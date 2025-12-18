import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { addSyncJob } from '../workers/syncWorker.js';

const router = express.Router();

// Générer l'URL d'authentification Strava
router.get('/strava/auth-url', (req, res) => {
  const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/auth/callback';

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all,profile:read_all`;

  res.json({ url: authUrl });
});

// Callback OAuth Strava - Création du compte + Sync initiale
router.post('/strava/callback', async (req, res) => {
  const { code } = req.body;

  try {
    // 1. Échanger le code contre un token Strava
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { athlete, access_token, refresh_token, expires_at } = tokenResponse.data;

    // 2. Créer ou mettre à jour l'utilisateur dans la DB
    const user = await User.upsert(athlete, {
      access_token,
      refresh_token,
      expires_at,
    });

    // 3. Générer un JWT pour l'authentification de l'application
    const jwtToken = generateToken(user);

    // 4. Vérifier si l'utilisateur a déjà des activités
    const isNewUser = user.last_sync_at === null;

    // 5. Lancer la synchronisation initiale en arrière-plan (si nouveau)
    let syncJobId = null;
    if (isNewUser) {
      const job = await addSyncJob(user.id, true, 10); // fullSync = true, priorité haute
      syncJobId = job.id;
    }

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        strava_id: user.strava_id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        profile_photo: user.profile_photo,
        sync_status: user.sync_status,
        last_sync_at: user.last_sync_at,
        role: user.role || 'user',
      },
      syncJobId,
      isNewUser,
    });
  } catch (error) {
    console.error('❌ OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Vérifier le statut de l'utilisateur
router.get('/me', async (req, res) => {
  try {
    // Récupérer le token JWT depuis le header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Décoder le token (simpliste, devrait utiliser le middleware)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      strava_id: user.strava_id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      profile_photo: user.profile_photo,
      sync_status: user.sync_status,
      last_sync_at: user.last_sync_at,
      role: user.role || 'user',
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
