# JARVIS KIDS OS

Central infantil de aprendizaje y entretenimiento para niños de **3 a 6 años**:
interfaz a pantalla completa, botones grandes, videos educativos de YouTube
**aprobados previamente por un adulto** y salida protegida con PIN parental.

- Desarrollo: macOS (Apple Silicon)
- Destino: Windows 11 Pro (x64)
- Tecnologías: Electron · React · TypeScript · Vite · Tailwind CSS

> **Estado: v0.3** — pantalla de inicio, panel de padres con PIN, lista blanca de
> videos/listas/canales de YouTube y reproductor protegido. Ver el plan completo en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

---

## ⚡ Instalación rápida en Windows (sin Node ni Git)

1. Descarga: <https://github.com/onemoreint/jarvis-kids-os/releases/latest/download/JARVIS-KIDS-OS-Setup.exe>
2. Doble clic → SmartScreen: «Más información» → «Ejecutar de todas formas» → aceptar el aviso de administrador.
3. Se instala para todos los usuarios y se abre sola.
4. **Actualizar**: primero sal de la app (botón ⏻ Salir + PIN; o usa el script de abajo, que la cierra solo), descarga de nuevo el mismo link y ejecútalo. Se conservan el PIN y los videos.

### Instalar videos con un script (sin abrir el panel)

1. Descarga <https://github.com/onemoreint/jarvis-kids-os/releases/latest/download/Instalar-Videos-JARVIS.bat>
2. Doble clic (en la cuenta de Windows donde se usa la app; no hace falta "Ejecutar como administrador").
   Si Windows avisa: «Más información» → «Ejecutar de todas formas».
3. El script cierra la app, la actualiza a la última versión, deja la lista de videos y la vuelve a abrir.
   Los videos aparecen solos en unos segundos.

Para cambiar los videos, abre el `.bat` con el Bloc de notas y edita la lista
(`[Categoría]` y debajo los enlaces). El resultado de cada importación queda en
`%APPDATA%\JARVIS KIDS OS\importado-<fecha>.txt`. También puedes crear a mano
`%APPDATA%\JARVIS KIDS OS\importar.txt` con el mismo formato: se importa al abrir la app.

### Uso del panel de padres

- Mantén presionado **⚙️ Padres** (abajo a la derecha) → la primera vez creas un PIN de 4–6 números.
- **Añadir videos**: pega enlaces de YouTube, YouTube Kids, listas de reproducción o canales (`youtube.com/@nombre`), elige la categoría y pulsa Añadir.
- **✨ Añadir paquete sugerido**: carga una selección inicial de canales educativos.
- Cada elemento se puede **mover** de categoría o **quitar** cuando quieras.
- **Salir de la app**: botón **⏻ Salir** en la pantalla principal (pide el PIN). Alt+F4 está bloqueado.
- Los datos se guardan en `%APPDATA%\JARVIS KIDS OS\` (`content.json` y `pin.json`).

Para publicar una versión nueva desde la Mac: subir `version` en `package.json`,
`npm run dist:win:desde-mac` y `gh release create vX.Y.Z release/JARVIS-KIDS-OS-Setup.exe`.

---

## 1. Requisitos

| Herramienta | Versión            | Comprobar            |
| ----------- | ------------------ | -------------------- |
| Node.js     | 22 LTS o 24 LTS    | `node -v`            |
| npm         | incluido con Node  | `npm -v`             |
| Git         | 2.40 o superior    | `git --version`      |

### Instalar Node.js en macOS (elige una opción)

- **Instalador oficial**: descarga el `.pkg` LTS desde <https://nodejs.org>.
- **Homebrew**:

  ```bash
  brew install node@24
  ```

  `node@24` no se enlaza automáticamente; añádelo al `PATH` una vez:

  ```bash
  echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
  ```

> **npm 11+ y `allowScripts`**: npm ya no ejecuta scripts de instalación de
> paquetes no aprobados. `package.json` aprueba solo `electron` y `esbuild`
> (necesarios); el resto se omite a propósito. Electron descarga su binario la
> primera vez que se ejecuta.

## 2. Ejecutar en macOS

```bash
cd ~/Documents/JARVIS-KIDS-OS
npm install          # solo la primera vez (descarga ~300 MB, incluido Electron)
npm run dev          # abre la app con recarga en caliente
```

`npm run dev` arranca Vite en `http://127.0.0.1:5173` y abre Electron en una
**ventana normal** (no pantalla completa) con DevTools habilitadas.
Para cerrar: `Cmd + Q` en la ventana o `Ctrl + C` en la terminal.

