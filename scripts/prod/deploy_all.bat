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

echo [2/4] Deploying Storage...
call "%SCRIPT_DIR%deploy_slave_storage.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Storage deployment failed
    exit /b 1
)

echo.
echo [3/4] Deploying Backend...
call "%SCRIPT_DIR%deploy_backend.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Backend deployment failed
    exit /b 1
)

echo.
echo [4/4] Deploying Frontend...
call "%SCRIPT_DIR%deploy_frontend.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [FATAL] Frontend deployment failed
    exit /b 1
)

echo.
echo ========================================
echo   ALL CONTAINERS DEPLOYED SUCCESSFULLY
echo ========================================
echo.
echo Fetching status from remote server...
ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker ps --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo.
echo Server: %SSH_HOST%
echo Network: closo_network
echo Volumes: closo_postgres_data, closo_storage_data
echo.
echo IMPORTANT: Volumes have been preserved if they existed
echo           Your data has NOT been lost
