# Windows 11 Pro: instalación, compilación y quiosco

> Esta guía **no** cambia nada del sistema por sí sola. Cada paso lo realiza un
> adulto conscientemente con la cuenta administradora.

## 1. Preparar la laptop

1. Mantén una **cuenta administradora adulta** con contraseña robusta (ver
   [RECUPERACION.md](RECUPERACION.md)).
2. Instala, con esa cuenta:
   - Node.js LTS (x64): <https://nodejs.org>
   - Git for Windows: <https://git-scm.com/download/win>
3. Comprueba en PowerShell:

   ```powershell
   node -v
   npm -v
   git --version
   ```

## 2. Obtener y probar el proyecto

```powershell
cd $HOME\Documents
git clone https://github.com/onemoreint/jarvis-kids-os.git
cd jarvis-kids-os
npm ci
npm run dev
```

## 3. Compilar el instalador

```powershell
npm run dist:win
```

Resultado: `release\JARVIS KIDS OS Setup <versión>.exe` (NSIS, x64,
instalación para todos los usuarios). Al no estar firmado, SmartScreen
mostrará un aviso: «Más información» → «Ejecutar de todas formas». La firma
de código se planificará en la fase 6.

> Compilar para Windows desde macOS es posible en parte, pero la compilación
> **oficial y las pruebas finales se hacen en Windows**.

## 4. Pruebas finales en Windows (lista de comprobación)

- [ ] La app abre a pantalla completa y sin menú.
- [ ] Las 7 categorías responden al tacto/clic y se escucha la voz.
- [ ] El botón 🔒 solo reacciona tras mantenerlo 3 segundos.
- [ ] No se abren ventanas nuevas ni enlaces externos.
- [ ] Escalado de pantalla 125 % y 150 %: todo cabe sin desplazamiento.

## 5. Diseño de la integración con Assigned Access (fase 5)

Objetivo: que la cuenta infantil solo pueda ejecutar JARVIS KIDS OS, usando
las funciones nativas de Windows 11 Pro en lugar de trucos dentro de la app.

1. Crear una **cuenta local estándar** (sin privilegios), p. ej. `Peques`.
2. Configuración → Cuentas → Otros usuarios → **Configurar un quiosco**
   (Assigned Access), elegir la cuenta `Peques` y la app **JARVIS KIDS OS**
   (aplicación Win32 de pantalla completa; en ediciones recientes de
   Windows 11 Pro se configura mediante el asistente o un archivo XML de
   Assigned Access aplicado por un administrador).
3. Al iniciar sesión `Peques`, Windows abre la app; si se cierra, Windows la
   reinicia.
4. Para salir del quiosco: `Ctrl + Alt + Supr` → cambiar de usuario →
   cuenta adulta. **No se bloquea** esta combinación: es la vía de
   recuperación.

Políticas complementarias a evaluar (siempre aplicadas a la cuenta infantil,
nunca a la adulta, y documentadas antes de aplicarlas):

- Family Safety / filtros de contenido de Microsoft.
- Desactivar el acceso a Configuración y al Panel de control para la cuenta
  infantil (GPO por usuario o MDM).
- Actualizaciones de Windows activas.

La app no modificará el registro ni políticas por su cuenta.

## 6. Desinstalar

Configuración → Aplicaciones → Aplicaciones instaladas → JARVIS KIDS OS →
Desinstalar (con la cuenta adulta).
