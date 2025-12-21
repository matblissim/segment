import express from 'express';
import axios from 'axios';

const router = express.Router();

// Configuration Strava OAuth
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/auth/callback';

// Générer l'URL d'authentification Strava
router.get('/auth-url', (req, res) => {
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=activity:read_all,profile:read_all`;
  res.json({ url: authUrl });
});

// Échanger le code d'autorisation contre un token
router.post('/exchange-token', async (req, res) => {
  const { code } = req.body;

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Rafraîchir le token
router.post('/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Récupérer les activités de l'utilisateur
router.get('/activities', async (req, res) => {
  const { access_token, per_page = 30, page = 1 } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      params: { per_page, page }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching activities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Récupérer le profil de l'athlète
router.get('/athlete', async (req, res) => {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching athlete:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch athlete profile' });
  }
});

// Récupérer les stats de l'athlète
router.get('/athlete/stats/:id', async (req, res) => {
  const { id } = req.params;
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.get(`https://www.strava.com/api/v3/athletes/${id}/stats`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stats:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch athlete stats' });
  }
});

// Récupérer une activité détaillée par ID
router.get('/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching activity details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch activity details' });
  }
});

// Récupérer les streams d'une activité (données seconde par seconde)
router.get('/activities/:id/streams', async (req, res) => {
  const { id } = req.params;
  const { access_token, keys = 'time,heartrate,altitude,velocity_smooth,cadence,distance' } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${id}/streams`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      params: {
        keys,
        key_by_type: true
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching activity streams:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch activity streams' });
  }
});

export default router;
