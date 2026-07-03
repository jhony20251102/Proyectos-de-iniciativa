@echo off
:: =====================================================================
:: LAZADOR OFICIAL DE NOVA.IA - DESARROLLADO PARA RICKY
:: =====================================================================
title Lanzador Nova.IA - Ecosistema de Inteligencia
mode con: cols=80 lines=20
color 0B

echo.
echo   ###########################################################
echo   #                                                         #
echo   #            🚀 INICIANDO ECOSISTEMA NOVA.IA              #
echo   #                                                         #
echo   ###########################################################
echo.

:: 1. INICIAR EL FRONTEND (Interfaz 3D)
echo [STEP 1] Levantando Frontend (Vite + React)...
start "NOVA_FRONTEND" cmd /k "cd /d c:\Users\rsedano\Desktop\certus-asistente && npm run dev"

echo.
echo   Espere un momento mientras se prepara el Servidor...
timeout /t 3 /nobreak > nul

:: 2. INICIAR EL BACKEND (Cerebro IA + Memoria)
echo [STEP 2] Levantando Backend (NodeJS + Memory)...
start "NOVA_BACKEND" cmd /k "cd /d c:\Users\rsedano\Desktop\certus-asistente\backend && npm run dev"

echo.
echo [STEP 3] Abriendo Nova en el navegador (Google Chrome)...
timeout /t 3 /nobreak > nul
start chrome http://localhost:5173/ || start http://localhost:5173/

echo.
echo   -----------------------------------------------------------
echo   ✅ PROCESO COMPLETADO
echo   -----------------------------------------------------------
echo   Nova ahora esta operativa:
echo   - Interfaz: http://localhost:5173
echo   - Cerebro:  http://localhost:3001
echo   -----------------------------------------------------------
echo.
echo   Presiona cualquier tecla para cerrar este lanzador...
pause > nul
