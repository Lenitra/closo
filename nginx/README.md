# Configuration Nginx pour Closo

Ce répertoire contient la configuration Nginx pour le reverse proxy avec SSL/HTTPS.

## Fichiers

- **nginx.conf** : Configuration principale avec support SSL et proxy vers les services
- **logs/** : Répertoire des logs (créé automatiquement sur le serveur)

## Configuration automatique

Le fichier `nginx.conf` est automatiquement configuré lors de l'exécution du script `setup_ssl.bat`.

Le script remplace `closo.fr` par votre nom de domaine réel.

## Structure

### Server HTTP (Port 80)
- Validation Let's Encrypt (/.well-known/acme-challenge/)
- Redirection automatique vers HTTPS

### Server HTTPS (Port 443)
- SSL/TLS avec certificats Let's Encrypt
- Proxy vers frontend (/)
- Proxy vers backend (/api/)
- Proxy vers storage (/storage/)

## Modification manuelle

Si vous devez modifier la configuration :

1. Éditez `nginx.conf` localement
2. Copiez vers le serveur :
   ```bash
   scp -i %USERPROFILE%\.ssh\closo_prod_key nginx.conf debian@79.137.78.243:/opt/closo/nginx/
   ```
3. Rechargez Nginx :
   ```bash
   ssh -i %USERPROFILE%\.ssh\closo_prod_key debian@79.137.78.243 "docker exec closo_nginx nginx -s reload"
   ```

## Logs

Les logs sont disponibles sur le serveur dans `/opt/closo/nginx/logs/` :
- `closo_access.log` : Logs d'accès
- `closo_error.log` : Logs d'erreurs

Pour consulter :
```bash
ssh ... "docker exec closo_nginx tail -f /var/log/nginx/closo_access.log"
ssh ... "docker exec closo_nginx tail -f /var/log/nginx/closo_error.log"
```
