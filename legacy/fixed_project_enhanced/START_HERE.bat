@echo off
title Workforce Intelligence Platform — Launcher
color 0A

echo.
echo  ============================================================
echo   Workforce Intelligence Platform v7.0 — STARTUP GUIDE
echo  ============================================================
echo.
echo  STEP 1: Make sure MySQL is running (check MySQL Workbench)
echo.
echo  STEP 2: This window will start the Node.js backend
echo          Opening a second window for the Python attrition service...
echo.

:: Start Python attrition model in a separate window
start "Attrition Model (Port 5050)" cmd /k "echo Installing Python deps... && pip install flask flask-cors scikit-learn pandas mysql-connector-python python-dotenv && echo. && echo Starting attrition model on http://localhost:5050 && echo Open http://localhost:5050/health to verify && echo. && python attrition_model.py"

:: Wait 2 seconds then start Node
timeout /t 2 /nobreak >nul

echo  Starting Node.js backend on http://localhost:5000 ...
echo.
npm start

pause
