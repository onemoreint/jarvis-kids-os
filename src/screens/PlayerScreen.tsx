import { useEffect, useRef, useState } from 'react';
import type { ContentItem } from '../../electron/ipc-contract';
import { YT_STATE, loadYouTubeApi, playerErrorMessage, type YTPlayer } from '../lib/youtubeApi';

interface Props {
  item: ContentItem;
  onBack: () => void;
}

/**
 * Reproductor infantil. Una capa transparente cubre TODO el iframe, de modo
 * que el niño nunca toca la interfaz de YouTube (títulos, logo, videos
 * sugeridos). Los controles son botones grandes propios.
 */
export function PlayerScreen({ item, onBack }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [state, setState] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return;
        const target = document.createElement('div');
        mountRef.current.appendChild(target);
        const playerVars: Record<string, string | number> = {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          cc_load_policy: 0,
          hl: 'es',
        };
        if (item.kind === 'playlist') {
          playerVars.listType = 'playlist';
          playerVars.list = item.youtubeId;
        }
        playerRef.current = new YT.Player(target, {
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          // En listas NO se pasa videoId (ni siquiera undefined): la API lo rechaza.
          ...(item.kind === 'video' ? { videoId: item.youtubeId } : {}),
          playerVars,
          events: {
            onReady: (e) => e.target.playVideo(),
            onStateChange: (e) => setState(e.data),
            onError: (e) => setError(playerErrorMessage(e.data)),
          },
        });
      })
      .catch((err: unknown) => {
        console.error('[player]', err);
        if (cancelled) return;
        const network = err instanceof Error && (err.message === 'network' || err.message === 'timeout');
        setError(network ? 'No hay conexión a Internet.' : 'No se pudo abrir el reproductor.');
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [item]);

  const playing = state === YT_STATE.PLAYING || state === YT_STATE.BUFFERING;
  const ended = state === YT_STATE.ENDED;

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  const replay = () => {
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
  };

  return (
    <main className="flex h-full flex-col bg-black">
      <div className="relative flex-1">
        <div ref={mountRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />

        {/* Capa protectora: captura todos los toques. */}
        <button
          type="button"
          aria-label={playing ? 'Pausa' : 'Reproducir'}
          onClick={togglePlay}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        />

        {/* En pausa, tapamos las sugerencias de YouTube. */}
        {!playing && !ended && !error && state !== -1 && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#0b1026]/85">
            <span className="emoji text-[10rem] drop-shadow-2xl">▶️</span>
          </div>
        )}

        {ended && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-[#0b1026]">
            <span className="emoji text-9xl">🎉</span>
            <p className="text-5xl font-black">¡Terminó!</p>
            <div className="flex gap-6">
              <BigButton onClick={replay} emoji="🔁" label="Otra vez" />
              <BigButton onClick={onBack} emoji="⬅️" label="Volver" />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-[#0b1026] text-center">
            <span className="emoji text-9xl">🙈</span>
            <p className="max-w-xl text-3xl font-black">{error}</p>
            <BigButton onClick={onBack} emoji="⬅️" label="Volver" />
          </div>
        )}
      </div>

      <nav className="z-40 flex items-center justify-center gap-6 bg-[#0b1026] px-6 py-4">
        <BigButton onClick={onBack} emoji="⬅️" label="Volver" />
        <BigButton onClick={togglePlay} emoji={playing ? '⏸️' : '▶️'} label={playing ? 'Pausa' : 'Seguir'} />
        {item.kind === 'playlist' && (
          <BigButton onClick={() => playerRef.current?.nextVideo()} emoji="⏭️" label="Siguiente" />
        )}
      </nav>
    </main>
  );
}

function BigButton({ onClick, emoji, label }: { onClick: () => void; emoji: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-20 items-center gap-3 rounded-full bg-white px-8 text-2xl font-black text-indigo-900 shadow-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-cyan-300"
    >
      <span className="emoji text-3xl">{emoji}</span>
      {label}
    </button>
  );
}
