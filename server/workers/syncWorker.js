import { Worker, Queue } from 'bullmq';
import { redis } from '../config/database.js';
import SyncService from '../services/syncService.js';
import { pool } from '../config/database.js';

// Créer la queue pour les jobs de synchronisation
export const syncQueue = new Queue('strava-sync', {
  connection: redis,
  skipVersionCheck: true, // Désactiver le warning de version Redis
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Garder les 100 derniers jobs complétés
    removeOnFail: 200, // Garder les 200 derniers jobs échoués
  },
});

// Créer le worker qui traite les jobs
export const syncWorker = new Worker(
  'strava-sync',
  async (job) => {
    const { userId, fullSync } = job.data;

    console.log(`🚀 Processing sync job ${job.id} for user ${userId}`);

    // Créer ou mettre à jour l'enregistrement dans sync_jobs
    const jobRecord = await pool.query(
      `INSERT INTO sync_jobs (user_id, job_id, status, started_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (job_id)
       DO UPDATE SET status = $3, started_at = NOW(), completed_at = NULL, error_message = NULL
       RETURNING *`,
      [userId, job.id, 'processing']
    );

    try {
      let result;

      // Callback pour mettre à jour la progression
      const progressCallback = async (progress) => {
        await job.updateProgress(progress);
        await pool.query(
          `UPDATE sync_jobs
           SET processed_activities = $1
           WHERE job_id = $2`,
          [progress.processed, job.id]
        );
      };

      // Lancer la synchronisation
      if (fullSync) {
        result = await SyncService.syncUserActivities(userId, progressCallback);
      } else {
        result = await SyncService.syncNewActivities(userId);
      }

      // Mettre à jour le job record
      await pool.query(
        `UPDATE sync_jobs
         SET status = $1, completed_at = NOW(), total_activities = $2
         WHERE job_id = $3`,
        ['completed', result.newActivities || result.totalFetched, job.id]
      );

      console.log(`✅ Sync job ${job.id} completed for user ${userId}`);

      return result;
    } catch (error) {
      console.error(`❌ Sync job ${job.id} failed for user ${userId}:`, error);

      // Mettre à jour le job record avec l'erreur
      await pool.query(
        `UPDATE sync_jobs
         SET status = $1, error_message = $2, completed_at = NOW()
         WHERE job_id = $3`,
        ['failed', error.message, job.id]
      );

      throw error;
    }
  },
  {
    connection: redis,
    skipVersionCheck: true, // Désactiver le warning de version Redis
    concurrency: 3, // Traiter 3 jobs en parallèle max
  }
);

// Event handlers pour le worker
syncWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

syncWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

syncWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Fonction helper pour ajouter un job de sync
export async function addSyncJob(userId, fullSync = false, priority = 0) {
  const job = await syncQueue.add(
    'sync-user',
    { userId, fullSync },
    { priority }
  );

  console.log(`📝 Sync job ${job.id} added for user ${userId}`);

  return job;
}

// Fonction pour obtenir le statut d'un job
export async function getJobStatus(jobId) {
  const job = await syncQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}

// Fonction pour obtenir tous les jobs d'un utilisateur
export async function getUserJobs(userId) {
  const result = await pool.query(
    `SELECT * FROM sync_jobs
     WHERE user_id = $1
     ORDER BY started_at DESC
     LIMIT 10`,
    [userId]
  );

  return result.rows;
}

export default { syncQueue, syncWorker, addSyncJob, getJobStatus, getUserJobs };
