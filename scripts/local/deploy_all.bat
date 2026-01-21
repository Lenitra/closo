@echo off
call "%~dp0config.bat"
set SCRIPT_DIR=%~dp0

echo ========================================
echo   Closo Local Development Deployment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    exit /b 1
)

echo [1/4] Database...
call "%SCRIPT_DIR%deploy_bdd.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Database deployment failed
    exit /b 1
)

REM Wait for database to be ready
echo [1/4] Waiting for database to be ready...
:wait_db
docker exec %CONTAINER_DB% pg_isready -U postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo [1/4] Database is ready!

echo.
echo [2/4] Storage...
call "%SCRIPT_DIR%deploy_slave_storage.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Storage deployment failed
    exit /b 1
)
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Backend...
call "%SCRIPT_DIR%deploy_backend.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend deployment failed
    exit /b 1
)
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Frontend...
call "%SCRIPT_DIR%deploy_frontend.bat"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend deployment failed
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Services running:
docker ps --filter "name=closo_" --filter "name=_local" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Access points:
echo   Frontend: http://localhost:%PORT_FRONTEND%
echo   Backend:  http://localhost:%PORT_BACKEND%
echo   Storage:  http://localhost:%PORT_STORAGE%
echo   Database: localhost:%PORT_DB%
echo.
