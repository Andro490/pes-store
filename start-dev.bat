@echo off
title Launching PES Store Local Development
echo ===================================================
echo   Starting PES Store Development Servers (Local)
echo ===================================================

echo [1/2] Starting Backend on http://localhost:5000 ...
start "PES Store - Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [2/2] Starting Frontend on http://localhost:5173 ...
start "PES Store - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo  Both servers are starting in separate windows!
echo  - Backend API:  http://localhost:5000
echo  - Frontend Web: http://localhost:5173
echo ===================================================
echo You can close this window now.
pause
