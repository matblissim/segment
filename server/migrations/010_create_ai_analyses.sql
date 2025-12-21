-- Migration pour stocker les analyses IA des activités

CREATE TABLE IF NOT EXISTS activity_ai_analyses (
    id SERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(activity_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_activity ON activity_ai_analyses(activity_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON activity_ai_analyses(user_id);

-- Ajouter max_heartrate à la table users si pas déjà présent
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_heartrate INTEGER DEFAULT 190;

COMMENT ON TABLE activity_ai_analyses IS 'Analyses IA générées par Claude pour chaque activité';
COMMENT ON COLUMN users.max_heartrate IS 'FC max de l''utilisateur pour calcul des zones (défaut 190)';
