import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mantener pulsado durante `durationMs` para activar. Evita que un niño abra
 * por accidente las zonas reservadas a adultos. Devuelve el progreso (0..1)
 * para dibujar un anillo.
 */
export function useLongPress(onComplete: () => void, durationMs = 3000) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    start.current = null;
    setProgress(0);
  }, []);

  const tick = useCallback(
    (time: number) => {
      if (start.current === null) start.current = time;
      const p = Math.min((time - start.current) / durationMs, 1);
      setProgress(p);
      if (p >= 1) {
        frame.current = null;
        start.current = null;
        setProgress(0);
        onComplete();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    },
    [durationMs, onComplete],
  );

  const begin = useCallback(() => {
    cancel();
    frame.current = requestAnimationFrame(tick);
  }, [cancel, tick]);

  useEffect(() => cancel, [cancel]);

  return {
    progress,
    handlers: {
      onPointerDown: begin,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
  };
}
