@echo off
title BecuGram Mobile - Android Studio Launcher
echo ========================================================
echo   BecuGram Mobile - Android Studio Emulator Launcher
echo ========================================================
echo.

set ANDROID_HOME=C:\Users\user\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator

echo [1/3] Android SDK tekshirildi: %ANDROID_HOME%
echo.

echo [2/3] Ulangan qurilmalar (adb devices):
adb devices
echo.

echo [3/3] BecuGram Mobile Expo ishga tushirilmoqda...
cd /d "%~dp0mobile"
call npx expo start --android
pause

