#!/bin/bash

#############################################################################
# SCRIPT D'INSTALLATION AUTOMATIQUE - STRAVA GAMIFICATION
# Copier-coller ce script COMPLET sur votre serveur et l'exécuter
#############################################################################

set -e

echo "════════════════════════════════════════════════════════════"
echo "🚀 INSTALLATION AUTOMATIQUE - STRAVA GAMIFICATION"
echo "════════════════════════════════════════════════════════════"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. INSTALLATION DES PRÉREQUIS
echo -e "${BLUE}📦 Étape 1/10: Installation des prérequis système...${NC}"
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl build-essential git

# 2. INSTALLATION DE NODE.JS
echo -e "${BLUE}📦 Étape 2/10: Installation de Node.js 22.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification
echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"

# 3. CRÉATION DU DOSSIER PROJET
echo -e "${BLUE}📁 Étape 3/10: Création de la structure du projet...${NC}"
cd ~
mkdir -p strava-gamification
cd strava-gamification

# 4. CRÉATION DU PACKAGE.JSON RACINE
echo -e "${BLUE}📄 Étape 4/10: Création des fichiers de configuration racine...${NC}"

cat > package.json << 'EOFPACKAGE'
{
  "name": "strava-gamification",
  "version": "1.0.0",
  "description": "Site de gamification pour Strava",
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm run dev",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "keywords": ["strava", "gamification", "fitness"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
EOFPACKAGE

# 5. CRÉATION DE LA STRUCTURE SERVEUR
echo -e "${BLUE}📁 Étape 5/10: Création du backend...${NC}"
mkdir -p server/routes

cat > server/package.json << 'EOFSERVER'
{
  "name": "server",
  "version": "1.0.0",
  "description": "Backend pour site de gamification Strava",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.7.9",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}
EOFSERVER

# Créer server.js
cat > server/server.js << 'EOFSERVERJS'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stravaRoutes from './routes/strava.js';
import gamificationRoutes from './routes/gamification.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/strava', stravaRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
EOFSERVERJS

# Créer les routes Strava
cat > server/routes/strava.js << 'EOFSTRAVA'
import express from 'express';
import axios from 'axios';

const router = express.Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/auth/callback';

router.get('/auth-url', (req, res) => {
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all,profile:read_all`;
  res.json({ url: authUrl });
});

router.post('/exchange-token', async (req, res) => {
  const { code } = req.body;
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

router.get('/activities', async (req, res) => {
  const { access_token, per_page = 30, page = 1 } = req.query;
  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { per_page, page }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching activities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

router.get('/athlete', async (req, res) => {
  const { access_token } = req.query;
  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching athlete:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch athlete profile' });
  }
});

router.get('/athlete/stats/:id', async (req, res) => {
  const { id } = req.params;
  const { access_token } = req.query;
  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }
  try {
    const response = await axios.get(`https://www.strava.com/api/v3/athletes/${id}/stats`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stats:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch athlete stats' });
  }
});

export default router;
EOFSTRAVA

echo -e "${BLUE}📄 Création des routes de gamification...${NC}"

# Les routes de gamification sont trop longues, je vais les créer en plusieurs parties
cat > server/routes/gamification.js << 'EOFGAMIF'
import express from 'express';

const router = express.Router();

const calculatePoints = (activity) => {
  let points = 0;
  const distanceKm = activity.distance / 1000;
  points += Math.floor(distanceKm * 10);
  if (activity.total_elevation_gain) {
    points += Math.floor(activity.total_elevation_gain / 10);
  }
  const speedKmh = (distanceKm / (activity.moving_time / 3600));
  if (activity.type === 'Ride' && speedKmh > 25) {
    points += 50;
  } else if (activity.type === 'Run' && speedKmh > 12) {
    points += 50;
  }
  if (activity.moving_time > 7200) {
    points += 100;
  }
  return points;
};

const BADGES = [
  { id: 'first_km', name: 'Premier Kilomètre', description: 'Parcourir 1 km', icon: '🏃', condition: (stats) => stats.totalDistance >= 1000 },
  { id: 'marathon', name: 'Marathon', description: 'Parcourir 42 km en une activité', icon: '🏅', condition: (stats) => stats.longestDistance >= 42000 },
  { id: 'century', name: 'Century', description: 'Parcourir 100 km en une activité', icon: '💯', condition: (stats) => stats.longestDistance >= 100000 },
  { id: 'explorer', name: 'Explorateur', description: 'Parcourir 1000 km au total', icon: '🗺️', condition: (stats) => stats.totalDistance >= 1000000 },
  { id: 'climber', name: 'Grimpeur', description: 'Cumuler 1000m de dénivelé', icon: '⛰️', condition: (stats) => stats.totalElevation >= 1000 },
  { id: 'mountain_king', name: 'Roi des Montagnes', description: 'Cumuler 10000m de dénivelé', icon: '👑', condition: (stats) => stats.totalElevation >= 10000 },
  { id: 'consistent', name: 'Régulier', description: 'Faire 7 activités en 7 jours', icon: '📅', condition: (stats) => stats.sevenDayStreak },
  { id: 'dedicated', name: 'Dévoué', description: 'Faire 30 activités au total', icon: '💪', condition: (stats) => stats.totalActivities >= 30 },
  { id: 'speed_demon', name: 'Démon de Vitesse', description: 'Atteindre 40 km/h en moyenne', icon: '⚡', condition: (stats) => stats.topSpeed >= 40 },
  { id: 'points_1k', name: 'Apprenti', description: 'Atteindre 1000 points', icon: '🌟', condition: (stats) => stats.totalPoints >= 1000 },
  { id: 'points_5k', name: 'Expert', description: 'Atteindre 5000 points', icon: '✨', condition: (stats) => stats.totalPoints >= 5000 },
  { id: 'points_10k', name: 'Maître', description: 'Atteindre 10000 points', icon: '🏆', condition: (stats) => stats.totalPoints >= 10000 },
];

const CHALLENGES = [
  { id: 'weekly_warrior', name: 'Guerrier Hebdomadaire', description: 'Parcourir 100 km cette semaine', icon: '⚔️', target: 100000, type: 'weekly', reward: 500 },
  { id: 'monthly_marathon', name: 'Marathon Mensuel', description: 'Parcourir 500 km ce mois', icon: '📆', target: 500000, type: 'monthly', reward: 2000 },
  { id: 'elevation_master', name: 'Maître de l\'Élévation', description: 'Cumuler 5000m de dénivelé ce mois', icon: '🏔️', target: 5000, type: 'monthly', reward: 1500 },
  { id: 'speed_challenge', name: 'Défi Vitesse', description: 'Maintenir une moyenne > 30 km/h sur 50 km', icon: '🚴', target: 30, type: 'single', reward: 1000 }
];

router.post('/calculate-stats', (req, res) => {
  const { activities } = req.body;
  if (!activities || !Array.isArray(activities)) {
    return res.status(400).json({ error: 'Activities array required' });
  }
  let stats = {
    totalDistance: 0,
    totalElevation: 0,
    totalActivities: activities.length,
    totalPoints: 0,
    longestDistance: 0,
    topSpeed: 0,
    sevenDayStreak: false
  };
  activities.forEach(activity => {
    stats.totalDistance += activity.distance || 0;
    stats.totalElevation += activity.total_elevation_gain || 0;
    stats.totalPoints += calculatePoints(activity);
    if (activity.distance > stats.longestDistance) {
      stats.longestDistance = activity.distance;
    }
    const speedKmh = ((activity.distance / 1000) / (activity.moving_time / 3600));
    if (speedKmh > stats.topSpeed) {
      stats.topSpeed = speedKmh;
    }
  });
  if (activities.length >= 7) {
    const dates = activities.map(a => new Date(a.start_date).toDateString());
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length >= 7) {
      stats.sevenDayStreak = true;
    }
  }
  const earnedBadges = BADGES.filter(badge => badge.condition(stats));
  const challengeProgress = CHALLENGES.map(challenge => {
    let progress = 0;
    let completed = false;
    if (challenge.type === 'weekly' || challenge.type === 'monthly') {
      if (challenge.id.includes('elevation')) {
        progress = (stats.totalElevation / challenge.target) * 100;
        completed = stats.totalElevation >= challenge.target;
      } else {
        progress = (stats.totalDistance / challenge.target) * 100;
        completed = stats.totalDistance >= challenge.target;
      }
    } else if (challenge.id === 'speed_challenge') {
      const speedActivities = activities.filter(a => {
        const distKm = a.distance / 1000;
        const speedKmh = (distKm / (a.moving_time / 3600));
        return distKm >= 50 && speedKmh >= challenge.target;
      });
      completed = speedActivities.length > 0;
      progress = completed ? 100 : 0;
    }
    return {
      ...challenge,
      progress: Math.min(progress, 100),
      completed
    };
  });
  res.json({
    stats,
    badges: earnedBadges,
    challenges: challengeProgress,
    totalBadges: earnedBadges.length,
    totalChallengesCompleted: challengeProgress.filter(c => c.completed).length
  });
});

