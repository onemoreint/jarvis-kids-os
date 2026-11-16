// Mascota/asistente JARVIS: un orbe amistoso con ojos.
export function JarvisOrb({ size = 72 }: { size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <span className="animate-pulse-ring absolute inset-0 rounded-full bg-cyan-300/50" />
      <div className="relative flex h-full w-full items-center justify-center gap-[14%] rounded-full bg-gradient-to-br from-cyan-200 via-sky-400 to-indigo-500 shadow-lg shadow-cyan-500/40 ring-4 ring-white/30">
        <span className="h-[22%] w-[14%] rounded-full bg-[#0b1026]" />
        <span className="h-[22%] w-[14%] rounded-full bg-[#0b1026]" />
        <span className="absolute bottom-[24%] h-[8%] w-[30%] rounded-b-full bg-[#0b1026]/80" />
      </div>
    </div>
  );
}
