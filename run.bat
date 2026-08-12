@echo off
TITLE AI Interview Intelligence Platform
COLOR 0A
CLS

echo ============================================================================
echo           AI INTERVIEW INTELLIGENCE PLATFORM — LOCAL LAUNCHER
echo ============================================================================
echo.

:: 1. Check for .env file in root and backend
if not exist .env (
    echo [1/6] Creating .env file from .env.example...
    copy .env.example .env >nul
) else (
    echo [1/6] Found existing .env file.
)

echo       Syncing backend\.env...
copy .env backend\.env >nul

:: 2. Check Node dependencies
if not exist node_modules (
    echo [2/6] Installing root and workspace dependencies...
    call npm install --no-audit --no-fund
    call npm run install:all
) else (
    echo [2/6] Node dependencies verified.
)

if not exist backend\node_modules (
    echo       Installing backend dependencies...
    cd backend && call npm install --no-audit --no-fund && cd ..
)

if not exist frontend\node_modules (
    echo       Installing frontend dependencies...
    cd frontend && call npm install --no-audit --no-fund && cd ..
)

:: 3. Check if Docker is running
echo [3/6] Checking Docker service status...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop on your PC and run this script again.
    echo.
    pause
    exit /b 1
)
echo       Docker is running.

:: 4. Build & start local Docker Compose services
echo [4/6] Starting local PostgreSQL (port 5433), Redis (port 6380), and Judge0 containers...
docker compose -f docker/docker-compose.yml up postgres redis judge0 --build -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker compose failed to start services.
    pause
    exit /b 1
)

:: 5. Run Prisma DB Migration & Seed
echo [5/6] Running PostgreSQL database migrations and initial seed...
cd backend
call npx prisma generate
call npx prisma db push --skip-generate
call node prisma/seed.js
cd ..

:: 6. Launch Frontend & Backend Dev Servers
echo [6/6] Launching Platform Development Servers...
echo.
echo ============================================================================
echo   Platform URLs:
echo   - Frontend:  http://localhost:5173
echo   - Backend:   http://localhost:5000/api
echo   - Health:    http://localhost:5000/api/health/full
echo ============================================================================
echo.

node ./scripts/dev.js

pause
