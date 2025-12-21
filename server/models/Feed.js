import { pool } from '../config/database.js';

class Feed {
  /**
   * Obtenir le feed d'un utilisateur (ses activités + celles de ses amis + badges)
   */
  static async getUserFeed(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      'SELECT * FROM get_user_feed_with_badges($1, $2, $3)',
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Enregistrer un achievement de badge
   */
  static async recordBadgeAchievement(userId, badge, sportType, activityId = null, achievedAt = null) {
    // Si pas de date fournie, on cherche la date de l'activité associée
    let badgeDate = achievedAt;

    if (!badgeDate && activityId) {
      const activityResult = await pool.query(
        'SELECT start_date FROM activities WHERE id = $1',
        [activityId]
      );
      if (activityResult.rows.length > 0) {
        badgeDate = activityResult.rows[0].start_date;
      }
    }

    // Si toujours pas de date, utiliser NOW()
    if (!badgeDate) {
      badgeDate = new Date();
    }

    const result = await pool.query(
      `INSERT INTO badge_achievements (user_id, badge_id, badge_name, badge_description, sport_type, activity_id, count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, badge_id)
       DO UPDATE SET
         count = badge_achievements.count + 1,
         activity_id = EXCLUDED.activity_id,
         created_at = EXCLUDED.created_at
       RETURNING *`,
      [userId, badge.id, badge.name, badge.description, sportType, activityId, badge.count || 1, badgeDate]
    );
    return result.rows[0];
  }

  /**
   * Liker une activité
   */
  static async likeActivity(activityId, userId) {
    try {
      const result = await pool.query(
        `INSERT INTO activity_likes (activity_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [activityId, userId]
      );

      // Créer une notification pour le propriétaire de l'activité
      const activity = await pool.query(
        'SELECT user_id FROM activities WHERE strava_id = $1',
        [activityId]
      );

      if (activity.rows.length > 0 && activity.rows[0].user_id !== userId) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, from_user_id, activity_id)
           VALUES ($1, 'like', $2, $3)`,
          [activity.rows[0].user_id, userId, activityId]
        );
      }

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation - déjà liké
        throw new Error('Already liked');
      }
      throw error;
    }
  }

  /**
   * Retirer un like d'une activité
   */
  static async unlikeActivity(activityId, userId) {
    const result = await pool.query(
      `DELETE FROM activity_likes
       WHERE activity_id = $1 AND user_id = $2
       RETURNING *`,
      [activityId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Like not found');
    }

    return result.rows[0];
  }

  /**
   * Obtenir les likes d'une activité
   */
  static async getActivityLikes(activityId) {
    const result = await pool.query(
      `SELECT al.*, u.username, u.strava_id
       FROM activity_likes al
       JOIN users u ON al.user_id = u.id
       WHERE al.activity_id = $1
       ORDER BY al.created_at DESC`,
      [activityId]
    );
    return result.rows;
  }

  /**
   * Ajouter un commentaire sur une activité
   */
  static async addComment(activityId, userId, comment) {
    const result = await pool.query(
      `INSERT INTO activity_comments (activity_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [activityId, userId, comment]
    );

    // Créer une notification pour le propriétaire de l'activité
    const activity = await pool.query(
      'SELECT user_id FROM activities WHERE strava_id = $1',
      [activityId]
    );

    if (activity.rows.length > 0 && activity.rows[0].user_id !== userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, from_user_id, activity_id, comment_id)
         VALUES ($1, 'comment', $2, $3, $4)`,
        [activity.rows[0].user_id, userId, activityId, result.rows[0].id]
      );
    }

    return result.rows[0];
  }

  /**
   * Modifier un commentaire
   */
  static async updateComment(commentId, userId, newComment) {
    const result = await pool.query(
      `UPDATE activity_comments
       SET comment = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [newComment, commentId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Comment not found or unauthorized');
    }

    return result.rows[0];
  }

  /**
   * Supprimer un commentaire
   */
  static async deleteComment(commentId, userId) {
    const result = await pool.query(
      `DELETE FROM activity_comments
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Comment not found or unauthorized');
    }

    return result.rows[0];
  }

  /**
   * Obtenir les commentaires d'une activité
   */
  static async getActivityComments(activityId) {
    const result = await pool.query(
      `SELECT ac.*, u.username, u.strava_id
       FROM activity_comments ac
       JOIN users u ON ac.user_id = u.id
       WHERE ac.activity_id = $1
       ORDER BY ac.created_at ASC`,
      [activityId]
    );
    return result.rows;
  }

  /**
   * Obtenir les notifications d'un utilisateur
   */
  static async getUserNotifications(userId, limit = 50, unreadOnly = false) {
    const query = unreadOnly
      ? `SELECT n.*, u.username as from_username, u.strava_id as from_strava_id
         FROM notifications n
         LEFT JOIN users u ON n.from_user_id = u.id
         WHERE n.user_id = $1 AND n.read = false
         ORDER BY n.created_at DESC
         LIMIT $2`
      : `SELECT n.*, u.username as from_username, u.strava_id as from_strava_id
         FROM notifications n
         LEFT JOIN users u ON n.from_user_id = u.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT $2`;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return result.rows[0];
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllNotificationsAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications
       SET read = true
       WHERE user_id = $1 AND read = false
       RETURNING *`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Compter les notifications non lues
   */
  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Obtenir les détails d'une activité avec likes et commentaires
   */
  static async getActivityDetails(activityId, userId) {
    // Récupérer l'activité
    const activityResult = await pool.query(
      `SELECT a.*, u.username, u.strava_id as user_strava_id
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.strava_id = $1`,
      [activityId]
    );

    if (activityResult.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityResult.rows[0];

    // Récupérer les likes
    const likes = await this.getActivityLikes(activityId);

    // Récupérer les commentaires
    const comments = await this.getActivityComments(activityId);

    // Vérifier si l'utilisateur a liké
    const userHasLiked = likes.some(like => like.user_id === userId);

    return {
      ...activity,
      likes_count: likes.length,
      comments_count: comments.length,
      user_has_liked: userHasLiked,
      likes,
      comments
    };
  }
}

export default Feed;
