@echo off
echo ========================================
echo     Deployment Docker Closo Project
echo ========================================

@REM Navigate to the project's root directory
cd /d %~dp0\..

@REM Check if all .env files exist
set "ENV_ERROR=0"

if not exist "bdd\.env" (
    echo ERREUR: Le fichier bdd\.env n'existe pas.
    set "ENV_ERROR=1"
)

if not exist "backend\.env" (
    echo ERREUR: Le fichier backend\.env n'existe pas.
    set "ENV_ERROR=1"
)

if not exist "frontend\.env" (
    echo ERREUR: Le fichier frontend\.env n'existe pas.
    set "ENV_ERROR=1"
)

if not exist "slave_storage\.env" (
    echo ERREUR: Le fichier slave_storage\.env n'existe pas.
    set "ENV_ERROR=1"
)

if "%ENV_ERROR%"=="1" (
    echo.
    echo Veuillez créer tous les fichiers .env nécessaires:
    echo.
    echo bdd\.env - Variables pour PostgreSQL:
    echo   - POSTGRES_DB
    echo   - POSTGRES_USER
    echo   - POSTGRES_PASSWORD
    echo.
    echo backend\.env - Variables pour le backend FastAPI:
    echo   - DEBUG
    echo   - DB_HOST ^(doit être 'db' pour Docker^)
    echo   - DB_PORT
    echo   - DB_USERNAME
    echo   - DB_PASSWORD
    echo   - DB_DATABASE
    echo   - SECRET_KEY
    echo   - ALGORITHM
    echo   - ACCESS_TOKEN_EXPIRE_MINUTES
    echo   - STORAGE_API_KEY
    echo   - STORAGE_URL ^(doit être 'http://storage:8060' pour Docker^)
    echo.
    echo frontend\.env - Variables pour le frontend:
    echo   - VITE_API_URL
    echo.
    echo slave_storage\.env - Variables pour le stockage:
    echo   - STORAGE_API_KEY ^(doit correspondre a celle du backend^)
    echo   - NODE_ID
    echo.
    pause
    exit /b 1
)

echo Tous les fichiers .env sont présents.
echo.

REM Arrêter les conteneurs existants
echo Arrêt des conteneurs existants...
docker-compose down

REM Supprimer les images et volumes orphelins ^(optionnel^)
echo Nettoyage des ressources Docker...
docker system prune -f

REM Construire et démarrer les services
echo Construction et démarrage des conteneurs...

if "%1"=="--fast" (
    echo Mode rapide: utilisation du cache Docker
    docker-compose build
) else (
    echo Mode complet: reconstruction sans cache
    docker-compose build --no-cache
)

docker-compose up -d --remove-orphans

REM Vérifier le statut des conteneurs
echo.
echo Statut des conteneurs:
docker-compose ps

REM Afficher les logs en temps réel ^(optionnel^)
echo.
echo ========================================
echo   Déploiement terminé avec succès!
echo ========================================
echo.
echo Pour voir les logs en temps réel:
echo   docker-compose logs -f
echo.
echo Pour arrêter les conteneurs:
echo   docker-compose down
echo.
echo Services accessibles:
echo   - Backend API: http://localhost:8055
echo   - Frontend: http://localhost:3000
echo   - PostgreSQL: localhost:5432
echo   - Storage API: http://localhost:8060
echo.

pause
