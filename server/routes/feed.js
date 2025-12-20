import express from 'express';
import Feed from '../models/Feed.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

/**
 * GET /api/feed
 * Obtenir le feed de l'utilisateur (ses activités + celles de ses amis)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const feed = await Feed.getUserFeed(req.user.id, limit, offset);

    res.json({
      success: true,
      activities: feed,
      count: feed.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading feed'
    });
  }
});

/**
 * GET /api/feed/activity/:activityId
 * Obtenir les détails d'une activité avec likes et commentaires
 */
router.get('/activity/:activityId', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const details = await Feed.getActivityDetails(activityId, req.user.id);

    res.json({
      success: true,
      activity: details
    });
  } catch (error) {
    console.error('Error getting activity details:', error);
    res.status(error.message === 'Activity not found' ? 404 : 500).json({
      success: false,
      error: error.message || 'Error loading activity details'
    });
  }
});

/**
 * POST /api/feed/activity/:activityId/like
 * Liker une activité
 */
router.post('/activity/:activityId/like', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const like = await Feed.likeActivity(activityId, req.user.id);

    res.json({
      success: true,
      like
    });
  } catch (error) {
    console.error('Error liking activity:', error);
    if (error.message === 'Already liked') {
      return res.status(400).json({
        success: false,
        error: 'Already liked'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error liking activity'
    });
  }
});

/**
 * DELETE /api/feed/activity/:activityId/like
 * Retirer le like d'une activité
 */
router.delete('/activity/:activityId/like', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    await Feed.unlikeActivity(activityId, req.user.id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error unliking activity:', error);
    if (error.message === 'Like not found') {
      return res.status(404).json({
        success: false,
        error: 'Like not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error unliking activity'
    });
  }
});

/**
 * GET /api/feed/activity/:activityId/likes
 * Obtenir les likes d'une activité
 */
router.get('/activity/:activityId/likes', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const likes = await Feed.getActivityLikes(activityId);

    res.json({
      success: true,
      likes,
      count: likes.length
    });
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading likes'
    });
  }
});

/**
 * POST /api/feed/activity/:activityId/comment
 * Ajouter un commentaire sur une activité
 */
router.post('/activity/:activityId/comment', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot be empty'
      });
    }

    const newComment = await Feed.addComment(activityId, req.user.id, comment.trim());

    res.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding comment'
    });
  }
});

/**
 * PUT /api/feed/comment/:commentId
 * Modifier un commentaire
 */
router.put('/comment/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot be empty'
      });
    }

    const updatedComment = await Feed.updateComment(commentId, req.user.id, comment.trim());

    res.json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error.message === 'Comment not found or unauthorized') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error updating comment'
    });
  }
});

/**
 * DELETE /api/feed/comment/:commentId
 * Supprimer un commentaire
 */
router.delete('/comment/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    await Feed.deleteComment(commentId, req.user.id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error.message === 'Comment not found or unauthorized') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error deleting comment'
    });
  }
});

/**
 * GET /api/feed/activity/:activityId/comments
 * Obtenir les commentaires d'une activité
 */
router.get('/activity/:activityId/comments', async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const comments = await Feed.getActivityComments(activityId);

    res.json({
      success: true,
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading comments'
    });
  }
});

/**
 * GET /api/feed/notifications
 * Obtenir les notifications de l'utilisateur
 */
router.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === 'true';

    const notifications = await Feed.getUserNotifications(req.user.id, limit, unreadOnly);
    const unreadCount = await Feed.getUnreadCount(req.user.id);

    res.json({
      success: true,
      notifications,
      unread_count: unreadCount,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading notifications'
    });
  }
});

/**
 * PUT /api/feed/notifications/:notificationId/read
 * Marquer une notification comme lue
 */
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    await Feed.markNotificationAsRead(notificationId, req.user.id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error updating notification'
    });
  }
});

/**
 * PUT /api/feed/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/notifications/read-all', async (req, res) => {
  try {
    await Feed.markAllNotificationsAsRead(req.user.id);

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating notifications'
    });
  }
});

export default router;
