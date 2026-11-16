# Cuenta adulta y recuperación segura

## Reglas

1. **Siempre existe una cuenta administradora adulta** en la laptop Windows,
   separada de la cuenta infantil. La app nunca se ejecuta como administradora
   ni en quiosco sobre esa cuenta.
2. La cuenta infantil es **estándar** (sin privilegios de administrador).
3. Nunca se deshabilitan `Ctrl + Alt + Supr`, el cambio de usuario ni el
   arranque en modo seguro: son las vías de recuperación.

## Qué guardar en un lugar seguro (fuera de la laptop)

- Contraseña de la cuenta administradora adulta.
- Clave de recuperación de **BitLocker** (si está activado; suele estar en la
  cuenta Microsoft del adulto: <https://account.microsoft.com/devices/recoverykey>).
- PIN parental de JARVIS KIDS OS.

Usa un gestor de contraseñas o papel guardado bajo llave. **No** guardes estos
datos en el repositorio de GitHub.

## Escenarios

| Problema | Solución |
| -------- | -------- |
| Olvidé el PIN parental | Cierra la app (Ctrl+Alt+Supr → Administrador de tareas → JARVIS KIDS OS → Finalizar tarea). Borra el archivo `%APPDATA%\JARVIS KIDS OS\pin.json` de la cuenta de Windows donde se usa la app (desde la cuenta adulta: `C:\Users\<cuenta>\AppData\Roaming\JARVIS KIDS OS\pin.json`). Al abrir la app pedirá crear un PIN nuevo; los videos se conservan. |
| La app está colgada y no puedo salir | Ctrl+Alt+Supr → Administrador de tareas → JARVIS KIDS OS → Finalizar tarea. |
| La app no abre en la cuenta infantil | `Ctrl + Alt + Supr` → Cambiar de usuario → cuenta adulta → reinstalar la app o revisar el quiosco. |
| Quiero quitar el modo quiosco | Cuenta adulta → Configuración → Cuentas → Otros usuarios → Quiosco → Quitar quiosco. |
| Olvidé la contraseña adulta (cuenta Microsoft) | Restablecer en <https://account.live.com/password/reset> desde otro dispositivo. |
| Olvidé la contraseña adulta (cuenta local) | Preguntas de seguridad en la pantalla de inicio; si no hay, se requiere otra cuenta administradora o reinstalar Windows. Por eso se recomienda **dos** administradores adultos o usar cuenta Microsoft. |
| La laptop no arranca | Entorno de recuperación de Windows (Mayús + Reiniciar) con la clave de BitLocker a mano. |
