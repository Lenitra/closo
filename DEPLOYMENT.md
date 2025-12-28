# Guide de Déploiement Closo

Ce document explique comment déployer l'application Closo en local et en production.

## Architecture

L'application Closo est composée de 4 services Docker :

- **Frontend** (Nginx) : Interface utilisateur - Port 8057
- **Backend** (FastAPI) : API REST - Port 8055
- **Database** (PostgreSQL) : Base de données - Port 5432
- **Storage** (FastAPI) : Service de stockage de fichiers - Port 8060

### Configuration Automatique des URLs

Le frontend détecte automatiquement l'environnement :
- **En local** (`localhost` ou `127.0.0.1`) : API sur `http://localhost:8055`
- **En production** : API sur `http://<server-ip>:8055`

Cette détection se fait via le fichier `frontend/static/js/config.js`.

## Déploiement Local

### Prérequis
- Docker Desktop installé et lancé
- Git Bash ou CMD/PowerShell

### Méthode 1 : Scripts individuels

```bash
# Déployer la base de données
scripts\local\deploy_bdd.bat

# Déployer le service de stockage
scripts\local\deploy_slave_storage.bat

# Déployer le backend
scripts\local\deploy_backend.bat

# Déployer le frontend
scripts\local\deploy_frontend.bat
```

### Méthode 2 : Déploiement complet automatique

```bash
scripts\local\deploy_all.bat
```

Ce script :
1. Déploie la base de données PostgreSQL
2. Attend que la DB soit healthy
3. Déploie le storage, le backend et le frontend
4. Affiche l'état final des containers

### Méthode 3 : Docker Compose

```bash
docker-compose up -d
```

### Accès en local

Après le déploiement, l'application est accessible sur :
- **Frontend** : http://localhost:8057
- **Backend API** : http://localhost:8055
- **Storage API** : http://localhost:8060
- **Database** : localhost:5432

## Déploiement Production

### Prérequis

1. **Serveur distant** avec :
   - Docker installé
   - SSH activé
   - Utilisateur `debian` avec accès sudo
   - Utilisateur `debian` membre du groupe `docker`

2. **Machine locale** avec :
   - SSH client installé
   - Clé SSH configurée (voir SSH_SETUP.md)
   - Git Bash ou CMD/PowerShell

### Configuration SSH

La clé SSH doit être configurée :
- **Chemin local** : `C:\Users\<username>\.ssh\closo_prod_key`
- **Serveur** : 79.137.78.243
- **Utilisateur** : debian

Voir le fichier [scripts/prod/SSH_SETUP.md](scripts/prod/SSH_SETUP.md) pour les instructions détaillées.

### Variables de Configuration

Les variables de production sont définies dans `scripts/prod/config.bat` :
- `SSH_HOST=79.137.78.243`
- `SSH_USER=debian`
- `SSH_KEY=%USERPROFILE%\.ssh\closo_prod_key`
- `REMOTE_BASE=/opt/closo`

### Déploiement Complet

```bash
scripts\prod\deploy_all.bat
```

Ce script :
1. Vérifie la connexion SSH
2. Transfère les fichiers via tar over SSH (pas de prompts interactifs)
3. Build les images Docker sur le serveur distant
4. Déploie les containers dans l'ordre :
   - Database → Storage → Backend → Frontend
5. Préserve les volumes existants (données non perdues)
6. Affiche l'état final

### Déploiement Individuel

Si vous voulez déployer un seul service :

```bash
# Base de données
scripts\prod\deploy_bdd.bat

# Storage
scripts\prod\deploy_slave_storage.bat

# Backend
scripts\prod\deploy_backend.bat

# Frontend
scripts\prod\deploy_frontend.bat
```

### Utilitaires de Production

#### Voir les logs

```bash
scripts\prod\logs.bat
```

Choisissez ensuite le container (1-5) pour voir ses logs.

#### Vérifier le status

```bash
scripts\prod\status.bat
```

Affiche :
- État des containers
- Réseaux Docker
- Volumes Docker
- Santé des services
- Utilisation disque

#### Redémarrer tous les containers

```bash
scripts\prod\restart_all.bat
```

Redémarre dans l'ordre (DB → Storage → Backend → Frontend) avec vérification de santé de la DB.

#### Arrêter tous les containers

```bash
scripts\prod\stop_all.bat
```

### Accès en production

Après le déploiement, l'application est accessible sur :
- **Frontend** : http://79.137.78.243:8057
- **Backend API** : http://79.137.78.243:8055
- **Storage API** : http://79.137.78.243:8060
- **Database** : 79.137.78.243:5432 (accès interne uniquement)

## Architecture Réseau

### Réseau Docker : `closo_network`

Tous les containers communiquent via un réseau bridge personnalisé :
- Permet la résolution DNS entre containers
- Isolation du trafic
- Communication inter-conteneurs par nom de service

### Volumes Persistants

- **postgres_data** : Données PostgreSQL
- **storage_data** : Fichiers uploadés

⚠️ **Important** : Les volumes sont préservés lors des redéploiements. Les données ne sont JAMAIS perdues.

## Différences Local vs Production

