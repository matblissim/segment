import pkg from 'pg';
const { Pool } = pkg;
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuration PostgreSQL
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'strava_gamification',
  user: process.env.DB_USER || 'stravauser',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuration Redis
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
});

// Test de connexion PostgreSQL
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

// Test de connexion Redis
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Fonction helper pour les transactions
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Fonction helper pour le cache Redis
export async function getCached(key, ttl, fetchFn) {
  try {
    // Essayer de récupérer depuis le cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Si pas en cache, exécuter la fonction de fetch
    const data = await fetchFn();

    // Stocker en cache
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // En cas d'erreur Redis, on exécute quand même la fonction
    return await fetchFn();
  }
}

// Fonction pour invalider le cache d'un utilisateur
export async function invalidateUserCache(userId) {
  const pattern = `user:${userId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default { pool, redis, withTransaction, getCached, invalidateUserCache };
