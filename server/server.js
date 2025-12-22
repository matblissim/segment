import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import des routes
import stravaRoutes from './routes/strava.js';
import gamificationRoutes from './routes/gamification.js';
import authRoutes from './routes/auth.js';
import activitiesRoutes from './routes/activities.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import friendsRoutes from './routes/friends.js';
import feedRoutes from './routes/feed.js';
import eventsRoutes from './routes/events.js';
import challengesRoutes from './routes/challenges.js';
import aiCoachingRoutes from './routes/ai-coaching.js';
import profileRoutes from './routes/profile.js';

// Import de la configuration DB et du worker
import { pool, redis } from './config/database.js';
import { syncWorker } from './workers/syncWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes d'authentification (nouvelles)
app.use('/api/auth', authRoutes);

// Routes des activités depuis la BDD (nouvelles)
app.use('/api/activities', activitiesRoutes);

// Routes de synchronisation (nouvelles)
app.use('/api/sync', syncRoutes);

// Routes admin (nécessite authentification + rôle admin)
app.use('/api/admin', adminRoutes);

// Routes amis (nécessite authentification)
app.use('/api/friends', friendsRoutes);

// Routes feed (nécessite authentification)
app.use('/api/feed', feedRoutes);

// Routes events (nécessite authentification)
app.use('/api/events', eventsRoutes);

// Routes challenges (nécessite authentification)
app.use('/api/challenges', challengesRoutes);

// Routes AI coaching (nécessite authentification)
app.use('/api/ai', aiCoachingRoutes);

// Routes profile (nécessite authentification)
app.use('/api/profile', profileRoutes);

// Routes Strava legacy (pour compatibilité)
app.use('/api/strava', stravaRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Vérifier PostgreSQL
    await pool.query('SELECT 1');

    // Vérifier Redis
    await redis.ping();

    res.json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
      cache: 'connected',
      worker: 'running',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully...');
  await syncWorker.close();
  await pool.end();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  SIGINT received, shutting down gracefully...');
  await syncWorker.close();
  await pool.end();
  await redis.quit();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log('📊 Database: PostgreSQL');
  console.log('⚡ Cache: Redis');
  console.log('👷 Worker: BullMQ running');
});
