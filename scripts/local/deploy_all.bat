@echo off
echo ========================================
echo   Deploying ALL Closo Containers
echo ========================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0

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
docker exec closo_db pg_isready -U postgres >nul 2>&1
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
echo Running containers:
docker ps --filter "name=closo_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Network: closo_network
echo Volumes: closo_postgres_data, closo_storage_data
