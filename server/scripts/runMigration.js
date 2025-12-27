import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('📦 Exécution de la migration 012_create_training_plans.sql...');

    const migrationPath = path.join(__dirname, '../migrations/012_create_training_plans.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration terminée avec succès !');
    console.log('✅ Tables créées : training_plans, training_sessions');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  }
}

runMigration();
