@echo off
call "%~dp0config.bat"
set SCRIPT_DIR=%~dp0

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found
    exit /b 1
)
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo ok" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] SSH connection failed
    exit /b 1
)

echo [1/5] Database...
call "%SCRIPT_DIR%deploy_bdd.bat"
if %ERRORLEVEL% NEQ 0 exit /b 1

:wait_db
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_db pg_isready -U postgres" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)

echo [2/5] Storage...
call "%SCRIPT_DIR%deploy_slave_storage.bat"
if %ERRORLEVEL% NEQ 0 exit /b 1
timeout /t 3 /nobreak >nul

echo [3/5] Backend...
call "%SCRIPT_DIR%deploy_backend.bat"
if %ERRORLEVEL% NEQ 0 exit /b 1
timeout /t 5 /nobreak >nul

echo [4/5] Frontend...
call "%SCRIPT_DIR%deploy_frontend_no_port.bat"
if %ERRORLEVEL% NEQ 0 exit /b 1

echo [5/5] SSL + Certbot...
call "%SCRIPT_DIR%deploy_ssl.bat"

REM Update nginx if running
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --format '{{.Names}}' | grep -q '^closo_nginx$'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PROJECT_ROOT=%SCRIPT_DIR%..\..
    powershell -Command "$c = Get-Content '%PROJECT_ROOT%\nginx\nginx.conf' -Raw; $c -replace '\bcloso\.fr\b', 'clo-so.com' | Set-Content '%PROJECT_ROOT%\nginx\nginx.conf.tmp'"
    scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\nginx\nginx.conf.tmp" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx.conf
    del "%PROJECT_ROOT%\nginx\nginx.conf.tmp" >nul 2>&1
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_nginx nginx -t && docker exec closo_nginx nginx -s reload" >nul 2>&1
)

echo.
echo [OK] Deployment complete
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}'"
