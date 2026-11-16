@echo off
title BecuGram - Kodlarni Yangilash va Android ga O'tkazish
echo ========================================================
echo   BecuGram Web UI Yangilanmoqda...
echo ========================================================
echo.
cd /d "%~dp0client"
call npm run build
echo.
echo Android Studio loyihasi sinxronizatsiya qilinmoqda...
call npx cap sync android
echo.
echo ========================================================
echo [MUVAFFAQITYATLI] Kodlar yangilandi!
echo Endi Android Studio ga o'tib, yashil Play (Run) tugmasini bosing!
echo ========================================================
pause

