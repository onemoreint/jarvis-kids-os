// Listas de videos incluidas dentro del instalador. Al abrir la app, cada
// lista se importa UNA sola vez por equipo (ver content.importBundled): si el
// padre quita un video desde el panel, no vuelve a aparecer.
//
// Para añadir más en una versión futura, crea una lista NUEVA con otro `id`
// (no edites una ya publicada: los equipos que ya la importaron la ignorarían).
// Formato: [Categoría] y debajo los enlaces. Categorías: Matematicas, Letras,
// Ingles, Animales, Ciencias, Musica, Cuentos, Dibujos.

export const BUNDLED_LISTS: readonly { id: string; text: string }[] = [
  {
    id: 'lista-jose-2026-11-16',
    text: `
[Animales]
https://www.youtube.com/watch?v=Ns-iX4itsQI
https://www.youtube.com/playlist?list=PLFIdvqGgGJp8

[Cuentos]
https://www.youtube.com/watch?v=-lHO77CDa54
https://youtu.be/QDaQkAJjO_k

[Ingles]
https://youtu.be/iVNJ33ePw40

[Musica]
https://youtu.be/mrxTQZW9b08
https://youtu.be/Ggq4tbQdPVM

[Ciencias]
https://youtu.be/Vwma9FcK5T4

[Dibujos]
https://www.youtube.com/watch?v=hWkkMbdwzXs
https://youtu.be/jiR8Arh0x7o
https://youtu.be/wVyLeTrLFBw
https://youtu.be/lAZ01QgTciU
https://youtu.be/WuvvYna34GY
https://youtu.be/NedvnOFrN7I
https://youtu.be/CiKB1byapuw
`,
  },
];
