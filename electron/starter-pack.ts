import type { CategoryId } from './ipc-contract';

// Paquete sugerido: se añade solo cuando un adulto lo pide desde el panel.
// Canales educativos reconocidos; cada entrada se vuelve a verificar con
// oEmbed al añadirse (si un video desaparece, simplemente se omite).
// Verificado el 2026-11-16.
export const STARTER_PACK: readonly { category: CategoryId; url: string }[] = [
  // Matemáticas — Super Simple Español
  { category: 'matematicas', url: 'https://www.youtube.com/watch?v=PtbAfjovQNc' }, // Cuenta & Muévete
  { category: 'matematicas', url: 'https://www.youtube.com/watch?v=swFRcUEKJ_A' }, // Cinco Monitos

  // Letras
  { category: 'letras', url: 'https://www.youtube.com/watch?v=6-x_HOpK9O8' }, // Farmees: Canción del Abecedario
  { category: 'letras', url: 'https://www.youtube.com/watch?v=OLf6moN4EPI' }, // Happy Babies: ABC en Español

  // Inglés — Super Simple Songs
  { category: 'ingles', url: 'https://www.youtube.com/playlist?list=PL028565C616627F50' },
  { category: 'ingles', url: 'https://www.youtube.com/playlist?list=PLdkj6XH8GYPQnOl061EKcQd13VFMb8FFN' },

  // Animales — Happy Learning Español
  { category: 'animales', url: 'https://www.youtube.com/watch?v=icR8t6yvGXQ' },
  { category: 'animales', url: 'https://www.youtube.com/watch?v=IJe8DJgK5DI' },
  { category: 'animales', url: 'https://www.youtube.com/playlist?list=PL_Y3qbepMRobmH0XmoZ3OL8WDDbuxM3px' },

  // Ciencias — Happy Learning Español
  { category: 'ciencias', url: 'https://www.youtube.com/watch?v=f4FH0vD3i4A' },

  // Música — Super Simple Español
  { category: 'musica', url: 'https://www.youtube.com/playlist?list=PLG5nAmCKiJrttFvxSXfpZFArQpUwGZgYr' },
  { category: 'musica', url: 'https://www.youtube.com/watch?v=ydKSWq-GG_4' },

  // Cuentos — Juguetes Animados
  { category: 'cuentos', url: 'https://www.youtube.com/playlist?list=PL8ambqHwzdi4cIAClUw0hdTML4QD7LFP0' },
];
