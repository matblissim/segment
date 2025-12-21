import express from 'express';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { geocodeUserActivities } from '../services/geocoding.js';
import { syncQueue } from '../workers/syncWorker.js';

const router = express.Router();

// Toutes les routes admin nécessitent l'authentification ET le rôle admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role - Mettre à jour le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Valider le rôle
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    // Mettre à jour le rôle
    const updatedUser = await User.updateRole(id, role);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/users/:id - Récupérer les détails d'un utilisateur spécifique
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/admin/geocode/:userId - Géocoder les activités d'un utilisateur
router.post('/geocode/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.body;

    console.log(`🚀 Démarrage géocodage pour user ${userId}...`);

    const result = await geocodeUserActivities(parseInt(userId), parseInt(limit));

    res.json({
      message: 'Géocodage terminé',
      ...result
    });
  } catch (error) {
    console.error('Error geocoding activities:', error);
    res.status(500).json({ error: 'Failed to geocode activities' });
  }
});

// POST /api/admin/sync-all - Synchroniser toutes les activités de tous les utilisateurs
router.post('/sync-all', async (req, res) => {
  try {
    console.log('🚀 Admin: Démarrage synchronisation globale de tous les utilisateurs');

    // Récupérer tous les utilisateurs
    const users = await User.findAll();

    // Lancer la synchronisation pour chaque utilisateur
    const jobs = [];
    for (const user of users) {
      try {
        const job = await syncQueue.add(
          'sync-user-activities',
          {
            userId: user.id,
            fullSync: false
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        );
        jobs.push({ userId: user.id, jobId: job.id });
        console.log(`✅ Job créé pour ${user.username} (${user.id}): ${job.id}`);
      } catch (err) {
        console.error(`❌ Erreur création job pour user ${user.id}:`, err);
      }
    }

    res.json({
      message: 'Synchronisation globale lancée',
      usersCount: users.length,
      jobsCreated: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Error starting global sync:', error);
    res.status(500).json({ error: 'Failed to start global sync' });
  }
});

export default router;
