import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { addSyncJob, getJobStatus, getUserJobs } from '../workers/syncWorker.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Lancer une synchronisation manuelle
router.post('/start', async (req, res) => {
  try {
    const userId = req.userId;
    const { fullSync = false } = req.body;

    // Ajouter le job de synchronisation
    const job = await addSyncJob(userId, fullSync);

    res.json({
      success: true,
      jobId: job.id,
      message: fullSync
        ? 'Full synchronization started'
        : 'Incremental synchronization started',
    });
  } catch (error) {
    console.error('❌ Start sync error:', error);
    res.status(500).json({ error: 'Failed to start synchronization' });
  }
});

// Récupérer le statut d'un job de synchronisation
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('❌ Get job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Récupérer l'historique des synchronisations
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;

    const jobs = await getUserJobs(userId);

    res.json(jobs);
  } catch (error) {
    console.error('❌ Get sync history error:', error);
    res.status(500).json({ error: 'Failed to get sync history' });
  }
});

// Obtenir le statut général de synchronisation
router.get('/info', async (req, res) => {
  try {
    const userId = req.userId;

    // Info utilisateur
    const user = await User.findById(userId);

    // Compter les activités
    const activityCount = await Activity.countByUserId(userId);

    // Récupérer l'historique des jobs
    const jobs = await getUserJobs(userId);

    // Récupérer le dernier job actif si existant
    const activeJob = jobs.find(j => j.status === 'processing');
    let currentJob = null;

    if (activeJob) {
      currentJob = await getJobStatus(activeJob.job_id);
    }

    res.json({
      syncStatus: user.sync_status,
      lastSyncAt: user.last_sync_at,
      activityCount,
      currentJob,
      recentJobs: jobs.slice(0, 3),
    });
  } catch (error) {
    console.error('❌ Get sync info error:', error);
    res.status(500).json({ error: 'Failed to get sync info' });
  }
});

export default router;