| Aspect | Local | Production |
|--------|-------|-----------|
| Transfert fichiers | Build local | tar over SSH |
| Base URL API | `http://localhost:8055` | `http://79.137.78.243:8055` |
| Détection | Automatique via hostname | Automatique via hostname |
| Permissions | Non critique | chmod 755 sur static/ |
| Volumes | Créés en local | Préservés sur serveur |
| SSH | Non requis | Clé SSH requise |

## Fichiers de Configuration

### Frontend
- `frontend/static/js/config.js` : Détection automatique de l'URL API
- `frontend/.env` : Variables d'environnement (optionnel)

### Backend
- `backend/.env` : Configuration API et DB
  ```
  DATABASE_URL=postgresql://user:password@closo_db:5432/closo
  SECRET_KEY=your-secret-key
  ```

### Database
- `bdd/.env` : Configuration PostgreSQL
  ```
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=your-password
  POSTGRES_DB=closo
  ```

### Storage
- `slave_storage/.env` : Configuration du service de stockage
  ```
  STORAGE_DIR=/app/storage
  PORT=8060
  ```

## Troubleshooting

### Le frontend ne contacte pas le backend

**Symptôme** : Pas de logs dans le backend lors des tentatives de connexion

**Solution** :
1. Vérifier que `frontend/static/js/config.js` est bien inclus dans les pages HTML
2. Ouvrir la console du navigateur (F12) et vérifier l'URL appelée
3. Vérifier que le backend est accessible : `curl http://<server>:8055/docs`

### CSS/JS ne se chargent pas en production

**Symptôme** : Page sans style, erreurs 403 dans la console

**Solution** :
```bash
ssh -i ~/.ssh/closo_prod_key debian@79.137.78.243 "chmod -R 755 /opt/closo/frontend/static"
docker restart closo_frontend
```

### Erreur "Port already allocated"

**Symptôme** : Le container ne démarre pas car le port est déjà utilisé

**Solution** :
```bash
# Arrêter le container existant
docker stop closo_<service>
docker rm closo_<service>

# Ou vérifier quel processus utilise le port
# Windows
netstat -ano | findstr :8057

# Linux
lsof -i :8057
```

### Problèmes SSH en production

**Symptôme** : Demande de mot de passe ou erreur de connexion

**Solution** :
1. Vérifier que la clé SSH existe : `dir %USERPROFILE%\.ssh\closo_prod_key`
2. Tester la connexion : `ssh -i %USERPROFILE%\.ssh\closo_prod_key debian@79.137.78.243`
3. Voir [scripts/prod/SSH_SETUP.md](scripts/prod/SSH_SETUP.md) pour reconfigurer

### Base de données ne démarre pas

**Symptôme** : Le script attend indéfiniment que la DB soit healthy

**Solution** :
```bash
# Vérifier les logs
scripts\prod\logs.bat
# Choisir option 1 (closo_db)

# Redémarrer la DB
docker restart closo_db
```

## Maintenance

### Mise à jour du code

**Local** :
```bash
git pull
scripts\local\deploy_all.bat
```

**Production** :
```bash
git pull
scripts\prod\deploy_all.bat
```

### Backup de la base de données

```bash
# Production
ssh debian@79.137.78.243 "docker exec closo_db pg_dump -U postgres closo > /tmp/backup.sql"
scp debian@79.137.78.243:/tmp/backup.sql ./backup_$(date +%Y%m%d).sql
```

### Restauration de la base de données

```bash
# Copier le backup sur le serveur
scp backup.sql debian@79.137.78.243:/tmp/

# Restaurer
ssh debian@79.137.78.243 "docker exec -i closo_db psql -U postgres closo < /tmp/backup.sql"
```

### Nettoyage Docker

```bash
# Supprimer les images non utilisées
docker image prune -a

# Supprimer les containers arrêtés
docker container prune

# Attention : Ne pas supprimer les volumes !
# docker volume prune (⚠️ Supprime les données !)
```

## Sécurité

### Bonnes Pratiques

1. **Clés SSH** : Ne jamais committer les clés privées dans Git
2. **Fichiers .env** : Ajouter au `.gitignore`, ne jamais committer
3. **Secrets** : Utiliser des secrets forts et uniques pour chaque environnement
4. **Ports** : En production, utiliser un reverse proxy (nginx/traefik) avec HTTPS
5. **Firewall** : Limiter l'accès aux ports sensibles (5432)

### Fichiers Sensibles à Ne Pas Committer

- `backend/.env`
- `bdd/.env`
- `frontend/.env`
- `slave_storage/.env`
- `C:\Users\<username>\.ssh\closo_prod_key`
- `scripts/prod/config.bat` (si contient des secrets)

## Logs et Monitoring

### Voir les logs en temps réel

```bash
# Local
docker logs -f closo_backend

# Production
scripts\prod\logs.bat
# Puis choisir le container
```

### Monitorer les ressources

```bash
# Local
docker stats

# Production
ssh debian@79.137.78.243 "docker stats"
```

## Support

Pour toute question ou problème :
1. Vérifier ce guide de déploiement
2. Consulter les logs des containers
3. Vérifier l'état avec `scripts\prod\status.bat`
4. Consulter la documentation Docker officielle

---

**Dernière mise à jour** : 2025-12-28
