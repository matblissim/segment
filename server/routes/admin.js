import express from 'express';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes admin nécessitent l'authentification ET le rôle admin
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role - Mettre à jour le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Valider le rôle
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }

    // Mettre à jour le rôle
    const updatedUser = await User.updateRole(id, role);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/users/:id - Récupérer les détails d'un utilisateur spécifique
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
