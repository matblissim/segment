import { geocodeUserActivities } from './services/geocoding.js';
import { pool } from './config/database.js';

async function testGeocoding() {
  try {
    console.log('🧪 Test du système de géocodage...\n');

    // Vérifier combien d'activités ont besoin de géocodage
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activities
      WHERE user_id = 1
        AND city IS NULL
        AND raw_data->'start_latlng' IS NOT NULL
        AND jsonb_array_length(raw_data->'start_latlng') = 2
    `;

    const { rows } = await pool.query(countQuery);
    console.log(`📍 Activités à géocoder: ${rows[0].total}`);

    if (rows[0].total === 0) {
      console.log('\n✅ Toutes les activités ont déjà une ville!');

      // Afficher quelques exemples
      const sampleQuery = `
        SELECT name, city, start_date
        FROM activities
        WHERE user_id = 1 AND city IS NOT NULL
        ORDER BY start_date DESC
        LIMIT 5
      `;
      const samples = await pool.query(sampleQuery);
      console.log('\n📋 Exemples de villes géocodées:');
      samples.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.city}) - ${new Date(row.start_date).toLocaleDateString('fr-FR')}`);
      });

      process.exit(0);
    }

    console.log('\n🚀 Lancement du géocodage (5 premières activités)...');
    console.log('⏱️  Cela prendra environ 6 secondes (1 req/sec)...\n');

    // Géocoder les 5 premières activités pour tester
    const result = await geocodeUserActivities(1, 5);

    console.log('\n📊 Résultats:');
    console.log(`  ✓ Activités traitées: ${result.processed}`);
    console.log(`  ✓ Réussies: ${result.success}`);
    console.log(`  ✗ Erreurs: ${result.errors}`);

    if (result.success > 0) {
      // Afficher les activités géocodées
      const newlyGeocodedQuery = `
        SELECT name, city, start_date
        FROM activities
        WHERE user_id = 1 AND city IS NOT NULL
        ORDER BY start_date DESC
        LIMIT 5
      `;
      const geocoded = await pool.query(newlyGeocodedQuery);
      console.log('\n🌍 Activités avec villes:');
      geocoded.rows.forEach(row => {
        console.log(`  ✓ ${row.name} → ${row.city}`);
      });
    }

    console.log('\n✅ Test terminé!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testGeocoding();
