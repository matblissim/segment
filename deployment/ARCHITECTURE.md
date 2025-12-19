# 📚 Architecture et Déploiement - locked-in.fr

## 🏗️ Architecture Actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (Proxy)                       │
│              https://locked-in.fr (SSL/CDN)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVEUR (51.159.67.199)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  NGINX (Port 443 HTTPS)                            │     │
│  │  - Certificat SSL Cloudflare Origin                │     │
│  │  - Redirige HTTP → HTTPS                           │     │
│  └─────┬──────────────────────┬───────────────────────┘     │
│        │                      │                             │
│        │ /api/*               │ /* (tout le reste)          │
│        │                      │                             │
│        ▼                      ▼                             │
│  ┌─────────────┐        ┌─────────────────────┐            │
│  │  BACKEND    │        │  FRONTEND (dist/)   │            │
│  │  Node.js    │        │  Fichiers statiques │            │
│  │  Port 3001  │        │  React compilé      │            │
│  │  (PM2)      │        │                     │            │
│  └─────┬───────┘        └─────────────────────┘            │
│        │                                                    │
│        ├─── PostgreSQL (Base de données)                   │
│        └─── Redis (Cache)                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📂 Fichiers et Emplacements

### Frontend (React)
```
📁 /home/mathieudottir/strava-gamification/client/
├── src/               # Code source React
├── .env               # Config (VITE_API_URL)
├── dist/              # ⭐ Build de production (servi par Nginx)
└── package.json
```

### Backend (Node.js)
```
📁 /home/mathieudottir/strava-gamification/server/
├── routes/            # Routes API
├── models/            # Modèles de données
├── .env               # ⭐ Config (DB, Strava API, etc.)
├── server.js          # Point d'entrée
└── package.json
```

## 🔄 Workflow de Déploiement

### 1️⃣ Modification FRONTEND uniquement

**Tu changes :** `client/src/*` (composants, pages, CSS, etc.)

**Commandes sur le serveur :**
```bash
cd /home/mathieudottir/strava-gamification/client

# Si tu as changé les .env
cp .env.production .env

# Rebuild le frontend
npm run build

# Pas besoin de redémarrer le backend
# Pas besoin de recharger Nginx (sauf si tu changes nginx.conf)
```

**Résultat :** Les nouveaux fichiers sont dans `dist/` et Nginx les sert immédiatement.

**⚠️ Note :** Si ça ne marche pas tout de suite, vide le cache du navigateur (Ctrl+F5)

---

### 2️⃣ Modification BACKEND uniquement

**Tu changes :** `server/routes/*`, `server/models/*`, `server/server.js`, etc.

**Commandes sur le serveur :**
```bash
cd /home/mathieudottir/strava-gamification/server

# Si tu as changé les .env
cp .env.production .env

# Redémarre le backend avec PM2
pm2 restart strava-backend --update-env

# Vérifie les logs pour les erreurs
pm2 logs strava-backend --lines 20
```

**Résultat :** Le backend redémarre avec le nouveau code.

**⚠️ Note :** Le flag `--update-env` est important pour recharger les variables d'environnement.

---

### 3️⃣ Modification FRONTEND + BACKEND

**Commandes sur le serveur :**
```bash
cd /home/mathieudottir/strava-gamification

# Frontend
cd client
cp .env.production .env
npm run build
cd ..

# Backend
cd server
cp .env.production .env
cd ..

# Redémarre le backend
pm2 restart strava-backend --update-env

# Vérifie que tout fonctionne
pm2 logs strava-backend --lines 20
```

---

### 4️⃣ Modification NGINX (configuration serveur)

**Tu changes :** `/etc/nginx/sites-available/locked-in.fr`

**Commandes sur le serveur :**
```bash
# Teste la config avant de recharger
sudo nginx -t

# Si OK, recharge Nginx
sudo systemctl reload nginx

# Vérifie le statut
sudo systemctl status nginx
```

---

## 🚀 Déploiement Complet (Nouveau Code depuis Git)

**Workflow complet pour déployer une nouvelle version :**

```bash
# Sur le serveur
cd /home/mathieudottir/strava-gamification

# 1. Pull les derniers changements
git pull origin main  # ou ta branche

# 2. Installer les dépendances (si package.json a changé)
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Copier les .env de production
cp client/.env.production client/.env
cp server/.env.production server/.env

# 4. Build le frontend
cd client
npm run build
cd ..

# 5. Redémarrer le backend
pm2 restart strava-backend --update-env

# 6. Vérifier les logs
pm2 logs strava-backend --lines 30
```

---

## 🔍 Commandes de Debug Utiles

### Vérifier que tout tourne
```bash
# Backend
pm2 status
pm2 logs strava-backend

# Nginx
sudo systemctl status nginx
sudo nginx -t

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis
```

### Vérifier les ports
```bash
# Port 443 (HTTPS)
sudo netstat -tlnp | grep 443

# Port 3001 (Backend)
sudo netstat -tlnp | grep 3001
```

### Tester le backend directement
```bash
# Test de santé
curl http://localhost:3001/api/gamification/badges

# Test auth
curl http://localhost:3001/api/auth/strava/auth-url
```

---

## 📝 Résumé Rapide

| Changement | Commandes | Redémarrage nécessaire |
|------------|-----------|------------------------|
| **Frontend (React)** | `cd client && npm run build` | ❌ Non |
| **Backend (Node.js)** | `pm2 restart strava-backend --update-env` | ✅ Oui (PM2) |
| **Variables .env** | `cp .env.production .env` + redémarrer backend | ✅ Oui (PM2) |
| **Config Nginx** | `sudo nginx -t && sudo systemctl reload nginx` | ✅ Oui (Nginx) |
| **Base de données** | Migrations SQL manuelles | ❌ Non (PostgreSQL toujours actif) |

---

## 🎯 Points Importants

1. **Le frontend est statique** : Une fois `npm run build` fait, les fichiers sont dans `dist/` et Nginx les sert. Pas de processus Node à gérer.

2. **Le backend est un service** : Il tourne en permanence via PM2. Chaque changement nécessite un `pm2 restart`.

3. **PM2 redémarre automatiquement** : Si le serveur redémarre, PM2 relance automatiquement le backend.

4. **Les .env ne sont pas versionnés** : Toujours copier `.env.production` vers `.env` après un pull.

5. **Nginx sert tout** :
   - `/api/*` → Proxy vers backend (port 3001)
   - Tout le reste → Fichiers statiques frontend (`dist/`)

6. **Cloudflare en proxy** : Le SSL est géré entre Cloudflare et ton serveur (certificat Origin).

---

## 🆘 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| 502 Bad Gateway | Backend down → `pm2 restart strava-backend` |
| 404 Not Found | Mauvaise config Nginx ou fichiers manquants |
| 500 Internal Error | Erreur backend → `pm2 logs strava-backend` |
| CORS Error | Vérifier VITE_API_URL dans .env frontend |
| Changements non visibles | Vider cache navigateur (Ctrl+F5) |
| OAuth ne marche pas | Vérifier REDIRECT_URI dans .env backend |
