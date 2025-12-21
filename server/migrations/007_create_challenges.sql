-- Migration pour le système de challenges entre amis
-- Système "premier arrivé, premier gagnant" : pas de date de fin fixe

-- Table des challenges
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenged_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric VARCHAR(20) NOT NULL CHECK (metric IN ('distance', 'elevation')),
    target_value DECIMAL NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- Optionnel, par défaut start_date + 30 jours si non spécifié
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'cancelled')),
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP, -- Date à laquelle le gagnant a atteint l'objectif
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

COMMENT ON TABLE challenges IS 'Challenges sportifs entre amis - premier arrivé, premier gagnant';
COMMENT ON COLUMN challenges.metric IS 'Type de métrique: distance (en mètres) ou elevation (en mètres)';
COMMENT ON COLUMN challenges.target_value IS 'Valeur cible en mètres';
COMMENT ON COLUMN challenges.end_date IS 'Date de fin optionnelle, par défaut 30 jours après start_date';
COMMENT ON COLUMN challenges.status IS 'pending=en attente, active=accepté et en cours, completed=terminé, declined=refusé, cancelled=annulé';
COMMENT ON COLUMN challenges.winner_id IS 'ID du gagnant (premier à atteindre l''objectif)';
COMMENT ON COLUMN challenges.completed_at IS 'Date et heure à laquelle le gagnant a atteint l''objectif';
