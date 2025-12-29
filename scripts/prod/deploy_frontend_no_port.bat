@echo off
echo ========================================
echo   Deploying Frontend - NO PORT MAPPING
echo   (Used when Nginx SSL proxy is active)
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
REM Transfer all files in one batch using tar through SSH
tar czf - static *.html Dockerfile .env | ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "cd %REMOTE_FRONTEND% && tar xzf -"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] tar transfer may have issues, trying SCP fallback...
    scp -i "%SSH_KEY%" %SSH_OPTS% -r static %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
    scp -i "%SSH_KEY%" %SSH_OPTS% *.html Dockerfile .env %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
)

REM Fix permissions on static directory so Docker can read files
echo Fixing file permissions...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "chmod -R 755 %REMOTE_FRONTEND%/static"

REM Execute remote Docker commands (NO PORT MAPPING - nginx will proxy)
echo.
echo Stopping and removing old container...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_frontend 2>/dev/null; docker rm closo_frontend 2>/dev/null; docker rmi closo_frontend:latest 2>/dev/null; echo 'Old container removed'"

echo Building and deploying container on remote server (no port mapping)...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd /opt/closo/frontend && docker build -t closo_frontend:latest . && docker run -d --name closo_frontend --network closo_network --restart unless-stopped closo_frontend:latest && echo '[OK] Container deployed successfully (accessible only via nginx proxy)'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Frontend deployment completed successfully
    echo [INFO] Frontend is NOT accessible directly - access via nginx proxy on port 80/443
) else (
    echo.
    echo [ERROR] Frontend deployment failed
    exit /b 1
)
