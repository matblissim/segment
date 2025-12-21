import { pool } from '../config/database.js';

class Challenge {
  /**
   * Créer un nouveau challenge
   */
  static async create(challengerId, challengedId, metric, targetValue, startDate, endDate) {
    const result = await pool.query(
      `INSERT INTO challenges (challenger_id, challenged_id, metric, target_value, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [challengerId, challengedId, metric, targetValue, startDate, endDate]
    );
    return result.rows[0];
  }

  /**
   * Accepter un challenge
   */
  static async accept(challengeId, userId) {
    const result = await pool.query(
      `UPDATE challenges
       SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND challenged_id = $2 AND status = 'pending'
       RETURNING *`,
      [challengeId, userId]
    );
    return result.rows[0];
  }

  /**
   * Refuser un challenge
   */
  static async decline(challengeId, userId) {
    const result = await pool.query(
      `UPDATE challenges
       SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND challenged_id = $2 AND status = 'pending'
       RETURNING *`,
      [challengeId, userId]
    );
    return result.rows[0];
  }

  /**
   * Annuler un challenge (seulement le créateur)
   */
  static async cancel(challengeId, userId) {
    const result = await pool.query(
      `UPDATE challenges
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND challenger_id = $2 AND status IN ('pending', 'active')
       RETURNING *`,
      [challengeId, userId]
    );
    return result.rows[0];
  }

  /**
   * Obtenir les challenges d'un utilisateur
   */
  static async getUserChallenges(userId) {
    const result = await pool.query(
      `SELECT
         c.*,
         u1.username as challenger_username,
         u1.profile_photo as challenger_photo,
         u2.username as challenged_username,
         u2.profile_photo as challenged_photo
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       WHERE c.challenger_id = $1 OR c.challenged_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Obtenir les challenges actifs d'un utilisateur
   */
  static async getActiveChallenges(userId) {
    const result = await pool.query(
      `SELECT
         c.*,
         u1.username as challenger_username,
         u1.profile_photo as challenger_photo,
         u2.username as challenged_username,
         u2.profile_photo as challenged_photo
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       WHERE (c.challenger_id = $1 OR c.challenged_id = $1)
         AND c.status = 'active'
         AND c.end_date >= CURRENT_DATE
       ORDER BY c.end_date ASC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Obtenir les challenges en attente pour un utilisateur
   */
  static async getPendingChallenges(userId) {
    const result = await pool.query(
      `SELECT
         c.*,
         u1.username as challenger_username,
         u1.profile_photo as challenger_photo,
         u2.username as challenged_username,
         u2.profile_photo as challenged_photo
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       WHERE c.challenged_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Calculer la progression d'un challenge pour un utilisateur
   */
  static async getProgress(challengeId, userId) {
    // Récupérer le challenge
    const challengeResult = await pool.query(
      'SELECT * FROM challenges WHERE id = $1',
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      return null;
    }

    const challenge = challengeResult.rows[0];

    // Calculer les stats pour les deux participants
    const statsQuery = `
      SELECT
        COALESCE(SUM(distance), 0) as total_distance,
        COALESCE(SUM(total_elevation_gain), 0) as total_elevation
      FROM activities
      WHERE user_id = $1
        AND start_date >= $2
        AND start_date <= $3
    `;

    const [challengerStats, challengedStats] = await Promise.all([
      pool.query(statsQuery, [challenge.challenger_id, challenge.start_date, challenge.end_date]),
      pool.query(statsQuery, [challenge.challenged_id, challenge.start_date, challenge.end_date]),
    ]);

    const challengerValue = challenge.metric === 'distance'
      ? parseFloat(challengerStats.rows[0].total_distance) || 0
      : parseFloat(challengerStats.rows[0].total_elevation) || 0;

    const challengedValue = challenge.metric === 'distance'
      ? parseFloat(challengedStats.rows[0].total_distance) || 0
      : parseFloat(challengedStats.rows[0].total_elevation) || 0;

    return {
      challenge,
      challenger_value: challengerValue,
      challenged_value: challengedValue,
      challenger_percentage: (challengerValue / parseFloat(challenge.target_value)) * 100,
      challenged_percentage: (challengedValue / parseFloat(challenge.target_value)) * 100,
    };
  }

  /**
   * Calculer les statistiques H2H entre deux utilisateurs
   */
  static async getHeadToHeadStats(userId1, userId2) {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE winner_id = $1) as user1_wins,
         COUNT(*) FILTER (WHERE winner_id = $2) as user2_wins,
         COUNT(*) FILTER (WHERE winner_id IS NULL AND status = 'completed') as draws,
         COUNT(*) FILTER (WHERE status = 'completed') as total_completed
       FROM challenges
       WHERE status = 'completed'
         AND ((challenger_id = $1 AND challenged_id = $2)
           OR (challenger_id = $2 AND challenged_id = $1))`,
      [userId1, userId2]
    );
    return result.rows[0];
  }

  /**
   * Terminer un challenge et déterminer le gagnant
   */
  static async complete(challengeId) {
    const progress = await this.getProgress(challengeId, null);

    if (!progress) {
      return null;
    }

    let winnerId = null;
    if (progress.challenger_value > progress.challenged_value) {
      winnerId = progress.challenge.challenger_id;
    } else if (progress.challenged_value > progress.challenger_value) {
      winnerId = progress.challenge.challenged_id;
    }
    // Si égalité, winnerId reste null

    const result = await pool.query(
      `UPDATE challenges
       SET status = 'completed', winner_id = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [challengeId, winnerId]
    );

    return result.rows[0];
  }
}

export default Challenge;
