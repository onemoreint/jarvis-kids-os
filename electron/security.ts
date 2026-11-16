import { app, session, type WebContents } from 'electron';

// Orígenes de YouTube permitidos para la futura reproducción con IFrame API.
// Solo se cargarán videos de la lista blanca; nunca se navega a youtube.com.
const YOUTUBE_SCRIPT = ['https://www.youtube.com', 'https://s.ytimg.com'];
const YOUTUBE_FRAME = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
const YOUTUBE_IMG = ['https://i.ytimg.com'];

export function isYouTubeEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      (u.hostname === 'www.youtube-nocookie.com' || u.hostname === 'www.youtube.com') &&
      u.pathname.startsWith('/embed/')
    );
  } catch {
    return false;
  }
}

/**
 * Content-Security-Policy de la interfaz.
 * En desarrollo Vite necesita scripts en línea (React Refresh) y WebSocket
 * para la recarga en caliente; en producción no se permite nada de eso.
 */
export function buildCsp(isDev: boolean, devOrigin?: string): string {
  const scriptSrc = ["'self'", ...YOUTUBE_SCRIPT];
  const connectSrc = ["'self'"];
  if (isDev && devOrigin) {
    scriptSrc.push("'unsafe-inline'");
    connectSrc.push(devOrigin, devOrigin.replace(/^http/, 'ws'));
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${YOUTUBE_IMG.join(' ')}`,
    "font-src 'self' data:",
    `frame-src ${YOUTUBE_FRAME.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * YouTube exige una cabecera Referer HTTP(S) en el reproductor embebido
 * (si falta: "error 153"). Una página servida desde app:// no la envía, así
 * que la añadimos SOLO a las peticiones dirigidas a YouTube.
 */
export const EMBED_REFERRER = 'https://jarvis-kids-os.app/';

export function addYouTubeReferrer(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [
        'https://www.youtube-nocookie.com/*',
        'https://www.youtube.com/*',
      ],
    },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      if (!headers.Referer && !headers.referer) headers.Referer = EMBED_REFERRER;
      callback({ requestHeaders: headers });
    },
  );
}

/**
 * Endurece la sesión por defecto: niega permisos (cámara, micrófono,
 * ubicación, notificaciones...) y bloquea descargas.
 */
export function hardenDefaultSession(): void {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.on('will-download', (event) => event.preventDefault());
}

/**
 * Aplica a TODO WebContents creado: bloqueo de navegación externa, de ventanas
 * emergentes y de <webview>.
 */
export function lockDownWebContents(isAllowedUrl: (url: string) => boolean): void {
  app.on('web-contents-created', (_event, contents: WebContents) => {
    contents.on('will-navigate', (event, url) => {
      if (!isAllowedUrl(url)) event.preventDefault();
    });
    contents.on('will-redirect', (event, url) => {
      if (!isAllowedUrl(url)) event.preventDefault();
    });
    // Los iframes (reproductor de YouTube) solo pueden cargar el reproductor
    // embebido; cualquier otra navegación dentro del iframe se cancela.
    contents.on('will-frame-navigate', (details) => {
      if (!details.isMainFrame && !isYouTubeEmbedUrl(details.url)) details.preventDefault();
    });
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-attach-webview', (event) => event.preventDefault());
  });
}
