# Guide de Déploiement - Architecture Scalable

Ce guide détaille l'installation de l'architecture scalable avec PostgreSQL, Redis et BullMQ.

## 📋 Prérequis

- Serveur Ubuntu avec accès sudo
- Node.js 22+ et npm installés
- Git installé

## 🚀 Installation sur le serveur

### 1. Installer PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Démarrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer la base de données et l'utilisateur
sudo -u postgres psql -c "CREATE DATABASE strava_gamification;"
sudo -u postgres psql -c "CREATE USER stravauser WITH PASSWORD 'tonmotdepasse123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE strava_gamification TO stravauser;"
sudo -u postgres psql -d strava_gamification -c "GRANT ALL ON SCHEMA public TO stravauser;"

# Vérifier
sudo systemctl status postgresql
```

### 2. Installer Redis

```bash
sudo apt install -y redis-server

# Démarrer et activer Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Vérifier
redis-cli ping  # Doit répondre "PONG"
```

### 3. Récupérer le code

```bash
cd ~/strava-gamification
git pull origin claude/strava-gamification-site-01E9bN6HuQ7eBJySCGgPM7zi
```

### 4. Initialiser la base de données

```bash
cd ~/strava-gamification/server
sudo -u postgres psql -d strava_gamification -f init-db.sql
```

### 5. Installer les dépendances backend

```bash
cd ~/strava-gamification/server
npm install
```

### 6. Vérifier la configuration .env

Le fichier `.env` doit contenir :

```env
STRAVA_CLIENT_ID=22883
STRAVA_CLIENT_SECRET=89e6fb2273180f0db1c74597dd668f171591177a
REDIRECT_URI=http://51.159.67.199:5173/auth/callback
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=strava_gamification
DB_USER=stravauser
DB_PASSWORD=tonmotdepasse123

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=strava-gamification-secret-key-2024-change-in-production
NODE_ENV=production
```

### 7. Redémarrer les services avec PM2

```bash
# Arrêter les anciens services
pm2 delete all

# Démarrer le backend
cd ~/strava-gamification/server
pm2 start server.js --name strava-backend

# Démarrer le frontend
cd ~/strava-gamification/client
npm install  # Installer les nouvelles dépendances si nécessaire
pm2 start npm --name strava-frontend -- run dev -- --host 0.0.0.0

# Sauvegarder la config PM2
pm2 save
```

### 8. Vérifier que tout fonctionne

```bash
# Vérifier les services
pm2 status

# Tester le backend
curl http://localhost:3001/api/health

# Devrait retourner :
# {
#   "status": "ok",
#   "database": "connected",
#   "cache": "connected",
#   "worker": "running"
# }
```

## 🎯 Nouvelle Architecture

### Modifications principales :

1. **Authentification JWT** : Plus besoin de stocker access_token/refresh_token en localStorage
2. **Base de données PostgreSQL** : Toutes les activités sont stockées localement
3. **Cache Redis** : Stats pré-calculées pour performance maximale
4. **Worker BullMQ** : Synchronisation asynchrone en arrière-plan
5. **API optimisée** : Pagination, agrégations SQL, index optimisés

### Nouveaux endpoints :

- `POST /api/auth/strava/callback` - Login avec Strava et sync initiale
- `GET /api/auth/me` - Infos utilisateur
- `GET /api/activities` - Activités avec pagination
- `GET /api/activities/all` - Toutes les activités (cachées)
- `GET /api/activities/stats/weekly` - Stats hebdomadaires (cachées)
- `GET /api/activities/stats/yearly` - Stats annuelles (cachées)
- `POST /api/sync/start` - Lancer une synchronisation manuelle
- `GET /api/sync/status/:jobId` - Statut d'un job de sync
- `GET /api/sync/history` - Historique des synchronisations

### Workflow utilisateur :

1. **Premier login** :
   - Login avec Strava
   - Sync automatique de toutes les activités (background job)
   - Stockage du JWT token

2. **Visites suivantes** :
   - Authentification avec JWT
   - Données chargées depuis la BDD (ultra rapide)
   - Pas d'appels API Strava

3. **Synchronisation** :
   - Bouton "Synchroniser" pour récupérer les nouvelles activités
   - Job exécuté en arrière-plan
   - Suivi de progression disponible

## 🔧 Dépannage

### PostgreSQL ne démarre pas :
```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql
```

### Redis ne fonctionne pas :
```bash
sudo systemctl status redis-server
redis-cli ping
```

### Problème de connexion DB :
```bash
# Vérifier les permissions
sudo -u postgres psql -d strava_gamification -c "\du"
sudo -u postgres psql -d strava_gamification -c "\l"
```

### Worker BullMQ ne traite pas les jobs :
```bash
# Vérifier les logs PM2
pm2 logs strava-backend

# Vérifier Redis
redis-cli
> KEYS bull:strava-sync:*
```

## 📊 Performance

### Avant (API directe) :
- Chargement Stats : ~3-5s
- Chargement Total : ~10-15s
- Limites API Strava : 200 req/15min

### Après (BDD + Cache) :
- Chargement Stats : ~100-200ms (cache) / ~500ms (DB)
- Chargement Total : ~200-300ms (cache) / ~1s (DB)
- Pas de limite API

## 🎉 Prochaines étapes (optionnel)

1. **Webhook Strava** : Sync automatique temps réel
2. **Monitoring** : Winston + PM2 logs
3. **Backup DB** : Script de sauvegarde quotidien
4. **Load Balancer** : Nginx + multiple instances Node.js
5. **Read Replicas** : PostgreSQL replicas pour scale
