import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Récupérer le profil utilisateur
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT id, strava_id, username, firstname, lastname, profile_photo, max_heartrate FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Calculer les zones FC basées sur max_heartrate
    const maxHR = user.max_heartrate || 190;
    const zones = {
      z1: { min: 0, max: Math.round(maxHR * 0.60), name: 'Récupération', percentage: '0-60%' },
      z2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), name: 'Endurance', percentage: '60-70%' },
      z3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), name: 'Tempo', percentage: '70-80%' },
      z4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), name: 'Seuil', percentage: '80-90%' },
      z5: { min: Math.round(maxHR * 0.90), max: 220, name: 'VO2max', percentage: '90%+' },
    };

    res.json({
      user: {
        id: user.id,
        strava_id: user.strava_id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        profile_photo: user.profile_photo,
        max_heartrate: maxHR
      },
      hr_zones: zones
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Mettre à jour le profil utilisateur (FC max)
router.put('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { max_heartrate } = req.body;

    // Validation
    if (!max_heartrate || max_heartrate < 100 || max_heartrate > 220) {
      return res.status(400).json({
        error: 'FC max invalide. Doit être entre 100 et 220 bpm.'
      });
    }

    // Mise à jour en base
    await pool.query(
      'UPDATE users SET max_heartrate = $1 WHERE id = $2',
      [max_heartrate, userId]
    );

    // Calculer les nouvelles zones
    const zones = {
      z1: { min: 0, max: Math.round(max_heartrate * 0.60), name: 'Récupération', percentage: '0-60%' },
      z2: { min: Math.round(max_heartrate * 0.60), max: Math.round(max_heartrate * 0.70), name: 'Endurance', percentage: '60-70%' },
      z3: { min: Math.round(max_heartrate * 0.70), max: Math.round(max_heartrate * 0.80), name: 'Tempo', percentage: '70-80%' },
      z4: { min: Math.round(max_heartrate * 0.80), max: Math.round(max_heartrate * 0.90), name: 'Seuil', percentage: '80-90%' },
      z5: { min: Math.round(max_heartrate * 0.90), max: 220, name: 'VO2max', percentage: '90%+' },
    };

    res.json({
      success: true,
      max_heartrate,
      hr_zones: zones,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
