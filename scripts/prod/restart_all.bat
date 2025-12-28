@echo off
echo ========================================
echo   Restarting ALL Closo Containers
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
echo Restarting containers on remote server...

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo '[1/4] Restarting Database...' && docker restart closo_db && echo '' && echo 'Waiting for database to be healthy...' && until docker exec closo_db pg_isready -U postgres >/dev/null 2>&1; do sleep 2; done && echo 'Database is ready!' && echo '' && echo '[2/4] Restarting Storage...' && docker restart closo_storage && echo '' && echo '[3/4] Restarting Backend...' && docker restart closo_backend && echo '' && echo '[4/4] Restarting Frontend...' && docker restart closo_frontend && echo '' && echo '=========================================' && echo '  ALL CONTAINERS RESTARTED SUCCESSFULLY' && echo '=========================================' && echo '' && docker ps --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] All containers restarted successfully
) else (
    echo.
    echo [ERROR] Some containers failed to restart
    exit /b 1
)
