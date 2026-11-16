import { useLongPress } from '../hooks/useLongPress';

/**
 * Botón visible "Padres". Hay que MANTENERLO pulsado 1,5 s (evita toques
 * accidentales) y después pedirá el PIN.
 */
export function ParentLockButton({ onUnlockRequest }: { onUnlockRequest: () => void }) {
  const { progress, handlers } = useLongPress(onUnlockRequest, 1500);

  return (
    <button
      type="button"
      {...handlers}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onUnlockRequest();
      }}
      aria-label="Padres: mantener presionado"
      className="relative flex h-16 items-center gap-3 overflow-hidden rounded-full bg-white/10 px-6 ring-1 ring-white/25 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-white/25"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="emoji relative text-2xl">⚙️</span>
      <span className="relative text-left leading-tight">
        <span className="block text-lg font-black">Padres</span>
        <span className="block text-xs font-semibold text-white/60">Mantén presionado</span>
      </span>
    </button>
  );
}
