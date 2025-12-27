import { pool } from '../config/database.js';
import { generateTrainingPlan } from '../utils/planGenerator.js';

class TrainingPlan {
  /**
   * Créer un plan d'entraînement et générer toutes les séances
   */
  static async create(userId, planConfig) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Créer le plan
      const planResult = await client.query(
        `INSERT INTO training_plans (
          user_id, event_id, name, goal_distance, goal_elevation, goal_date,
          goal_pace, race_type, weeks_duration, sessions_per_week, available_days,
          cross_training, user_level, max_heart_rate, vma, current_weekly_km,
          constraints, preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
        [
          userId,
          planConfig.eventId || null,
          planConfig.name,
          planConfig.goalDistance * 1000, // Convertir en mètres
          planConfig.goalElevation || 0,
          planConfig.goalDate,
          planConfig.goalPace || null,
          planConfig.raceType || 'route',
          planConfig.weeksDuration,
          planConfig.sessionsPerWeek,
          JSON.stringify(planConfig.availableDays),
          JSON.stringify(planConfig.crossTraining || []),
          planConfig.userLevel || 'intermediate',
          planConfig.maxHeartRate || null,
          planConfig.vma || null,
          planConfig.currentWeeklyKm || null,
          planConfig.constraints || null,
          JSON.stringify(planConfig.preferences || {}),
        ]
      );

      const plan = planResult.rows[0];

      // 2. Générer les séances avec l'algorithme
      const sessions = generateTrainingPlan({
        goalDistance: planConfig.goalDistance,
        goalElevation: planConfig.goalElevation || 0,
        goalDate: planConfig.goalDate,
        goalPace: planConfig.goalPace,
        raceType: planConfig.raceType || 'route',
        weeksDuration: planConfig.weeksDuration,
        sessionsPerWeek: planConfig.sessionsPerWeek,
        availableDays: planConfig.availableDays,
        crossTraining: planConfig.crossTraining || [],
        userLevel: planConfig.userLevel || 'intermediate',
        maxHeartRate: planConfig.maxHeartRate,
        vma: planConfig.vma,
        currentWeeklyKm: planConfig.currentWeeklyKm,
      });

      // 3. Calculer les dates des séances
      // Commencer au lundi de cette semaine ou au lundi prochain
      const today = new Date();
      const currentDay = today.getDay(); // 0=Dim, 1=Lun... 6=Sam
      const daysUntilMonday = currentDay === 0 ? 1 : (currentDay === 1 ? 0 : 8 - currentDay);

      const startDate = new Date(today);
      startDate.setDate(today.getDate() + daysUntilMonday);
      startDate.setHours(0, 0, 0, 0);

      // 4. Insérer toutes les séances
      for (const session of sessions) {
        const sessionDate = new Date(startDate);
        // day_of_week: 1=Lun, 2=Mar... 6=Sam, 0=Dim
        // Convertir en offset depuis lundi : Lun=0, Mar=1... Dim=6
        const dayOffset = session.day_of_week === 0 ? 6 : session.day_of_week - 1;
        sessionDate.setDate(sessionDate.getDate() + ((session.week_number - 1) * 7) + dayOffset);

        await client.query(
          `INSERT INTO training_sessions (
            plan_id, week_number, day_of_week, session_date, session_type,
            duration_minutes, distance_km, description, pace_min, pace_max,
            intensity_zone, elevation_gain, cross_training_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            plan.id,
            session.week_number,
            session.day_of_week,
            sessionDate.toISOString().split('T')[0],
            session.session_type,
            session.duration_minutes,
            session.distance_km,
            session.description,
            session.pace_min || null,
            session.pace_max || null,
            session.intensity_zone,
            session.elevation_gain || 0,
            session.cross_training_type || null,
          ]
        );
      }

      await client.query('COMMIT');

      return plan;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir tous les plans d'un utilisateur
   */
  static async getUserPlans(userId) {
    const result = await pool.query(
      `SELECT p.*, e.name as event_name, e.event_date,
        (SELECT COUNT(*) FROM training_sessions WHERE plan_id = p.id) as total_sessions,
        (SELECT COUNT(*) FROM training_sessions WHERE plan_id = p.id AND completed = true) as completed_sessions
      FROM training_plans p
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Obtenir un plan avec toutes ses séances
   */
  static async getPlanWithSessions(planId, userId) {
    // Vérifier que le plan appartient à l'utilisateur
    const planResult = await pool.query(
      `SELECT p.*, e.name as event_name, e.event_date
      FROM training_plans p
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [planId, userId]
    );

    if (planResult.rows.length === 0) {
      return null;
    }

    const plan = planResult.rows[0];

    // Récupérer toutes les séances
    const sessionsResult = await pool.query(
      `SELECT * FROM training_sessions
      WHERE plan_id = $1
      ORDER BY week_number, day_of_week`,
      [planId]
    );

    plan.sessions = sessionsResult.rows;

    return plan;
  }

  /**
   * Marquer une séance comme complétée
   */
  static async completeSession(sessionId, userId, completionData) {
    const result = await pool.query(
      `UPDATE training_sessions ts
      SET completed = true,
          completed_at = NOW(),
          actual_distance = $3,
          actual_duration = $4,
          actual_pace = $5,
          notes = $6
      FROM training_plans p
      WHERE ts.id = $1 AND ts.plan_id = p.id AND p.user_id = $2
      RETURNING ts.*`,
      [
        sessionId,
        userId,
        completionData.distance || null,
        completionData.duration || null,
        completionData.pace || null,
        completionData.notes || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Supprimer un plan
   */
  static async delete(planId, userId) {
    const result = await pool.query(
      `DELETE FROM training_plans
      WHERE id = $1 AND user_id = $2
      RETURNING *`,
      [planId, userId]
    );

    return result.rows[0];
  }

  /**
   * Obtenir les séances de la semaine en cours
   */
  static async getCurrentWeekSessions(planId, userId) {
    const result = await pool.query(
      `SELECT ts.*
      FROM training_sessions ts
      JOIN training_plans p ON ts.plan_id = p.id
      WHERE ts.plan_id = $1 AND p.user_id = $2
        AND ts.session_date >= CURRENT_DATE
        AND ts.session_date < CURRENT_DATE + INTERVAL '7 days'
      ORDER BY ts.session_date`,
      [planId, userId]
    );

    return result.rows;
  }

  /**
   * Obtenir les statistiques d'un plan
   */
  static async getPlanStats(planId, userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed = true) as completed_sessions,
        COALESCE(SUM(distance_km), 0) as planned_km,
        COALESCE(SUM(actual_distance), 0) as completed_km,
        COALESCE(SUM(elevation_gain), 0) as planned_elevation,
        COUNT(*) FILTER (WHERE session_type = 'long_run') as long_runs,
        COUNT(*) FILTER (WHERE intensity_zone >= 4) as quality_sessions
      FROM training_sessions ts
      JOIN training_plans p ON ts.plan_id = p.id
      WHERE ts.plan_id = $1 AND p.user_id = $2`,
      [planId, userId]
    );

    return result.rows[0];
  }
}

export default TrainingPlan;
