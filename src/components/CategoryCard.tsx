import type { Category } from '../data/categories';

interface Props {
  category: Category;
  index: number;
  onSelect: (category: Category) => void;
}

export function CategoryCard({ category, index, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      aria-label={category.name}
      // --card se define en index.css y escala con la altura de la pantalla.
      style={{ animationDelay: `${index * 60}ms`, width: 'var(--card)', height: 'var(--card)' }}
      className={[
        'animate-pop-in group relative flex flex-col items-center justify-center gap-[6%]',
        'rounded-[18%] bg-gradient-to-br text-white shadow-2xl ring-4 ring-white/25',
        'transition-transform duration-200 ease-out hover:-translate-y-2 hover:ring-white/60',
        'active:scale-95 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-white',
        category.gradient,
        category.glow,
      ].join(' ')}
    >
      {/* brillo superior para efecto "caramelo" */}
      <span className="pointer-events-none absolute inset-x-6 top-3 h-1/3 rounded-full bg-white/25 blur-md" />
      <span
        className="emoji flex h-1/2 w-1/2 items-center justify-center rounded-full bg-white/30 shadow-inner transition-transform duration-300 group-hover:scale-110"
        style={{ fontSize: 'calc(var(--card) * 0.28)' }}
      >
        {category.emoji}
      </span>
      <span
        className="font-black tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]"
        style={{ fontSize: 'calc(var(--card) * 0.13)' }}
      >
        {category.name}
      </span>
    </button>
  );
}
