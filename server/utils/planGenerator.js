/**
 * Training Plan Generator - Algorithme intelligent de génération de plans d'entraînement
 * Prend en compte : niveau, objectif, disponibilités, physiologie, type de course
 */

/**
 * Génère un plan d'entraînement complet et personnalisé
 */
export function generateTrainingPlan(config) {
  const {
    goalDistance, // en km
    goalElevation, // en mètres (pour trail)
    goalDate,
    goalPace, // en sec/km (optionnel)
    raceType, // 'route', 'trail', 'ultra'
    weeksDuration,
    sessionsPerWeek,
    availableDays, // [0,1,2,3,4,5,6]
    crossTraining, // ['cycling', 'swimming', etc.]
    userLevel, // 'beginner', 'intermediate', 'advanced', 'expert'
    maxHeartRate,
    vma, // km/h
    currentWeeklyKm,
  } = config;

  // Calculer les zones d'allure et FC
  const zones = calculateTrainingZones(maxHeartRate, vma, goalPace);

  // Déterminer la périodisation
  const phases = calculatePeriodization(weeksDuration, userLevel);

  // Générer les semaines
  const sessions = [];
  let weeklyKm = currentWeeklyKm || estimateStartingVolume(goalDistance, userLevel);

  for (let week = 1; week <= weeksDuration; week++) {
    const phase = determinePhase(week, phases);
    const isRecoveryWeek = isRecoveryWeekNeeded(week, userLevel);

    // Ajuster le volume
    if (!isRecoveryWeek && week < weeksDuration - 2) {
      weeklyKm = Math.min(weeklyKm * 1.08, goalDistance * 2.5); // Max 10% increase, cap à 2.5x la distance objectif
    } else if (isRecoveryWeek) {
      weeklyKm *= 0.7; // -30% sur semaine récup
    } else if (week >= weeksDuration - 2) {
      weeklyKm *= 0.6; // Affûtage: -40%
    }

    const weekSessions = generateWeekSessions({
      week,
      phase,
      weeklyKm,
      goalDistance,
      goalElevation,
      raceType,
      sessionsPerWeek,
      availableDays,
      crossTraining,
      userLevel,
      zones,
      isRecoveryWeek,
      isLastWeek: week === weeksDuration,
      goalPace,
    });

    sessions.push(...weekSessions);
  }

  return sessions;
}

/**
 * Calcule les zones d'entraînement (FC et allure)
 */
function calculateTrainingZones(maxHR, vma, goalPace) {
  const zones = {
    hr: {},
    pace: {},
  };

  if (maxHR) {
    zones.hr = {
      z1: { min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), name: 'Récupération' },
      z2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), name: 'Endurance' },
      z3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), name: 'Tempo' },
      z4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), name: 'Seuil' },
      z5: { min: Math.round(maxHR * 0.90), max: maxHR, name: 'VMA' },
    };
  }

  if (vma) {
    // Calcul allures en sec/km
    const vmaSecPerKm = (60 * 60) / vma; // Conversion VMA en sec/km
    zones.pace = {
      recovery: Math.round(vmaSecPerKm * 1.4), // 70% VMA
      easy: Math.round(vmaSecPerKm * 1.25), // 80% VMA
      marathon: Math.round(vmaSecPerKm * 1.11), // 90% VMA
      threshold: Math.round(vmaSecPerKm * 1.05), // 95% VMA
      vma: Math.round(vmaSecPerKm), // 100% VMA
    };
  }

  if (goalPace) {
    zones.pace.goal = goalPace;
  }

  return zones;
}

/**
 * Calcule la périodisation (phases du plan)
 */
function calculatePeriodization(weeks, level) {
  // Affûtage : 2 dernières semaines
  const taperWeeks = 2;
  const buildWeeks = weeks - taperWeeks;

  // Phase de base vs intensité selon niveau
  const basePhaseRatio = {
    beginner: 0.7, // 70% base
    intermediate: 0.6,
    advanced: 0.5,
    expert: 0.5,
  }[level] || 0.6;

  const baseWeeks = Math.floor(buildWeeks * basePhaseRatio);
  const buildIntenseWeeks = buildWeeks - baseWeeks;

  return {
    base: { start: 1, end: baseWeeks },
    intense: { start: baseWeeks + 1, end: baseWeeks + buildIntenseWeeks },
    taper: { start: weeks - taperWeeks + 1, end: weeks },
  };
}

