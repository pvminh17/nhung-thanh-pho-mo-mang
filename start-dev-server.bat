@echo off
echo.
echo 🎵 Vietnamese Music PWA - Development Server
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org
    echo.
    pause
    exit /b 1
)

echo 🚀 Starting development server...
echo.
echo 📱 The app will open in your browser automatically
echo 🛑 Press Ctrl+C to stop the server
echo.

REM Start the Python server
python dev-server.py

pause
