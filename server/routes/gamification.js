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

// Types d'activités de course à pied acceptés
const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun', 'Trail'];
const CYCLING_TYPES = ['Ride', 'VirtualRide', 'EBikeRide'];

// Définition des badges Course à pied
const RUNNING_BADGES = [
  { id: 'semi_marathon', name: 'Semi-Marathon', description: 'Course de 21.1 km ou plus', sportType: 'running', threshold: 21100, excludeAbove: 42200 },
  { id: 'marathon', name: 'Marathon', description: 'Course de 42.2 km ou plus', sportType: 'running', threshold: 42200, excludeAbove: 100000 },
  { id: 'ultra_100k', name: '100 KM', description: 'Course de 100 km ou plus', sportType: 'running', threshold: 100000, excludeAbove: null },
  { id: 'week_100k', name: 'Semaine 100K+', description: 'Semaine avec 100+ km', sportType: 'running', threshold: 100000, weekly: true, metric: 'distance' },
  { id: 'week_150k', name: 'Semaine 150K+', description: 'Semaine avec 150+ km', sportType: 'running', threshold: 150000, weekly: true, metric: 'distance' },
  { id: 'week_200k', name: 'Semaine 200K+', description: 'Semaine avec 200+ km', sportType: 'running', threshold: 200000, weekly: true, metric: 'distance' },
  { id: 'week_5kd', name: 'Semaine 5000D+', description: 'Semaine avec 5000m de dénivelé', sportType: 'running', threshold: 5000, weekly: true, metric: 'elevation' },
  { id: 'week_10kd', name: 'Semaine 10000D+', description: 'Semaine avec 10000m de dénivelé', sportType: 'running', threshold: 10000, weekly: true, metric: 'elevation' },
];

// Définition des badges Vélo
const CYCLING_BADGES = [
  { id: 'ride_100k', name: 'Sortie 100K', description: 'Sortie vélo de 100 km ou plus', sportType: 'cycling', threshold: 100000, excludeAbove: 160000 },
  { id: 'ride_160k', name: 'Sortie 160K+', description: 'Sortie vélo de 160 km ou plus', sportType: 'cycling', threshold: 160000, excludeAbove: null },
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

  console.log('\n========================================');
  console.log('🚀 CALCULATE-STATS APPELÉ:', new Date().toISOString());
  console.log('Nombre d\'activités reçues:', activities ? activities.length : 0);
  console.log('Type de activities:', typeof activities, Array.isArray(activities));
  if (activities && activities.length > 0) {
    console.log('Première activité - distance:', activities[0].distance, typeof activities[0].distance);
  }
  console.log('========================================\n');

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

  // Fonction générique pour calculer les badges
  const calculateBadges = (badgeList, activityTypes) => {
    const filteredActivities = activities.filter(a => activityTypes.includes(a.type));

    // Debug: vérifier la structure des activités
    if (badgeList.some(b => b.id === 'week_100k') && filteredActivities.length > 0) {
      console.log('\n🔍 DEBUG Activités reçues:');
      console.log('Nombre total activités:', activities.length);
      console.log('Activités running filtrées:', filteredActivities.length);
      console.log('Exemple d\'activité (première):');
      const sample = filteredActivities[0];
      console.log('  - id:', sample.id);
      console.log('  - type:', sample.type);
      console.log('  - distance:', sample.distance, typeof sample.distance);
      console.log('  - total_elevation_gain:', sample.total_elevation_gain);
      console.log('  - start_date:', sample.start_date);
      console.log('  - Toutes les clés:', Object.keys(sample).join(', '));
    }

    return badgeList.map(badge => {
      let matchingActivities = [];
      let count = 0;

      if (badge.weekly) {
        // Badge hebdomadaire: grouper par semaine (lundi-dimanche)
        const weekGroups = {};

        filteredActivities.forEach(activity => {
          const date = new Date(activity.start_date);
          // Calculer le lundi de la semaine
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(date);
          monday.setDate(diff);
          const weekKey = monday.toISOString().split('T')[0];

          if (!weekGroups[weekKey]) {
            weekGroups[weekKey] = { distance: 0, elevation: 0, activities: [], weekStart: weekKey };
          }
          weekGroups[weekKey].distance += activity.distance || 0;
          weekGroups[weekKey].elevation += activity.total_elevation_gain || 0;
          weekGroups[weekKey].activities.push(activity);
        });

        // Debug pour badge Semaine 100K+
        if (badge.id === 'week_100k') {
          console.log('\n🔍 DEBUG Badge Semaine 100K+:');
          console.log('Total activités running filtrées:', filteredActivities.length);
          console.log('Semaines avec distances:');
          Object.values(weekGroups).forEach(week => {
            const distKm = Math.round(week.distance / 1000 * 10) / 10;
            console.log(`  ${week.weekStart}: ${distKm} km (${week.activities.length} activités)`);
          });
        }

        // Filtrer les semaines selon la métrique (distance ou dénivelé)
        const metric = badge.metric || 'distance';
        matchingActivities = Object.values(weekGroups)
          .filter(week => week[metric] >= badge.threshold)
          .flatMap(week => week.activities);

        count = Object.values(weekGroups).filter(week => week[metric] >= badge.threshold).length;

        // Debug pour badge Semaine 100K+
        if (badge.id === 'week_100k') {
          console.log('Seuil (threshold):', badge.threshold, 'mètres');
          console.log('Semaines qualifiantes:', count);
          console.log('');
        }
      } else {
        // Badge par activité individuelle
        matchingActivities = filteredActivities.filter(activity => {
          const distance = activity.distance || 0;

          // Vérifier si l'activité est dans la plage de ce badge
          if (distance < badge.threshold) return false;

          // Exclure si au-dessus du seuil supérieur (éviter le double comptage)
          if (badge.excludeAbove && distance >= badge.excludeAbove) return false;

          return true;
        });

        count = matchingActivities.length;
      }

      return {
        ...badge,
        count,
        earned: count > 0,
        activities: matchingActivities.map(a => ({
          id: a.id,
          name: a.name,
          distance: a.distance,
          elevation: a.total_elevation_gain,
          start_date: a.start_date,
          type: a.type,
          city: a.start_city || a.location_city || a.timezone?.split('/')[1] || 'Non spécifiée'
        }))
      };
    });
  };

  // Calculer les badges pour chaque type de sport
  const runningBadges = calculateBadges(RUNNING_BADGES, RUNNING_TYPES);
  const cyclingBadges = calculateBadges(CYCLING_BADGES, CYCLING_TYPES);
  const allBadges = [...runningBadges, ...cyclingBadges];

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
    badges: allBadges,
    runningBadges,
    cyclingBadges,
    challenges: challengeProgress,
    totalBadges: allBadges.filter(b => b.earned).length,
    totalChallengesCompleted: challengeProgress.filter(c => c.completed).length
  });
});

// Obtenir tous les badges disponibles
router.get('/badges', (req, res) => {
  res.json({
    running: RUNNING_BADGES,
    cycling: CYCLING_BADGES,
    all: [...RUNNING_BADGES, ...CYCLING_BADGES]
  });
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
