@echo off
echo ========================================
echo   View Container Logs
echo   Target: Remote Server
echo ========================================
echo.

REM Load configuration
call "%~dp0config.bat"

REM Check if SSH key exists
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found: %SSH_KEY%
    exit /b 1
)

echo Available containers:
echo   1. closo_db       (Database)
echo   2. closo_storage  (Slave Storage)
echo   3. closo_backend  (Backend API)
echo   4. closo_frontend (Frontend)
echo   5. All containers
echo.

set /p choice="Select container (1-5): "

if "%choice%"=="1" set CONTAINER=closo_db
if "%choice%"=="2" set CONTAINER=closo_storage
if "%choice%"=="3" set CONTAINER=closo_backend
if "%choice%"=="4" set CONTAINER=closo_frontend
if "%choice%"=="5" set CONTAINER=all

if "%CONTAINER%"=="" (
    echo Invalid choice
    exit /b 1
)

echo.
echo Fetching logs from %SSH_HOST%...
echo (Press Ctrl+C to stop)
echo.

if "%CONTAINER%"=="all" (
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker logs --tail 50 closo_db && echo '---' && docker logs --tail 50 closo_storage && echo '---' && docker logs --tail 50 closo_backend && echo '---' && docker logs --tail 50 closo_frontend"
) else (
    ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "docker logs --tail 100 -f %CONTAINER%"
)
