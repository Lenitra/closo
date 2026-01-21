@echo off
REM ========================================
REM   Closo Local Development Configuration
REM ========================================

REM Project root
set PROJECT_ROOT=%~dp0..\..

REM Docker configuration
set NETWORK_NAME=closo_network
set VOLUME_DB=closo_postgres_data_local
set VOLUME_STORAGE=closo_storage_data_local

REM Container names (suffixed with _local to avoid conflicts)
set CONTAINER_DB=closo_db_local
set CONTAINER_BACKEND=closo_backend_local
set CONTAINER_FRONTEND=closo_frontend_local
set CONTAINER_STORAGE=closo_storage_local

REM Image names
set IMAGE_DB=postgres:15-alpine
set IMAGE_BACKEND=closo_backend_local:latest
set IMAGE_FRONTEND=closo_frontend_local:latest
set IMAGE_STORAGE=closo_storage_local:latest

REM Local ports
set PORT_DB=5432
set PORT_BACKEND=8000
set PORT_FRONTEND=3000
set PORT_STORAGE=8001
