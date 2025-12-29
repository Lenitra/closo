@echo off
echo ========================================
echo   Setup SSL Certificate with Let's Encrypt
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
echo This script will:
echo 1. Create necessary directories on remote server
echo 2. Copy nginx configuration
echo 3. Obtain SSL certificate from Let's Encrypt
echo 4. Setup automatic certificate renewal
echo.

set /p DOMAIN="Enter your domain name (e.g., closo.fr): "
set /p EMAIL="Enter your email for Let's Encrypt notifications: "

echo.
echo Domain: %DOMAIN%
echo Email: %EMAIL%
echo.
set /p CONFIRM="Is this correct? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Setup cancelled.
    exit /b 0
)

echo.
echo Creating directories on remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p /opt/closo/nginx /opt/closo/certbot/conf /opt/closo/certbot/www /opt/closo/nginx/logs"

echo.
echo Copying nginx configuration...
REM Update nginx.conf with the actual domain before copying
REM Use word boundary \b to avoid matching container names like closo_frontend
powershell -Command "$content = Get-Content '%PROJECT_ROOT%\nginx\nginx.conf' -Raw; $content = $content -replace '\bcloso\.fr\b', '%DOMAIN%'; $content | Set-Content '%PROJECT_ROOT%\nginx\nginx.conf.tmp'"
scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\nginx\nginx.conf.tmp" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx.conf
del "%PROJECT_ROOT%\nginx\nginx.conf.tmp"

echo.
echo Creating temporary nginx config for certificate generation...
REM Create temporary nginx config locally
echo server { > "%TEMP%\nginx-certbot.conf"
echo     listen 80; >> "%TEMP%\nginx-certbot.conf"
echo     listen [::]:80; >> "%TEMP%\nginx-certbot.conf"
echo     server_name %DOMAIN% www.%DOMAIN%; >> "%TEMP%\nginx-certbot.conf"
echo. >> "%TEMP%\nginx-certbot.conf"
echo     location /.well-known/acme-challenge/ { >> "%TEMP%\nginx-certbot.conf"
echo         root /var/www/certbot; >> "%TEMP%\nginx-certbot.conf"
echo     } >> "%TEMP%\nginx-certbot.conf"
echo. >> "%TEMP%\nginx-certbot.conf"
echo     location / { >> "%TEMP%\nginx-certbot.conf"
echo         return 200 'Waiting for SSL setup...'; >> "%TEMP%\nginx-certbot.conf"
echo         add_header Content-Type text/plain; >> "%TEMP%\nginx-certbot.conf"
echo     } >> "%TEMP%\nginx-certbot.conf"
echo } >> "%TEMP%\nginx-certbot.conf"

REM Copy to server
scp -i "%SSH_KEY%" %SSH_OPTS% "%TEMP%\nginx-certbot.conf" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx-certbot.conf
del "%TEMP%\nginx-certbot.conf"

echo.
echo Stopping existing frontend to free port 80...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_frontend 2>/dev/null || true"

echo.
echo Starting temporary nginx for certificate validation...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_nginx 2>/dev/null || true && docker rm closo_nginx 2>/dev/null || true && docker run -d --name closo_nginx --network closo_network -p 80:80 -v /opt/closo/nginx/nginx-certbot.conf:/etc/nginx/conf.d/default.conf -v /opt/closo/certbot/www:/var/www/certbot nginx:alpine"

echo.
echo Waiting for nginx to start...
timeout /t 5 /nobreak >nul

echo.
echo Obtaining SSL certificate from Let's Encrypt...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker run --rm --name certbot -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot certbot/certbot certonly --webroot --webroot-path /var/www/certbot --email %EMAIL% --agree-tos --no-eff-email -d %DOMAIN% -d www.%DOMAIN% --non-interactive"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to obtain SSL certificate
    echo Please check:
    echo 1. DNS records are correctly configured
    echo 2. Port 80 is accessible from the internet
    echo 3. Domain name is correct
    exit /b 1
)

echo.
echo [OK] SSL certificate obtained successfully

echo.
echo Stopping temporary nginx...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_nginx && docker rm closo_nginx"

echo.
echo Frontend will remain stopped (nginx will serve on port 80/443 instead)...

echo.
echo Starting nginx with SSL configuration...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker run -d --name closo_nginx --network closo_network -p 80:80 -p 443:443 -v /opt/closo/nginx/nginx.conf:/etc/nginx/conf.d/default.conf -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot -v /opt/closo/nginx/logs:/var/log/nginx --restart unless-stopped nginx:alpine"

echo.
echo Setting up automatic certificate renewal...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker run -d --name closo_certbot --network closo_network -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot --restart unless-stopped --entrypoint '/bin/sh' certbot/certbot -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

echo.
echo Redeploying frontend without port mapping (accessed via nginx only)...
call "%~dp0deploy_frontend_no_port.bat"

echo.
echo ========================================
echo   SSL Setup Complete!
echo ========================================
echo.
echo Your site is now accessible at:
echo   https://%DOMAIN%
echo   https://www.%DOMAIN%
echo.
echo HTTP requests will automatically redirect to HTTPS
echo.
echo Certificate renewal is automatic (every 12 hours check)
echo ========================================
