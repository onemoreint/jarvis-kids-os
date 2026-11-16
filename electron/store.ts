import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

// Archivos JSON en la carpeta de datos del usuario de Windows/macOS:
//   Windows: %APPDATA%\JARVIS KIDS OS\
//   macOS:   ~/Library/Application Support/JARVIS KIDS OS/

export function dataPath(name: string): string {
  return path.join(app.getPath('userData'), name);
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(dataPath(name), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/** Escritura atómica: primero a un .tmp y luego renombrar. */
export function writeJson(name: string, data: unknown): void {
  const target = dataPath(name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, target);
}
