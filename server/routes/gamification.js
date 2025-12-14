import express from 'express';

const router = express.Router();

// Système de calcul des points basé sur les activités
const calculatePoints = (activity) => {
  let points = 0;

  // Points de base selon la distance (en km)
  const distanceKm = activity.distance / 1000;
  points += Math.floor(distanceKm * 10); // 10 points par km

  // Bonus pour l'élévation (en m)
  if (activity.total_elevation_gain) {
    points += Math.floor(activity.total_elevation_gain / 10); // 1 point par 10m d'élévation
  }

  // Bonus pour la vitesse moyenne (si > 25 km/h pour vélo, > 12 km/h pour course)
  const speedKmh = (distanceKm / (activity.moving_time / 3600));
  if (activity.type === 'Ride' && speedKmh > 25) {
    points += 50; // Bonus vitesse vélo
  } else if (activity.type === 'Run' && speedKmh > 12) {
    points += 50; // Bonus vitesse course
  }

  // Bonus pour les longues sorties (> 2h)
  if (activity.moving_time > 7200) {
    points += 100; // Bonus endurance
  }

  return points;
};

// Définition des badges (basés sur comptage d'activités)
const DISTANCE_BADGES = [
  { id: 'semi_marathon', name: 'Semi-Marathon', description: 'Activités de 21.1 km ou plus', icon: '🏃', threshold: 21100, excludeAbove: 42200 },
  { id: 'marathon', name: 'Marathon', description: 'Activités de 42.2 km ou plus', icon: '🏅', threshold: 42200, excludeAbove: 100000 },
  { id: 'ultra_100k', name: '100 KM', description: 'Activités de 100 km ou plus', icon: '💯', threshold: 100000, excludeAbove: null },
];

// Définition des challenges
const CHALLENGES = [
  {
    id: 'weekly_warrior',
    name: 'Guerrier Hebdomadaire',
    description: 'Parcourir 100 km cette semaine',
    icon: '⚔️',
    target: 100000,
    type: 'weekly',
    reward: 500
  },
  {
    id: 'monthly_marathon',
    name: 'Marathon Mensuel',
    description: 'Parcourir 500 km ce mois',
    icon: '📆',
    target: 500000,
    type: 'monthly',
    reward: 2000
  },
  {
    id: 'elevation_master',
    name: 'Maître de l\'Élévation',
    description: 'Cumuler 5000m de dénivelé ce mois',
    icon: '🏔️',
    target: 5000,
    type: 'monthly',
    reward: 1500
  },
  {
    id: 'speed_challenge',
    name: 'Défi Vitesse',
    description: 'Maintenir une moyenne > 30 km/h sur 50 km',
    icon: '🚴',
    target: 30,
    type: 'single',
    reward: 1000
  }
];

// Calculer les statistiques à partir des activités
router.post('/calculate-stats', (req, res) => {
  const { activities } = req.body;

  if (!activities || !Array.isArray(activities)) {
    return res.status(400).json({ error: 'Activities array required' });
  }

  // Calculer les stats
  let stats = {
    totalDistance: 0,
    totalElevation: 0,
    totalActivities: activities.length,
    totalPoints: 0,
    longestDistance: 0,
    topSpeed: 0,
    sevenDayStreak: false
  };

  activities.forEach(activity => {
    stats.totalDistance += activity.distance || 0;
    stats.totalElevation += activity.total_elevation_gain || 0;
    stats.totalPoints += calculatePoints(activity);

    if (activity.distance > stats.longestDistance) {
      stats.longestDistance = activity.distance;
    }

    const speedKmh = ((activity.distance / 1000) / (activity.moving_time / 3600));
    if (speedKmh > stats.topSpeed) {
      stats.topSpeed = speedKmh;
    }
  });

  // Vérifier le streak de 7 jours
  if (activities.length >= 7) {
    const dates = activities.map(a => new Date(a.start_date).toDateString());
    const uniqueDates = [...new Set(dates)];
    if (uniqueDates.length >= 7) {
      stats.sevenDayStreak = true;
    }
  }

  // Calculer les badges de distance (avec comptage et liste des activités)
  const distanceBadges = DISTANCE_BADGES.map(badge => {
    const matchingActivities = activities.filter(activity => {
      const distance = activity.distance || 0;

      // Vérifier si l'activité est dans la plage de ce badge
      if (distance < badge.threshold) return false;

      // Exclure si au-dessus du seuil supérieur (éviter le double comptage)
      if (badge.excludeAbove && distance >= badge.excludeAbove) return false;

      return true;
    });

    return {
      ...badge,
      count: matchingActivities.length,
      earned: matchingActivities.length > 0,
      activities: matchingActivities.map(a => ({
        id: a.id,
        name: a.name,
        distance: a.distance,
        start_date: a.start_date,
        type: a.type
      }))
    };
  });

  // Calculer la progression des challenges
  const challengeProgress = CHALLENGES.map(challenge => {
    let progress = 0;
    let completed = false;

    if (challenge.type === 'weekly' || challenge.type === 'monthly') {
      // Pour les challenges de distance
      if (challenge.id.includes('elevation')) {
        progress = (stats.totalElevation / challenge.target) * 100;
        completed = stats.totalElevation >= challenge.target;
      } else {
        progress = (stats.totalDistance / challenge.target) * 100;
        completed = stats.totalDistance >= challenge.target;
      }
    } else if (challenge.id === 'speed_challenge') {
      // Challenge de vitesse
      const speedActivities = activities.filter(a => {
        const distKm = a.distance / 1000;
        const speedKmh = (distKm / (a.moving_time / 3600));
        return distKm >= 50 && speedKmh >= challenge.target;
      });
      completed = speedActivities.length > 0;
      progress = completed ? 100 : 0;
    }

    return {
      ...challenge,
      progress: Math.min(progress, 100),
      completed
    };
  });

  res.json({
    stats,
    badges: distanceBadges,
    challenges: challengeProgress,
    totalBadges: distanceBadges.filter(b => b.earned).length,
    totalChallengesCompleted: challengeProgress.filter(c => c.completed).length
  });
});

// Obtenir tous les badges disponibles
router.get('/badges', (req, res) => {
  res.json(DISTANCE_BADGES);
});

// Obtenir tous les challenges disponibles
router.get('/challenges', (req, res) => {
  res.json(CHALLENGES);
});

// Calculer le classement (leaderboard)
router.post('/leaderboard', (req, res) => {
  const { users } = req.body;

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Users array required' });
  }

  // Trier par points
  const leaderboard = users
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));

  res.json(leaderboard);
});

export default router;