/**
 * Détermine la phase actuelle
 */
function determinePhase(week, phases) {
  if (week >= phases.taper.start) return 'taper';
  if (week >= phases.intense.start) return 'intense';
  return 'base';
}

/**
 * Semaine de récupération tous les 3-4 semaines
 */
function isRecoveryWeekNeeded(week, level) {
  const recoveryInterval = {
    beginner: 3,
    intermediate: 3,
    advanced: 4,
    expert: 4,
  }[level] || 3;

  return week % recoveryInterval === 0 && week > 2;
}

/**
 * Estime le volume de départ selon objectif et niveau
 */
function estimateStartingVolume(goalDistance, level) {
  const baseVolumes = {
    beginner: goalDistance * 0.4,
    intermediate: goalDistance * 0.6,
    advanced: goalDistance * 0.8,
    expert: goalDistance * 1.0,
  };
  return baseVolumes[level] || baseVolumes.intermediate;
}

/**
 * Génère les séances d'une semaine
 */
function generateWeekSessions(config) {
  const {
    week,
    phase,
    weeklyKm,
    goalDistance,
    goalElevation,
    raceType,
    sessionsPerWeek,
    availableDays,
    crossTraining,
    userLevel,
    zones,
    isRecoveryWeek,
    isLastWeek,
    goalPace,
  } = config;

  const sessions = [];
  const isTrail = raceType === 'trail';
  const elevationPerKm = goalElevation / goalDistance;
  const isHillyTrail = elevationPerKm > 40; // > 40m D+/km

  // Calculer la distance de la sortie longue (25-35% du volume hebdo)
  const longRunDistance = Math.min(weeklyKm * 0.30, goalDistance * 1.1);

  // Répartir le volume sur les séances
  const sessionDistances = distributeWeeklyVolume(weeklyKm, sessionsPerWeek, longRunDistance);

  // Sélectionner les jours de la semaine (prioriser espacement)
  const selectedDays = selectTrainingDays(availableDays, sessionsPerWeek);

  // Séance longue toujours le week-end si disponible
  const longRunDay = selectedDays.includes(0) ? 0 : selectedDays.includes(6) ? 6 : selectedDays[selectedDays.length - 1];

  selectedDays.forEach((day, index) => {
    let session;

    // Dernière semaine : affûtage spécifique
    if (isLastWeek) {
      if (day === longRunDay) {
        session = createTaperLongRun(day, goalDistance, zones, isTrail);
      } else if (index === selectedDays.length - 3) {
        session = createRacePreparation(day, goalPace, zones, goalDistance);
      } else {
        session = createRecoveryRun(day, sessionDistances[index], zones);
      }
    }
    // Sortie longue
    else if (day === longRunDay) {
      session = createLongRun(day, longRunDistance, phase, zones, isTrail, goalElevation, week);
    }
    // Séance de qualité selon phase
    else if (index === 1 || (sessionsPerWeek >= 4 && index === 3)) {
      // 1-2 séances de qualité selon le nombre total
      if (phase === 'base') {
        session = isHillyTrail
          ? createHillSession(day, sessionDistances[index], zones, userLevel)
          : createTempoRun(day, sessionDistances[index], zones, userLevel);
      } else if (phase === 'intense') {
        // Alterner VMA et seuil
        session = week % 2 === 0
          ? createIntervalSession(day, sessionDistances[index], zones, userLevel, isTrail)
          : createThresholdRun(day, sessionDistances[index], zones, userLevel);
      } else {
        // Taper : maintien intensité, faible volume
        session = createTaperQualityRun(day, sessionDistances[index], zones, goalPace);
      }
    }
    // Cross-training si demandé
    else if (crossTraining.length > 0 && index === 2 && sessionsPerWeek >= 4) {
      const crossType = crossTraining[0]; // Prendre le premier
      session = createCrossTrainingSession(day, crossType, sessionDistances[index]);
    }
    // Endurance fondamentale (EF)
    else {
      session = createEasyRun(day, sessionDistances[index], zones, isRecoveryWeek);
    }

    sessions.push({
      ...session,
      week_number: week,
    });
  });

  return sessions;
}

