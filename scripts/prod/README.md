# Scripts de Production

Scripts pour déployer et gérer l'application Closo en production.

## 📋 Scripts disponibles

### Déploiement

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `deploy_all.bat` | Déploie tous les services (détecte automatiquement SSL) | `scripts\prod\deploy_all.bat` |
| `deploy_bdd.bat` | Déploie uniquement la base de données | `scripts\prod\deploy_bdd.bat` |
| `deploy_backend.bat` | Déploie uniquement le backend | `scripts\prod\deploy_backend.bat` |
| `deploy_slave_storage.bat` | Déploie uniquement le storage | `scripts\prod\deploy_slave_storage.bat` |
| `deploy_frontend.bat` | Déploie le frontend avec port 80 (mode sans SSL) | `scripts\prod\deploy_frontend.bat` |
| `deploy_frontend_no_port.bat` | Déploie le frontend sans port (mode SSL/nginx) | `scripts\prod\deploy_frontend_no_port.bat` |

### SSL/HTTPS

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `setup_ssl.bat` | Installation complète SSL avec Let's Encrypt | `scripts\prod\setup_ssl.bat` |
| `check_ssl.bat` | Vérifier le statut des certificats SSL | `scripts\prod\check_ssl.bat` |
| `renew_ssl.bat` | Forcer le renouvellement des certificats | `scripts\prod\renew_ssl.bat` |

### Gestion

| Script | Description | Utilisation |
|--------|-------------|-------------|
| `status.bat` | Afficher l'état de tous les containers | `scripts\prod\status.bat` |
| `stop_all.bat` | Arrêter tous les services | `scripts\prod\stop_all.bat` |
| `logs.bat` | Voir les logs d'un service | `scripts\prod\logs.bat <service>` |
| `fix_db_password.bat` | Réinitialiser le mot de passe PostgreSQL | `scripts\prod\fix_db_password.bat` |

### Configuration

| Script | Description |
|--------|-------------|
| `config.bat` | Configuration SSH et chemins (appelé automatiquement) |

## 🚀 Workflows courants

### Premier déploiement (sans SSL)

```bash
# 1. Déployer tous les services
scripts\prod\deploy_all.bat

# 2. Vérifier que tout fonctionne
scripts\prod\status.bat

# Accès : http://79.137.78.243
```

### Premier déploiement (avec SSL)

```bash
# 1. Déployer tous les services
scripts\prod\deploy_all.bat

# 2. Installer SSL (demande domaine et email)
scripts\prod\setup_ssl.bat

# 3. Vérifier SSL
scripts\prod\check_ssl.bat

# Accès : https://closo.fr
```

### Mise à jour du code

```bash
# Redéployer tout (détecte automatiquement si SSL est actif)
scripts\prod\deploy_all.bat

# OU redéployer un seul service
scripts\prod\deploy_backend.bat
scripts\prod\deploy_slave_storage.bat

# Redéployer le frontend (si SSL actif, utiliser no_port)
scripts\prod\deploy_frontend_no_port.bat
```

### Redémarrer les services

```bash
# Arrêter tout
scripts\prod\stop_all.bat

# Redémarrer
scripts\prod\deploy_all.bat
```

### Voir les logs

```bash
# Logs backend
scripts\prod\logs.bat backend

# Logs frontend
scripts\prod\logs.bat frontend

# Logs database
scripts\prod\logs.bat db
```

### Gérer SSL

```bash
# Vérifier les certificats
scripts\prod\check_ssl.bat

# Renouveler manuellement (si besoin)
scripts\prod\renew_ssl.bat
```

## 📁 Structure après déploiement

Sur le serveur distant (`/opt/closo/`) :

```
/opt/closo/
├── backend/           # Code backend
├── frontend/          # Code frontend
├── slave_storage/     # Code storage
├── bdd/              # Config base de données
├── nginx/            # Config nginx (si SSL)
│   ├── nginx.conf
│   └── logs/
└── certbot/          # Certificats SSL (si SSL)
    ├── conf/
    └── www/
```

## ⚙️ Configuration SSH

Tous les scripts utilisent `config.bat` qui définit :

```batch
SSH_HOST=79.137.78.243
SSH_USER=debian
SSH_KEY=%USERPROFILE%\.ssh\closo_prod_key
REMOTE_BASE=/opt/closo
```

## 🔍 Vérification

Après déploiement, vérifiez :

```bash
# État des containers
scripts\prod\status.bat

# Connexion SSH
ssh -i %USERPROFILE%\.ssh\closo_prod_key debian@79.137.78.243 "docker ps"

# Logs
scripts\prod\logs.bat backend
```

## 📖 Documentation

- **[DEPLOYMENT.md](../../DEPLOYMENT.md)** - Guide complet de déploiement
- **[SSL_SETUP.md](../../SSL_SETUP.md)** - Configuration SSL détaillée
- **[MIGRATION_SSL.md](../../MIGRATION_SSL.md)** - Migration vers HTTPS

## 🆘 Dépannage

### Erreur "password authentication failed" sur le backend

Si le backend ne peut pas se connecter à la base de données :

```bash
scripts\prod\fix_db_password.bat
```

Ce problème arrive lorsque le volume PostgreSQL existant a un mot de passe différent du `.env`.

### Nginx ne démarre pas après setup SSL

Vérifier les logs nginx :
```bash
scripts\prod\logs.bat
# Choisir option 6 (nginx)
```

Causes fréquentes :
- Certificat SSL non obtenu → relancer `setup_ssl.bat`
- Configuration nginx corrompue → vérifier `/opt/closo/nginx/nginx.conf` sur le serveur

## ⚠️ Important

- **Volumes préservés** : Les données (DB, Storage) sont TOUJOURS préservées lors des redéploiements
- **Détection SSL automatique** : `deploy_all.bat` détecte automatiquement si nginx est actif et déploie le frontend sans port mapping
- **Déploiement manuel frontend** : Si vous déployez le frontend seul, utilisez `deploy_frontend_no_port.bat` après installation SSL
- **Renouvellement auto** : Les certificats SSL se renouvellent automatiquement (pas d'action manuelle)
