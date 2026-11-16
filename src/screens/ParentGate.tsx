import { useCallback, useEffect, useState } from 'react';

interface Props {
  /** Título alternativo (p. ej. "Salir de JARVIS"). */
  title?: string;
  onUnlocked: () => void;
  onCancel: () => void;
}

type Mode = 'loading' | 'create' | 'confirm' | 'verify';

/** Pantalla de PIN: crear (primera vez) o verificar. */
export function ParentGate({ title: customTitle, onUnlocked, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>('loading');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [lockedFor, setLockedFor] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.jarvis
      ?.pinStatus()
      .then((s) => {
        setMode(s.isSet ? 'verify' : 'create');
        setLockedFor(s.lockedForSeconds);
      })
      .catch(() => setMessage('No disponible fuera de la app.'));
  }, []);

  // Cuenta atrás del bloqueo por intentos fallidos.
  useEffect(() => {
    if (lockedFor <= 0) return;
    const id = window.setTimeout(() => setLockedFor((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [lockedFor]);

  const submit = useCallback(async () => {
    const api = window.jarvis;
    if (!api || busy || pin.length < 4) return;
    setBusy(true);
    try {
      if (mode === 'create') {
        setFirstPin(pin);
        setPin('');
        setMode('confirm');
        setMessage(null);
      } else if (mode === 'confirm') {
        if (pin !== firstPin) {
          setMessage('Los PIN no coinciden. Empieza de nuevo.');
          setPin('');
          setFirstPin('');
          setMode('create');
        } else {
          const res = await api.createPin(pin);
          if (res.ok) onUnlocked();
          else setMessage(res.error ?? 'No se pudo guardar el PIN.');
        }
      } else if (mode === 'verify') {
        const res = await api.verifyPin(pin);
        setPin('');
        if (res.ok) {
          onUnlocked();
        } else {
          setLockedFor(res.lockedForSeconds);
          setMessage(
            res.lockedForSeconds > 0
              ? 'Demasiados intentos.'
              : `PIN incorrecto. Te quedan ${res.attemptsLeft} intento${res.attemptsLeft === 1 ? '' : 's'}.`,
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }, [busy, firstPin, mode, onUnlocked, pin]);

  const press = useCallback(
    (key: string) => {
      if (lockedFor > 0) return;
      if (key === 'del') setPin((p) => p.slice(0, -1));
      else if (key === 'ok') void submit();
      else setPin((p) => (p.length < 6 ? p + key : p));
    },
    [lockedFor, submit],
  );

  // Teclado físico.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, press]);

  const title =
    mode === 'create'
      ? 'Crea un PIN de padres'
      : mode === 'confirm'
        ? 'Repite el PIN'
        : (customTitle ?? 'PIN de padres');
  const subtitle =
    mode === 'create'
      ? 'De 4 a 6 números. Guárdalo en un lugar seguro.'
      : mode === 'confirm'
        ? 'Para comprobar que lo escribiste bien.'
        : customTitle
          ? 'Escribe el PIN de padres para cerrar la app.'
          : 'Solo para adultos.';

  return (
    <main className="flex h-full items-center justify-center bg-[#0b1026]/80 backdrop-blur">
      <div className="flex w-[26rem] flex-col items-center gap-6">
        <span className="emoji text-6xl">🔐</span>
        <div className="text-center">
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="mt-1 text-white/60">{subtitle}</p>
        </div>

        <div className="flex h-8 gap-4" aria-label={`${pin.length} números escritos`}>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full ring-2 ring-white/50 ${i < pin.length ? 'bg-white' : 'bg-transparent'} ${i >= 4 && i >= pin.length ? 'opacity-40' : ''}`}
            />
          ))}
        </div>

        <p role="alert" className="h-6 text-center font-semibold text-amber-300">
          {lockedFor > 0 ? `Bloqueado. Espera ${lockedFor} s.` : message}
        </p>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((k) => (
            <button
              key={k}
              type="button"
              disabled={lockedFor > 0 || busy || mode === 'loading' || (k === 'ok' && pin.length < 4)}
              onClick={() => press(k)}
              className={`h-20 w-24 rounded-2xl text-3xl font-black transition active:scale-95 disabled:opacity-30 ${
                k === 'ok' ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20'
              }`}
            >
              {k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k}
            </button>
          ))}
        </div>

        <button type="button" onClick={onCancel} className="mt-2 text-lg font-bold text-white/60 underline-offset-4 hover:underline">
          Cancelar
        </button>
      </div>
    </main>
  );
}
