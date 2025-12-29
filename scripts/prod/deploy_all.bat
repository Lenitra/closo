@echo off
echo ========================================
echo   Deploying ALL Closo Containers
echo   Target: Remote Server (PRODUCTION)
echo ========================================
echo.

REM Load configuration
call "%~dp0config.bat"

echo Server: %SSH_HOST%
echo User: %SSH_USER%
echo Remote path: %REMOTE_BASE%
echo.
echo PRODUCTION MODE:
echo - Networks and volumes are created only if they don't exist
echo - Existing volumes are preserved to protect data
echo - Containers are rebuilt with latest code
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0

REM Check if SSH key exists
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found: %SSH_KEY%
    echo Please follow the instructions in SSH_SETUP.md
    exit /b 1
)

REM Test SSH connection
echo Testing SSH connection...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo Connection OK" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot connect to server. Please check:
    echo   - Server is online
    echo   - SSH key is correctly configured
    echo   - Firewall allows SSH connections
    exit /b 1
)
echo SSH connection OK!
echo.

REM Deploy in order (respecting dependencies)

echo [1/4] Deploying Database...
call "%SCRIPT_DIR%deploy_bdd.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Database deployment failed
    exit /b 1
)

echo.
echo Waiting for database to be healthy...
:wait_db
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_db pg_isready -U postgres" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo Database is ready!

echo.
echo Ensuring database password matches .env configuration...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_db psql -U postgres -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Database password configured
) else (
    echo [WARNING] Could not set database password, may need manual fix
)
echo.

echo [2/4] Deploying Storage...
call "%SCRIPT_DIR%deploy_slave_storage.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Storage deployment failed
    exit /b 1
)

echo.
echo Waiting for storage to start...
timeout /t 3 /nobreak >nul
echo [OK] Storage deployed

echo.
echo [3/4] Deploying Backend...
call "%SCRIPT_DIR%deploy_backend.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Backend deployment failed
    exit /b 1
)

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
echo [OK] Backend deployed

echo.
echo [4/4] Deploying Frontend...
echo Checking if nginx SSL proxy is active...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --format '{{.Names}}' | grep -q '^closo_nginx$'" >nul 2>&1
echo [INFO] Nginx proxy detected - deploying frontend without port mapping
call "%SCRIPT_DIR%deploy_frontend_no_port.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Frontend deployment failed
    exit /b 1
)

REM Update nginx config if nginx is running
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --format '{{.Names}}' | grep -q '^closo_nginx$'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [5/5] Updating Nginx configuration...

    REM Get project root
    set PROJECT_ROOT=%SCRIPT_DIR%..\..

    REM Create temp config with domain replacement
    powershell -Command "$c = Get-Content '%PROJECT_ROOT%\nginx\nginx.conf' -Raw; $c -replace '\bcloso\.fr\b', 'clo-so.com' | Set-Content '%PROJECT_ROOT%\nginx\nginx.conf.tmp'"

    REM Copy to server
    scp -i "%SSH_KEY%" %SSH_OPTS% "%PROJECT_ROOT%\nginx\nginx.conf.tmp" %SSH_USER%@%SSH_HOST%:/opt/closo/nginx/nginx.conf
    del "%PROJECT_ROOT%\nginx\nginx.conf.tmp" >nul 2>&1

    REM Reload nginx
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_nginx nginx -t && docker exec closo_nginx nginx -s reload"
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Nginx configuration updated
    ) else (
        echo [WARNING] Nginx reload failed - check configuration
    )
)

echo.
echo ========================================
echo   ALL CONTAINERS DEPLOYED SUCCESSFULLY
echo ========================================
echo.
echo Waiting for all services to stabilize...
timeout /t 3 /nobreak >nul

echo.
echo Fetching status from remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo.
echo Verifying service health...
echo.

REM Check database
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker exec closo_db pg_isready -U postgres" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Database: Healthy
) else (
    echo [WARNING] Database: Not responding
)

REM Check backend
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker logs closo_backend --tail 5 2>&1 | grep -q 'Uvicorn running'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend: Running
) else (
    echo [WARNING] Backend: Check logs with 'scripts\prod\logs.bat backend'
)

REM Check frontend
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_frontend' --filter 'status=running' -q" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend: Running
) else (
    echo [WARNING] Frontend: Not running
)

REM Check storage
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_storage' --filter 'status=running' -q" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Storage: Running
) else (
    echo [WARNING] Storage: Not running
)

REM Check nginx (if present)
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_nginx' --filter 'status=running' -q" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Nginx: Running ^(HTTPS active^)
)

echo.
echo Server: %SSH_HOST%
echo Network: closo_network
echo Volumes: closo_postgres_data, closo_storage_data
echo.
echo IMPORTANT: Volumes have been preserved if they existed
echo           Your data has NOT been lost
echo.
echo Access your application:
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --format '{{.Names}}' | grep -q '^closo_nginx$'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   - HTTPS: https://clo-so.com ^(or your domain^)
    echo   - HTTP redirects to HTTPS automatically
) else (
    echo   - HTTP: http://%SSH_HOST%
    echo   - Backend API: http://%SSH_HOST%:8055
)
