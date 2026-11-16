@echo off
title BecuGram Mobile - APK Yaratish (Android Studio / Gradle)
echo ========================================================
echo   BecuGram Mobile - Mijoz uchun APK Yaratish
echo ========================================================
echo.

set ANDROID_HOME=C:\Users\user\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator

cd /d "%~dp0"

echo [1/3] Android Native loyihasi tekshirilmoqda...
if not exist "android" (
    echo android papkasi topilmadi. Expo Prebuild ishga tushirilmoqda...
    call npx expo prebuild --platform android
    if errorlevel 1 (
        echo [XATOLIK] Prebuild jarayonida xatolik yuz berdi!
        pause
        exit /b 1
    )
) else (
    echo [OK] android papkasi mavjud.
)

echo.
echo [2/3] Gradle orqali APK yig'ilmoqda (assembleDebug)...
cd android
call gradlew.bat assembleDebug

if errorlevel 1 (
    echo.
    echo [XATOLIK] APK yig'ishda xatolik yuz berdi.
    echo Loyihani Android Studio orqali ochib sinab ko'rishingiz mumkin:
    echo Manzil: %~dp0android
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [3/3] MUVAFFAQITYATLI YAKUNLANDI!
echo APK fayl tayyor:
set APK_PATH=%~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo %APK_PATH%
echo ========================================================
echo.

if exist "%APK_PATH%" (
    echo Tayyor APK fayli joylashgan papka ochilmoqda...
    explorer /select,"%APK_PATH%"
)

pause

