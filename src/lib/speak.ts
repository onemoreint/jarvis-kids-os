/**
 * Lee un texto en voz alta con las voces del sistema (macOS / Windows).
 * Si no hay síntesis de voz disponible, falla en silencio.
 */
export function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    synth.speak(utterance);
  } catch {
    /* sin voz: no es crítico */
  }
}
