-- Migration: Create training plans and sessions tables

-- Table des plans d'entraînement
CREATE TABLE IF NOT EXISTS training_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,

  -- Informations générales
  name VARCHAR(255) NOT NULL,
  goal_distance INTEGER, -- en mètres
  goal_elevation INTEGER DEFAULT 0, -- en mètres (pour trail)
  goal_date DATE NOT NULL,
  goal_pace INTEGER, -- en secondes/km (optionnel)
  race_type VARCHAR(50) DEFAULT 'route', -- route, trail, ultra

  -- Configuration du plan
  weeks_duration INTEGER NOT NULL, -- nombre de semaines
  sessions_per_week INTEGER NOT NULL, -- 3-6 séances
  available_days JSONB NOT NULL, -- [0,1,2,3,4,5,6] pour dim-sam
  cross_training JSONB DEFAULT '[]'::jsonb, -- ['cycling', 'swimming', 'crossfit', 'hyrox', 'strength']

  -- Niveau et données physiologiques
  user_level VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
  max_heart_rate INTEGER, -- FC max
  vma DECIMAL(4,1), -- VMA en km/h
  current_weekly_km INTEGER, -- volume hebdo actuel

  -- Contraintes et préférences
  constraints TEXT, -- blessures, limitations
  preferences JSONB DEFAULT '{}'::jsonb, -- préférences additionnelles

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed, archived

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des séances du plan
CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,

  -- Planification
  week_number INTEGER NOT NULL, -- 1-N
  day_of_week INTEGER NOT NULL, -- 0-6 (dimanche-samedi)
  session_date DATE, -- date calculée

  -- Type de séance
  session_type VARCHAR(50) NOT NULL,
  -- endurance, threshold, intervals, long_run, recovery, hill_repeats,
  -- fartlek, tempo, cross_training, rest, race_pace, speed_work

  -- Détails de la séance
  duration_minutes INTEGER,
  distance_km DECIMAL(5,2),
  description TEXT NOT NULL,

  -- Allures et intensité
  pace_min INTEGER, -- secondes/km (allure min)
  pace_max INTEGER, -- secondes/km (allure max)
  intensity_zone INTEGER, -- 1-5 (zones FC)
  elevation_gain INTEGER DEFAULT 0, -- D+ en mètres

  -- Cross-training
  cross_training_type VARCHAR(50), -- cycling, swimming, crossfit, hyrox, strength

  -- Complétion
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  actual_distance DECIMAL(5,2),
  actual_duration INTEGER,
  actual_pace INTEGER,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_training_plans_user_id ON training_plans(user_id);
CREATE INDEX idx_training_plans_event_id ON training_plans(event_id);
CREATE INDEX idx_training_plans_status ON training_plans(status);
CREATE INDEX idx_training_sessions_plan_id ON training_sessions(plan_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_week ON training_sessions(week_number);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_training_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_training_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER training_plans_updated_at
BEFORE UPDATE ON training_plans
FOR EACH ROW
EXECUTE FUNCTION update_training_plans_updated_at();

CREATE TRIGGER training_sessions_updated_at
BEFORE UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION update_training_sessions_updated_at();
