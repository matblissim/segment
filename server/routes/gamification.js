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

// Définition des badges
const BADGES = [
  // Distance
  { id: 'first_km', name: 'Premier Kilomètre', description: 'Parcourir 1 km', icon: '🏃', condition: (stats) => stats.totalDistance >= 1000 },
  { id: 'marathon', name: 'Marathon', description: 'Parcourir 42 km en une activité', icon: '🏅', condition: (stats) => stats.longestDistance >= 42000 },
  { id: 'century', name: 'Century', description: 'Parcourir 100 km en une activité', icon: '💯', condition: (stats) => stats.longestDistance >= 100000 },
  { id: 'explorer', name: 'Explorateur', description: 'Parcourir 1000 km au total', icon: '🗺️', condition: (stats) => stats.totalDistance >= 1000000 },

  // Élévation
  { id: 'climber', name: 'Grimpeur', description: 'Cumuler 1000m de dénivelé', icon: '⛰️', condition: (stats) => stats.totalElevation >= 1000 },
  { id: 'mountain_king', name: 'Roi des Montagnes', description: 'Cumuler 10000m de dénivelé', icon: '👑', condition: (stats) => stats.totalElevation >= 10000 },

  // Régularité
  { id: 'consistent', name: 'Régulier', description: 'Faire 7 activités en 7 jours', icon: '📅', condition: (stats) => stats.sevenDayStreak },
  { id: 'dedicated', name: 'Dévoué', description: 'Faire 30 activités au total', icon: '💪', condition: (stats) => stats.totalActivities >= 30 },

  // Vitesse
  { id: 'speed_demon', name: 'Démon de Vitesse', description: 'Atteindre 40 km/h en moyenne', icon: '⚡', condition: (stats) => stats.topSpeed >= 40 },

  // Points
  { id: 'points_1k', name: 'Apprenti', description: 'Atteindre 1000 points', icon: '🌟', condition: (stats) => stats.totalPoints >= 1000 },
  { id: 'points_5k', name: 'Expert', description: 'Atteindre 5000 points', icon: '✨', condition: (stats) => stats.totalPoints >= 5000 },
  { id: 'points_10k', name: 'Maître', description: 'Atteindre 10000 points', icon: '🏆', condition: (stats) => stats.totalPoints >= 10000 },
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

  // Calculer les badges obtenus
  const earnedBadges = BADGES.filter(badge => badge.condition(stats));

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
    badges: earnedBadges,
    challenges: challengeProgress,
    totalBadges: earnedBadges.length,
    totalChallengesCompleted: challengeProgress.filter(c => c.completed).length
  });
});

// Obtenir tous les badges disponibles
router.get('/badges', (req, res) => {
  res.json(BADGES);
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
