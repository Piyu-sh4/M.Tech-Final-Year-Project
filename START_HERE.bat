@echo off
setlocal
cd /d "%~dp0"
title Workforce Intelligence

docker compose version >nul 2>&1
if errorlevel 1 (
    echo Docker Compose is required. Install and start Docker Desktop.
    pause
    exit /b 1
)

echo Starting Workforce Intelligence with its persistent database...
docker compose up -d --build --wait
if errorlevel 1 (
    echo Startup failed. Review docker compose logs before retrying.
    pause
    exit /b 1
)

for /f "delims=" %%A in ('docker compose port api 5000') do set "WFI_ADDRESS=%%A"
if defined WFI_ADDRESS start "" "http://%WFI_ADDRESS%/login.html"
echo The app is ready. Docker volumes preserve saved data across restarts.
pause
