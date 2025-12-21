import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import axios from 'axios';

const router = express.Router();

// Initialiser le client Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Toutes les routes nécessitent l'authentification
router.use(authenticateToken);

// Helper: Calculer les zones FC manuellement (sans Premium)
function calculateHRZones(streams, maxHR) {
  if (!streams.heartrate || !maxHR) return null;

  const zones = {
    z1: { min: 0, max: Math.round(maxHR * 0.60), time: 0 },
    z2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), time: 0 },
    z3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), time: 0 },
    z4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), time: 0 },
    z5: { min: Math.round(maxHR * 0.90), max: 220, time: 0 },
  };

  streams.heartrate.data.forEach(hr => {
    if (hr <= zones.z1.max) zones.z1.time++;
    else if (hr <= zones.z2.max) zones.z2.time++;
    else if (hr <= zones.z3.max) zones.z3.time++;
    else if (hr <= zones.z4.max) zones.z4.time++;
    else zones.z5.time++;
  });

  return zones;
}

// Helper: Analyser la dérive cardiaque
function analyzeCardiacDrift(streams) {
  if (!streams.heartrate || !streams.velocity_smooth) return null;

  const hrData = streams.heartrate.data;
  const speedData = streams.velocity_smooth.data;

  // Comparer première moitié vs deuxième moitié
  const midpoint = Math.floor(hrData.length / 2);
  const firstHalfHR = hrData.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const secondHalfHR = hrData.slice(midpoint).reduce((a, b) => a + b, 0) / (hrData.length - midpoint);
  const firstHalfSpeed = speedData.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const secondHalfSpeed = speedData.slice(midpoint).reduce((a, b) => a + b, 0) / (speedData.length - midpoint);

  const hrIncrease = ((secondHalfHR - firstHalfHR) / firstHalfHR) * 100;
  const speedChange = ((secondHalfSpeed - firstHalfSpeed) / firstHalfSpeed) * 100;

  return {
    hrIncrease: hrIncrease.toFixed(1),
    speedChange: speedChange.toFixed(1),
    drift: hrIncrease > 5 && Math.abs(speedChange) < 3 // Dérive si FC +5% mais vitesse stable
  };
}

