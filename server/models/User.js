import { pool } from '../config/database.js';

class User {
  // Créer ou mettre à jour un utilisateur
  static async upsert(stravaData, tokens) {
    const query = `
      INSERT INTO users (
        strava_id, username, firstname, lastname, profile_photo,
        access_token, refresh_token, token_expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (strava_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        firstname = EXCLUDED.firstname,
        lastname = EXCLUDED.lastname,
        profile_photo = EXCLUDED.profile_photo,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at
      RETURNING *
    `;

    const values = [
      stravaData.id,
      stravaData.username,
      stravaData.firstname,
      stravaData.lastname,
      stravaData.profile,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_at,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Récupérer un utilisateur par strava_id
  static async findByStravaId(stravaId) {
    const query = 'SELECT * FROM users WHERE strava_id = $1';
    const result = await pool.query(query, [stravaId]);
    return result.rows[0];
  }

  // Récupérer un utilisateur par ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour les tokens
  static async updateTokens(userId, tokens) {
    const query = `
      UPDATE users
      SET access_token = $1, refresh_token = $2, token_expires_at = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_at,
      userId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Mettre à jour le statut de synchronisation
  static async updateSyncStatus(userId, status, lastSyncAt = new Date()) {
    const query = `
      UPDATE users
      SET sync_status = $1, last_sync_at = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status, lastSyncAt, userId]);
    return result.rows[0];
  }

  // Vérifier si le token a expiré
  static isTokenExpired(user) {
    return user.token_expires_at * 1000 < Date.now();
  }

  // Récupérer tous les utilisateurs qui ont besoin de sync
  static async findNeedingSync() {
    const query = `
      SELECT * FROM users
      WHERE sync_status = 'pending'
      OR last_sync_at IS NULL
      OR last_sync_at < NOW() - INTERVAL '1 hour'
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Admin: Récupérer tous les utilisateurs
  static async findAll() {
    const query = `
      SELECT
        id, strava_id, username, firstname, lastname,
        profile_photo, created_at, last_sync_at, sync_status, role
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Admin: Mettre à jour le rôle d'un utilisateur
  static async updateRole(userId, role) {
    const query = `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, strava_id, username, firstname, lastname, role
    `;
    const result = await pool.query(query, [role, userId]);
    return result.rows[0];
  }

  // Vérifier si un utilisateur est admin
  static async isAdmin(userId) {
    const query = 'SELECT role FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.role === 'admin';
  }
}

export default User;
