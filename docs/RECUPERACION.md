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
- PIN parental de JARVIS KIDS OS (a partir de la fase 2).

Usa un gestor de contraseñas o papel guardado bajo llave. **No** guardes estos
datos en el repositorio de GitHub.

## Escenarios

| Problema | Solución |
| -------- | -------- |
| Olvidé el PIN parental (fase 2+) | Inicia sesión con la cuenta adulta y usa la opción de restablecer PIN que se documentará en la fase 2 (borrar el archivo de configuración de la app en el perfil de la cuenta infantil restablece el PIN, sin afectar a Windows). |
| La app no abre en la cuenta infantil | `Ctrl + Alt + Supr` → Cambiar de usuario → cuenta adulta → reinstalar la app o revisar el quiosco. |
| Quiero quitar el modo quiosco | Cuenta adulta → Configuración → Cuentas → Otros usuarios → Quiosco → Quitar quiosco. |
| Olvidé la contraseña adulta (cuenta Microsoft) | Restablecer en <https://account.live.com/password/reset> desde otro dispositivo. |
| Olvidé la contraseña adulta (cuenta local) | Preguntas de seguridad en la pantalla de inicio; si no hay, se requiere otra cuenta administradora o reinstalar Windows. Por eso se recomienda **dos** administradores adultos o usar cuenta Microsoft. |
| La laptop no arranca | Entorno de recuperación de Windows (Mayús + Reiniciar) con la clave de BitLocker a mano. |
