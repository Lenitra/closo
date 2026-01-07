# Closo - Architecture & Documentation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   HTTPS/TLS (443)    │
                    │   HTTP → HTTPS (80)  │
                    └──────────┬───────────┘
                               │
              ╔════════════════╧════════════════╗
              ║       closo_nginx (alpine)      ║
              ║  - Reverse proxy & SSL/TLS      ║
              ║  - Certificats Let's Encrypt    ║
              ║  - Ports: 80, 443 (externes)    ║
              ╚════════════════╤════════════════╝
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
         /                     /api/             /storage/
         │                     │                     │
         │                     │                     │
═════════╧═════════════════════╧═════════════════════╧═════════════
            closo_network (réseau Docker interne)
═══════════════════════════════════════════════════════════════════
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ closo_frontend   │  │  closo_backend   │  │  closo_storage   │
│  (nginx:alpine)  │  │  (Python 3.13)   │  │  (Python 3.13)   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • HTML/CSS/JS    │  │ • FastAPI        │  │ • FastAPI        │
│ • Static files   │  │ • SQLAlchemy     │  │ • Upload/serving │
│ • Port: 80       │  │ • JWT auth       │  │ • Port: 8060     │
│   (interne)      │  │ • Port: 8000     │  │   (interne)      │
│                  │  │   (interne)      │  │                  │
└──────────────────┘  └────────┬─────────┘  └────────┬─────────┘
                               │                     │
                               │ PostgreSQL          │ Fichiers
                               │ Protocol            │ (images,
                               │                     │  docs...)
                               ▼                     ▼
                      ┌──────────────────┐  ┌──────────────────┐
                      │    closo_db      │  │ closo_storage_   │
                      │ (postgres:15)    │  │      data        │
                      ├──────────────────┤  │   (volume)       │
                      │ • Port: 5432     │  └──────────────────┘
                      │   (interne)      │
                      │ • DB: db_closo   │
                      │ • User: user_    │
                      │   closo_app_bdd  │
                      │ • Volume:        │
                      │   postgres_data  │
                      └──────────────────┘
                               ▲
                               │
                      ┌────────┴─────────┐
                      │ closo_postgres_  │
                      │      data        │
                      │    (volume)      │
                      └──────────────────┘

═══════════════════════════════════════════════════════════════════
                    Maintenance & Sécurité
═══════════════════════════════════════════════════════════════════

                      ┌──────────────────┐
                      │  closo_certbot   │
                      │ (certbot/certbot)│
                      ├──────────────────┤
                      │ • Renouvellement │
                      │   SSL tous les   │
                      │   48 heures      │
                      │ • Partage volumes│
                      │   avec nginx     │
                      └──────────────────┘
```

## Flux de données

### 1. Requête utilisateur (Frontend)
```
User Browser → HTTPS (443) → nginx → frontend:80 → HTML/JS servi
```

### 2. Appel API
```
JS Frontend → /api/users → nginx → backend:8000 → PostgreSQL
                                 ↓
                            Réponse JSON
```

### 3. Upload fichier
```
Frontend → /api/upload → backend:8000 → /storage/upload → storage:8060
                                                              ↓
                                                    Volume: storage_data
```

### 4. Récupération fichier
```
Browser → /storage/files/xyz.jpg → nginx → storage:8060 → storage_data
```

## Sécurité

| Aspect | Configuration |
|--------|--------------|
| **Ports externes** | Nginx: 80, 443 uniquement |
| **Ports internes** | Backend: 8000, Storage: 8060, DB: 5432 (non exposés) |
| **SSL/TLS** | Let's Encrypt (auto-renouvelé tous les 48h) |
| **Authentification** | JWT tokens (backend) |
| **Réseau** | closo_network (isolation Docker) |
| **Volumes** | Données persistantes (postgres_data, storage_data) |

## Déploiement

### Configuration
Modifier `scripts/prod/config.bat` :
```batch
set SSH_HOST=79.137.78.243
set SSH_USER=debian
set SSL_DOMAIN=clo-so.com
set SSL_EMAIL=lenitramc@gmail.com
```

### Déploiement complet
```bash
scripts\prod\deploy_all.bat
```

Ordre d'exécution :
1. `deploy_bdd.bat` - PostgreSQL
2. `deploy_slave_storage.bat` - Service de stockage
3. `deploy_backend.bat` - API FastAPI
4. `deploy_frontend_no_port.bat` - Interface web
5. `deploy_ssl.bat` - Nginx + Certbot

### Commandes utiles
```bash
# Voir le statut
scripts\prod\status.bat

# Déployer uniquement SSL
scripts\prod\deploy_ssl.bat
```

## Containers

| Container | Image | Port interne | Accès externe |
|-----------|-------|--------------|---------------|
| closo_nginx | nginx:alpine | 80, 443 | ✅ Port 80, 443 |
| closo_frontend | Custom | 80 | ❌ Via nginx |
| closo_backend | Custom | 8000 | ❌ Via nginx |
| closo_storage | Custom | 8060 | ❌ Via nginx |
| closo_db | postgres:15-alpine | 5432 | ❌ Interne |
| closo_certbot | certbot/certbot | - | ❌ Maintenance |

## Stack technique

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Python 3.13, FastAPI, SQLAlchemy
- **Database**: PostgreSQL 15
- **Proxy**: Nginx (reverse proxy + SSL)
- **SSL**: Let's Encrypt (Certbot)
- **Deployment**: Docker containers
- **Orchestration**: Batch scripts (Windows → SSH → Linux)
