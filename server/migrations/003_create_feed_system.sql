-- Migration pour le système de Feed
-- Cette migration crée les tables pour le feed social, likes, commentaires et notifications

-- Table pour les likes d'activités
CREATE TABLE IF NOT EXISTS activity_likes (
    id SERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON activity_likes(user_id);

-- Table pour les commentaires d'activités
CREATE TABLE IF NOT EXISTS activity_comments (
    id SERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON activity_comments(user_id);

-- Table pour les notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'friend_request', 'friend_accepted', 'challenge_invite', etc.
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_id BIGINT,
    comment_id INTEGER REFERENCES activity_comments(id) ON DELETE CASCADE,
    metadata JSONB, -- Pour stocker des données supplémentaires
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Vue pour le feed d'activités des amis
DROP VIEW IF EXISTS feed_activities CASCADE;
CREATE VIEW feed_activities AS
SELECT
    a.id,
    a.strava_id as strava_activity_id,
    a.user_id,
    u.username,
    u.strava_id,
    a.name,
    a.type,
    a.sport_type,
    a.distance,
    a.moving_time,
    a.elapsed_time,
    a.total_elevation_gain,
    a.start_date,
    a.average_speed,
    a.max_speed,
    a.average_heartrate,
    a.max_heartrate,
    a.kudos_count,
    (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.strava_id) as likes_count,
    (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.strava_id) as comments_count,
    a.created_at
FROM activities a
JOIN users u ON a.user_id = u.id
ORDER BY a.start_date DESC;

-- Vue pour obtenir les activités du feed d'un utilisateur (ses amis + lui-même)
DROP FUNCTION IF EXISTS get_user_feed(INTEGER, INTEGER, INTEGER);
CREATE FUNCTION get_user_feed(p_user_id INTEGER, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id INTEGER,
    strava_activity_id BIGINT,
    user_id INTEGER,
    username VARCHAR,
    strava_id BIGINT,
    name VARCHAR,
    type VARCHAR,
    sport_type VARCHAR,
    distance DECIMAL,
    moving_time INTEGER,
    elapsed_time INTEGER,
    total_elevation_gain DECIMAL,
    start_date TIMESTAMP,
    average_speed DECIMAL,
    max_speed DECIMAL,
    average_heartrate DECIMAL,
    max_heartrate DECIMAL,
    kudos_count INTEGER,
    likes_count BIGINT,
    comments_count BIGINT,
    user_has_liked BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.strava_id as strava_activity_id,
        a.user_id,
        u.username,
        u.strava_id,
        a.name,
        a.type,
        a.sport_type,
        a.distance,
        a.moving_time,
        a.elapsed_time,
        a.total_elevation_gain,
        a.start_date,
        a.average_speed,
        a.max_speed,
        a.average_heartrate,
        a.max_heartrate,
        a.kudos_count,
        (SELECT COUNT(*)::BIGINT FROM activity_likes al2 WHERE al2.activity_id = a.strava_id) as likes_count,
        (SELECT COUNT(*)::BIGINT FROM activity_comments ac WHERE ac.activity_id = a.strava_id) as comments_count,
        EXISTS(
            SELECT 1 FROM activity_likes al
            WHERE al.activity_id = a.strava_id
            AND al.user_id = p_user_id
        ) as user_has_liked,
        a.created_at
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id IN (
        -- Amis de l'utilisateur
        SELECT f.friend_id FROM friendships f
        WHERE f.user_id = p_user_id AND f.status = 'accepted'
        UNION
        SELECT f.user_id FROM friendships f
        WHERE f.friend_id = p_user_id AND f.status = 'accepted'
        UNION
        -- L'utilisateur lui-même
        SELECT p_user_id
    )
    ORDER BY a.start_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE activity_likes IS 'Stores likes on activities';
COMMENT ON TABLE activity_comments IS 'Stores comments on activities';
COMMENT ON TABLE notifications IS 'Stores user notifications for various events';
COMMENT ON FUNCTION get_user_feed IS 'Returns the activity feed for a user (their activities + friends activities)';
