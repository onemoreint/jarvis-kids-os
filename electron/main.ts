import { app, BrowserWindow, ipcMain, Menu, net, protocol, session } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AppInfo } from './ipc-contract';
import { buildCsp, hardenDefaultSession, lockDownWebContents } from './security';

// ---------------------------------------------------------------------------
// Modo de ejecución
// ---------------------------------------------------------------------------
// El servidor de desarrollo solo se acepta si la app NO está empaquetada, así
// una versión instalada nunca puede apuntar a una URL externa.
const DEV_ARG = '--dev-server=';
const devServerArg = process.argv.find((a) => a.startsWith(DEV_ARG))?.slice(DEV_ARG.length);
const isDev = !app.isPackaged && Boolean(devServerArg);
const devOrigin = isDev && devServerArg ? new URL(devServerArg).origin : undefined;

// En producción la interfaz se sirve con un protocolo propio (app://jarvis/)
// en vez de file://, lo que permite aplicar CSP y restringir rutas.
const APP_SCHEME = 'app';
const APP_HOST = 'jarvis';
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const RENDERER_DIST = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function isAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (isDev) return parsed.origin === devOrigin;
    // Ojo: para esquemas propios `URL.origin` vale "null", por eso se
    // comparan protocolo y host por separado.
    return parsed.protocol === `${APP_SCHEME}:` && parsed.host === APP_HOST;
  } catch {
    return false;
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
};

function registerAppProtocol(): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url);
    if (url.host !== APP_HOST) return new Response('Not found', { status: 404 });

    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.normalize(path.join(RENDERER_DIST, relative));
    // Evita salir de la carpeta dist (path traversal).
    if (!filePath.startsWith(RENDERER_DIST + path.sep)) {
      return new Response('Forbidden', { status: 403 });
    }

    const file = await net.fetch(pathToFileURL(filePath).toString());
    if (!file.ok) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    headers.set('Content-Type', MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream');
    headers.set('Content-Security-Policy', buildCsp(false));
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(file.body, { status: 200, headers });
  });
}

function applyDevCsp(): void {
  if (!devOrigin) return;
  // Solo a las respuestas del servidor de Vite; nunca a terceros (YouTube).
  session.defaultSession.webRequest.onHeadersReceived({ urls: [`${devOrigin}/*`] }, (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [buildCsp(true, devOrigin)],
      },
    });
  });
}

function registerIpc(): void {
  ipcMain.handle('app:get-info', (event): AppInfo => {
    // Solo responde a nuestra propia interfaz.
    if (!event.senderFrame || !isAppUrl(event.senderFrame.url)) {
      throw new Error('Origen no autorizado');
    }
    return {
      name: 'JARVIS KIDS OS',
      version: app.getVersion(),
      platform: process.platform,
      isDev,
    };
  });
}

// ---------------------------------------------------------------------------
// Ventana principal
// ---------------------------------------------------------------------------
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    // Pantalla completa en producción. En desarrollo, ventana normal para
    // poder trabajar. La salida protegida con PIN llega en la fase 2.
    fullscreen: !isDev,
    autoHideMenuBar: true,
    backgroundColor: '#0b1026',
    title: 'JARVIS KIDS OS',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
      devTools: isDev,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev && devServerArg) {
    void mainWindow.loadURL(devServerArg);
  } else {
    void mainWindow.loadURL(`${APP_ORIGIN}/index.html`);
  }
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  lockDownWebContents(isAppUrl);

  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    hardenDefaultSession();
    registerAppProtocol();
    applyDevCsp();
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
