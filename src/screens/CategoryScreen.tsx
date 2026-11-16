import type { ContentItem } from '../../electron/ipc-contract';
import { getCategory, type CategoryId } from '../data/categories';

interface Props {
  categoryId: CategoryId;
  items: ContentItem[];
  onBack: () => void;
  onPlay: (item: ContentItem) => void;
}

export function CategoryScreen({ categoryId, items, onBack, onPlay }: Props) {
  const category = getCategory(categoryId);

  return (
    <main className="flex h-full flex-col px-10 py-8">
      <header className="flex items-center gap-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al inicio"
          className="flex h-20 shrink-0 items-center gap-3 rounded-full bg-white px-8 text-2xl font-black text-indigo-900 shadow-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-cyan-300"
        >
          <span className="emoji text-3xl">⬅️</span> Volver
        </button>
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ring-4 ring-white/30 ${category.gradient}`}
        >
          <span className="emoji text-5xl">{category.emoji}</span>
        </div>
        <h1 className="text-5xl font-black">{category.name}</h1>
      </header>

      {items.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div
            className={`animate-float flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl ring-8 ring-white/30 ${category.gradient} ${category.glow}`}
          >
            <span className="emoji text-8xl">{category.emoji}</span>
          </div>
          <p className="text-3xl font-black">¡Aún no hay videos aquí!</p>
          <p className="text-xl font-semibold text-white/70">Pide a un adulto que los añada en ⚙️ Padres.</p>
        </section>
      ) : (
        <section className="mt-8 grid flex-1 auto-rows-max grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-8 overflow-y-auto pb-8 pr-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPlay(item)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-pop-in group overflow-hidden rounded-[2rem] bg-white/10 text-left ring-4 ring-white/15 transition hover:-translate-y-1 hover:ring-white/50 active:scale-95 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-white"
            >
              <div className="relative aspect-video bg-black/40">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="emoji flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl shadow-xl transition group-hover:scale-110">
                    ▶️
                  </span>
                </span>
                {item.kind === 'playlist' && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-bold">
                    📺 Varios videos
                  </span>
                )}
              </div>
              <div className="px-5 py-4">
                <p className="line-clamp-2 text-xl font-bold">{item.title}</p>
              </div>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
