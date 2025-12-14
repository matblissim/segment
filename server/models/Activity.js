import { pool } from '../config/database.js';

class Activity {
  // Calculer les points selon les règles de gamification
  static calculatePoints(activity) {
    const distance = activity.distance / 1000; // Conversion en km
    const elevation = activity.total_elevation_gain || 0;

    let points = Math.round(distance * 10); // 10 points par km

    // Bonus dénivelé : 1 point par 100m
    points += Math.round(elevation / 100);

    // Bonus type d'activité
    if (['Trail', 'TrailRun'].includes(activity.type)) {
      points = Math.round(points * 1.2); // +20% pour trail
    }
    if (activity.type === 'Swim') {
      points = Math.round(points * 1.5); // +50% pour natation
    }

    return points;
  }

  // Insérer ou mettre à jour une activité (évite les doublons)
  static async upsert(userId, stravaActivity) {
    const points = this.calculatePoints(stravaActivity);

    const query = `
      INSERT INTO activities (
        user_id, strava_id, name, type, sport_type, start_date,
        distance, moving_time, elapsed_time, total_elevation_gain,
        average_speed, max_speed, average_heartrate, max_heartrate,
        kudos_count, points, raw_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (strava_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        sport_type = EXCLUDED.sport_type,
        distance = EXCLUDED.distance,
        moving_time = EXCLUDED.moving_time,
        elapsed_time = EXCLUDED.elapsed_time,
        total_elevation_gain = EXCLUDED.total_elevation_gain,
        average_speed = EXCLUDED.average_speed,
        max_speed = EXCLUDED.max_speed,
        average_heartrate = EXCLUDED.average_heartrate,
        max_heartrate = EXCLUDED.max_heartrate,
        kudos_count = EXCLUDED.kudos_count,
        points = EXCLUDED.points,
        raw_data = EXCLUDED.raw_data
      RETURNING *
    `;

    const values = [
      userId,
      stravaActivity.id,
      stravaActivity.name,
      stravaActivity.type,
      stravaActivity.sport_type,
      stravaActivity.start_date,
      stravaActivity.distance,
      stravaActivity.moving_time,
      stravaActivity.elapsed_time,
      stravaActivity.total_elevation_gain,
      stravaActivity.average_speed,
      stravaActivity.max_speed,
      stravaActivity.average_heartrate,
      stravaActivity.max_heartrate,
      stravaActivity.kudos_count,
      points,
      JSON.stringify(stravaActivity),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Insérer plusieurs activités en batch (plus performant)
  static async batchUpsert(userId, stravaActivities) {
    const inserted = [];

    for (const activity of stravaActivities) {
      const result = await this.upsert(userId, activity);
      inserted.push(result);
    }

    return inserted;
  }

  // Récupérer les activités d'un utilisateur avec pagination
  static async findByUserId(userId, limit = 30, offset = 0) {
    const query = `
      SELECT * FROM activities
      WHERE user_id = $1
      ORDER BY start_date DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  // Récupérer toutes les activités d'un utilisateur (pour stats)
  static async findAllByUserId(userId) {
    const query = `
      SELECT * FROM activities
      WHERE user_id = $1
      ORDER BY start_date DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Compter le nombre d'activités
  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) as count FROM activities WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Récupérer les stats hebdomadaires (8 dernières semaines)
  static async getWeeklyStats(userId) {
    const query = `
      SELECT
        DATE_TRUNC('week', start_date)::date as week_start,
        COUNT(*) as activity_count,
        SUM(distance) / 1000 as total_distance_km,
        SUM(total_elevation_gain) as total_elevation,
        SUM(points) as total_points
      FROM activities
      WHERE user_id = $1
        AND start_date >= NOW() - INTERVAL '8 weeks'
      GROUP BY week_start
      ORDER BY week_start ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Récupérer les stats annuelles par sport
  static async getYearlyStatsBySport(userId) {
    const query = `
      SELECT
        EXTRACT(YEAR FROM start_date)::integer as year,
        type,
        COUNT(*) as activity_count,
        SUM(distance) / 1000 as total_distance_km,
        SUM(total_elevation_gain) as total_elevation,
        SUM(points) as total_points
      FROM activities
      WHERE user_id = $1
      GROUP BY year, type
      ORDER BY year DESC, type
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Récupérer l'activité la plus récente
  static async getLatest(userId) {
    const query = `
      SELECT * FROM activities
      WHERE user_id = $1
      ORDER BY start_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Supprimer les activités d'un utilisateur
  static async deleteByUserId(userId) {
    const query = 'DELETE FROM activities WHERE user_id = $1';
    await pool.query(query, [userId]);
  }
}

export default Activity;
