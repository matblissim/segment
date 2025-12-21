import express from 'express';
import Friendship from '../models/Friendship.js';
import Activity from '../models/Activity.js';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Chercher des utilisateurs pour ajouter des amis
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    // Si q est vide ou undefined, on recherche tous les users
    // Sinon, on applique le filtre de recherche
    const query = q || '';

    const users = await Friendship.searchUsers(query, req.userId);

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Obtenir la liste des amis avec leurs stats mensuelles
router.get('/', async (req, res) => {
  try {
    const friends = await Friendship.getFriends(req.userId);

    // Pour chaque ami, récupérer ses stats du mois et son prochain événement
    const friendsWithStats = await Promise.all(
      friends.map(async (friend) => {
        // Stats du mois en cours
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const statsResult = await pool.query(
          `SELECT
             COALESCE(SUM(distance), 0) as monthly_distance,
             COALESCE(SUM(total_elevation_gain), 0) as monthly_elevation
           FROM activities
           WHERE user_id = $1 AND start_date >= $2`,
          [friend.friend_id, startOfMonth]
        );

        const stats = statsResult.rows[0];

        // Prochain événement prioritaire
        const eventResult = await pool.query(
          `SELECT e.*, ep.priority,
             (e.event_date - CURRENT_DATE) as days_until
           FROM events e
           JOIN event_participants ep ON e.id = ep.event_id
           WHERE ep.user_id = $1
             AND e.event_date >= CURRENT_DATE
           ORDER BY e.event_date ASC
           LIMIT 1`,
          [friend.friend_id]
        );

        const nextEvent = eventResult.rows[0] || null;

        return {
          ...friend,
          monthly_distance: parseFloat(stats.monthly_distance) || 0,
          monthly_elevation: parseFloat(stats.monthly_elevation) || 0,
          next_event: nextEvent
        };
      })
    );

    res.json({ friends: friendsWithStats });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Obtenir les demandes d'amis en attente (reçues)
router.get('/pending', async (req, res) => {
  try {
    const pendingRequests = await Friendship.getPendingRequests(req.userId);

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Obtenir les demandes envoyées
router.get('/sent', async (req, res) => {
  try {
    const sentRequests = await Friendship.getSentRequests(req.userId);

    res.json({ requests: sentRequests });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

// Envoyer une demande d'ami
router.post('/request/:friendId', async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);

    if (friendId === req.userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const friendship = await Friendship.sendRequest(req.userId, friendId);

    res.json({
      message: 'Friend request sent successfully',
      friendship
    });
  } catch (error) {
    console.error('Error sending friend request:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accepter une demande d'ami
router.post('/accept/:friendshipId', async (req, res) => {
  try {
    const friendshipId = parseInt(req.params.friendshipId);

    const friendship = await Friendship.acceptRequest(friendshipId, req.userId);

    res.json({
      message: 'Friend request accepted',
      friendship
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Rejeter une demande d'ami
router.post('/reject/:friendshipId', async (req, res) => {
  try {
    const friendshipId = parseInt(req.params.friendshipId);

    const friendship = await Friendship.rejectRequest(friendshipId, req.userId);

    res.json({
      message: 'Friend request rejected',
      friendship
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Supprimer un ami
router.delete('/remove/:friendshipId', async (req, res) => {
  try {
    const friendshipId = parseInt(req.params.friendshipId);

    await Friendship.remove(friendshipId, req.userId);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Vérifier le statut d'amitié avec un utilisateur
router.get('/status/:userId', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    const status = await Friendship.checkFriendshipStatus(req.userId, targetUserId);

    res.json({ status });
  } catch (error) {
    console.error('Error checking friendship status:', error);
    res.status(500).json({ error: 'Failed to check friendship status' });
  }
});

export default router;