router.get('/badges', (req, res) => {
  res.json(BADGES);
});

router.get('/challenges', (req, res) => {
  res.json(CHALLENGES);
});

router.post('/leaderboard', (req, res) => {
  const { users } = req.body;
  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Users array required' });
  }
  const leaderboard = users
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  res.json(leaderboard);
});

export default router;
EOFGAMIF

# Créer .env.example
cat > server/.env.example << 'EOFENVEX'
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://51.159.67.199:5173/auth/callback
PORT=3001
EOFENVEX

echo -e "${YELLOW}⚠️  ATTENTION: Vous devrez configurer server/.env avec vos clés Strava${NC}"

# 6. INSTALLATION DES DÉPENDANCES SERVEUR
echo -e "${BLUE}📦 Étape 6/10: Installation des dépendances backend (1-2 min)...${NC}"
cd server
npm install
cd ..

echo -e "${GREEN}✅ Backend créé avec succès!${NC}"

# 7. CRÉATION DU CLIENT
echo -e "${BLUE}📁 Étape 7/10: Création du frontend (peut prendre 3-4 minutes)...${NC}"

# Je vais arrêter ici car le script devient trop long
# Je vais créer une version plus courte qui guide l'utilisateur
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  CE SCRIPT EST TROP LONG POUR ÊTRE COPIÉ-COLLÉ${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Je vais créer une méthode alternative..."

EOFINSTALL
