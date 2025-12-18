import { pool } from './config/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Exécution de la migration 003_add_city_to_activities.sql...');

    const migrationPath = join(__dirname, 'migrations', '003_add_city_to_activities.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration exécutée avec succès!');
    console.log('   - Colonne city ajoutée à la table activities');
    console.log('   - Index idx_activities_city créé');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();
