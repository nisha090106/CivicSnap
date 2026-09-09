@echo off
title CivicSnap System Launcher
echo ====================================================================
echo                   CivicSnap System Launcher
echo ====================================================================
echo.

for %%I in ("%~dp0..") do set "ROOT_DIR=%%~fI"

REM 1. Determine Python Executable for Backend
if exist "%ROOT_DIR%\backend\venv\Scripts\python.exe" (
    set "PYTHON_CMD=%ROOT_DIR%\backend\venv\Scripts\python.exe"
) else (
    set "PYTHON_CMD=python"
)

echo [1/3] Launching Auth Service (Port 4000)...
start "CivicSnap Auth Service (Port 4000)" cmd /k "cd /d "%ROOT_DIR%\auth-service" && npm start"

echo [2/3] Launching Core Backend API (Port 5000)...
start "CivicSnap Core Backend API (Port 5000)" cmd /k "cd /d "%ROOT_DIR%\backend" && "%PYTHON_CMD%" -m uvicorn main:app --reload --host 0.0.0.0 --port 5000"

echo [3/3] Launching Frontend Application (Port 3000)...
start "CivicSnap Frontend App (Port 3000)" cmd /k "cd /d "%ROOT_DIR%\frontend" && npm run dev"

echo.
echo ====================================================================
echo  CivicSnap microservices are starting up in separate windows:
echo   - Auth Service:       http://localhost:4000
echo   - Core Backend API:   http://localhost:5000 (Docs: /docs)
echo   - Frontend Web App:   http://localhost:3000
echo ====================================================================
echo.
pause
