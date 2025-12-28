@echo off
REM ========================================
REM   Closo Production Configuration
REM ========================================

REM SSH Configuration
set SSH_HOST=79.137.78.243
set SSH_USER=debian
set SSH_KEY=%USERPROFILE%\.ssh\closo_prod_key
set SSH_OPTS=-o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=10

REM Remote paths on server
set REMOTE_BASE=/opt/closo
set REMOTE_BACKEND=%REMOTE_BASE%/backend
set REMOTE_FRONTEND=%REMOTE_BASE%/frontend
set REMOTE_STORAGE=%REMOTE_BASE%/slave_storage
set REMOTE_BDD=%REMOTE_BASE%/bdd

REM Docker configuration
set NETWORK_NAME=closo_network
set VOLUME_DB=closo_postgres_data
set VOLUME_STORAGE=closo_storage_data

REM Container names
set CONTAINER_DB=closo_db
set CONTAINER_BACKEND=closo_backend
set CONTAINER_FRONTEND=closo_frontend
set CONTAINER_STORAGE=closo_storage

REM Image names
set IMAGE_DB=postgres:15-alpine
set IMAGE_BACKEND=closo_backend:latest
set IMAGE_FRONTEND=closo_frontend:latest
set IMAGE_STORAGE=closo_storage:latest