// Analyser une activité spécifique
router.post('/analyze-activity/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const userId = req.userId;

    // 1. Récupérer l'activité depuis la DB
    const activityResult = await pool.query(
      'SELECT * FROM activities WHERE strava_id = $1 AND user_id = $2',
      [activityId, userId]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const activity = activityResult.rows[0];
    const rawData = activity.raw_data;

    // 2. Récupérer le token Strava
    const userResult = await pool.query(
      'SELECT strava_access_token, max_heartrate FROM users WHERE id = $1',
      [userId]
    );
    const accessToken = userResult.rows[0].strava_access_token;
    const userMaxHR = userResult.rows[0].max_heartrate || 190; // Défaut si pas défini

    // 3. Récupérer les streams depuis Strava
    let streams = null;
    try {
      const streamsResponse = await axios.get(
        `https://www.strava.com/api/v3/activities/${activityId}/streams`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            keys: 'time,heartrate,altitude,velocity_smooth,cadence,distance',
            key_by_type: true
          }
        }
      );
      streams = streamsResponse.data;
    } catch (error) {
      console.error('Error fetching streams:', error.message);
      // Continue sans streams si erreur
    }

    // 4. Récupérer l'historique des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyResult = await pool.query(
      `SELECT
        COUNT(*) as activity_count,
        SUM(distance) as total_distance,
        SUM(total_elevation_gain) as total_elevation,
        SUM(moving_time) as total_time,
        AVG(average_heartrate) as avg_hr
       FROM activities
       WHERE user_id = $1 AND start_date >= $2 AND start_date < $3`,
      [userId, thirtyDaysAgo, activity.start_date]
    );

    const history30d = historyResult.rows[0];

    // 5. Préparer les données pour l'IA
    const splits = rawData.splits_metric || [];
    const hrZones = streams ? calculateHRZones(streams, userMaxHR) : null;
    const cardiacDrift = streams ? analyzeCardiacDrift(streams) : null;

    const activityData = {
      // Métriques générales
      distance_km: (activity.distance / 1000).toFixed(2),
      duration_min: Math.round(activity.moving_time / 60),
      avg_pace_per_km: activity.average_speed ? (1000 / activity.average_speed / 60).toFixed(2) : null,
      elevation_gain_m: activity.total_elevation_gain,
      type: activity.type,
      sport_type: activity.sport_type,
      date: activity.start_date,

      // FC
      avg_hr: activity.average_heartrate,
      max_hr: activity.max_heartrate,
      hr_zones: hrZones,
      cardiac_drift: cardiacDrift,

      // Allure (splits)
      splits: splits.map((split, i) => ({
        km: i + 1,
        time_seconds: split.moving_time,
        pace_per_km: (split.moving_time / 60).toFixed(2),
        elevation_diff: split.elevation_difference,
        avg_hr: split.average_heartrate
      })),

      // Cadence
      avg_cadence: activity.average_cadence,

      // Historique 30j
      history_30d: {
        activity_count: parseInt(history30d.activity_count),
        total_km: (parseFloat(history30d.total_distance) / 1000).toFixed(1),
        total_hours: (parseFloat(history30d.total_time) / 3600).toFixed(1),
        avg_hr: Math.round(parseFloat(history30d.avg_hr) || 0)
      }
    };

    // 6. Prompt pour Claude (COACH DUR ET EXIGEANT)
    const prompt = `Tu es un coach de course à pied EXIGEANT et STRICT. Tu ne fais PAS de compliments gratuits. Tu analyses les données factuellement et tu donnes un feedback DIRECT et HONNÊTE.

DONNÉES DE LA SÉANCE :
${JSON.stringify(activityData, null, 2)}

TON RÔLE :
- Analyse SANS COMPLAISANCE
- Détecte les erreurs, les faiblesses, les incohérences
- Compare avec l'historique des 30 derniers jours
- Identifie si le coureur en fait TROP ou PAS ASSEZ
- Donne des conseils CONCRETS et EXIGEANTS

ANALYSE OBLIGATOIRE :
1. **Gestion de l'allure** : Splits réguliers ou n'importe quoi ? Départ trop rapide ?
2. **Cardio** : Zones adaptées ? Dérive cardiaque ? Effort cohérent ?
3. **Volume/Intensité** : Par rapport à l'historique, c'est cohérent ou aberrant ?
4. **Points à améliorer** : Sois DIRECT. Pas de "c'est pas mal", dis ce qui ne va PAS.
5. **Prochaine séance** : Consignes PRÉCISES et STRICTES.

FORMAT DE RÉPONSE :
- Utilise des bullets points
- Sois CONCIS et FACTUEL
- Pas de "bravo", "félicitations", etc.
- Si c'est mauvais, DIS-LE clairement

ANALYSE :`;

    // 7. Appeler Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysis = message.content[0].text;

    // 8. Sauvegarder l'analyse en DB (optionnel)
    await pool.query(
      `INSERT INTO activity_ai_analyses (activity_id, user_id, analysis, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (activity_id) DO UPDATE SET analysis = $3, created_at = NOW()`,
      [activityId, userId, analysis]
    );

    res.json({
      analysis,
      activity_data: activityData
    });

  } catch (error) {
    console.error('Error analyzing activity:', error);
    res.status(500).json({ error: 'Failed to analyze activity', details: error.message });
  }
});

