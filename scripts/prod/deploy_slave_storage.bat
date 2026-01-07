@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_STORAGE%"
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\slave_storage\main.py" "%PROJECT_ROOT%\slave_storage\Dockerfile" "%PROJECT_ROOT%\slave_storage\pyproject.toml" "%PROJECT_ROOT%\slave_storage\uv.lock" "%PROJECT_ROOT%\slave_storage\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_STORAGE%/
if %ERRORLEVEL% NEQ 0 exit /b 1

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_storage 2>/dev/null; docker rm closo_storage 2>/dev/null; docker rmi closo_storage:latest 2>/dev/null; docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && docker volume inspect closo_storage_data >/dev/null 2>&1 || docker volume create closo_storage_data && cd /opt/closo/slave_storage && docker build -t closo_storage:latest . && docker run -d --name closo_storage --network closo_network --env-file /opt/closo/slave_storage/.env -v closo_storage_data:/app/storage --restart unless-stopped closo_storage:latest"
