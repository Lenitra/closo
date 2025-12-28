@echo off
echo ========================================
echo   Deploying Slave Storage Container
echo ========================================

set CONTAINER_NAME=closo_storage
set IMAGE_NAME=closo_storage:latest
set NETWORK_NAME=closo_network
set VOLUME_NAME=closo_storage_data

REM Get project root (2 levels up from script location)
set PROJECT_ROOT=%~dp0..\..

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1 || docker network create %NETWORK_NAME%

REM Create volume if not exists
docker volume inspect %VOLUME_NAME% >nul 2>&1 || docker volume create %VOLUME_NAME%

REM Build image
echo Building image...
docker build -t %IMAGE_NAME% "%PROJECT_ROOT%\slave_storage"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build image
    exit /b 1
)

REM Stop and remove existing container
docker stop %CONTAINER_NAME% 2>nul
docker rm %CONTAINER_NAME% 2>nul

REM Run container
docker run -d ^
    --name %CONTAINER_NAME% ^
    --network %NETWORK_NAME% ^
    --env-file "%PROJECT_ROOT%\slave_storage\.env" ^
    -p 8060:8060 ^
    -v %VOLUME_NAME%:/app/storage ^
    --restart unless-stopped ^
    %IMAGE_NAME%

if %ERRORLEVEL% EQU 0 (
    echo [OK] Container %CONTAINER_NAME% started successfully
) else (
    echo [ERROR] Failed to start %CONTAINER_NAME%
    exit /b 1
)
