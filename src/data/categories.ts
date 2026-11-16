export type CategoryId =
  | 'matematicas'
  | 'letras'
  | 'ingles'
  | 'animales'
  | 'ciencias'
  | 'musica'
  | 'cuentos';

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  /** Frase corta que se lee en voz alta (los niños pequeños aún no leen). */
  spoken: string;
  hint: string;
  /** Clases de Tailwind escritas completas para que el compilador las detecte. */
  gradient: string;
  glow: string;
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'matematicas',
    name: 'Matemáticas',
    emoji: '🔢',
    spoken: 'Matemáticas. ¡Vamos a contar!',
    hint: 'Contar y jugar con números',
    gradient: 'from-amber-300 via-orange-400 to-orange-500',
    glow: 'shadow-orange-500/40',
  },
  {
    id: 'letras',
    name: 'Letras',
    emoji: '🔤',
    spoken: 'Letras. ¡A aprender el abecedario!',
    hint: 'El abecedario y las palabras',
    gradient: 'from-rose-300 via-pink-400 to-rose-500',
    glow: 'shadow-rose-500/40',
  },
  {
    id: 'ingles',
    name: 'Inglés',
    emoji: '🌎',
    spoken: 'Inglés. Let’s play!',
    hint: 'Palabras y canciones en inglés',
    gradient: 'from-sky-300 via-sky-400 to-blue-500',
    glow: 'shadow-sky-500/40',
  },
  {
    id: 'animales',
    name: 'Animales',
    emoji: '🦁',
    spoken: 'Animales. ¡Hola, amigos del bosque!',
    hint: 'Conoce a los animales',
    gradient: 'from-lime-300 via-green-400 to-emerald-500',
    glow: 'shadow-emerald-500/40',
  },
  {
    id: 'ciencias',
    name: 'Ciencias',
    emoji: '🔬',
    spoken: 'Ciencias. ¡Vamos a descubrir!',
    hint: 'Experimentos y descubrimientos',
    gradient: 'from-violet-300 via-purple-400 to-indigo-500',
    glow: 'shadow-violet-500/40',
  },
  {
    id: 'musica',
    name: 'Música',
    emoji: '🎵',
    spoken: 'Música. ¡A cantar y bailar!',
    hint: 'Canciones para cantar y bailar',
    gradient: 'from-fuchsia-300 via-fuchsia-400 to-pink-500',
    glow: 'shadow-fuchsia-500/40',
  },
  {
    id: 'cuentos',
    name: 'Cuentos',
    emoji: '📚',
    spoken: 'Cuentos. ¡Había una vez!',
    hint: 'Historias para imaginar',
    gradient: 'from-yellow-200 via-amber-300 to-yellow-500',
    glow: 'shadow-yellow-500/40',
  },
];

export function getCategory(id: CategoryId): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Categoría desconocida: ${id}`);
  return found;
}
