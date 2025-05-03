@echo off
echo Starting Rabbitholes Application...

:: Set title for main window
title Rabbitholes App Manager

:: Try to use NVM if available, otherwise use system Node.js
where nvm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo NVM detected. Activating Node.js 20.0.0 with NVM...
    call nvm use 20.0.0
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to activate Node.js version 20.0.0 with NVM.
        echo Please make sure NVM is installed and the specified version is available.
        echo You can install this version using: nvm install 20.0.0
        echo.
        pause
        exit /b 1
    )
    echo Node.js activated successfully: 
    node -v
) else (
    echo NVM not found. Using system Node.js. Please ensure Node.js v18+ is installed and on your PATH.
    node -v
)

:: Create a new directory if it doesn't exist for log files
if not exist "%~dp0logs" mkdir "%~dp0logs"

:: Start backend server in a new terminal window
echo Starting backend server...
start "Rabbitholes Backend" cmd /k "cd %~dp0backend && echo Starting backend server... && yarn start > %~dp0logs\backend.log 2>&1"

:: Wait for backend to be ready on port 3000
echo Waiting for backend to be ready on http://localhost:3000 ...
npx wait-on http://localhost:3000

:: Start frontend in a new terminal window
echo Starting frontend development server...
start "Rabbitholes Frontend" cmd /k "cd %~dp0frontend && echo Starting frontend development server... && yarn start > %~dp0logs\frontend.log 2>&1"

:: Wait for frontend to be ready on port 5173
echo Waiting for frontend to be ready on http://localhost:5173 ...
npx wait-on http://localhost:5173

:: Open the application in the default browser
echo Opening application in browser...
start http://localhost:5173

echo.
echo Rabbitholes application is now starting.
echo - Backend server running on http://localhost:3000
echo - Frontend server running on http://localhost:5173
echo - Log files are saved in the logs directory
echo.
echo To stop the application, close the terminal windows or press Ctrl+C in each window.
echo.

pause
