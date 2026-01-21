@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

echo [FRONTEND] Uploading React project to server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_FRONTEND%"

REM Upload React project files (excluding node_modules, dist, etc.)
cd /d "%PROJECT_ROOT%\front"
tar czf - --exclude=node_modules --exclude=dist --exclude=.git src public package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html Dockerfile nginx.conf .dockerignore 2>nul | ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "cd %REMOTE_FRONTEND% && tar xzf -"
if %ERRORLEVEL% NEQ 0 (
    echo [FRONTEND] Fallback to scp...
    scp -i "%SSH_KEY%" %SSH_OPTS% -r src public %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
    scp -i "%SSH_KEY%" %SSH_OPTS% package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html Dockerfile nginx.conf .dockerignore %SSH_USER%@%SSH_HOST%:%REMOTE_FRONTEND%/
)

echo [FRONTEND] Building and deploying container...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_frontend 2>/dev/null; docker rm closo_frontend 2>/dev/null; docker rmi closo_frontend:latest 2>/dev/null; docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && cd %REMOTE_FRONTEND% && docker build -t closo_frontend:latest . && docker run -d --name closo_frontend --network closo_network --restart unless-stopped closo_frontend:latest"
