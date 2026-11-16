@echo off
title BecuGram - Backend Server (Port 5000)
color 0A
cd /d "%~dp0"
echo ========================================================
echo   BecuGram Server Ishga Tushmoqda...
echo   Port: 5000
echo   Android Emulator manzili: http://10.0.2.2:5000
echo ========================================================
echo.
npm run dev:server
pause

