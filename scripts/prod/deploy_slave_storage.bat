@echo off
echo ========================================
echo   Deploying Slave Storage - PRODUCTION
echo   Target: Remote Server
echo ========================================

REM Load configuration
call "%~dp0config.bat"

REM Get project root (2 levels up from script location)
set PROJECT_ROOT=%~dp0..\..

REM Check if SSH key exists
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found: %SSH_KEY%
    echo Please run setup_ssh.bat first or check the SSH key path
    exit /b 1
)

echo.
echo Connecting to %SSH_HOST%...
echo.

REM Create remote directory
echo Creating remote directories...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_STORAGE%"

REM Transfer storage files
echo Transferring storage files...
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\main.py" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\Dockerfile" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\pyproject.toml" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\uv.lock" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to transfer files
    exit /b 1
)

REM Execute remote Docker commands
echo.
echo Stopping and removing old container...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_storage 2>/dev/null; docker rm closo_storage 2>/dev/null; docker rmi closo_storage:latest 2>/dev/null; echo 'Old container removed'"

echo Building and deploying container on remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && docker volume inspect closo_storage_data >/dev/null 2>&1 && echo 'Volume exists - preserving data' || docker volume create closo_storage_data && cd /opt/closo/slave_storage && docker build -t closo_storage:latest . && docker run -d --name closo_storage --network closo_network --env-file /opt/closo/slave_storage/.env -p 8060:8060 -v closo_storage_data:/app/storage --restart unless-stopped closo_storage:latest && echo '[OK] Container deployed successfully'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Storage deployment completed successfully
) else (
    echo.
    echo [ERROR] Storage deployment failed
    exit /b 1
)
