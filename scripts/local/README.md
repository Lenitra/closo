# Scripts de Developpement Local

Scripts pour deployer et gerer l'application Closo en local sous Windows.

## Prerequis

- Docker Desktop installe et en cours d'execution
- Fichiers `.env` configures dans chaque service (bdd, backend, slave_storage)

## Scripts disponibles

### Deploiement

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `deploy_all.bat` | Deploie tous les services | `scripts\local\deploy_all.bat` |
| `deploy_bdd.bat` | Deploie uniquement la base de donnees | `scripts\local\deploy_bdd.bat` |
| `deploy_backend.bat` | Deploie uniquement le backend | `scripts\local\deploy_backend.bat` |
| `deploy_slave_storage.bat` | Deploie uniquement le storage | `scripts\local\deploy_slave_storage.bat` |
| `deploy_frontend.bat` | Deploie uniquement le frontend | `scripts\local\deploy_frontend.bat` |

### Gestion

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `status.bat` | Afficher l'etat de tous les containers | `scripts\local\status.bat` |
| `stop_all.bat` | Arreter tous les services | `scripts\local\stop_all.bat` |
| `logs.bat` | Voir les logs d'un service | `scripts\local\logs.bat <service>` |

### Configuration

| Script | Description |
|--------|-------------|
| `config.bat` | Configuration locale (appele automatiquement) |

## Utilisation rapide

### Premier lancement

```batch
REM Deployer tous les services
scripts\local\deploy_all.bat

REM Verifier le statut
scripts\local\status.bat
```

### Ports par defaut

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Storage | 8001 | http://localhost:8001 |
| Database | 5432 | localhost:5432 |

### Voir les logs

```batch
REM Menu interactif
scripts\local\logs.bat

REM Directement
scripts\local\logs.bat backend
scripts\local\logs.bat db
scripts\local\logs.bat frontend
scripts\local\logs.bat storage
```

### Arreter les services

```batch
scripts\local\stop_all.bat
```

## Differences avec la production

| Aspect | Local | Production |
|--------|-------|------------|
| Execution | Docker local | Docker via SSH |
| Reseau | closo_network | closo_network |
| Ports | Exposes localement | Via nginx reverse proxy |
| SSL | Non | Oui (Let's Encrypt) |
| Suffixe containers | `_local` | (aucun) |
| Volumes | `_local` suffixe | (aucun) |

## Structure des containers

```
closo_db_local          -> PostgreSQL 15
closo_backend_local     -> API Python/FastAPI
closo_storage_local     -> Service de stockage
closo_frontend_local    -> Nginx + static files
```

## Depannage

### Docker n'est pas lance

```
[ERROR] Docker is not running. Please start Docker Desktop.
```

Solution: Lancer Docker Desktop et attendre qu'il soit pret.

### Fichier .env manquant

```
[ERROR] backend\.env file not found
```

Solution: Creer le fichier `.env` requis dans le dossier du service.

### Port deja utilise

Si un port est deja utilise, modifier les variables `PORT_*` dans `config.bat`.

### Reset complet

```batch
REM Arreter tout
scripts\local\stop_all.bat

REM Supprimer les volumes (ATTENTION: perte de donnees)
docker volume rm closo_postgres_data_local closo_storage_data_local

REM Redemarrer
scripts\local\deploy_all.bat
```
