import { useLongPress } from '../hooks/useLongPress';

/**
 * Acceso para adultos: hay que MANTENER pulsado 3 segundos.
 * En la fase 2 abrirá la pantalla de PIN; ahora solo avisa.
 */
export function ParentLockButton({ onUnlockRequest }: { onUnlockRequest: () => void }) {
  const { progress, handlers } = useLongPress(onUnlockRequest, 3000);
  const r = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <button
      type="button"
      {...handlers}
      aria-label="Zona de padres: mantener pulsado tres segundos"
      title="Padres: mantener pulsado 3 s"
      className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          opacity={progress > 0 ? 0.9 : 0}
        />
      </svg>
      <span className="emoji opacity-70">🔒</span>
    </button>
  );
}
