@echo off
chcp 65001 >nul
echo.
echo ⚡ Workforce Intelligence — Localhost Setup (Windows)
echo =====================================================
echo.

echo Checking Node.js...
node --version || (echo ERROR: Node.js not found. Install from https://nodejs.org && exit /b 1)

echo.
echo Copying .env.example to .env...
if not exist .env (
    copy .env.example .env
    echo .env created
) else (
    echo .env already exists - keeping it
)

echo.
echo Installing Node.js dependencies...
set PUPPETEER_SKIP_DOWNLOAD=true
call npm install

echo.
echo Setting up MySQL database...
echo Please enter your MySQL ROOT password when prompted:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS workforce_intelligence CHARACTER SET utf8mb4; CREATE USER IF NOT EXISTS 'wfi_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'P123/'; GRANT ALL PRIVILEGES ON workforce_intelligence.* TO 'wfi_user'@'localhost'; FLUSH PRIVILEGES;"

echo.
echo Importing schema...
mysql -u wfi_user -p"P123/" workforce_intelligence < database\init\02_master.sql

echo.
echo =====================================================
echo Setup complete!
echo.
echo Start server:  npm start
echo Open browser:  http://localhost:5000/login.html
echo.
echo Credentials:
echo   admin@wip.com / P123/
echo =====================================================
pause
