// Fondo "cielo nocturno" suave: degradado + manchas de luz difuminadas.
// Sin imágenes externas para respetar la CSP.
const STARS = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: (i % 3) + 2,
  opacity: 0.25 + ((i * 7) % 10) / 20,
}));

export function SkyBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#141b4d] via-[#0f1640] to-[#0b1026]" />
      <div className="absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="absolute -right-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-48 left-1/4 h-[30rem] w-[30rem] rounded-full bg-amber-400/15 blur-3xl" />
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.opacity }}
        />
      ))}
    </div>
  );
}
