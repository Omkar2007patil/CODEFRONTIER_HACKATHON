@echo off
title Apex Coders Knowledge Handover Platform - CodeFrontier R2
echo =====================================================================
echo    APEX CODERS KNOWLEDGE HANDOVER PLATFORM
echo    CodeFrontier Hackathon Round 2 - VIT Pune
echo    Team: Aayush Patil (Frontend) & Omkar Patil (Backend)
echo =====================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Apex Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Apex Frontend Server" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo Both microservices are spinning up in background windows!
echo - Web Dashboard:  http://localhost:5173
echo - Backend Docs:   http://127.0.0.1:8000/docs
echo - API Health:     http://127.0.0.1:8000/api/health
echo =====================================================================
pause
