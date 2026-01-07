@echo off
call "%~dp0config.bat"
set PROJECT_ROOT=%~dp0..\..

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)

REM Check if SSL already exists
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "test -d /opt/closo/certbot/conf/live && ls /opt/closo/certbot/conf/live/ 2>/dev/null | head -1" > "%TEMP%\ssl_check.txt" 2>nul
set /p EXISTING_DOMAIN=<"%TEMP%\ssl_check.txt"
del "%TEMP%\ssl_check.txt" 2>nul

if not "%EXISTING_DOMAIN%"=="" (
    REM SSL exists - just renew and redeploy certbot
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker run --rm -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot certbot/certbot renew"
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_nginx nginx -s reload 2>/dev/null"
    goto deploy_certbot
)

REM New installation
set DOMAIN=%SSL_DOMAIN%
set EMAIL=%SSL_EMAIL%

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "mkdir -p /opt/closo/nginx /opt/closo/certbot/conf /opt/closo/certbot/www"

REM Create temp nginx config for validation
echo server { listen 80; server_name %DOMAIN% www.%DOMAIN%; location /.well-known/acme-challenge/ { root /var/www/certbot; } location / { return 200 'SSL setup...'; add_header Content-Type text/plain; } } > "%TEMP%\nginx-certbot.conf"
scp -i "%SSH_KEY%" %SSH_OPTS% "%TEMP%\nginx-certbot.conf" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx-certbot.conf
del "%TEMP%\nginx-certbot.conf"

REM Stop frontend, start temp nginx
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_frontend closo_nginx 2>/dev/null; docker rm closo_nginx 2>/dev/null; docker run -d --name closo_nginx --network closo_network -p 80:80 -v /opt/closo/nginx/nginx-certbot.conf:/etc/nginx/conf.d/default.conf -v /opt/closo/certbot/www:/var/www/certbot nginx:alpine"
timeout /t 3 /nobreak >nul

REM Get certificate
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker run --rm -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot certbot/certbot certonly --webroot --webroot-path /var/www/certbot --email %EMAIL% --agree-tos --no-eff-email -d %DOMAIN% -d www.%DOMAIN% --non-interactive"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to obtain certificate
    exit /b 1
)

REM Copy nginx config with domain
powershell -Command "(Get-Content '%PROJECT_ROOT%\nginx\nginx.conf' -Raw) -replace '\bcloso\.fr\b', '%DOMAIN%' | Set-Content '%TEMP%\nginx.conf'"
scp -i "%SSH_KEY%" %SSH_OPTS% "%TEMP%\nginx.conf" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx.conf
del "%TEMP%\nginx.conf"

REM Restart nginx with SSL
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_nginx; docker rm closo_nginx; docker run -d --name closo_nginx --network closo_network -p 80:80 -p 443:443 -v /opt/closo/nginx/nginx.conf:/etc/nginx/conf.d/default.conf -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot --restart unless-stopped nginx:alpine"

REM Redeploy frontend
call "%~dp0deploy_frontend_no_port.bat"

:deploy_certbot
REM Deploy certbot container (always)
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker stop closo_certbot 2>/dev/null; docker rm closo_certbot 2>/dev/null; docker run -d --name closo_certbot -v /opt/closo/certbot/conf:/etc/letsencrypt -v /opt/closo/certbot/www:/var/www/certbot --restart unless-stopped --entrypoint sh certbot/certbot -c 'while :; do certbot renew; sleep 48h; done'"
