@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

echo [INFO] Creating remote directory...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p %REMOTE_MAIL%"

echo [INFO] Uploading .env file...
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\mail_srv\.env" %SSH_USER%@%SSH_HOST%:%REMOTE_MAIL%/.env
if %ERRORLEVEL% NEQ 0 exit /b 1

echo [INFO] Deploying mail server container...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker network inspect closo_network >/dev/null 2>&1 || docker network create closo_network && docker stop %CONTAINER_MAIL% 2>/dev/null; docker rm %CONTAINER_MAIL% 2>/dev/null; docker run -d --name %CONTAINER_MAIL% --network closo_network --env-file %REMOTE_MAIL%/.env -p 25:25 --restart unless-stopped %IMAGE_MAIL%"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to deploy mail server
    exit /b 1
)

echo [SUCCESS] Mail server deployed successfully
echo [INFO] SMTP available at %CONTAINER_MAIL%:25 on closo_network
