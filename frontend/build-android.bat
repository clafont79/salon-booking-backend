@echo off
echo ========================================
echo  hairIT - Build e Deploy Android
echo ========================================
echo.

echo [1/4] Building web app...
call npm run build -- --configuration production
if errorlevel 1 (
    echo ERRORE durante il build web!
    pause
    exit /b 1
)

echo [2/4] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERRORE durante la sync!
    pause
    exit /b 1
)

echo [3/4] Building Android APK...
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo ERRORE durante il build APK!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [4/4] Copiando APK...
if not exist "releases" mkdir releases
copy "android\app\build\outputs\apk\release\app-release.apk" "releases\hairIT-v1.0.0.apk"

echo.
echo ========================================
echo  ✅ Build completato con successo!
echo ========================================
echo.
echo APK disponibile in: releases\hairIT-v1.0.0.apk
echo.
echo Prossimi passi:
echo 1. Testa l'APK su un dispositivo Android
echo 2. Carica su GitHub Releases
echo 3. Aggiorna l'URL in generate-qr.js
echo 4. Rigenera i QR code
echo.
pause
