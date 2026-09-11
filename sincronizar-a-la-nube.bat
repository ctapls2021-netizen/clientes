@echo off
chcp 65001 > nul
title Sincronizador Webmaster Cloud
color 0B
cls
echo ====================================================================
echo        WEBMASTER CLOUD - SINCRONIZADOR AUTOMATICO
echo ====================================================================
echo Carpeta actual: %~dp0
echo Servidor:        https://webmaster.gdtwo.com
echo --------------------------------------------------------------------
echo.

set "SCRIPT_PATH=%~dp0..\webmaster-platform\sync-folder.js"
if not exist "%SCRIPT_PATH%" set "SCRIPT_PATH=c:\Users\Diego\Downloads\Agente Ayrton\webmaster-platform\sync-folder.js"

node "%SCRIPT_PATH%" "%~dp0."

echo.
echo ====================================================================
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
