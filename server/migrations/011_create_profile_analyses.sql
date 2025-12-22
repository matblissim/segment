-- Créer la table pour l'historique des analyses de profil IA
CREATE TABLE IF NOT EXISTS profile_ai_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_text TEXT NOT NULL,
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour récupérer rapidement l'historique d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_profile_analyses_user_date
ON profile_ai_analyses(user_id, created_at DESC);

-- Index pour recherche par date
CREATE INDEX IF NOT EXISTS idx_profile_analyses_date
ON profile_ai_analyses(created_at DESC);
