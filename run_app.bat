@echo off
setlocal enabledelayedexpansion
title Apex Coders Knowledge Handover Platform - Round 3 Final Build

set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo =====================================================================
echo    APEX CODERS KNOWLEDGE HANDOVER PLATFORM
echo    CodeFrontier Hackathon Round 3 - Final Build
echo    Team: Aayush Patil ^& Omkar Patil (VIT Pune)
echo =====================================================================
echo.

:: ---------------------------------------------------------------------
:: 1. Detect and Configure Node.js / npm Environment
:: ---------------------------------------------------------------------
set "NODE_FOUND=0"
where node >nul 2>&1
if %errorlevel% equ 0 (
    set "NODE_FOUND=1"
) else (
    if exist "%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\9c26d707817e90a7\bin\node.exe" (
        set "PATH=%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\9c26d707817e90a7\bin;%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\9c26d707817e90a7\bin\node_modules\corepack\shims;!PATH!"
        set "NODE_FOUND=1"
    ) else if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;!PATH!"
        set "NODE_FOUND=1"
    )
)

if "!NODE_FOUND!"=="0" (
    echo [ERROR] Node.js executable not detected on this system.
    echo Please install Node.js v18+ or ensure node.exe is in your PATH.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------
:: 2. Detect and Configure Python Environment
:: ---------------------------------------------------------------------
set "PYTHON_FOUND=0"
where python >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_FOUND=1"
) else (
    if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Python\Python313;%LOCALAPPDATA%\Programs\Python\Python313\Scripts;!PATH!"
        set "PYTHON_FOUND=1"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;!PATH!"
        set "PYTHON_FOUND=1"
    )
)

if "!PYTHON_FOUND!"=="0" (
    echo [ERROR] Python 3.10+ executable not detected on this system.
    echo Please install Python and ensure python.exe is in your PATH.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------------
:: 3. Launch or Reuse FastAPI Backend (Port 8000)
:: ---------------------------------------------------------------------
netstat -ano | findstr /R /C:":8000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/2] FastAPI Backend is ALREADY RUNNING on http://127.0.0.1:8000
) else (
    echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
    start "Apex Backend Service (Port 8000)" cmd /k "cd /d "%PROJECT_ROOT%backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
)

:: ---------------------------------------------------------------------
:: 4. Launch or Reuse React Vite Frontend (Port 5173)
:: ---------------------------------------------------------------------
netstat -ano | findstr /R /C:":5173.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [2/2] React Vite Frontend is ALREADY RUNNING on http://localhost:5173
) else (
    echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
    start "Apex Frontend Service (Port 5173)" cmd /k "cd /d "%PROJECT_ROOT%frontend" && node.exe .\node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5173"
)

:: ---------------------------------------------------------------------
:: 5. Status Overview & Automatic Browser Launch
:: ---------------------------------------------------------------------
timeout /t 2 /nobreak >nul 2>&1

echo.
echo =====================================================================
echo    CODEFRONTIER SERVICES ENGAGED AND OPERATIONAL
echo =====================================================================
echo    - Web Application:   http://localhost:5173
echo    - System Health:     http://127.0.0.1:8000/api/health
echo    - OpenAPI Docs:      http://127.0.0.1:8000/docs
echo =====================================================================
echo.
echo Opening http://localhost:5173 in default browser...
start http://localhost:5173/

echo.
echo Both services are running in background worker windows.
echo To stop services, close the backend and frontend command windows.
echo.
pause
