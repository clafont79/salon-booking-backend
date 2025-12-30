@echo off
echo ========================================
echo  hairIT - Build APK Android Semplificato
echo ========================================
echo.

REM Imposta JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-17
echo JAVA_HOME impostato su: %JAVA_HOME%
echo.

REM Vai nella directory android
cd android

echo [1/2] Pulizia build precedente...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE durante la pulizia!
    pause
    exit /b 1
)
echo.

echo [2/2] Compilazione APK Release...
echo Questo processo richiede 5-10 minuti, attendere prego...
echo.
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ERRORE durante il build APK!
    pause
    exit /b 1
)
echo.

echo ========================================
echo  BUILD COMPLETATO!
echo ========================================
echo.
echo APK generato in:
echo app\build\outputs\apk\release\app-release.apk
echo.
pause
