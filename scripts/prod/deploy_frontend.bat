@echo off
echo ========================================
echo   Deploying Frontend - PRODUCTION
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
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_FRONTEND%"

REM Transfer frontend files
echo Transferring frontend files...
cd /d "%PROJECT_ROOT%\frontend"
REM Transfer all files in one batch using tar through SSH to avoid multiple SCP prompts
tar czf - static *.html Dockerfile .env 2>nul | ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "cd %REMOTE_FRONTEND% && tar xzf -"

REM Fix permissions on static directory so Docker can read files
echo Fixing file permissions...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "chmod -R 755 %REMOTE_FRONTEND%/static"

REM Execute remote Docker commands
echo.
echo Building and deploying container on remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd /opt/closo/frontend && docker build -t closo_frontend:latest . && docker stop closo_frontend 2>/dev/null || true && docker rm closo_frontend 2>/dev/null || true && docker run -d --name closo_frontend --network closo_network -p 8057:80 --restart unless-stopped closo_frontend:latest && echo '[OK] Container deployed successfully'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Frontend deployment completed successfully
) else (
    echo.
    echo [ERROR] Frontend deployment failed
    exit /b 1
)