/**
 * Répartit le volume hebdomadaire sur les séances
 */
function distributeWeeklyVolume(weeklyKm, sessionsCount, longRunKm) {
  const remaining = weeklyKm - longRunKm;
  const otherSessions = sessionsCount - 1;
  const avgOther = remaining / otherSessions;

  const distances = [longRunKm];
  for (let i = 0; i < otherSessions; i++) {
    // Varier légèrement les distances
    distances.push(avgOther * (0.8 + Math.random() * 0.4));
  }

  return distances.sort((a, b) => b - a); // Décroissant
}

/**
 * Sélectionne les jours d'entraînement (bien espacés)
 */
function selectTrainingDays(available, count) {
  if (available.length <= count) return available;

  const selected = [];
  const interval = Math.floor(available.length / count);

  for (let i = 0; i < count; i++) {
    const index = Math.min(i * interval, available.length - 1);
    selected.push(available[index]);
  }

  return selected.sort((a, b) => a - b);
}

// ========== Création des différents types de séances ==========

function createLongRun(day, distance, phase, zones, isTrail, goalElevation, week) {
  const elevation = isTrail ? Math.round((goalElevation / 12) * Math.min(week / 8, 1)) : 0;

  return {
    day_of_week: day,
    session_type: 'long_run',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 10) * 60), // Estimation 10km/h
    elevation_gain: elevation,
    description: `Sortie longue en endurance${isTrail && elevation > 0 ? ` avec ${elevation}m D+` : ''}. Rester en aisance respiratoire.`,
    pace_min: zones.pace?.easy ? zones.pace.easy + 20 : null,
    pace_max: zones.pace?.easy ? zones.pace.easy - 10 : null,
    intensity_zone: 2,
  };
}

function createEasyRun(day, distance, zones, isRecovery) {
  return {
    day_of_week: day,
    session_type: isRecovery ? 'recovery' : 'endurance',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 10) * 60),
    description: isRecovery
      ? 'Course de récupération très facile. Conversation aisée.'
      : 'Endurance fondamentale. Allure confortable, respiration facile.',
    pace_min: zones.pace?.recovery || zones.pace?.easy,
    pace_max: zones.pace?.easy,
    intensity_zone: isRecovery ? 1 : 2,
  };
}

function createIntervalSession(day, baseDistance, zones, level, isTrail) {
  const intervals = {
    beginner: '8-10 x 400m',
    intermediate: '10-12 x 400m',
    advanced: '12-15 x 400m',
    expert: '15-20 x 400m',
  }[level] || '10 x 400m';

  return {
    day_of_week: day,
    session_type: 'intervals',
    distance_km: parseFloat((baseDistance * 1.2).toFixed(1)),
    duration_minutes: Math.round((baseDistance / 12) * 60) + 30,
    description: `Échauffement 2km facile → ${intervals} à allure VMA (récup 1min trot) → Retour au calme 2km`,
    pace_min: zones.pace?.vma - 5,
    pace_max: zones.pace?.vma + 5,
    intensity_zone: 5,
  };
}

function createThresholdRun(day, distance, zones, level) {
  const duration = {
    beginner: '2 x 10min',
    intermediate: '2 x 15min',
    advanced: '3 x 12min',
    expert: '30-40min continu',
  }[level] || '2 x 12min';

  return {
    day_of_week: day,
    session_type: 'threshold',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 11) * 60),
    description: `Échauffement 2km → ${duration} au seuil (récup 3min) → Retour au calme 2km. Allure "difficile mais tenable".`,
    pace_min: zones.pace?.threshold - 5,
    pace_max: zones.pace?.threshold + 5,
    intensity_zone: 4,
  };
}

