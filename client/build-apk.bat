@echo off
setlocal enabledelayedexpansion
title BecuGram - Web UI APK Yaratish (Android Studio / Gradle)

echo ========================================================
echo   BecuGram (npm run dev dagi 100%% bir xil Style) APK
echo ========================================================
echo.

set ANDROID_HOME=C:\Users\user\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator

cd /d "%~dp0"

:: 1. Run Node script to prepare Capacitor and Android project
echo [1/2] Android Studio loyihasi tayyorlanmoqda...
call node prepare-android.js
if errorlevel 1 (
    echo.
    echo [XATOLIK] Tayyorlash jarayonida xatolik yuz berdi.
    echo Iltimos, yuqoridagi xabarni o'qing.
    echo.
    pause
    exit /b 1
)

:: 2. Build APK via Gradle
echo.
echo [2/2] APK fayl yig'ilmoqda (Gradle assembleDebug)...
echo Bu birinchi marta 1-3 daqiqa vaqt olishi mumkin, kuting...
echo.

cd android
call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo ========================================================
    echo [ESLATMA]
    echo Gradle orqali to'g'ridan-to'g'ri APK yig'ishda xatolik bo'ldi
    echo (odatda bu kompyuterda Android SDK build-tools litsenziyasi
    echo qabul qilinmagani sababli bo'ladi).
    echo.
    echo LEKIN XAVOTIR OLMANG! Loyiha to'liq tayyor bo'ldi.
    echo Uni hozir Android Studio dasturida ochib, 1 ta tugma
    echo orqali APK qilishingiz mumkin!
    echo.
    echo Loyiha manzili:
    echo %~dp0android
    echo ========================================================
    echo.
    echo Hozir Android Studio dasturi ochilsinmi? (H / Y / Enter = Ha)
    set /p OPEN_CHOICE="Tanlov (H/Y): "
    cd "%~dp0"
    call npx cap open android
    echo.
    echo Android Studio ochildi. Unda:
    echo Build menyusi -> Build Bundle(s) / APK(s) -> Build APK(s) ni bosing!
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================================
echo [MUVAFFAQITYATLI] APK TAYYOR BO'LDI!
echo (Bu aynan npm run dev dagi 100%% o'sha interfeys)
echo.
set APK_PATH=%~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo Tayyor fayl:
echo %APK_PATH%
echo ========================================================
echo.

if exist "%APK_PATH%" (
    echo Tayyor APK fayl papkasi ochilmoqda...
    explorer /select,"%APK_PATH%"
)

echo.
echo Loyihani Android Studio dasturida ham ochishni xohlaysizmi? (Y/N)
set /p OPEN_AS="Tanlov (Y/N): "
if /i "%OPEN_AS%"=="Y" (
    cd "%~dp0"
    call npx cap open android
)

echo.
echo Jarayon yakunlandi! Oynani yopish uchun istalgan tugmani bosing.
pause >nul
