import express from 'express';
import Activity from '../models/Activity.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCached } from '../config/database.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Récupérer les activités de l'utilisateur avec pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const userId = req.userId;

    const activities = await Activity.findByUserId(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    const total = await Activity.countByUserId(userId);

    res.json({
      activities,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + activities.length < total,
      },
    });
  } catch (error) {
    console.error('❌ Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Récupérer toutes les activités (pour les stats)
router.get('/all', async (req, res) => {
  try {
    const userId = req.userId;

    // Utiliser le cache Redis (TTL 1h)
    const cacheKey = `user:${userId}:activities:all`;
    const activities = await getCached(cacheKey, 3600, async () => {
      return await Activity.findAllByUserId(userId);
    });

    res.json(activities);
  } catch (error) {
    console.error('❌ Get all activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Récupérer les stats hebdomadaires
router.get('/stats/weekly', async (req, res) => {
  try {
    const userId = req.userId;

    // Utiliser le cache Redis (TTL 10min)
    const cacheKey = `user:${userId}:stats:weekly`;
    const stats = await getCached(cacheKey, 600, async () => {
      return await Activity.getWeeklyStats(userId);
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Get weekly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// Récupérer les stats annuelles par sport
router.get('/stats/yearly', async (req, res) => {
  try {
    const userId = req.userId;

    // Utiliser le cache Redis (TTL 1h)
    const cacheKey = `user:${userId}:stats:yearly`;
    const stats = await getCached(cacheKey, 3600, async () => {
      return await Activity.getYearlyStatsBySport(userId);
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Get yearly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch yearly stats' });
  }
});

// Compter les activités
router.get('/count', async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Activity.countByUserId(userId);

    res.json({ count });
  } catch (error) {
    console.error('❌ Count activities error:', error);
    res.status(500).json({ error: 'Failed to count activities' });
  }
});

export default router;
