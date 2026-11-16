// Contrato compartido entre el proceso principal, el preload y la interfaz.
// El preload (sandbox) solo puede usar `import type` de este archivo.

export const CATEGORY_IDS = [
  'matematicas',
  'letras',
  'ingles',
  'animales',
  'ciencias',
  'musica',
  'cuentos',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  isDev: boolean;
}

/** Elemento de la lista blanca: un video o una lista de reproducción. */
export interface ContentItem {
  id: string;
  kind: 'video' | 'playlist';
  /** ID de video (11 caracteres) o de lista de reproducción. */
  youtubeId: string;
  title: string;
  author: string;
  thumbnail: string | null;
  category: CategoryId;
  addedAt: string;
}

export interface PinStatus {
  isSet: boolean;
  lockedForSeconds: number;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; lockedForSeconds: number; attemptsLeft: number };

export interface SimpleResult {
  ok: boolean;
  error?: string;
}

export interface AddResult {
  added: ContentItem[];
  errors: { input: string; reason: string }[];
}

export interface JarvisBridge {
  getAppInfo: () => Promise<AppInfo>;
  listContent: () => Promise<ContentItem[]>;
  pinStatus: () => Promise<PinStatus>;
  createPin: (pin: string) => Promise<SimpleResult>;
  verifyPin: (pin: string) => Promise<VerifyResult>;
  changePin: (current: string, next: string) => Promise<SimpleResult>;
  lockParent: () => Promise<void>;
  addContent: (text: string, category: CategoryId) => Promise<AddResult>;
  removeContent: (id: string) => Promise<void>;
  moveContent: (id: string, category: CategoryId) => Promise<void>;
  addStarterPack: () => Promise<AddResult>;
  quitApp: () => Promise<void>;
}
