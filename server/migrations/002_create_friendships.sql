-- Migration: Système d'amis
-- Créer la table des relations d'amitié

CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, blocked
    requested_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    CHECK (user_id != friend_id), -- Un utilisateur ne peut pas être ami avec lui-même
    UNIQUE(user_id, friend_id) -- Éviter les doublons
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Vue pour obtenir facilement les amis acceptés (relation bidirectionnelle)
CREATE OR REPLACE VIEW friends_list AS
SELECT
    f.id,
    f.user_id,
    f.friend_id,
    u.username as friend_username,
    u.strava_id as friend_strava_id,
    f.accepted_at
FROM friendships f
JOIN users u ON u.id = f.friend_id
WHERE f.status = 'accepted'
UNION
SELECT
    f.id,
    f.friend_id as user_id,
    f.user_id as friend_id,
    u.username as friend_username,
    u.strava_id as friend_strava_id,
    f.accepted_at
FROM friendships f
JOIN users u ON u.id = f.user_id
WHERE f.status = 'accepted';
