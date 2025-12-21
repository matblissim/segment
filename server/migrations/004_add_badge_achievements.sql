-- Migration pour les achievements de badges dans le feed
-- Permet de tracker quand un utilisateur débloque un badge

-- Table pour enregistrer les achievements de badges
CREATE TABLE IF NOT EXISTS badge_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL, -- ID du badge (ex: "marathon_runner", "half_marathon_10x")
    badge_name VARCHAR(255) NOT NULL, -- Nom du badge
    badge_description TEXT, -- Description du badge
    sport_type VARCHAR(50) NOT NULL, -- 'running' ou 'cycling'
    activity_id BIGINT, -- L'activité qui a déclenché le badge (optionnel)
    count INTEGER DEFAULT 1, -- Nombre de fois que le badge a été obtenu
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badge_achievements_user ON badge_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_achievements_created ON badge_achievements(created_at DESC);

-- Fonction pour obtenir le feed mixte (activités + badges)
DROP FUNCTION IF EXISTS get_user_feed_with_badges(INTEGER, INTEGER, INTEGER);
CREATE FUNCTION get_user_feed_with_badges(p_user_id INTEGER, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    item_type VARCHAR,
    id BIGINT,
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
    badge_id VARCHAR,
    badge_name VARCHAR,
    badge_description TEXT,
    badge_count INTEGER,
    likes_count BIGINT,
    comments_count BIGINT,
    user_has_liked BOOLEAN,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    -- Activités
    SELECT
        'activity'::VARCHAR as item_type,
        a.id::BIGINT,
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
        NULL::VARCHAR as badge_id,
        NULL::VARCHAR as badge_name,
        NULL::TEXT as badge_description,
        NULL::INTEGER as badge_count,
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
        SELECT f.friend_id FROM friendships f
        WHERE f.user_id = p_user_id AND f.status = 'accepted'
        UNION
        SELECT f.user_id FROM friendships f
        WHERE f.friend_id = p_user_id AND f.status = 'accepted'
        UNION
        SELECT p_user_id
    )

    UNION ALL

    -- Badges
    SELECT
        'badge'::VARCHAR as item_type,
        ba.id::BIGINT,
        NULL::BIGINT as strava_activity_id,
        ba.user_id,
        u.username,
        u.strava_id,
        NULL::VARCHAR as name,
        NULL::VARCHAR as type,
        ba.sport_type,
        NULL::DECIMAL as distance,
        NULL::INTEGER as moving_time,
        NULL::INTEGER as elapsed_time,
        NULL::DECIMAL as total_elevation_gain,
        NULL::TIMESTAMP as start_date,
        ba.badge_id,
        ba.badge_name,
        ba.badge_description,
        ba.count as badge_count,
        0::BIGINT as likes_count,
        0::BIGINT as comments_count,
        false as user_has_liked,
        ba.created_at
    FROM badge_achievements ba
    JOIN users u ON ba.user_id = u.id
    WHERE ba.user_id IN (
        SELECT f.friend_id FROM friendships f
        WHERE f.user_id = p_user_id AND f.status = 'accepted'
        UNION
        SELECT f.user_id FROM friendships f
        WHERE f.friend_id = p_user_id AND f.status = 'accepted'
        UNION
        SELECT p_user_id
    )

    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE badge_achievements IS 'Stores badge achievements for the social feed';
COMMENT ON FUNCTION get_user_feed_with_badges IS 'Returns a mixed feed of activities and badge achievements for a user and their friends';
