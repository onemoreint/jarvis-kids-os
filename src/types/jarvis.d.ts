import type { JarvisBridge } from '../../electron/ipc-contract';

declare global {
  interface Window {
    /** Puente seguro expuesto por el preload. No existe en `npm run dev:web`. */
    jarvis?: JarvisBridge;
  }
}

export {};
