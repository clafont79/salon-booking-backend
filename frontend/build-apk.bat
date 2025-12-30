@echo off
echo ================================
echo Building hairIT APK v1.3.0
echo ================================
echo.

cd /d "%~dp0android"

echo [1/2] Cleaning previous build...
call gradlew.bat clean
if errorlevel 1 (
    echo ERROR: Clean failed
    pause
    exit /b 1
)

echo.
echo [2/2] Building debug APK...
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ================================
echo BUILD SUCCESSFUL!
echo ================================
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.

pause
