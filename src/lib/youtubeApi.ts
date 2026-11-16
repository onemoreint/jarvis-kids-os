// Carga perezosa de la YouTube IFrame API y tipos mínimos que usamos.

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTPlayerOptions {
  host?: string;
  width?: string | number;
  height?: string | number;
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number; target: YTPlayer }) => void;
    onError?: (e: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

let loading: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YTNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      loading = null;
      reject(new Error('timeout'));
    }, 15_000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      loading = null;
      script.remove();
      reject(new Error('network'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Mensajes para los códigos de error del reproductor. */
export function playerErrorMessage(code: number): string {
  switch (code) {
    case 101:
    case 150:
      return 'Este video no se puede ver dentro de la app.';
    case 100:
      return 'Este video ya no existe.';
    case 153:
      return 'YouTube rechazó la configuración del reproductor.';
    default:
      return 'No se pudo reproducir este video.';
  }
}
