import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { CATEGORY_IDS, type AddResult, type CategoryId, type ContentItem } from './ipc-contract';
import { BUNDLED_LISTS } from './default-videos';
import { STARTER_PACK } from './starter-pack';
import { dataPath, readJson, writeJson } from './store';
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

// ---------------------------------------------------------------------------
// Importación desde archivo (para el script de Windows "Instalar videos")
// ---------------------------------------------------------------------------
// Si existe %APPDATA%\JARVIS KIDS OS\importar.txt, al abrir la app se añaden
// sus enlaces. Formato:
//   [Música]
//   https://youtu.be/…
//   # comentario
// Después se renombra a importado-<fecha>.txt con el resultado. Si no hay
// Internet, el archivo se conserva para reintentarlo en el próximo arranque.

export const IMPORT_FILE = 'importar.txt';

function normalizeCategory(raw: string): CategoryId | null {
  const key = raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  return isCategory(key) ? key : null;
}

/** Procesa texto en formato [Categoría] + enlaces. Guarda si añadió algo. */
async function importText(text: string): Promise<{ result: AddResult; offline: boolean }> {
  const result: AddResult = { added: [], errors: [] };
  let category: CategoryId | null = null;
  let offline = false;

  outer: for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const header = /^\[(.+)\]$/.exec(line);
    if (header) {
      category = normalizeCategory(header[1] ?? '');
      if (!category) result.errors.push({ input: line, reason: 'Categoría desconocida.' });
      continue;
    }
    for (const token of line.split(/\s+/)) {
      if (!category) {
        result.errors.push({ input: token, reason: 'Falta la categoría ([Nombre]) antes del enlace.' });
        continue;
      }
      await addOne(token, category, result, true);
      if (result.errors.at(-1)?.reason.startsWith('Sin conexión')) {
        offline = true;
        break outer;
      }
    }
  }

  if (result.added.length) save();
  return { result, offline };
}

// Listas incluidas dentro de la app (default-videos.ts). Cada una se importa
// UNA sola vez por equipo: si el padre quita un video, no vuelve a aparecer.
const BUNDLED_DONE_FILE = 'listas-incluidas.json';

export async function importBundled(): Promise<AddResult | null> {
  const done = readJson<{ ids?: string[] }>(BUNDLED_DONE_FILE, {});
  const doneIds = new Set(Array.isArray(done.ids) ? done.ids : []);
  const pending = BUNDLED_LISTS.filter((l) => !doneIds.has(l.id));
  if (pending.length === 0) return null;

  const total: AddResult = { added: [], errors: [] };
  for (const list of pending) {
    const { result, offline } = await importText(list.text);
    total.added.push(...result.added);
    total.errors.push(...result.errors);
    if (offline) break; // sin Internet: se reintenta en el próximo arranque
    doneIds.add(list.id);
  }
  writeJson(BUNDLED_DONE_FILE, { ids: [...doneIds] });
  return total;
}

export async function importFromFile(): Promise<AddResult | null> {
  const file = dataPath(IMPORT_FILE);
  if (!fs.existsSync(file)) return null;

  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').slice(0, 200_000);
  const { result, offline } = await importText(text);

  if (!offline) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const report = [
      text.trimEnd(),
      '',
      `# --- Resultado ${new Date().toLocaleString('es')} ---`,
      `# Añadidos: ${result.added.length}`,
      ...result.added.map((a) => `#   ✔ [${a.category}] ${a.title}`),
      ...result.errors.map((e) => `#   ✖ ${e.input} → ${e.reason}`),
      '',
    ].join('\n');
    fs.writeFileSync(dataPath(`importado-${stamp}.txt`), report, 'utf8');
    fs.rmSync(file, { force: true });
  }
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
