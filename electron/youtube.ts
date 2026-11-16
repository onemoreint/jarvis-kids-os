import { net } from 'electron';

export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const PLAYLIST_ID = /^[A-Za-z0-9_-]{12,64}$/;

const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtubekids.com',
  'www.youtubekids.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export type ParsedYouTube = { kind: 'video'; id: string } | { kind: 'playlist'; id: string };
export type ParsedInput = ParsedYouTube | { kind: 'channel'; url: string };

const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const HANDLE = /^@[\p{L}\p{N}._-]{2,100}$/u;

/**
 * Acepta enlaces de YouTube y de YouTube Kids (watch, youtu.be, shorts,
 * embed, playlist), enlaces de canal (@nombre, /channel/UC…, /c/…, /user/…)
 * o un ID de video suelto. Las listas automáticas (RD…/UL…) se rechazan
 * porque su contenido cambia solo.
 */
export function parseYouTubeInput(raw: string): ParsedInput | null {
  let s = raw.trim();
  if (VIDEO_ID.test(s)) return { kind: 'video', id: s };
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const list = url.searchParams.get('list');

  if (segments[0] === 'playlist' && list) {
    if (!PLAYLIST_ID.test(list) || /^(RD|UL)/.test(list)) return null;
    return { kind: 'playlist', id: list };
  }

  // Canales (solo en youtube.com).
  const first = decodeURIComponent(segments[0] ?? '');
  if (url.hostname.toLowerCase().endsWith('youtube.com')) {
    if (first === 'channel' && CHANNEL_ID.test(segments[1] ?? '')) {
      return { kind: 'channel', url: `https://www.youtube.com/channel/${segments[1]}` };
    }
    if (HANDLE.test(first)) {
      return { kind: 'channel', url: `https://www.youtube.com/${encodeURIComponent(first)}` };
    }
    if ((first === 'c' || first === 'user') && /^[\p{L}\p{N}._-]{2,100}$/u.test(decodeURIComponent(segments[1] ?? ''))) {
      return { kind: 'channel', url: `https://www.youtube.com/${first}/${segments[1]}` };
    }
  }

  let id: string | null = null;
  if (url.hostname.toLowerCase() === 'youtu.be') id = segments[0] ?? null;
  else if (segments[0] === 'watch') id = url.searchParams.get('v');
  else if (['shorts', 'embed', 'live', 'v'].includes(segments[0] ?? '')) id = segments[1] ?? null;

  return id && VIDEO_ID.test(id) ? { kind: 'video', id } : null;
}

/**
 * Resuelve un canal a su lista de "videos subidos" (UC… → UU…), que la
 * IFrame API puede reproducir como lista, y obtiene su nombre.
 */
export async function resolveChannel(channelUrl: string): Promise<{ uploadsPlaylistId: string; name: string }> {
  let html: string;
  try {
    const res = await net.fetch(channelUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'Accept-Language': 'es-419,es;q=0.9' },
    });
    if (!res.ok) throw new Error('Canal no encontrado.');
    html = await res.text();
  } catch (err) {
    throw err instanceof Error && err.message === 'Canal no encontrado.'
      ? err
      : new Error('Sin conexión a Internet o YouTube no responde.');
  }

  const channelId =
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1] ??
    /"externalId":"(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1];
  if (!channelId) throw new Error('Canal no encontrado.');

  const rawName = /<meta property="og:title" content="([^"]{1,200})"/.exec(html)?.[1] ?? 'Canal';
  const name = rawName
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .slice(0, 100);

  return { uploadsPlaylistId: `UU${channelId.slice(2)}`, name };
}

export interface YouTubeMeta {
  title: string;
  author: string;
  thumbnail: string | null;
}

/**
 * Comprueba con oEmbed (sin clave de API) que el video/lista existe, es
 * público y se puede reproducir embebido, y obtiene título y autor.
 */
export async function fetchMeta(item: ParsedYouTube): Promise<YouTubeMeta> {
  const page =
    item.kind === 'video'
      ? `https://www.youtube.com/watch?v=${item.id}`
      : `https://www.youtube.com/playlist?list=${item.id}`;

  let res: Response;
  try {
    res = await net.fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(page)}`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('Sin conexión a Internet o YouTube no responde.');
  }

  if (res.status === 401 || res.status === 403) throw new Error('El autor no permite verlo fuera de YouTube.');
  if (!res.ok) throw new Error('No existe, es privado o fue eliminado.');

  const data = (await res.json()) as { title?: unknown; author_name?: unknown; thumbnail_url?: unknown };
  const title = typeof data.title === 'string' ? data.title.slice(0, 200) : 'Sin título';
  const author = typeof data.author_name === 'string' ? data.author_name.slice(0, 100) : '';

  let thumbnail: string | null = null;
  if (item.kind === 'video') {
    thumbnail = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
  } else if (typeof data.thumbnail_url === 'string') {
    try {
      const t = new URL(data.thumbnail_url);
      if (t.protocol === 'https:' && t.hostname === 'i.ytimg.com') thumbnail = t.toString();
    } catch {
      /* sin miniatura */
    }
  }

  return { title, author, thumbnail };
}
