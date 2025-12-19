import axios from 'axios';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { invalidateUserCache } from '../config/database.js';
import { geocodeUserActivities } from './geocoding.js';

class SyncService {
  // Rafraîchir le token Strava si nécessaire
  static async refreshTokenIfNeeded(user) {
    if (!User.isTokenExpired(user)) {
      return user.access_token;
    }

    console.log(`🔄 Refreshing token for user ${user.id}`);

    try {
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token,
      });

      const tokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: response.data.expires_at,
      };

      await User.updateTokens(user.id, tokens);

      return tokens.access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh Strava token');
    }
  }

  // Récupérer les activités depuis l'API Strava avec pagination
  static async fetchStravaActivities(accessToken, perPage = 200, page = 1) {
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: perPage, page },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Strava API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch activities from Strava');
    }
  }

  // Synchroniser toutes les activités d'un utilisateur
  static async syncUserActivities(userId, progressCallback = null) {
    console.log(`🔄 Starting sync for user ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Rafraîchir le token si nécessaire
    const accessToken = await this.refreshTokenIfNeeded(user);

    // Mettre à jour le statut
    await User.updateSyncStatus(userId, 'syncing');

    let page = 1;
    let hasMore = true;
    let totalActivities = 0;
    let newActivities = 0;

    try {
      // Récupérer la dernière activité en DB pour optimiser
      const latestActivity = await Activity.getLatest(userId);
      const latestDate = latestActivity ? new Date(latestActivity.start_date) : null;

      while (hasMore && page <= 50) {
        console.log(`📥 Fetching page ${page}...`);

        const activities = await this.fetchStravaActivities(accessToken, 200, page);

        if (activities.length === 0) {
          hasMore = false;
          break;
        }

        // Filtrer les activités déjà présentes
        let filteredActivities = activities;
        if (latestDate) {
          filteredActivities = activities.filter(
            (act) => new Date(act.start_date) > latestDate
          );

          // Si on ne trouve plus de nouvelles activités, on arrête
          if (filteredActivities.length === 0 && page > 1) {
            console.log('✅ No new activities found, stopping pagination');
            hasMore = false;
            break;
          }
        }

        // Insérer les activités en batch
        if (filteredActivities.length > 0) {
          await Activity.batchUpsert(userId, filteredActivities);
          newActivities += filteredActivities.length;
        }

        totalActivities += activities.length;

        // Callback pour le suivi de progression
        if (progressCallback) {
          progressCallback({
            page,
            processed: totalActivities,
            new: newActivities,
          });
        }

        // Si on a reçu moins que 200 activités, c'est la dernière page
        if (activities.length < 200) {
          hasMore = false;
        } else {
          page++;
        }

        // Petit délai pour éviter de surcharger l'API
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Invalider le cache de l'utilisateur
      await invalidateUserCache(userId);

      // Mettre à jour le statut
      await User.updateSyncStatus(userId, 'completed', new Date());

      console.log(`✅ Sync completed for user ${userId}: ${newActivities} new activities`);

      // Géocoder automatiquement les nouvelles activités en arrière-plan (non bloquant)
      if (newActivities > 0) {
        console.log(`🌍 Géocodage automatique de ${newActivities} nouvelles activités...`);
        geocodeUserActivities(userId, newActivities)
          .then((result) => {
            console.log(`✅ Géocodage terminé: ${result.success}/${result.processed} activités`);
          })
          .catch((error) => {
            console.error(`⚠️  Géocodage échoué (non critique):`, error.message);
          });
      }

      return {
        success: true,
        totalFetched: totalActivities,
        newActivities,
        pages: page - 1,
      };
    } catch (error) {
      console.error(`❌ Sync failed for user ${userId}:`, error);
      await User.updateSyncStatus(userId, 'failed');
      throw error;
    }
  }

  // Synchroniser uniquement les nouvelles activités (depuis la dernière sync)
  static async syncNewActivities(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = await this.refreshTokenIfNeeded(user);
    const latestActivity = await Activity.getLatest(userId);

    // Si pas d'activité, faire une sync complète
    if (!latestActivity) {
      return this.syncUserActivities(userId);
    }

    const latestDate = Math.floor(new Date(latestActivity.start_date).getTime() / 1000);

    try {
      const activities = await this.fetchStravaActivities(accessToken, 200, 1);

      // Filtrer les activités plus récentes que la dernière en DB
      const newActivities = activities.filter(
        (act) => new Date(act.start_date).getTime() / 1000 > latestDate
      );

      if (newActivities.length > 0) {
        await Activity.batchUpsert(userId, newActivities);
        await invalidateUserCache(userId);

        // Géocoder automatiquement les nouvelles activités (non bloquant)
        console.log(`🌍 Géocodage automatique de ${newActivities.length} nouvelles activités...`);
        geocodeUserActivities(userId, newActivities.length)
          .then((result) => {
            console.log(`✅ Géocodage terminé: ${result.success}/${result.processed} activités`);
          })
          .catch((error) => {
            console.error(`⚠️  Géocodage échoué (non critique):`, error.message);
          });
      }

      return {
        success: true,
        newActivities: newActivities.length,
      };
    } catch (error) {
      console.error('❌ Sync new activities failed:', error);
      throw error;
    }
  }
}

export default SyncService;
