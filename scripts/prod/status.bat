@echo off
echo ========================================
echo   Closo Production Status
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

ssh -i "%SSH_KEY%" %SSH_OPTS% %SSH_USER%@%SSH_HOST% "echo '=== CONTAINERS ===' && docker ps -a --filter 'name=closo_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' && echo '' && echo '=== NETWORKS ===' && (docker network inspect closo_network --format '{{.Name}}: {{len .Containers}} containers connected' 2>/dev/null || echo 'closo_network: NOT FOUND') && echo '' && echo '=== VOLUMES ===' && (docker volume inspect closo_postgres_data --format '{{.Name}}: {{.Mountpoint}}' 2>/dev/null || echo 'closo_postgres_data: NOT FOUND') && (docker volume inspect closo_storage_data --format '{{.Name}}: {{.Mountpoint}}' 2>/dev/null || echo 'closo_storage_data: NOT FOUND') && echo '' && echo '=== HEALTH STATUS ===' && docker ps --filter 'name=closo_' --format '{{.Names}}: {{.Status}}' && echo '' && echo '=== DISK USAGE ===' && docker system df --format 'table {{.Type}}\t{{.Size}}\t{{.Reclaimable}}'"