function createTempoRun(day, distance, zones, level) {
  return {
    day_of_week: day,
    session_type: 'tempo',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 11) * 60),
    description: 'Sortie tempo : 2km facile → ' + Math.round(distance - 4) + 'km allure marathon/semi → 2km facile',
    pace_min: zones.pace?.marathon - 10,
    pace_max: zones.pace?.marathon + 10,
    intensity_zone: 3,
  };
}

function createHillSession(day, distance, zones, level) {
  const repeats = {
    beginner: '6-8',
    intermediate: '8-10',
    advanced: '10-12',
    expert: '12-15',
  }[level] || '8';

  return {
    day_of_week: day,
    session_type: 'hill_repeats',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 9) * 60),
    elevation_gain: 300,
    description: `Échauffement plat 2km → ${repeats} côtes de 1-2min (récup descente) → Retour au calme`,
    intensity_zone: 4,
  };
}

function createCrossTrainingSession(day, type, distance) {
  const activities = {
    cycling: {
      desc: 'Vélo en endurance fondamentale',
      duration: Math.round(distance * 6),
      dist: distance * 2.5,
    },
    swimming: {
      desc: 'Natation technique avec éducatifs',
      duration: Math.round(distance * 7),
      dist: distance * 0.25,
    },
    crossfit: {
      desc: 'CrossFit : focus mobilité et renforcement',
      duration: 45,
      dist: 0,
    },
    hyrox: {
      desc: 'HYROX simulation : stations + course',
      duration: 60,
      dist: distance * 0.5,
    },
    strength: {
      desc: 'Renforcement musculaire général + gainage',
      duration: 45,
      dist: 0,
    },
  };

  const activity = activities[type] || activities.cycling;

  return {
    day_of_week: day,
    session_type: 'cross_training',
    cross_training_type: type,
    distance_km: activity.dist,
    duration_minutes: activity.duration,
    description: activity.desc,
    intensity_zone: 2,
  };
}

function createTaperQualityRun(day, distance, zones, goalPace) {
  return {
    day_of_week: day,
    session_type: 'race_pace',
    distance_km: parseFloat((distance * 0.6).toFixed(1)),
    duration_minutes: 40,
    description: '2km facile → 3-4km à allure objectif → 2km facile. Sensations, pas fatigue.',
    pace_min: goalPace ? goalPace - 5 : zones.pace?.goal,
    pace_max: goalPace ? goalPace + 5 : zones.pace?.goal,
    intensity_zone: 3,
  };
}

function createTaperLongRun(day, goalDistance, zones, isTrail) {
  const distance = Math.min(goalDistance * 0.6, 15);

  return {
    day_of_week: day,
    session_type: 'long_run',
    distance_km: parseFloat(distance.toFixed(1)),
    duration_minutes: Math.round((distance / 10) * 60),
    description: 'Dernière sortie longue courte. Rester frais, allure facile.',
    pace_min: zones.pace?.easy + 15,
    pace_max: zones.pace?.easy,
    intensity_zone: 2,
  };
}

function createRacePreparation(day, goalPace, zones, goalDistance) {
  return {
    day_of_week: day,
    session_type: 'race_pace',
    distance_km: 8,
    duration_minutes: 50,
    description: 'Rappel allure : 2km facile → 4-5km à allure objectif → 2km facile',
    pace_min: goalPace ? goalPace - 3 : zones.pace?.goal,
    pace_max: goalPace ? goalPace + 3 : zones.pace?.goal,
    intensity_zone: 3,
  };
}

function createRecoveryRun(day, distance, zones) {
  return {
    day_of_week: day,
    session_type: 'recovery',
    distance_km: parseFloat((distance * 0.5).toFixed(1)),
    duration_minutes: 30,
    description: 'Footing de récupération très léger',
    pace_min: zones.pace?.recovery + 10,
    pace_max: zones.pace?.recovery,
    intensity_zone: 1,
  };
}
