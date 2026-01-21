@echo off
call "%~dp0config.bat"

if "%~1"=="" goto menu

set SERVICE=%~1

if /i "%SERVICE%"=="db" set CONTAINER=%CONTAINER_DB%
if /i "%SERVICE%"=="database" set CONTAINER=%CONTAINER_DB%
if /i "%SERVICE%"=="bdd" set CONTAINER=%CONTAINER_DB%
if /i "%SERVICE%"=="backend" set CONTAINER=%CONTAINER_BACKEND%
if /i "%SERVICE%"=="frontend" set CONTAINER=%CONTAINER_FRONTEND%
if /i "%SERVICE%"=="storage" set CONTAINER=%CONTAINER_STORAGE%

if not defined CONTAINER (
    echo [ERROR] Unknown service: %SERVICE%
    echo Valid services: db, backend, frontend, storage
    exit /b 1
)

docker logs -f --tail 100 %CONTAINER%
goto :eof

:menu
echo ========================================
echo   Closo Local Logs
echo ========================================
echo.
echo Select a service:
echo   1. Database
echo   2. Backend
echo   3. Frontend
echo   4. Storage
echo   5. All (combined)
echo   0. Exit
echo.
set /p choice="Choice: "

if "%choice%"=="1" docker logs -f --tail 100 %CONTAINER_DB%
if "%choice%"=="2" docker logs -f --tail 100 %CONTAINER_BACKEND%
if "%choice%"=="3" docker logs -f --tail 100 %CONTAINER_FRONTEND%
if "%choice%"=="4" docker logs -f --tail 100 %CONTAINER_STORAGE%
if "%choice%"=="5" (
    echo [TIP] Use Ctrl+C to stop
    echo.
    docker logs --tail 50 %CONTAINER_DB%
    docker logs --tail 50 %CONTAINER_BACKEND%
    docker logs --tail 50 %CONTAINER_FRONTEND%
    docker logs --tail 50 %CONTAINER_STORAGE%
)
if "%choice%"=="0" exit /b 0
