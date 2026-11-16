import { getCategory, type CategoryId } from '../data/categories';
import { APPROVED_VIDEOS } from '../data/videoWhitelist';

interface Props {
  categoryId: CategoryId;
  onBack: () => void;
}

export function CategoryScreen({ categoryId, onBack }: Props) {
  const category = getCategory(categoryId);
  const videoCount = APPROVED_VIDEOS.filter((v) => v.category === categoryId).length;

  return (
    <main className="flex h-full flex-col px-10 py-8">
      <header>
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al inicio"
          className="flex h-20 items-center gap-3 rounded-full bg-white px-8 text-2xl font-black text-indigo-900 shadow-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-cyan-300"
        >
          <span className="emoji text-3xl">⬅️</span> Volver
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          className={`animate-float flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl ring-8 ring-white/30 ${category.gradient} ${category.glow}`}
        >
          <span className="emoji text-9xl">{category.emoji}</span>
        </div>
        <h1 className="text-6xl font-black">{category.name}</h1>
        <p className="text-2xl font-semibold text-white/80">{category.hint}</p>
        <p className="rounded-full bg-white/10 px-8 py-4 text-xl font-bold ring-1 ring-white/20">
          {videoCount === 0
            ? '¡Muy pronto habrá videos aquí! 🎬'
            : `${videoCount} videos aprobados`}
        </p>
      </section>
    </main>
  );
}
