@echo off
:: =====================================================================
:: LAZADOR PUBLICO DE NOVA.IA - DESARROLLADO PARA RICKY
:: =====================================================================
title Lanzador Nova.IA Publico - Certus
mode con: cols=90 lines=22
color 0E

echo.
echo   ################################================###########
echo   #                                                         #
echo   #      🚀 INICIANDO NOVA.IA CON URL PUBLICA (CELULARES)   #
echo   #                                                         #
echo   ###########################################################
echo.

:: 1. INICIAR EL BACKEND (Que sirve tanto el Cerebro como el Frontend compilado)
echo [PASO 1] Iniciando Servidor Unificado (Puerto 3001)...
start "NOVA_BACKEND" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo   Esperando a que el servidor inicialice...
timeout /t 5 /nobreak > nul

:: 2. INICIAR LOCALTUNNEL CON SUBDOMINIO FIJO
echo [PASO 2] Iniciando Tunel Publico (LocalTunnel)...
echo.
echo   Tu URL fija sera:
echo   https://nova-certus-ate.loca.lt
echo.
start "NOVA_TUNEL_PUBLICO" cmd /k "npx -y localtunnel --port 3001 --subdomain nova-certus-ate"

echo.
echo   -----------------------------------------------------------
echo   ✅ PROCESO INICIADO CON EXITO
echo   -----------------------------------------------------------
echo   - Acceso Local: http://localhost:3001
echo   - Acceso Publico: https://nova-certus-ate.loca.lt
echo   -----------------------------------------------------------
echo.
echo   Presiona cualquier tecla para cerrar este lanzador...
pause > nul
