@echo off
echo ========================================
echo   Deploying BDD (PostgreSQL) Container
echo ========================================

set CONTAINER_NAME=closo_db
set IMAGE_NAME=postgres:15-alpine
set NETWORK_NAME=closo_network
set VOLUME_NAME=closo_postgres_data

REM Get project root (2 levels up from script location)
set PROJECT_ROOT=%~dp0..\..

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1 || docker network create %NETWORK_NAME%

REM Create volume if not exists
docker volume inspect %VOLUME_NAME% >nul 2>&1 || docker volume create %VOLUME_NAME%

REM Stop and remove existing container
docker stop %CONTAINER_NAME% 2>nul
docker rm %CONTAINER_NAME% 2>nul

REM Run container
docker run -d ^
    --name %CONTAINER_NAME% ^
    --network %NETWORK_NAME% ^
    --env-file "%PROJECT_ROOT%\bdd\.env" ^
    -p 5432:5432 ^
    -v %VOLUME_NAME%:/var/lib/postgresql/data ^
    --health-cmd="pg_isready -U postgres" ^
    --health-interval=10s ^
    --health-timeout=5s ^
    --health-retries=5 ^
    --restart unless-stopped ^
    %IMAGE_NAME%

if %ERRORLEVEL% EQU 0 (
    echo [OK] Container %CONTAINER_NAME% started successfully
) else (
    echo [ERROR] Failed to start %CONTAINER_NAME%
    exit /b 1
)
