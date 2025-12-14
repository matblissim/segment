-- Script d'initialisation de la base de données PostgreSQL
-- Pour une architecture scalable avec index optimisés

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    strava_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    profile_photo VARCHAR(500),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50) DEFAULT 'pending'
);

-- Index pour recherche rapide par strava_id
CREATE INDEX IF NOT EXISTS idx_users_strava_id ON users(strava_id);

-- Table des activités
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strava_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(500),
    type VARCHAR(100) NOT NULL,
    sport_type VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    distance NUMERIC(10, 2),
    moving_time INTEGER,
    elapsed_time INTEGER,
    total_elevation_gain NUMERIC(10, 2),
    average_speed NUMERIC(10, 2),
    max_speed NUMERIC(10, 2),
    average_heartrate NUMERIC(10, 2),
    max_heartrate NUMERIC(10, 2),
    kudos_count INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON activities(strava_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, start_date DESC);

-- Index composite pour les stats par utilisateur/type/date
CREATE INDEX IF NOT EXISTS idx_activities_user_type_date ON activities(user_id, type, start_date DESC);

-- Table pour les stats pré-calculées (cache DB)
CREATE TABLE IF NOT EXISTS stats_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key VARCHAR(255) NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cache_key)
);

-- Index pour invalidation du cache
CREATE INDEX IF NOT EXISTS idx_stats_cache_expires ON stats_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_stats_cache_user_key ON stats_cache(user_id, cache_key);

-- Table pour les jobs de synchronisation (tracking)
CREATE TABLE IF NOT EXISTS sync_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_activities INTEGER DEFAULT 0,
    processed_activities INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
