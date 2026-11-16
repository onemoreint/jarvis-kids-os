# Arquitectura y hoja de ruta

## Principios

1. **Lista blanca, nunca lista negra.** El niño solo ve lo que un adulto aprobó.
2. **Mínimo privilegio.** La interfaz no tiene acceso a Node; todo lo sensible
   (PIN, almacenamiento, salida) vive en el proceso principal y se pide por IPC
   validado.
3. **El sistema operativo hace el bloqueo fuerte.** La app no intenta
   interceptar combinaciones protegidas de Windows (Ctrl+Alt+Supr, Win+L,
   etc.). El aislamiento real lo da **Windows Assigned Access** sobre una cuenta
   estándar infantil.
4. **Siempre recuperable.** Una cuenta administradora adulta conserva el control total.

## Capas

```
┌──────────────────────────────────────────────┐
│ Windows 11 Pro — Assigned Access (fase 5)    │  cuenta infantil estándar
│ ┌──────────────────────────────────────────┐ │
│ │ Electron main (Node)                     │ │  PIN (scrypt), almacenamiento,
│ │  · protocolo app://  · CSP · permisos    │ │  lista blanca, salida
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ preload (sandbox, contextBridge)     │ │ │  API mínima y tipada
│ │ │ ┌──────────────────────────────────┐ │ │ │
│ │ │ │ React UI (sin Node)              │ │ │ │  pantallas infantiles
│ │ │ │  └ iframe youtube-nocookie       │ │ │ │  solo IDs aprobados
│ │ │ └──────────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Fases

| Fase | Contenido |
| ---- | --------- |
| **1 (actual)** | Estructura, Electron endurecido, CSP, pantalla de inicio con 7 categorías, voz al tocar. |
| 2 | Panel de padres: PIN de 4–6 dígitos con hash **scrypt** (`node:crypto`, sal aleatoria de 16 bytes, comparación con `timingSafeEqual`) en el proceso principal; bloqueo progresivo tras intentos fallidos; salida de pantalla completa solo con PIN. |
| 3 | Reproductor con **YouTube IFrame API**: `youtube-nocookie.com`, `rel=0`, sin controles de navegación, sin enlaces a youtube.com; los IDs se validan contra la lista blanca en el proceso principal antes de reproducir. |
| 4 | Almacenamiento local seguro: archivo JSON en `app.getPath('userData')` con datos sensibles cifrados mediante `safeStorage` (DPAPI en Windows, Keychain en macOS); editor de lista blanca y límites de tiempo de uso. |
| 5 | Integración con **Windows Assigned Access** (quiosco de una sola app) y guía de políticas; ver [WINDOWS.md](WINDOWS.md). |
| 6 | Iconos, firma de código, auto-actualización opcional, pruebas finales en la laptop. |

## Notas técnicas para la fase 3 (YouTube)

- Desde 2025 YouTube exige que el reproductor embebido envíe una cabecera
  `Referer` válida (si falta, aparece el error 153). Con el protocolo
  `app://` habrá que verificarlo en la propia máquina y, si es necesario,
  establecer el `Referer` solo para las peticiones a `youtube-nocookie.com`
  mediante `webRequest.onBeforeSendHeaders`.
- La CSP ya permite `frame-src` a `youtube-nocookie.com`/`youtube.com` y
  `script-src` a `youtube.com`/`s.ytimg.com` para cargar la IFrame API.
- Dentro del iframe pueden aparecer enlaces de YouTube; `will-navigate`,
  `setWindowOpenHandler` y la cuenta infantil en Assigned Access impiden que
  se abran fuera de la app.

## Decisiones

- **Protocolo `app://` en lugar de `file://`**: permite aplicar CSP por
  cabecera, restringir rutas y validar el origen de los mensajes IPC.
- **Preload sin imports locales**: con `sandbox: true` el preload solo puede
  usar `electron`; los tipos se comparten mediante `import type`.
- **Sin `cross-env`**: el modo desarrollo se activa con el argumento
  `--dev-server=` y solo si la app no está empaquetada.
