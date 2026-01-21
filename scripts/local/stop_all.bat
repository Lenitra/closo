@echo off
call "%~dp0config.bat"

echo ========================================
echo   Stopping Closo Local Services
echo ========================================
echo.

echo [1/4] Stopping frontend...
docker stop %CONTAINER_FRONTEND% >nul 2>&1
docker rm %CONTAINER_FRONTEND% >nul 2>&1

echo [2/4] Stopping backend...
docker stop %CONTAINER_BACKEND% >nul 2>&1
docker rm %CONTAINER_BACKEND% >nul 2>&1

echo [3/4] Stopping storage...
docker stop %CONTAINER_STORAGE% >nul 2>&1
docker rm %CONTAINER_STORAGE% >nul 2>&1

echo [4/4] Stopping database...
docker stop %CONTAINER_DB% >nul 2>&1
docker rm %CONTAINER_DB% >nul 2>&1

echo.
echo [OK] All services stopped
echo.
echo Note: Volumes are preserved. Data is safe.
echo To remove volumes, run:
echo   docker volume rm %VOLUME_DB% %VOLUME_STORAGE%
echo.
