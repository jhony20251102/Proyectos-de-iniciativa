@echo off
REM Script para instalar el cliente ICE y que inicie automáticamente con Windows
REM Debe ejecutarse como Administrador

echo Instalando Cliente ICE...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Permisos de administrador confirmados.
) else (
    echo [ERROR] Por favor ejecuta este archivo como Administrador.
    pause
    exit /b
)

set INSTALL_DIR=C:\Program Files\IceClient

echo Creando directorio de instalacion: %INSTALL_DIR%
mkdir "%INSTALL_DIR%" 2>nul

echo Configurando excepcion de carpeta para alumnos...
mkdir "C:\ALUMNO" 2>nul
uwfmgr file add-exclusion "C:\ALUMNO" >nul 2>&1

echo Copiando archivos...
copy /Y "build\ice-client.exe" "%INSTALL_DIR%\iceclient.exe"
if exist "config.json" copy /Y "config.json" "%INSTALL_DIR%\config.json"
if exist ".env" copy /Y ".env" "%INSTALL_DIR%\.env"

echo Creando tarea programada para iniciar al ingresar sesion...
schtasks /create /f /tn "IceClientService" /tr "\"%INSTALL_DIR%\iceclient.exe\"" /sc onlogon /rl HIGHEST

echo Creando acceso directo en Startup del sistema (invisible para el usuario)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup\IceClient.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\iceclient.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Ice Client'; $Shortcut.Save()"

echo Iniciando el cliente ahora mismo...
schtasks /run /tn "IceClientService"

echo.
echo ===================================================
echo Instalacion completada. 
echo El cliente se ejecutara en la bandeja del sistema y 
echo arrancara automaticamente cada vez que un usuario
echo inicie sesion en esta PC.
echo ===================================================
pause
