@echo off
title Apex Coders Knowledge Handover Platform - Round 3 Final Build
echo =====================================================================
echo    APEX CODERS KNOWLEDGE HANDOVER PLATFORM
echo    CodeFrontier Hackathon Round 3 - Final Build
echo    Team: Aayush Patil & Omkar Patil (VIT Pune)
echo =====================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Apex Backend (Port 8000)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Apex Frontend (Port 5173)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo Services engaged:
echo - Web Application:  http://localhost:5173
echo - Swagger OpenAPI:   http://127.0.0.1:8000/docs
echo - System Health:    http://127.0.0.1:8000/api/health
echo =====================================================================
pause
