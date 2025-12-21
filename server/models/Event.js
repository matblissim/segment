import { pool } from '../config/database.js';

class Event {
  /**
   * Créer un nouvel événement
   */
  static async create(userId, name, eventDate, description = null, location = null, targetDistance = null, targetElevation = null) {
    const result = await pool.query(
      `INSERT INTO events (created_by, name, event_date, description, location, target_distance, target_elevation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, eventDate, description, location, targetDistance, targetElevation]
    );
    return result.rows[0];
  }

  /**
   * Obtenir tous les événements avec info de participation
   */
  static async getAllWithParticipation(userId = null) {
    const query = userId
      ? `SELECT
           e.*,
           u.username as creator_username,
           (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count,
           ep.priority as user_priority,
           (ep.user_id IS NOT NULL) as is_participating
         FROM events e
         JOIN users u ON e.created_by = u.id
         LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = $1
         ORDER BY e.event_date ASC`
      : `SELECT
           e.*,
           u.username as creator_username,
           (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count
         FROM events e
         JOIN users u ON e.created_by = u.id
         ORDER BY e.event_date ASC`;

    const result = userId
      ? await pool.query(query, [userId])
      : await pool.query(query);

    return result.rows;
  }

  /**
   * Obtenir les événements d'un utilisateur avec priorité spécifique
   */
  static async getUserEventsByPriority(userId, priority = 'A') {
    const result = await pool.query(
      `SELECT
         e.*,
         u.username as creator_username,
         ep.priority,
         (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count
       FROM events e
       JOIN users u ON e.created_by = u.id
       JOIN event_participants ep ON e.id = ep.event_id
       WHERE ep.user_id = $1 AND ep.priority = $2 AND e.event_date >= CURRENT_DATE
       ORDER BY e.event_date ASC`,
      [userId, priority]
    );
    return result.rows;
  }

  /**
   * Participer à un événement ou mettre à jour la priorité
   */
  static async participate(eventId, userId, priority = 'B') {
    const result = await pool.query(
      `INSERT INTO event_participants (event_id, user_id, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET priority = EXCLUDED.priority
       RETURNING *`,
      [eventId, userId, priority]
    );
    return result.rows[0];
  }

  /**
   * Retirer sa participation d'un événement
   */
  static async unparticipate(eventId, userId) {
    const result = await pool.query(
      `DELETE FROM event_participants
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [eventId, userId]
    );
    return result.rows[0];
  }

  /**
   * Obtenir les participants d'un événement
   */
  static async getParticipants(eventId) {
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.firstname,
         u.lastname,
         u.profile_photo,
         ep.priority,
         ep.created_at as joined_at
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = $1
       ORDER BY ep.priority ASC, ep.created_at ASC`,
      [eventId]
    );
    return result.rows;
  }

  /**
   * Supprimer un événement (créateur ou admin)
   */
  static async delete(eventId, userId, isAdmin = false) {
    const query = isAdmin
      ? `DELETE FROM events WHERE id = $1 RETURNING *`
      : `DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING *`;

    const params = isAdmin ? [eventId] : [eventId, userId];
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Mettre à jour un événement (seulement le créateur)
   */
  static async update(eventId, userId, updates) {
    const { name, event_date, description, location } = updates;
    const result = await pool.query(
      `UPDATE events
       SET name = COALESCE($3, name),
           event_date = COALESCE($4, event_date),
           description = COALESCE($5, description),
           location = COALESCE($6, location),
           updated_at = NOW()
       WHERE id = $1 AND created_by = $2
       RETURNING *`,
      [eventId, userId, name, event_date, description, location]
    );
    return result.rows[0];
  }
}

export default Event;
