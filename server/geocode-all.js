#!/usr/bin/env node
/**
 * Script de géocodage automatique pour toutes les activités
 * Usage: node geocode-all.js [user_id] [limit]
 *
 * Exemples:
 *   node geocode-all.js           # Géocode toutes les activités de tous les users
 *   node geocode-all.js 1         # Géocode seulement user 1
 *   node geocode-all.js 1 100     # Géocode 100 activités de user 1
 */

import { pool } from './config/database.js';
import { geocodeUserActivities } from './services/geocoding.js';
import dotenv from 'dotenv';

dotenv.config();

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function getStats() {
  const result = await pool.query(`
    SELECT
      u.id as user_id,
      COUNT(a.id) as total_activities,
      COUNT(a.city) as geocoded,
      COUNT(a.id) FILTER (WHERE a.city IS NULL AND a.raw_data->'start_latlng' IS NOT NULL) as need_geocoding
    FROM users u
    LEFT JOIN activities a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY u.id;
  `);
  return result.rows;
}

async function main() {
  const args = process.argv.slice(2);
  const targetUserId = args[0] ? parseInt(args[0]) : null;
  const limit = args[1] ? parseInt(args[1]) : null;

  log('\n🌍 GÉOCODAGE AUTOMATIQUE DES ACTIVITÉS\n', 'bright');

  // Afficher les stats initiales
  log('📊 État actuel:', 'cyan');
  const initialStats = await getStats();

  let totalToGeocode = 0;
  initialStats.forEach(stat => {
    if (targetUserId && stat.user_id !== targetUserId) return;

    log(`   User ${stat.user_id}: ${stat.total_activities} activités totales`, 'blue');
    log(`      ✓ Déjà géocodées: ${stat.geocoded}`, 'green');
    log(`      → À géocoder: ${stat.need_geocoding}`, 'yellow');
    totalToGeocode += stat.need_geocoding;
  });

  if (totalToGeocode === 0) {
    log('\n✅ Toutes les activités sont déjà géocodées!', 'green');
    process.exit(0);
  }

  const estimatedTime = Math.ceil(totalToGeocode * 1.1 / 60); // ~1.1 sec par activité
  log(`\n⏱️  Temps estimé: ${estimatedTime} minutes\n`, 'yellow');

  // Confirmation
  if (!process.env.AUTO_CONFIRM) {
    log('Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  log('\n🚀 Démarrage du géocodage...\n', 'bright');

  // Géocoder chaque utilisateur
  const usersToProcess = targetUserId
    ? initialStats.filter(s => s.user_id === targetUserId)
    : initialStats.filter(s => s.need_geocoding > 0);

  let globalStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalErrors: 0
  };

  for (const userStat of usersToProcess) {
    const userId = userStat.user_id;
    const limitForUser = limit || userStat.need_geocoding;

    log(`\n👤 User ${userId} - Géocodage de ${limitForUser} activités...`, 'cyan');
    log('─'.repeat(60), 'blue');

    const startTime = Date.now();

    try {
      const result = await geocodeUserActivities(userId, limitForUser);

      const duration = Math.round((Date.now() - startTime) / 1000);

      log(`\n✅ User ${userId} terminé en ${duration}s`, 'green');
      log(`   Traitées: ${result.processed}`, 'blue');
      log(`   Réussies: ${result.success}`, 'green');
      log(`   Erreurs: ${result.errors}`, result.errors > 0 ? 'red' : 'blue');

      globalStats.totalProcessed += result.processed;
      globalStats.totalSuccess += result.success;
      globalStats.totalErrors += result.errors;

    } catch (error) {
      log(`\n❌ Erreur pour user ${userId}: ${error.message}`, 'red');
    }
  }

  // Stats finales
  log('\n' + '═'.repeat(60), 'bright');
  log('📊 RÉSUMÉ FINAL', 'bright');
  log('═'.repeat(60), 'bright');

  const finalStats = await getStats();
  finalStats.forEach(stat => {
    if (targetUserId && stat.user_id !== targetUserId) return;
    log(`\nUser ${stat.user_id}:`, 'cyan');
    log(`  Géocodées: ${stat.geocoded}/${stat.total_activities}`, 'green');
    if (stat.need_geocoding > 0) {
      log(`  Restantes: ${stat.need_geocoding}`, 'yellow');
    }
  });

  log(`\n🎯 Total traité: ${globalStats.totalProcessed}`, 'blue');
  log(`✅ Succès: ${globalStats.totalSuccess}`, 'green');
  if (globalStats.totalErrors > 0) {
    log(`❌ Erreurs: ${globalStats.totalErrors}`, 'red');
  }

  log('\n✨ Géocodage terminé!', 'bright');
  log('💡 Pense à vider le cache Redis: redis-cli FLUSHALL\n', 'yellow');

  process.exit(0);
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n\n⚠️  Géocodage interrompu par l\'utilisateur', 'yellow');
  log('Les activités déjà géocodées sont sauvegardées.\n', 'green');
  process.exit(0);
});

main().catch(error => {
  log(`\n❌ Erreur: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
