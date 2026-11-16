// Preload en sandbox: solo puede usar 'electron' (no require de archivos
// locales). Expone una API mínima y tipada, sin acceso a Node.
import { contextBridge, ipcRenderer } from 'electron';
import type { JarvisBridge } from './ipc-contract';

const invoke = ipcRenderer.invoke.bind(ipcRenderer);

const bridge: JarvisBridge = {
  getAppInfo: () => invoke('app:get-info'),
  listContent: () => invoke('content:list'),
  pinStatus: () => invoke('pin:status'),
  createPin: (pin) => invoke('pin:create', pin),
  verifyPin: (pin) => invoke('pin:verify', pin),
  changePin: (current, next) => invoke('pin:change', current, next),
  lockParent: () => invoke('parent:lock'),
  addContent: (text, category) => invoke('content:add', text, category),
  removeContent: (id) => invoke('content:remove', id),
  moveContent: (id, category) => invoke('content:move', id, category),
  addStarterPack: () => invoke('content:add-starter'),
  quitApp: () => invoke('app:quit'),
};

contextBridge.exposeInMainWorld('jarvis', Object.freeze(bridge));
