import axios from 'axios';
import { pool } from '../config/database.js';

// Nominatim (OpenStreetMap) - Gratuit, respecter la politique: 1 req/sec max
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// Délai entre les requêtes pour respecter la politique de Nominatim
const DELAY_MS = 1100;

/**
 * Convertit des coordonnées GPS en ville via Nominatim
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} - Nom de la ville ou null
 */
export async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        lat,
        lon,
        format: 'json',
        'accept-language': 'fr',
        zoom: 10  // Niveau ville
      },
      headers: {
        'User-Agent': 'StravaGamificationApp/1.0'  // Requis par Nominatim
      },
      timeout: 5000
    });

    if (response.data && response.data.address) {
      // Essayer plusieurs champs dans l'ordre de préférence
      const city = response.data.address.city
                || response.data.address.town
                || response.data.address.village
                || response.data.address.municipality
                || response.data.address.county
                || null;

      return city;
    }

    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    return null;
  }
}

/**
 * Attendre un délai (pour respecter rate limit)
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Géocoder toutes les activités d'un utilisateur qui n'ont pas encore de ville
 * @param {number} userId - ID de l'utilisateur
 * @param {number} limit - Nombre max d'activités à géocoder (défaut: 100)
 * @returns {Promise<{processed: number, success: number, errors: number}>}
 */
export async function geocodeUserActivities(userId, limit = 100) {
  const result = { processed: 0, success: 0, errors: 0 };

  try {
    // Récupérer les activités sans ville et avec GPS
    const query = `
      SELECT id, raw_data->'start_latlng' as coords
      FROM activities
      WHERE user_id = $1
        AND city IS NULL
        AND raw_data->'start_latlng' IS NOT NULL
        AND jsonb_array_length(raw_data->'start_latlng') = 2
      ORDER BY start_date DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [userId, limit]);
    console.log(`📍 Géocodage de ${rows.length} activités pour user ${userId}...`);

    for (const row of rows) {
      result.processed++;

      try {
        // Extraire lat/lon du JSON
        const coords = row.coords;
        if (!Array.isArray(coords) || coords.length !== 2) {
          result.errors++;
          continue;
        }

        const [lat, lon] = coords;

        // Géocoder
        const city = await reverseGeocode(lat, lon);

        if (city) {
          // Mettre à jour la base de données
          await pool.query(
            'UPDATE activities SET city = $1 WHERE id = $2',
            [city, row.id]
          );
          result.success++;
          console.log(`  ✓ Activity ${row.id}: ${city}`);
        } else {
          result.errors++;
          console.log(`  ✗ Activity ${row.id}: pas de ville trouvée`);
        }

        // Respecter le rate limit de Nominatim
        if (result.processed < rows.length) {
          await delay(DELAY_MS);
        }

      } catch (error) {
        result.errors++;
        console.error(`  ✗ Activity ${row.id}: ${error.message}`);
      }
    }

    console.log(`✅ Géocodage terminé: ${result.success}/${result.processed} réussis`);
    return result;

  } catch (error) {
    console.error('❌ Geocode user activities error:', error);
    throw error;
  }
}
