import { useCallback, useEffect, useState } from 'react';
import { CATEGORIES, type Category, type CategoryId } from '../data/categories';
import { CategoryCard } from '../components/CategoryCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { ParentLockButton } from '../components/ParentLockButton';
import { useNow } from '../hooks/useNow';
import { speak } from '../lib/speak';

function greetingFor(date: Date): { text: string; emoji: string } {
  const h = date.getHours();
  if (h < 12) return { text: '¡Buenos días!', emoji: '☀️' };
  if (h < 19) return { text: '¡Buenas tardes!', emoji: '🌤️' };
  return { text: '¡Buenas noches!', emoji: '🌙' };
}

interface Props {
  onOpenCategory: (id: CategoryId) => void;
  onOpenParent: () => void;
  onExit: () => void;
}

export function HomeScreen({ onOpenCategory, onOpenParent, onExit }: Props) {
  const now = useNow();
  const greeting = greetingFor(now);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    window.jarvis
      ?.getAppInfo()
      .then((info) => setVersion(info.version))
      .catch(() => setVersion(null));
  }, []);

  const handleSelect = useCallback(
    (category: Category) => {
      speak(category.spoken);
      onOpenCategory(category.id);
    },
    [onOpenCategory],
  );

  const time = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const day = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main className="flex h-full flex-col px-10 py-8">
      {/* Cabecera */}
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <JarvisOrb size={76} />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-200/80">Jarvis Kids</p>
            <h1 className="text-4xl font-black leading-tight xl:text-5xl">
              {greeting.text} <span className="emoji">{greeting.emoji}</span>
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black tabular-nums xl:text-6xl">{time}</p>
          <p className="text-lg font-semibold text-white/70 first-letter:uppercase">{day}</p>
        </div>
      </header>

      {/* Pregunta guía */}
      <p className="mt-6 text-center text-2xl font-bold text-white/85 xl:text-3xl">¿Qué quieres aprender hoy?</p>

      {/* Categorías */}
      <section
        aria-label="Categorías"
        // Máximo 4 tarjetas por fila → 8 categorías en 2 filas de 4.
        style={{ maxWidth: 'calc(var(--card) * 4 + 9vh + 2rem)' }}
        className="mx-auto flex flex-1 flex-wrap content-center items-center justify-center gap-[3vh] px-4 py-[2vh]"
      >
        {CATEGORIES.map((category, i) => (
          <CategoryCard key={category.id} category={category} index={i} onSelect={handleSelect} />
        ))}
      </section>

      {/* Pie */}
      <footer className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <p className="text-sm font-semibold text-white/40">{version ? `v${version}` : ''}</p>
        <p className="text-center text-base font-semibold text-white/60">
          Desarrollado por: <span className="font-black text-white/80">José Lugo</span> · 3126387467
        </p>
        <div className="flex justify-end gap-3">
          <ParentLockButton onUnlockRequest={onOpenParent} />
          <button
            type="button"
            onClick={onExit}
            aria-label="Salir de la app"
            className="flex h-16 items-center gap-3 rounded-full bg-rose-500/20 px-6 ring-1 ring-rose-300/40 backdrop-blur transition hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          >
            <span className="text-2xl font-black text-rose-200">⏻</span>
            <span className="text-left leading-tight">
              <span className="block text-lg font-black">Salir</span>
              <span className="block text-xs font-semibold text-white/60">Cerrar la app</span>
            </span>
          </button>
        </div>
      </footer>
    </main>
  );
}
