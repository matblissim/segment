import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('📦 Exécution de la migration 013_fix_distance_km_precision.sql...');

    const migrationPath = path.join(__dirname, '../migrations/013_fix_distance_km_precision.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration 013 terminée avec succès !');
    console.log('✅ La colonne distance_km supporte maintenant jusqu\'à 9999.99 km');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
