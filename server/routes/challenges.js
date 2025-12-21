import express from 'express';
import Challenge from '../models/Challenge.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Obtenir tous les challenges de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.getUserChallenges(req.userId);
    res.json({ challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Obtenir les challenges actifs
router.get('/active', async (req, res) => {
  try {
    const challenges = await Challenge.getActiveChallenges(req.userId);
    res.json({ challenges });
  } catch (error) {
    console.error('Error fetching active challenges:', error);
    res.status(500).json({ error: 'Failed to fetch active challenges' });
  }
});

// Obtenir les challenges en attente
router.get('/pending', async (req, res) => {
  try {
    const challenges = await Challenge.getPendingChallenges(req.userId);
    res.json({ challenges });
  } catch (error) {
    console.error('Error fetching pending challenges:', error);
    res.status(500).json({ error: 'Failed to fetch pending challenges' });
  }
});

// Créer un nouveau challenge
router.post('/', async (req, res) => {
  try {
    const { challenged_id, metric, target_value, start_date, end_date } = req.body;

    // end_date est optionnel - sera auto-généré si non fourni
    if (!challenged_id || !metric || !target_value || !start_date) {
      return res.status(400).json({ error: 'Missing required fields: challenged_id, metric, target_value, start_date' });
    }

    if (!['distance', 'elevation'].includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric. Must be distance or elevation' });
    }

    const challenge = await Challenge.create(
      req.userId,
      challenged_id,
      metric,
      target_value,
      start_date,
      end_date // Optionnel, Challenge.create() va générer si null/undefined
    );

    res.json({ challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Accepter un challenge
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.accept(id, req.userId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found or already accepted' });
    }

    res.json({ challenge });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ error: 'Failed to accept challenge' });
  }
});

// Refuser un challenge
router.post('/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.decline(id, req.userId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found or already processed' });
    }

    res.json({ challenge });
  } catch (error) {
    console.error('Error declining challenge:', error);
    res.status(500).json({ error: 'Failed to decline challenge' });
  }
});

// Annuler un challenge
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.cancel(id, req.userId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found or cannot be cancelled' });
    }

    res.json({ challenge });
  } catch (error) {
    console.error('Error cancelling challenge:', error);
    res.status(500).json({ error: 'Failed to cancel challenge' });
  }
});

// Obtenir la progression d'un challenge
router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await Challenge.getProgress(id, req.userId);

    if (!progress) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Obtenir les stats H2H avec un ami
router.get('/h2h/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const stats = await Challenge.getHeadToHeadStats(req.userId, parseInt(friendId));
    res.json(stats);
  } catch (error) {
    console.error('Error fetching H2H stats:', error);
    res.status(500).json({ error: 'Failed to fetch H2H stats' });
  }
});

export default router;
