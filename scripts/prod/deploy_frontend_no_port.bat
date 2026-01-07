@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_FRONTEND%"
cd /d "%PROJECT_ROOT%\frontend"
tar czf - static *.html Dockerfile .env | ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "cd %REMOTE_FRONTEND% && tar xzf -"
if %ERRORLEVEL% NEQ 0 (
    scp -i "%SSH_KEY%" %SSH_OPTS% -r static %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
    scp -i "%SSH_KEY%" %SSH_OPTS% *.html Dockerfile .env %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
)
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "chmod -R 755 %REMOTE_FRONTEND%/static"

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_frontend 2>/dev/null; docker rm closo_frontend 2>/dev/null; docker rmi closo_frontend:latest 2>/dev/null; docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd /opt/closo/frontend && docker build -t closo_frontend:latest . && docker run -d --name closo_frontend --network closo_network --restart unless-stopped closo_frontend:latest"
