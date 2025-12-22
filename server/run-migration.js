import { pool } from './config/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Exécution de la migration 011_create_profile_analyses.sql...');

    const migrationPath = join(__dirname, 'migrations', '011_create_profile_analyses.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration exécutée avec succès!');
    console.log('   - Table profile_ai_analyses créée');
    console.log('   - Index idx_profile_analyses_user_date créé');
    console.log('   - Index idx_profile_analyses_date créé');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();
