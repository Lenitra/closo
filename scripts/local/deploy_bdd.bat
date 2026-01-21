@echo off
call "%~dp0config.bat"

echo [BDD] Deploying PostgreSQL locally...

REM Create network if not exists
docker network inspect %NETWORK_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [BDD] Creating network %NETWORK_NAME%...
    docker network create %NETWORK_NAME%
)

REM Create volume if not exists
docker volume inspect %VOLUME_DB% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [BDD] Creating volume %VOLUME_DB%...
    docker volume create %VOLUME_DB%
)

REM Stop and remove existing container
docker stop %CONTAINER_DB% >nul 2>&1
docker rm %CONTAINER_DB% >nul 2>&1

REM Check if .env file exists
if not exist "%PROJECT_ROOT%\bdd\.env" (
    echo [ERROR] bdd\.env file not found
    echo Please create %PROJECT_ROOT%\bdd\.env with your database configuration
    exit /b 1
)

REM Start PostgreSQL container
echo [BDD] Starting container %CONTAINER_DB%...
docker run -d ^
    --name %CONTAINER_DB% ^
    --network %NETWORK_NAME% ^
    --env-file "%PROJECT_ROOT%\bdd\.env" ^
    -p %PORT_DB%:5432 ^
    -v %VOLUME_DB%:/var/lib/postgresql/data ^
    --health-cmd="pg_isready -U postgres" ^
    --health-interval=10s ^
    --health-timeout=5s ^
    --health-retries=5 ^
    --restart unless-stopped ^
    %IMAGE_DB%

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start database container
    exit /b 1
)

echo [BDD] PostgreSQL deployed on port %PORT_DB%
