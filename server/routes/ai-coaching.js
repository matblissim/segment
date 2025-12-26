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
    z5: { min: Math.round(maxHR * 0.90), max: maxHR, time: 0 },
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
      'SELECT access_token, max_heartrate FROM users WHERE id = $1',
      [userId]
    );
    const accessToken = userResult.rows[0].access_token;
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

    // 6. Prompt pour Claude (COACH ULTRA-EXIGEANT)
    const prompt = `Tu es le MEILLEUR coach de course à pied au monde. EXIGEANT, STRICT, ULTRA-ANALYTIQUE. Pas de compliments gratuits, seulement la VÉRITÉ.

DONNÉES DE LA SÉANCE :
${JSON.stringify(activityData, null, 2)}

CONTEXTE IMPORTANT - DÉTECTION AUTOMATIQUE :
Avant d'analyser, DÉTERMINE si c'est :
- **COURSE/COMPÉTITION** : nom contient "course", "10km", "semi", "marathon", "trail", "race", OU distance exacte 5km/10km/21.1km/42.2km, OU allure très soutenue constante
- **ENTRAÎNEMENT** : sortie classique, fractionné, sortie longue

⚠️ ADAPTE ton analyse selon le type :
- COURSE : départ rapide NORMAL, FC haute ACCEPTABLE, splits décroissants OK si faible (fatigue normale), l'objectif = performance
- ENTRAÎNEMENT : régularité PRIMORDIALE, gestion FC importante, l'objectif = adaptation/progression

TON RÔLE DE COACH EXPERT :
- Analyse ULTRA-PROFONDE de chaque métrique
- Détecte TOUTES les erreurs tactiques et physiologiques
- Compare avec l'historique : cette séance s'inscrit comment dans la progression ?
- Identifie surcharge, sous-régime, erreurs de gestion
- Conseils CONCRETS et APPLICABLES immédiatement

ANALYSE OBLIGATOIRE DÉTAILLÉE :

0. **TYPE DE SÉANCE** (OBLIGATOIRE EN PREMIER) :
   - Détermine : COURSE ou ENTRAÎNEMENT ? Pourquoi ?
   - Adapte les critères d'évaluation en conséquence

1. **GESTION DE L'ALLURE** (analyse split par split, SELON LE TYPE) :
   - SI COURSE : départ rapide OK, cherche NEGATIVE SPLIT (accélération fin) ou EVEN SPLIT (régularité). Splits décroissants légers = fatigue acceptable si course longue
   - SI ENTRAÎNEMENT : régularité EXIGÉE, écart-type faible attendu, départ trop rapide = ERREUR
   - Gestion du dénivelé : adaptation en montée/descente cohérente ?
   - Verdict tactique : stratégie intelligente OU erreurs de gestion ?

2. **ANALYSE CARDIAQUE** (zones, dérive, cohérence - SELON TYPE) :
   - SI COURSE : FC haute Z4-Z5 NORMALE pour performance, dérive acceptable si effort > 1h
   - SI ENTRAÎNEMENT : distribution zones selon objectif (endurance Z2, tempo Z3, fractionné Z4-Z5)
   - Dérive cardiaque : fatigue musculaire, déshydratation, effort trop long pour le niveau ?
   - FC cohérente avec allure : économie de course bonne ou mauvaise ?
   - Zones HR suspectes : trop de temps en zone rouge en ENTRAÎNEMENT = surentraînement

3. **CONTEXTE & CHARGE** (par rapport à l'historique 30j) :
   - Volume de cette séance vs moyenne habituelle : cohérent ?
   - SI COURSE : timing intelligent ? Affûté (volume réduit avant) ou fatigué (grosse semaine juste avant) ?
   - SI ENTRAÎNEMENT : après une grosse semaine ou période de repos ? Timing intelligent ?
   - Intensité : trop poussée pour le niveau actuel ? Ou bien dosée ?
   - Cette séance = progression logique OU erreur tactique ?

4. **PERFORMANCE & POINTS FAIBLES** (sois IMPITOYABLE mais JUSTE) :
   - SI COURSE : performance cohérente avec niveau ? Marge de progression identifiée ? Stratégie optimale ou erreurs de gestion ?
   - SI ENTRAÎNEMENT : objectif de séance respecté ? Erreurs techniques détectées (allure, FC, gestion)
   - Manques identifiés (pas assez de D+, trop de plat, manque de variété)
   - Risques à court terme : blessure, fatigue, surentraînement
   - Ce qui DOIT changer pour la prochaine fois

5. **CONSIGNES POUR LA SUITE** (PRÉCISES selon contexte) :
   - SI COURSE RÉCENTE : temps de récup nécessaire (2-7j selon distance), retour progressif, bilan de la perf
   - SI ENTRAÎNEMENT : prochaine séance (type, durée, allure cible, zones FC), récup nécessaire, interdictions
   - Objectif 2 semaines : où aller, volume cible, adaptations nécessaires

RÈGLES ABSOLUES :
- DÉTECTE le type de séance (COURSE ou ENTRAÎNEMENT) et ADAPTE l'analyse
- Sois FACTUEL et CHIFFRÉ (pas de "pas mal", donne des chiffres)
- Si c'est mauvais, DIS-LE sans détour
- Si c'est bon, ok, mais explique POURQUOI avec données
- SI COURSE : reconnais la performance si méritée, mais identifie les marges de progression
- SI ENTRAÎNEMENT : exige la rigueur, identifie les erreurs de gestion
- Analyse INTELLIGENTE : cherche les CAUSES derrière les chiffres

ANALYSE :`;

    // 7. Appeler Claude
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku: 4x moins cher, 3-5x plus rapide
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

    // Récupérer les 30 dernières activités pour analyse rapide
    const allActivitiesResult = await pool.query(`
      SELECT
        start_date,
        type,
        sport_type,
        distance/1000 as distance_km,
        moving_time/3600 as duration_hours,
        total_elevation_gain,
        average_heartrate,
        name
      FROM activities
      WHERE user_id = $1
      ORDER BY start_date DESC
      LIMIT 30
    `, [userId]);

    const allActivities = allActivitiesResult.rows;

    // Récupérer la FC max de l'utilisateur pour les zones
    const userResult = await pool.query(
      'SELECT max_heartrate FROM users WHERE id = $1',
      [userId]
    );
    const userMaxHR = userResult.rows[0].max_heartrate || 190;

    // Calculer les zones FC personnalisées
    const hrZones = {
      z1: { min: 0, max: Math.round(userMaxHR * 0.60), name: 'Récupération', percentage: '0-60%' },
      z2: { min: Math.round(userMaxHR * 0.60), max: Math.round(userMaxHR * 0.70), name: 'Endurance', percentage: '60-70%' },
      z3: { min: Math.round(userMaxHR * 0.70), max: Math.round(userMaxHR * 0.80), name: 'Tempo', percentage: '70-80%' },
      z4: { min: Math.round(userMaxHR * 0.80), max: Math.round(userMaxHR * 0.90), name: 'Seuil', percentage: '80-90%' },
      z5: { min: Math.round(userMaxHR * 0.90), max: userMaxHR, name: 'VO2max', percentage: '90-100%' },
    };

    // Séparer CAP et Vélo
    const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Trail'];
    const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide'];

    const runActivities = allActivities.filter(a => RUNNING_TYPES.includes(a.type));
    const rideActivities = allActivities.filter(a => CYCLING_TYPES.includes(a.type));

    // Calculer la charge par semaine (4 dernières semaines)
    const now = new Date();
    const weeklyLoads = [];

    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);

      const weekRuns = runActivities.filter(a => {
        const date = new Date(a.start_date);
        return date >= weekStart && date < weekEnd;
      });

      const weekRides = rideActivities.filter(a => {
        const date = new Date(a.start_date);
        return date >= weekStart && date < weekEnd;
      });

      weeklyLoads.unshift({
        week: `S-${4-week}`,
        runs: {
          count: weekRuns.length,
          km: weekRuns.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1),
          hours: weekRuns.reduce((sum, a) => sum + parseFloat(a.duration_hours || 0), 0).toFixed(1),
          d_plus: weekRuns.reduce((sum, a) => sum + parseFloat(a.total_elevation_gain || 0), 0).toFixed(0)
        },
        rides: {
          count: weekRides.length,
          km: weekRides.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1),
          hours: weekRides.reduce((sum, a) => sum + parseFloat(a.duration_hours || 0), 0).toFixed(1)
        }
      });
    }

    // Stats 7j, 30j, 1an - SÉPARÉES par sport
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const runs7d = runActivities.filter(a => new Date(a.start_date) >= sevenDaysAgo);
    const runs30d = runActivities.filter(a => new Date(a.start_date) >= thirtyDaysAgo);
    const runs365d = runActivities.filter(a => new Date(a.start_date) >= oneYearAgo);

    const rides7d = rideActivities.filter(a => new Date(a.start_date) >= sevenDaysAgo);
    const rides30d = rideActivities.filter(a => new Date(a.start_date) >= thirtyDaysAgo);
    const rides365d = rideActivities.filter(a => new Date(a.start_date) >= oneYearAgo);

    const profileData = {
      running: {
        week: {
          count: runs7d.length,
          km: runs7d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1),
          hours: runs7d.reduce((sum, a) => sum + parseFloat(a.duration_hours || 0), 0).toFixed(1),
          d_plus: runs7d.reduce((sum, a) => sum + parseFloat(a.total_elevation_gain || 0), 0).toFixed(0)
        },
        month: {
          count: runs30d.length,
          km: runs30d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1),
          hours: runs30d.reduce((sum, a) => sum + parseFloat(a.duration_hours || 0), 0).toFixed(1)
        },
        year: {
          count: runs365d.length,
          km: runs365d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1)
        },
        recent: runActivities.slice(0, 5).map(a => ({
          date: a.start_date,
          km: parseFloat(a.distance_km).toFixed(1),
          d_plus: a.total_elevation_gain,
          hr: a.average_heartrate
        }))
      },
      cycling: {
        week: {
          count: rides7d.length,
          km: rides7d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1),
          hours: rides7d.reduce((sum, a) => sum + parseFloat(a.duration_hours || 0), 0).toFixed(1)
        },
        month: {
          count: rides30d.length,
          km: rides30d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1)
        },
        year: {
          count: rides365d.length,
          km: rides365d.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0).toFixed(1)
        }
      },
      weekly_progression: weeklyLoads,
      hr_config: {
        max_hr: userMaxHR,
        zones: hrZones
      }
    };

    // Prompt ULTRA-INTELLIGENT pour analyse profonde
    const prompt = `Tu es le MEILLEUR coach sportif au monde. Analyse ULTRA-PROFONDE du profil de cet athlète.

DONNÉES COMPLÈTES (CAP ET VÉLO SÉPARÉS) :
${JSON.stringify(profileData, null, 2)}

TON RÔLE DE COACH EXPERT :
Tu dois détecter TOUS les patterns, anomalies, risques et opportunités. Sois ULTRA-EXIGEANT et FACTUEL.

ANALYSE OBLIGATOIRE ULTRA-DÉTAILLÉE :

1. **TENDANCES & PATTERNS** (analyse semaine par semaine) :
   - Détecter les PICS de charge : grosse semaine suivie d'une baisse ? C'est normal (récup) ou inquiétant (épuisement) ?
   - Irrégularités : volume erratique = mauvaise planification
   - Progression : +10% max/semaine respecté ? Ou augmentation dangereuse ?
   - Détecter sous-régime : trop peu de volume pour progresser

2. **CHARGE D'ENTRAÎNEMENT** (CAP + Vélo) :
   - Volume CAP vs Vélo : équilibre correct ou déséquilibré ?
   - Cumul total : surcharge globale même si un sport semble ok ?
   - Dénivelé CAP : trop, pas assez, cohérent avec le volume ?

3. **RÉGULARITÉ & FRÉQUENCE** :
   - Nombre de séances/semaine : suffisant ? Trop espacé ?
   - Longues pauses détectées ? Pourquoi ? Blessure probable ?
   - Constance : athlète régulier ou "yoyo" ?

4. **INTENSITÉ & RÉCUPÉRATION** :
   - FC moyenne : trop haute (surentraînement) ou basse (sous-régime) ?
   - Après un pic, récup suffisante ? Ou rechargé trop vite ?
   - Détecter fatigue chronique si FC élevée + volume important

4bis. **ZONES CARDIAQUES PERSONNALISÉES** (FC max configurée : ${userMaxHR} bpm) :
   - Z1 (${hrZones.z1.min}-${hrZones.z1.max} bpm) : Récupération - séances faciles, récup active
   - Z2 (${hrZones.z2.min}-${hrZones.z2.max} bpm) : Endurance fondamentale - base de l'entraînement
   - Z3 (${hrZones.z3.min}-${hrZones.z3.max} bpm) : Tempo - allure marathon
   - Z4 (${hrZones.z4.min}-${hrZones.z4.max} bpm) : Seuil - efforts soutenus
   - Z5 (${hrZones.z5.min}-${hrZones.z5.max} bpm) : VO2max - intervalles courts, max effort
   - ANALYSE : Trop de Z4-Z5 = surentraînement. Pas assez de Z2 = mauvaise base aérobie.

5. **RISQUES IDENTIFIÉS** (sois ALARMISTE si nécessaire) :
   - Blessure imminente ? (progression trop rapide, volume excessif)
   - Surentraînement ? (volume élevé, irrégularité, FC haute)
   - Sous-entraînement ? (trop peu de km, pas de progression)
   - Déséquilibre musculaire ? (que du plat, pas de D+)

6. **PLAN D'ACTION PRÉCIS** :
   - Semaine prochaine : X km CAP + Y km Vélo (CHIFFRES EXACTS)
   - Type de séances : endurance, fractionné, récup
   - AVERTISSEMENTS : ce qu'il NE FAUT PAS faire
   - Objectif 4 semaines : volume cible progressif

RÈGLES ABSOLUES :
- Ne mélange JAMAIS CAP et Vélo dans les chiffres
- Explique les CAUSES des patterns (ex: "Grosse semaine S-3 à 50km puis chute à 20km S-2 = récup normale OU épuisement ?")
- Si c'est dangereux, DIS-LE clairement
- Si c'est médiocre, DIS-LE
- Pas de compliments gratuits, seulement si vraiment mérité
- Donne des CHIFFRES PRÉCIS, pas du vague

ANALYSE :`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku: 4x moins cher, 3-5x plus rapide
      max_tokens: 1800,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysis = message.content[0].text;

    // Sauvegarder l'analyse dans l'historique
    await pool.query(
      `INSERT INTO profile_ai_analyses (user_id, analysis_text, profile_data, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, analysis, JSON.stringify(profileData)]
    );

    res.json({
      analysis,
      profile_data: profileData
    });

  } catch (error) {
    console.error('Error analyzing profile:', error);
    res.status(500).json({ error: 'Failed to analyze profile', details: error.message });
  }
});

// Récupérer l'historique des analyses de profil
router.get('/profile-history', async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT id, analysis_text, created_at
       FROM profile_ai_analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      history: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching profile analysis history:', error);
    res.status(500).json({ error: 'Failed to fetch profile analysis history' });
  }
});

// Récupérer une analyse de profil spécifique
router.get('/profile-history/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, analysis_text, profile_data, created_at
       FROM profile_ai_analyses
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile analysis:', error);
    res.status(500).json({ error: 'Failed to fetch profile analysis' });
  }
});

export default router;
