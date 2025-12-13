# 🏆 Strava Gamification

Transformez vos activités Strava en une aventure épique avec un système de points, badges et challenges!

## ✨ Fonctionnalités

- 🔐 **Authentification Strava OAuth** - Connexion sécurisée avec votre compte Strava
- 🏆 **Système de Points** - Gagnez des points pour chaque activité (distance, dénivelé, vitesse)
- 🎖️ **Badges** - Débloquez des badges exclusifs en atteignant des objectifs
- 🎯 **Challenges** - Relevez des défis hebdomadaires et mensuels
- 📊 **Statistiques** - Suivez vos progrès et performances
- ⚡ **Mode Dev Ultra-Rapide** - Vite pour un rechargement instantané

## 🚀 Démarrage Rapide

### 1. Configuration Strava API

1. Créez une application Strava sur https://www.strava.com/settings/api
2. Notez votre `Client ID` et `Client Secret`
3. Configurez l'URL de callback: `http://localhost:5173/auth/callback`

### 2. Configuration du Backend

```bash
cd server
cp .env.example .env
```

Modifiez le fichier `server/.env` avec vos identifiants Strava:

```bash
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:5173/auth/callback
PORT=3001
```

### 3. Configuration du Frontend

```bash
cd client
cp .env.example .env
```

Le fichier `client/.env` devrait contenir:

```bash
VITE_API_URL=http://localhost:3001/api
```

### 4. Lancement en Mode Dev ⚡

Depuis la racine du projet:

```bash
npm run dev
```

Cette commande lance automatiquement:
- ✅ Backend Express.js sur http://localhost:3001
- ✅ Frontend Vite sur http://localhost:5173

**C'est tout!** Ouvrez http://localhost:5173 dans votre navigateur.

## 📁 Structure du Projet

```
strava-gamification/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/      # Context API (Auth)
│   │   ├── pages/         # Pages principales
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Activities.jsx
│   │   │   ├── Badges.jsx
│   │   │   └── Challenges.jsx
│   │   ├── services/      # API calls
│   │   └── App.jsx
│   └── package.json
├── server/                 # Backend Express.js
│   ├── routes/
│   │   ├── strava.js      # Routes Strava OAuth & API
│   │   └── gamification.js # Routes de gamification
│   ├── server.js
│   └── package.json
└── package.json           # Scripts racine
```

## 🎮 Système de Gamification

### Points

Les points sont calculés automatiquement pour chaque activité:

- **10 points** par kilomètre parcouru
- **1 point** par 10m de dénivelé positif
- **+50 points** bonus vitesse (>25 km/h vélo, >12 km/h course)
- **+100 points** bonus endurance (>2h d'activité)

### Badges

12 badges à débloquer:

- 🏃 **Premier Kilomètre** - Parcourir 1 km
- 🏅 **Marathon** - Parcourir 42 km en une activité
- 💯 **Century** - Parcourir 100 km en une activité
- 🗺️ **Explorateur** - Parcourir 1000 km au total
- ⛰️ **Grimpeur** - Cumuler 1000m de dénivelé
- 👑 **Roi des Montagnes** - Cumuler 10000m de dénivelé
- 📅 **Régulier** - 7 activités en 7 jours
- 💪 **Dévoué** - 30 activités au total
- ⚡ **Démon de Vitesse** - Atteindre 40 km/h en moyenne
- 🌟 **Apprenti** - Atteindre 1000 points
- ✨ **Expert** - Atteindre 5000 points
- 🏆 **Maître** - Atteindre 10000 points

### Challenges

4 types de challenges:

- ⚔️ **Guerrier Hebdomadaire** - 100 km/semaine (+500 pts)
- 📆 **Marathon Mensuel** - 500 km/mois (+2000 pts)
- 🏔️ **Maître de l'Élévation** - 5000m dénivelé/mois (+1500 pts)
- 🚴 **Défi Vitesse** - Moyenne >30 km/h sur 50 km (+1000 pts)

## 🛠️ Commandes Utiles

### Backend

```bash
cd server
npm run dev          # Démarrer en mode développement
npm start           # Démarrer en mode production
```

### Frontend

```bash
cd client
npm run dev         # Démarrer en mode développement
npm run build       # Build pour production
npm run preview     # Prévisualiser le build
```

### Global

```bash
npm run dev                # Lancer frontend + backend
npm run install:all        # Installer toutes les dépendances
```

## 🔧 Technologies Utilisées

### Frontend
- ⚛️ **React 18** - Framework UI
- ⚡ **Vite** - Build tool ultra-rapide
- 🎨 **TailwindCSS** - Styling moderne
- 🔀 **React Router** - Navigation
- 📡 **Axios** - HTTP client

### Backend
- 🚀 **Express.js** - Framework web
- 🔑 **Strava API** - OAuth & Données d'activités
- 🔐 **dotenv** - Variables d'environnement
- 🔄 **CORS** - Sécurité cross-origin

## 📝 Variables d'Environnement

### Backend (server/.env)

```bash
STRAVA_CLIENT_ID=         # Votre Client ID Strava
STRAVA_CLIENT_SECRET=     # Votre Client Secret Strava
REDIRECT_URI=             # URL de callback OAuth
PORT=3001                 # Port du serveur
```

### Frontend (client/.env)

```bash
VITE_API_URL=             # URL de l'API backend
```

## 🐛 Dépannage

### Le frontend ne se connecte pas au backend

1. Vérifiez que les deux serveurs tournent
2. Vérifiez l'URL dans `client/.env`
3. Vérifiez CORS dans `server/server.js`

### Erreur OAuth Strava

1. Vérifiez vos identifiants dans `server/.env`
2. Vérifiez l'URL de callback dans les paramètres Strava
3. Assurez-vous que le REDIRECT_URI correspond

### Les activités ne se chargent pas

1. Vérifiez les scopes OAuth (activity:read_all, profile:read_all)
2. Vérifiez la validité du token d'accès
3. Consultez les logs du serveur

## 📈 Évolutions Futures

- [ ] Base de données pour persister les données
- [ ] Classement (leaderboard) multi-joueurs
- [ ] Notifications push pour les nouveaux badges
- [ ] Partage sur les réseaux sociaux
- [ ] Challenges personnalisés
- [ ] Intégration d'autres plateformes (Garmin, Polar, etc.)
- [ ] Mode sombre
- [ ] PWA (Progressive Web App)

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

ISC

## 🎉 Amusez-vous bien!

Transformez vos entraînements en aventure épique! 🏃‍♂️🚴‍♀️💪
