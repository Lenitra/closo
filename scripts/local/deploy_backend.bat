@echo off
call "%~dp0config.bat"

echo [BACKEND] Deploying backend locally...

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [BACKEND] Creating network %NETWORK_NAME%...
    docker network create %NETWORK_NAME%
)

REM Check if required files exist
if not exist "%PROJECT_ROOT%\backend\Dockerfile" (
    echo [ERROR] backend\Dockerfile not found
    exit /b 1
)

if not exist "%PROJECT_ROOT%\backend\.env" (
    echo [ERROR] backend\.env file not found
    exit /b 1
)

REM Stop and remove existing container
docker stop %CONTAINER_BACKEND% >nul 2>&1
docker rm %CONTAINER_BACKEND% >nul 2>&1

REM Remove old image
docker rmi %IMAGE_BACKEND% >nul 2>&1

REM Build the image
echo [BACKEND] Building image %IMAGE_BACKEND%...
docker build -t %IMAGE_BACKEND% "%PROJECT_ROOT%\backend"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build backend image
    exit /b 1
)

REM Start container
echo [BACKEND] Starting container %CONTAINER_BACKEND%...
docker run -d ^
    --name %CONTAINER_BACKEND% ^
    --network %NETWORK_NAME% ^
    --env-file "%PROJECT_ROOT%\backend\.env" ^
    -p %PORT_BACKEND%:8000 ^
    --restart unless-stopped ^
    %IMAGE_BACKEND%

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start backend container
    exit /b 1
)

echo [BACKEND] Backend deployed on port %PORT_BACKEND%