Otros comandos:

| Comando             | Qué hace                                                            |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev:web`   | Solo la interfaz en el navegador (sin Electron), útil para diseño.  |
| `npm run typecheck` | Revisa tipos de TypeScript.                                         |
| `npm start`         | Compila y abre la versión de producción (pantalla completa, sin DevTools). Sal con `Cmd + Q`. |
| `npm run dist:mac`  | Genera un `.dmg` de prueba sin firmar en `release/`.               |
| `npm run dist:win`  | Genera el instalador de Windows. **Hazlo en Windows** (ver abajo).  |

## 3. Estructura

```
JARVIS-KIDS-OS/
├── electron/                 Proceso principal (Node) — compilado a dist-electron/
│   ├── main.ts               Ventana, protocolo app://, CSP, IPC validado
│   ├── preload.ts            Puente mínimo (contextBridge) en sandbox
│   ├── security.ts           CSP, permisos, bloqueo de navegación y ventanas
│   └── ipc-contract.ts       Tipos compartidos
├── src/                      Interfaz React (renderer) — compilada a dist/
│   ├── App.tsx               Navegación interna (sin URLs)
│   ├── screens/              HomeScreen, CategoryScreen
│   ├── components/           Tarjetas, orbe JARVIS, botón de padres…
│   ├── data/                 Categorías y lista blanca de videos
│   ├── hooks/ lib/           Utilidades (reloj, pulsación larga, voz)
│   └── index.css             Tailwind + tema
├── docs/                     Arquitectura, Windows, recuperación
├── electron-builder.yml      Empaquetado (NSIS para Windows)
└── vite.config.ts
```

## 4. Seguridad (implementada en la fase 1)

- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webviewTag: false`.
- DevTools desactivadas en producción; sin menú de aplicación.
- Interfaz servida desde un protocolo propio `app://jarvis/` con protección contra *path traversal*.
- **CSP** estricta: solo scripts propios y los dominios de YouTube necesarios para la IFrame API.
- Bloqueo de navegación externa (`will-navigate`, `will-redirect`), de ventanas nuevas y de `<webview>`.
- Todos los permisos del navegador denegados (cámara, micrófono, ubicación…) y descargas bloqueadas.
- IPC con validación del origen del remitente.
- Instancia única de la aplicación.

## 5. GitHub

Crea primero un repositorio vacío en <https://github.com/new>
(sin README ni .gitignore), y luego:

```bash
git init
git add .
git commit -m "Fase 1: estructura y pantalla de inicio"
git branch -M main
git remote add origin https://github.com/onemoreint/jarvis-kids-os.git
git push -u origin main
```

Recomendaciones: el repositorio es público; no subas nunca PINs, hashes
reales ni archivos de datos de los niños (`.gitignore` ya excluye `.env`,
`dist/`, `release/` y `node_modules/`).

## 6. Instalar y compilar en Windows 11 Pro

Resumen (detalles en [docs/WINDOWS.md](docs/WINDOWS.md)):

1. Inicia sesión con la **cuenta administradora adulta**.
2. Instala Node.js LTS (nodejs.org) y Git for Windows (git-scm.com).
3. En PowerShell:

   ```powershell
   git clone https://github.com/onemoreint/jarvis-kids-os.git
   cd jarvis-kids-os
   npm ci
   npm run dev        # probar
   npm run dist:win   # genera release\JARVIS KIDS OS Setup x.y.z.exe
   ```

4. Ejecuta el instalador (se instala para todos los usuarios).

## 7. Cuenta adulta y recuperación

La cuenta administradora adulta **nunca** se bloquea ni se modifica desde la app.
Lee [docs/RECUPERACION.md](docs/RECUPERACION.md) antes de configurar el modo quiosco.
