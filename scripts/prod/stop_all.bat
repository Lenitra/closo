@echo off
echo ========================================
echo   Stopping ALL Closo Containers
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

echo Server: %SSH_HOST%
echo.
echo Stopping containers on remote server...

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo 'Stopping containers...' && docker stop closo_frontend closo_backend closo_storage closo_db 2>/dev/null || true && echo '' && echo 'Current status:' && docker ps -a --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}'"

echo.
echo [OK] Stop command executed
