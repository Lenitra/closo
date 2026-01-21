@echo off
call "%~dp0config.bat"

echo ========================================
echo   Closo Local Status
echo ========================================
echo.

REM Check Docker
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running
    exit /b 1
)

echo === CONTAINERS ===
echo.

REM Check each container
for %%c in (%CONTAINER_DB% %CONTAINER_BACKEND% %CONTAINER_FRONTEND% %CONTAINER_STORAGE%) do (
    docker ps -q -f name=^%%c$ >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        for /f "tokens=*" %%s in ('docker ps -f name^=^%%c$ --format "{{.Status}}"') do (
            echo [OK] %%c - %%s
        )
    ) else (
        echo [--] %%c - Not running
    )
)

echo.
echo === NETWORK ===
docker network inspect %NETWORK_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] %NETWORK_NAME%
) else (
    echo [--] %NETWORK_NAME% - Not created
)

echo.
echo === VOLUMES ===
docker volume inspect %VOLUME_DB% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] %VOLUME_DB%
) else (
    echo [--] %VOLUME_DB% - Not created
)

docker volume inspect %VOLUME_STORAGE% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] %VOLUME_STORAGE%
) else (
    echo [--] %VOLUME_STORAGE% - Not created
)

echo.
echo === PORTS ===
echo   Frontend: http://localhost:%PORT_FRONTEND%
echo   Backend:  http://localhost:%PORT_BACKEND%
echo   Storage:  http://localhost:%PORT_STORAGE%
echo   Database: localhost:%PORT_DB%
echo.
