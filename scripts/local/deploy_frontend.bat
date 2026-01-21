@echo off
call "%~dp0config.bat"

echo [FRONTEND] Deploying frontend locally...

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FRONTEND] Creating network %NETWORK_NAME%...
    docker network create %NETWORK_NAME%
)

REM Check if required files exist
if not exist "%PROJECT_ROOT%\front\Dockerfile" (
    echo [ERROR] front\Dockerfile not found
    exit /b 1
)

REM Stop and remove existing container
docker stop %CONTAINER_FRONTEND% >nul 2>&1
docker rm %CONTAINER_FRONTEND% >nul 2>&1

REM Remove old image
docker rmi %IMAGE_FRONTEND% >nul 2>&1

REM Build the image
echo [FRONTEND] Building image %IMAGE_FRONTEND%...
docker build -t %IMAGE_FRONTEND% "%PROJECT_ROOT%\front"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build frontend image
    exit /b 1
)

REM Start container
echo [FRONTEND] Starting container %CONTAINER_FRONTEND%...
docker run -d ^
    --name %CONTAINER_FRONTEND% ^
    --network %NETWORK_NAME% ^
    -p %PORT_FRONTEND%:80 ^
    --restart unless-stopped ^
    %IMAGE_FRONTEND%

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start frontend container
    exit /b 1
)

echo [FRONTEND] Frontend deployed on port %PORT_FRONTEND%
echo [FRONTEND] Access at http://localhost:%PORT_FRONTEND%
