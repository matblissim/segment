import express from 'express';
import Friendship from '../models/Friendship.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Chercher des utilisateurs pour ajouter des amis
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await Friendship.searchUsers(q, req.userId);

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Obtenir la liste des amis
router.get('/', async (req, res) => {
  try {
    const friends = await Friendship.getFriends(req.userId);

    res.json({ friends });
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
