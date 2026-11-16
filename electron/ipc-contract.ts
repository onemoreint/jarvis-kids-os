// Contrato de tipos compartido entre el proceso principal, el preload y la
// interfaz. SOLO tipos: el preload en sandbox no puede importar código local
// en tiempo de ejecución, por lo que los nombres de canal se repiten allí.

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  isDev: boolean;
}

export interface JarvisBridge {
  getAppInfo: () => Promise<AppInfo>;
}

export const IPC_CHANNELS = {
  getAppInfo: 'app:get-info',
} as const;
