import express from 'express';
import TrainingPlan from '../models/TrainingPlan.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Obtenir tous les plans de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const plans = await TrainingPlan.getUserPlans(req.userId);
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Obtenir un plan spécifique avec toutes ses séances
router.get('/:id', async (req, res) => {
  try {
    const plan = await TrainingPlan.getPlanWithSessions(req.params.id, req.userId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// Créer un nouveau plan
router.post('/', async (req, res) => {
  try {
    const {
      eventId,
      name,
      goalDistance, // en km
      goalElevation,
      goalDate,
      goalPace, // en sec/km
      raceType,
      weeksDuration,
      sessionsPerWeek,
      availableDays,
      crossTraining,
      userLevel,
      maxHeartRate,
      vma,
      currentWeeklyKm,
      constraints,
      preferences,
    } = req.body;

    // Validation
    if (!name || !goalDistance || !goalDate || !weeksDuration || !sessionsPerWeek || !availableDays) {
      return res.status(400).json({
        error: 'Missing required fields: name, goalDistance, goalDate, weeksDuration, sessionsPerWeek, availableDays',
      });
    }

    if (sessionsPerWeek < 3 || sessionsPerWeek > 7) {
      return res.status(400).json({ error: 'Sessions per week must be between 3 and 7' });
    }

    if (weeksDuration < 4 || weeksDuration > 52) {
      return res.status(400).json({ error: 'Weeks duration must be between 4 and 52' });
    }

    const plan = await TrainingPlan.create(req.userId, {
      eventId,
      name,
      goalDistance,
      goalElevation,
      goalDate,
      goalPace,
      raceType,
      weeksDuration,
      sessionsPerWeek,
      availableDays,
      crossTraining,
      userLevel,
      maxHeartRate,
      vma,
      currentWeeklyKm,
      constraints,
      preferences,
    });

    res.json({ plan });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Marquer une séance comme complétée
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { distance, duration, pace, notes } = req.body;

    const session = await TrainingPlan.completeSession(req.params.id, req.userId, {
      distance,
      duration,
      pace,
      notes,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Obtenir les séances de la semaine en cours
router.get('/:id/current-week', async (req, res) => {
  try {
    const sessions = await TrainingPlan.getCurrentWeekSessions(req.params.id, req.userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching current week sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Obtenir les stats d'un plan
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await TrainingPlan.getPlanStats(req.params.id, req.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching plan stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Supprimer un plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await TrainingPlan.delete(req.params.id, req.userId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;
