import { pool } from '../config/database.js';

class Friendship {
  // Envoyer une demande d'ami
  static async sendRequest(userId, friendId) {
    // Vérifier qu'il n'existe pas déjà une relation
    const existing = await pool.query(
      `SELECT * FROM friendships
       WHERE (user_id = $1 AND friend_id = $2)
          OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    if (existing.rows.length > 0) {
      throw new Error('Friendship request already exists');
    }

    const result = await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [userId, friendId]
    );

    return result.rows[0];
  }

  // Accepter une demande d'ami
  static async acceptRequest(friendshipId, userId) {
    const result = await pool.query(
      `UPDATE friendships
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [friendshipId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Friendship request not found or already processed');
    }

    return result.rows[0];
  }

  // Rejeter une demande d'ami
  static async rejectRequest(friendshipId, userId) {
    const result = await pool.query(
      `UPDATE friendships
       SET status = 'rejected'
       WHERE id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING *`,
      [friendshipId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Friendship request not found or already processed');
    }

    return result.rows[0];
  }

  // Supprimer une amitié
  static async remove(friendshipId, userId) {
    const result = await pool.query(
      `DELETE FROM friendships
       WHERE id = $1 AND (user_id = $2 OR friend_id = $2)
       RETURNING *`,
      [friendshipId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Friendship not found');
    }

    return result.rows[0];
  }

  // Obtenir tous les amis (acceptés) d'un utilisateur
  static async getFriends(userId) {
    const result = await pool.query(
      `SELECT * FROM friends_list
       WHERE user_id = $1
       ORDER BY accepted_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Obtenir les demandes en attente reçues
  static async getPendingRequests(userId) {
    const result = await pool.query(
      `SELECT f.*, u.id as requester_id, u.username, u.strava_id
       FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.requested_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Obtenir les demandes envoyées en attente
  static async getSentRequests(userId) {
    const result = await pool.query(
      `SELECT f.*, u.id as recipient_id, u.username, u.strava_id
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.requested_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Chercher des utilisateurs (pour ajouter des amis)
  static async searchUsers(query, currentUserId, limit = 20) {
    // Si query est vide, retourner tous les users (sauf l'utilisateur courant)
    if (!query || query.length === 0) {
      const result = await pool.query(
        `SELECT id, username, strava_id, created_at,
                (SELECT status FROM friendships
                 WHERE (user_id = $1 AND friend_id = users.id)
                    OR (user_id = users.id AND friend_id = $1)
                 LIMIT 1) as friendship_status
         FROM users
         WHERE id != $1
         ORDER BY username
         LIMIT $2`,
        [currentUserId, limit]
      );
      return result.rows;
    }

    // Sinon, filtrer par le query
    const result = await pool.query(
      `SELECT id, username, strava_id, created_at,
              (SELECT status FROM friendships
               WHERE (user_id = $2 AND friend_id = users.id)
                  OR (user_id = users.id AND friend_id = $2)
               LIMIT 1) as friendship_status
       FROM users
       WHERE id != $2
         AND (username ILIKE $1 OR CAST(strava_id AS TEXT) ILIKE $1)
       ORDER BY username
       LIMIT $3`,
      [`%${query}%`, currentUserId, limit]
    );

    return result.rows;
  }

  // Vérifier le statut d'amitié entre deux utilisateurs
  static async checkFriendshipStatus(userId, friendId) {
    const result = await pool.query(
      `SELECT * FROM friendships
       WHERE (user_id = $1 AND friend_id = $2)
          OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    return result.rows[0] || null;
  }
}

export default Friendship;
