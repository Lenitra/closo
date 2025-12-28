@echo off
echo ========================================
echo   Deploying BDD (PostgreSQL) - PRODUCTION
echo   Target: Remote Server
echo ========================================

REM Load configuration
call "%~dp0config.bat"

REM Get project root (2 levels up from script location)
set PROJECT_ROOT=%~dp0..\..

REM Check if SSH key exists
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found: %SSH_KEY%
    echo Please follow the instructions in SSH_SETUP.md
    exit /b 1
)

echo.
echo Connecting to %SSH_HOST%...
echo.

REM Create remote directory if not exists
echo Creating remote directories...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_BDD%"

REM Transfer env file
echo Transferring environment file...
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\bdd\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_BDD%/.env

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to transfer files
    exit /b 1
)

REM Execute remote Docker commands
echo.
echo Deploying container on remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && docker volume inspect closo_postgres_data >/dev/null 2>&1 && echo 'Volume exists - preserving data' || docker volume create closo_postgres_data && (docker ps -q -f name=^closo_db$ | grep -q . && echo 'Container already running' || (docker ps -aq -f name=^closo_db$ | grep -q . && docker start closo_db || docker run -d --name closo_db --network closo_network --env-file /opt/closo/bdd/.env -p 5432:5432 -v closo_postgres_data:/var/lib/postgresql/data --health-cmd='pg_isready -U postgres' --health-interval=10s --health-timeout=5s --health-retries=5 --restart unless-stopped postgres:15-alpine)) && echo '[OK] Container deployed successfully'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Database deployment completed successfully
) else (
    echo.
    echo [ERROR] Database deployment failed
    exit /b 1
)
