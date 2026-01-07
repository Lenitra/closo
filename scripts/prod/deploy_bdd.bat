@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_BDD%"
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\bdd\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_BDD%/.env
if %ERRORLEVEL% NEQ 0 exit /b 1

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && docker volume inspect closo_postgres_data >/dev/null 2>&1 || docker volume create closo_postgres_data && docker stop closo_db 2>/dev/null; docker rm closo_db 2>/dev/null; docker run -d --name closo_db --network closo_network --env-file /opt/closo/bdd/.env -v closo_postgres_data:/var/lib/postgresql/data --health-cmd='pg_isready -U postgres' --health-interval=10s --health-timeout=5s --health-retries=5 --restart unless-stopped postgres:15-alpine"
