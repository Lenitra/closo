@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_BACKEND%"
scp -i "%SSH_KEY%" %SSH_OPTS% -r "%PROJECT_ROOT%\backend\app" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\backend\Dockerfile" "%PROJECT_ROOT%\backend\pyproject.toml" "%PROJECT_ROOT%\backend\uv.lock" "%PROJECT_ROOT%\backend\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_BACKEND%/
if %ERRORLEVEL% NEQ 0 exit /b 1

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_backend 2>/dev/null; docker rm closo_backend 2>/dev/null; docker rmi closo_backend:latest 2>/dev/null; docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd /opt/closo/backend && docker build -t closo_backend:latest . && docker run -d --name closo_backend --network closo_network --env-file /opt/closo/backend/.env --restart unless-stopped closo_backend:latest"
