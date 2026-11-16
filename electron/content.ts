import { randomUUID } from 'node:crypto';
import { CATEGORY_IDS, type AddResult, type CategoryId, type ContentItem } from './ipc-contract';
import { STARTER_PACK } from './starter-pack';
import { readJson, writeJson } from './store';
import { PLAYLIST_ID, VIDEO_ID, fetchMeta, parseYouTubeInput, resolveChannel, type ParsedYouTube } from './youtube';

// Lista blanca persistente (content.json). El proceso principal es la única
// fuente de verdad: la interfaz solo puede leerla, y modificarla exige la
// sesión de padres desbloqueada con PIN.

const FILE = 'content.json';
const MAX_ITEMS = 500;
let cache: ContentItem[] | null = null;

export function isCategory(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}

function isValidItem(x: unknown): x is ContentItem {
  if (!x || typeof x !== 'object') return false;
  const i = x as Record<string, unknown>;
  const idOk =
    (i.kind === 'video' && typeof i.youtubeId === 'string' && VIDEO_ID.test(i.youtubeId)) ||
    (i.kind === 'playlist' && typeof i.youtubeId === 'string' && PLAYLIST_ID.test(i.youtubeId));
  return (
    idOk &&
    typeof i.id === 'string' &&
    typeof i.title === 'string' &&
    typeof i.author === 'string' &&
    (i.thumbnail === null || (typeof i.thumbnail === 'string' && i.thumbnail.startsWith('https://i.ytimg.com/'))) &&
    isCategory(i.category) &&
    typeof i.addedAt === 'string'
  );
}

function load(): ContentItem[] {
  if (!cache) {
    const raw = readJson<{ items?: unknown[] }>(FILE, { items: [] });
    cache = Array.isArray(raw.items) ? raw.items.filter(isValidItem) : [];
  }
  return cache;
}

function save(): void {
  writeJson(FILE, { v: 1, items: load() });
}

export function list(): ContentItem[] {
  return load().map((i) => ({ ...i }));
}

async function addOne(input: string, category: CategoryId, result: AddResult, quietDuplicates = false): Promise<void> {
  const items = load();
  const raw = parseYouTubeInput(input);
  if (!raw) {
    result.errors.push({ input, reason: 'No es un enlace válido de YouTube o YouTube Kids.' });
    return;
  }
  // Un canal se convierte en su lista de "videos subidos" (UU…).
  let parsed: ParsedYouTube;
  let channelName: string | null = null;
  if (raw.kind === 'channel') {
    try {
      const ch = await resolveChannel(raw.url);
      parsed = { kind: 'playlist', id: ch.uploadsPlaylistId };
      channelName = ch.name;
    } catch (err) {
      result.errors.push({ input, reason: err instanceof Error ? err.message : 'Canal no encontrado.' });
      return;
    }
  } else {
    parsed = raw;
  }
  if (items.some((i) => i.kind === parsed.kind && i.youtubeId === parsed.id && i.category === category)) {
    if (!quietDuplicates) result.errors.push({ input, reason: 'Ya está en esta categoría.' });
    return;
  }
  if (items.length >= MAX_ITEMS) {
    result.errors.push({ input, reason: `Máximo ${MAX_ITEMS} elementos.` });
    return;
  }
  try {
    const meta = await fetchMeta(parsed).catch((err: unknown) => {
      // Algunas listas de canal no responden a oEmbed: usamos el nombre del canal.
      if (channelName) return { title: channelName, author: channelName, thumbnail: null };
      throw err;
    });
    const item: ContentItem = {
      id: randomUUID(),
      kind: parsed.kind,
      youtubeId: parsed.id,
      title: channelName ? `Canal: ${channelName}` : meta.title,
      author: channelName ?? meta.author,
      thumbnail: meta.thumbnail,
      category,
      addedAt: new Date().toISOString(),
    };
    items.push(item);
    result.added.push(item);
  } catch (err) {
    result.errors.push({ input, reason: err instanceof Error ? err.message : 'Error desconocido.' });
  }
}

/** Admite varios enlaces separados por espacios, comas o saltos de línea. */
export async function addFromText(text: string, category: CategoryId): Promise<AddResult> {
  const result: AddResult = { added: [], errors: [] };
  const inputs = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  for (const input of inputs) await addOne(input, category, result);
  if (result.added.length) save();
  return result;
}

export async function addStarterPack(): Promise<AddResult> {
  const result: AddResult = { added: [], errors: [] };
  for (const entry of STARTER_PACK) await addOne(entry.url, entry.category, result, true);
  if (result.added.length) save();
  return result;
}

export function move(id: string, category: CategoryId): void {
  const item = load().find((i) => i.id === id);
  if (item && item.category !== category) {
    item.category = category;
    save();
  }
}

export function remove(id: string): void {
  const items = load();
  const index = items.findIndex((i) => i.id === id);
  if (index >= 0) {
    items.splice(index, 1);
    save();
  }
}
