@echo off
echo ========================================
echo Rigenerazione Progetto Android
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Rimozione cartella android...
if exist android (
    rmdir /s /q android
    echo Android folder removed
) else (
    echo Android folder not found
)

echo.
echo [2/4] Rigenerazione progetto Android con Capacitor...
call npx cap add android
if errorlevel 1 (
    echo ERROR: Failed to add Android platform
    pause
    exit /b 1
)

echo.
echo [3/4] Ripristino configurazioni...

:: Crea strings.xml con il nome hairIT
echo ^<?xml version="1.0" encoding="utf-8"?^> > android\app\src\main\res\values\strings.xml
echo ^<resources^> >> android\app\src\main\res\values\strings.xml
echo     ^<string name="app_name"^>hairIT^</string^> >> android\app\src\main\res\values\strings.xml
echo     ^<string name="title_activity_main"^>hairIT^</string^> >> android\app\src\main\res\values\strings.xml
echo     ^<string name="package_name"^>com.salon.booking^</string^> >> android\app\src\main\res\values\strings.xml
echo     ^<string name="custom_url_scheme"^>com.salon.booking^</string^> >> android\app\src\main\res\values\strings.xml
echo ^</resources^> >> android\app\src\main\res\values\strings.xml

echo.
echo [4/4] Rigenerazione icone...
python create-icons.py
if errorlevel 1 (
    echo WARNING: Icon generation failed
)

echo.
echo ========================================
echo COMPLETATO!
echo ========================================
echo.
echo Ora puoi compilare l'APK con:
echo cd android
echo gradlew assembleDebug
echo.
pause
