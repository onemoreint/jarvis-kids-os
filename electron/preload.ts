// Preload en sandbox: solo puede usar 'electron' (no require de archivos
// locales). Expone una API mínima, de solo lectura y sin acceso a Node.
import { contextBridge, ipcRenderer } from 'electron';
import type { AppInfo, JarvisBridge } from './ipc-contract';

const bridge: JarvisBridge = {
  getAppInfo: () => ipcRenderer.invoke('app:get-info') as Promise<AppInfo>,
};

contextBridge.exposeInMainWorld('jarvis', Object.freeze(bridge));
