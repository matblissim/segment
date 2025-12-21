import express from 'express';
import Event from '../models/Event.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Obtenir tous les événements
router.get('/', async (req, res) => {
  try {
    const events = await Event.getAllWithParticipation(req.userId);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Obtenir les événements prioritaires d'un utilisateur (pour le dashboard)
router.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    if (!['A', 'B', 'C'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const events = await Event.getUserEventsByPriority(req.userId, priority);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching priority events:', error);
    res.status(500).json({ error: 'Failed to fetch priority events' });
  }
});

// Créer un nouvel événement
router.post('/', async (req, res) => {
  try {
    const { name, event_date, description, location, target_distance, target_elevation } = req.body;

    if (!name || !event_date) {
      return res.status(400).json({ error: 'Name and event_date are required' });
    }

    const event = await Event.create(
      req.userId,
      name,
      event_date,
      description,
      location,
      target_distance || null,
      target_elevation || null
    );
    res.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Participer à un événement
router.post('/:id/participate', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (priority && !['A', 'B', 'C'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be A, B, or C' });
    }

    const participation = await Event.participate(id, req.userId, priority || 'B');
    res.json({ participation });
  } catch (error) {
    console.error('Error participating in event:', error);
    res.status(500).json({ error: 'Failed to participate in event' });
  }
});

// Retirer sa participation
router.delete('/:id/participate', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Event.unparticipate(id, req.userId);

    if (!result) {
      return res.status(404).json({ error: 'Participation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error unparticipating from event:', error);
    res.status(500).json({ error: 'Failed to unparticipate from event' });
  }
});

// Obtenir les participants d'un événement
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const participants = await Event.getParticipants(id);
    res.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Mettre à jour un événement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.update(id, req.userId, updates);

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Supprimer un événement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.delete(id, req.userId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
