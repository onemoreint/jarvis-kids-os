@echo off
setlocal
title JARVIS KIDS OS - Instalar videos
rem ===========================================================================
rem  JARVIS KIDS OS - Instalar videos (Windows 10/11)
rem  Doble clic. NO hace falta "Ejecutar como administrador".
rem  Ejecutalo en la cuenta de Windows donde se usa la app.
rem  1) Cierra la app  2) La actualiza  3) Deja la lista de videos  4) La abre
rem  Para cambiar los videos, edita la lista que hay mas abajo (entre @' y '@).
rem ===========================================================================
set "JARVIS_BAT=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:JARVIS_BAT,[Text.Encoding]::UTF8); iex $s.Substring($s.LastIndexOf('#__PS__'))"
echo.
pause
exit /b

#__PS__
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# ------------------------- LISTA DE VIDEOS ---------------------------------
# Una categoria entre corchetes y debajo sus enlaces (YouTube, YouTube Kids,
# listas de reproduccion o canales @nombre). Categorias validas:
# Matematicas, Letras, Ingles, Animales, Ciencias, Musica, Cuentos, Dibujos
$Videos = @'
[Animales]
https://www.youtube.com/watch?v=Ns-iX4itsQI
https://www.youtube.com/playlist?list=PLFIdvqGgGJp8

[Cuentos]
https://www.youtube.com/watch?v=-lHO77CDa54
https://youtu.be/QDaQkAJjO_k

[Ingles]
https://youtu.be/iVNJ33ePw40

[Musica]
https://youtu.be/mrxTQZW9b08
https://youtu.be/Ggq4tbQdPVM

[Ciencias]
https://youtu.be/Vwma9FcK5T4

[Dibujos]
https://www.youtube.com/watch?v=hWkkMbdwzXs
https://youtu.be/jiR8Arh0x7o
https://youtu.be/wVyLeTrLFBw
https://youtu.be/lAZ01QgTciU
https://youtu.be/WuvvYna34GY
https://youtu.be/NedvnOFrN7I
https://youtu.be/CiKB1byapuw
'@
# ---------------------------------------------------------------------------

$AppName   = 'JARVIS KIDS OS'
$Installer = 'https://github.com/onemoreint/jarvis-kids-os/releases/latest/download/JARVIS-KIDS-OS-Setup.exe'
$DataDir   = Join-Path $env:APPDATA $AppName
$Candidates = @(
  (Join-Path $env:ProgramFiles "$AppName\$AppName.exe"),
  (Join-Path $env:LOCALAPPDATA "Programs\$AppName\$AppName.exe")
)
if (${env:ProgramFiles(x86)}) { $Candidates += (Join-Path ${env:ProgramFiles(x86)} "$AppName\$AppName.exe") }

function Paso($n, $texto) { Write-Host ''; Write-Host "[$n/4] $texto" -ForegroundColor Cyan }

try {
  Write-Host '=== JARVIS KIDS OS: instalar videos ===' -ForegroundColor Yellow

  Paso 1 'Cerrando JARVIS KIDS OS si está abierto...'
  Get-Process -Name $AppName -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2

  Paso 2 'Descargando la última versión (unos 120 MB)...'
  $setup = Join-Path $env:TEMP 'JARVIS-KIDS-OS-Setup.exe'
  try {
    Invoke-WebRequest -Uri $Installer -OutFile $setup -UseBasicParsing
    Write-Host '      Instalando... acepta el aviso de Windows si aparece.'
    $proc = Start-Process -FilePath $setup -ArgumentList '/S' -PassThru
    $proc.WaitForExit()
    # Por si el instalador se relanza o desinstala la versión anterior.
    $limite = (Get-Date).AddMinutes(5)
    Start-Sleep -Seconds 2
    while ((Get-Process -Name 'JARVIS-KIDS-OS-Setup', 'Un_A', 'Un_B' -ErrorAction SilentlyContinue) -and ((Get-Date) -lt $limite)) {
      Start-Sleep -Seconds 1
    }
    Write-Host '      Actualizada.' -ForegroundColor Green
  } catch {
    Write-Host "      No se pudo actualizar: $($_.Exception.Message)" -ForegroundColor DarkYellow
    Write-Host '      Se usará la versión que ya está instalada.' -ForegroundColor DarkYellow
  }

  Paso 3 'Preparando la lista de videos...'
  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
  $importFile = Join-Path $DataDir 'importar.txt'
  $texto = $Videos
  if (Test-Path $importFile) { $texto = [IO.File]::ReadAllText($importFile) + "`r`n" + $Videos }
  [IO.File]::WriteAllText($importFile, $texto, (New-Object System.Text.UTF8Encoding($false)))
  $total = @($Videos -split "`n" | Where-Object { $_ -match '^\s*https?://' }).Count
  Write-Host "      $total enlaces listos en $importFile" -ForegroundColor Green

  Paso 4 'Abriendo JARVIS KIDS OS...'
  $exe = $Candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($exe) {
    Start-Process -FilePath $exe
    Write-Host '      Listo. Los videos aparecerán en unos segundos.' -ForegroundColor Green
    Write-Host "      El resultado queda en $DataDir\importado-<fecha>.txt"
  } else {
    Write-Host '      No encontré la app instalada. Instálala desde:' -ForegroundColor Red
    Write-Host "      $Installer"
    Write-Host '      Los videos se importarán la próxima vez que se abra.'
  }
} catch {
  Write-Host ''
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
