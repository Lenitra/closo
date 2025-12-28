@echo off
echo ========================================
echo   Deploying Backend - PRODUCTION
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

REM Create remote directory
echo Creating remote directories...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_BACKEND%"

REM Transfer backend files
echo Transferring backend files...
scp -i "%SSH_KEY%" %SSH_OPTS% -r "%PROJECT_ROOT%\backend\app" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\backend\Dockerfile" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\backend\pyproject.toml" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\backend\uv.lock" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\backend\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to transfer files
    exit /b 1
)

REM Execute remote Docker commands
echo.
echo Building and deploying container on remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd /opt/closo/backend && docker build -t closo_backend:latest . && docker stop closo_backend 2>/dev/null || true && docker rm closo_backend 2>/dev/null || true && docker run -d --name closo_backend --network closo_network --env-file /opt/closo/backend/.env -p 8055:8000 --restart unless-stopped closo_backend:latest && echo '[OK] Container deployed successfully'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Backend deployment completed successfully
) else (
    echo.
    echo [ERROR] Backend deployment failed
    exit /b 1
)
