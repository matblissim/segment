-- Migration pour le système de challenges entre amis

-- Table des challenges
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenged_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric VARCHAR(20) NOT NULL CHECK (metric IN ('distance', 'elevation')),
    target_value DECIMAL NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined', 'cancelled')),
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT different_users CHECK (challenger_id != challenged_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

COMMENT ON TABLE challenges IS 'Challenges sportifs entre amis';
COMMENT ON COLUMN challenges.metric IS 'Type de métrique: distance (en mètres) ou elevation (en mètres)';
COMMENT ON COLUMN challenges.target_value IS 'Valeur cible en mètres';
COMMENT ON COLUMN challenges.status IS 'pending=en attente, active=accepté et en cours, completed=terminé, declined=refusé, cancelled=annulé';
COMMENT ON COLUMN challenges.winner_id IS 'ID du gagnant une fois le challenge terminé';
