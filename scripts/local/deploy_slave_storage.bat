@echo off
call "%~dp0config.bat"

echo [STORAGE] Deploying slave storage locally...

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [STORAGE] Creating network %NETWORK_NAME%...
    docker network create %NETWORK_NAME%
)

REM Create volume if not exists
docker volume inspect %VOLUME_STORAGE% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [STORAGE] Creating volume %VOLUME_STORAGE%...
    docker volume create %VOLUME_STORAGE%
)

REM Check if required files exist
if not exist "%PROJECT_ROOT%\slave_storage\Dockerfile" (
    echo [ERROR] slave_storage\Dockerfile not found
    exit /b 1
)

if not exist "%PROJECT_ROOT%\slave_storage\.env" (
    echo [ERROR] slave_storage\.env file not found
    exit /b 1
)

REM Stop and remove existing container
docker stop %CONTAINER_STORAGE% >nul 2>&1
docker rm %CONTAINER_STORAGE% >nul 2>&1

REM Remove old image
docker rmi %IMAGE_STORAGE% >nul 2>&1

REM Build the image
echo [STORAGE] Building image %IMAGE_STORAGE%...
docker build -t %IMAGE_STORAGE% "%PROJECT_ROOT%\slave_storage"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build storage image
    exit /b 1
)

REM Start container
echo [STORAGE] Starting container %CONTAINER_STORAGE%...
docker run -d ^
    --name %CONTAINER_STORAGE% ^
    --network %NETWORK_NAME% ^
    --env-file "%PROJECT_ROOT%\slave_storage\.env" ^
    -v %VOLUME_STORAGE%:/app/storage ^
    -p %PORT_STORAGE%:8000 ^
    --restart unless-stopped ^
    %IMAGE_STORAGE%

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start storage container
    exit /b 1
)

echo [STORAGE] Slave storage deployed on port %PORT_STORAGE%