// Analyser le profil global du coureur
router.post('/analyze-profile', async (req, res) => {
  try {
    const userId = req.userId;

    // Récupérer les stats de différentes périodes
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [week, month, year, allTime] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as count,
          SUM(distance)/1000 as total_km,
          SUM(total_elevation_gain) as total_d_plus,
          SUM(moving_time)/3600 as total_hours,
          AVG(average_heartrate) as avg_hr
        FROM activities WHERE user_id = $1 AND start_date >= $2
      `, [userId, sevenDaysAgo]),
      pool.query(`
        SELECT
          COUNT(*) as count,
          SUM(distance)/1000 as total_km,
          SUM(total_elevation_gain) as total_d_plus,
          SUM(moving_time)/3600 as total_hours,
          AVG(average_heartrate) as avg_hr
        FROM activities WHERE user_id = $1 AND start_date >= $2
      `, [userId, thirtyDaysAgo]),
      pool.query(`
        SELECT
          COUNT(*) as count,
          SUM(distance)/1000 as total_km,
          SUM(total_elevation_gain) as total_d_plus,
          SUM(moving_time)/3600 as total_hours,
          AVG(average_heartrate) as avg_hr
        FROM activities WHERE user_id = $1 AND start_date >= $2
      `, [userId, oneYearAgo]),
      pool.query(`
        SELECT
          COUNT(*) as count,
          SUM(distance)/1000 as total_km,
          SUM(total_elevation_gain) as total_d_plus,
          SUM(moving_time)/3600 as total_hours
        FROM activities WHERE user_id = $1
      `, [userId])
    ]);

    // Récupérer les 5 dernières activités
    const recentActivities = await pool.query(`
      SELECT name, start_date, distance/1000 as distance_km, moving_time/60 as duration_min,
             total_elevation_gain, average_heartrate, type
      FROM activities
      WHERE user_id = $1
      ORDER BY start_date DESC
      LIMIT 5
    `, [userId]);

    const profileData = {
      stats_7d: {
        activities: parseInt(week.rows[0].count),
        km: parseFloat(week.rows[0].total_km || 0).toFixed(1),
        d_plus: parseFloat(week.rows[0].total_d_plus || 0).toFixed(0),
        hours: parseFloat(week.rows[0].total_hours || 0).toFixed(1),
        avg_hr: Math.round(parseFloat(week.rows[0].avg_hr || 0))
      },
      stats_30d: {
        activities: parseInt(month.rows[0].count),
        km: parseFloat(month.rows[0].total_km || 0).toFixed(1),
        d_plus: parseFloat(month.rows[0].total_d_plus || 0).toFixed(0),
        hours: parseFloat(month.rows[0].total_hours || 0).toFixed(1),
        avg_hr: Math.round(parseFloat(month.rows[0].avg_hr || 0))
      },
      stats_365d: {
        activities: parseInt(year.rows[0].count),
        km: parseFloat(year.rows[0].total_km || 0).toFixed(1),
        d_plus: parseFloat(year.rows[0].total_d_plus || 0).toFixed(0),
        hours: parseFloat(year.rows[0].total_hours || 0).toFixed(1),
        avg_hr: Math.round(parseFloat(year.rows[0].avg_hr || 0))
      },
      all_time: {
        activities: parseInt(allTime.rows[0].count),
        km: parseFloat(allTime.rows[0].total_km || 0).toFixed(1),
        d_plus: parseFloat(allTime.rows[0].total_d_plus || 0).toFixed(0),
        hours: parseFloat(allTime.rows[0].total_hours || 0).toFixed(1)
      },
      recent_activities: recentActivities.rows.map(a => ({
        name: a.name,
        date: a.start_date,
        km: parseFloat(a.distance_km).toFixed(1),
        duration_min: Math.round(a.duration_min),
        d_plus: a.total_elevation_gain,
        avg_hr: a.average_heartrate,
        type: a.type
      }))
    };

    // Prompt pour l'analyse globale
    const prompt = `Tu es un coach de course à pied EXIGEANT. Analyse le PROFIL GLOBAL de ce coureur.

DONNÉES DU COUREUR :
${JSON.stringify(profileData, null, 2)}

ANALYSE OBLIGATOIRE :
1. **Volume d'entraînement** :
   - 7 jours vs 30 jours → Progression cohérente ou pic anormal ?
   - Comparaison avec l'année → En surcharge ou sous-entraînement ?

2. **Régularité** :
   - Fréquence des séances adaptée ?
   - Activités récentes régulières ou erratiques ?

3. **Intensité** :
   - FC moyenne cohérente ?
   - Trop d'intensité ou pas assez ?

4. **Progressivité** :
   - Augmentation du volume prudente (10% max/semaine) ou dangereuse ?
   - Risque de blessure imminent ?

5. **Plan d'action** :
   - Objectif de volume pour la semaine prochaine (KM PRÉCIS)
   - Type de séances à privilégier
   - AVERTISSEMENTS si nécessaire

SOIS DIRECT ET FACTUEL. Si le coureur fait n'importe quoi, DIS-LE.

ANALYSE :`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysis = message.content[0].text;

    res.json({
      analysis,
      profile_data: profileData
    });

  } catch (error) {
    console.error('Error analyzing profile:', error);
    res.status(500).json({ error: 'Failed to analyze profile', details: error.message });
  }
});

export default router;
