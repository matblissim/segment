# 🔧 Guide d'Exécution de la Migration - Plans d'Entraînement

## Option 1 : Via un Client PostgreSQL Distant (Recommandé)

Si vous utilisez un service cloud (ex: Supabase, Railway, Render) :

### A) Interface Web
1. Connectez-vous à votre tableau de bord PostgreSQL
2. Allez dans l'éditeur SQL
3. Copiez-collez le contenu de `server/migrations/012_create_training_plans.sql`
4. Exécutez la requête

### B) Client Local (psql)
```bash
# Si vous avez accès distant à votre DB
PGPASSWORD=tonmotdepasse123 psql -h VOTRE_HOST -p 5432 -U stravauser -d segment -f server/migrations/012_create_training_plans.sql

# Exemple avec un host distant
# PGPASSWORD=tonmotdepasse123 psql -h db.example.com -p 5432 -U stravauser -d segment -f server/migrations/012_create_training_plans.sql
```

## Option 2 : Via l'Application Backend

Le backend peut exécuter la migration automatiquement au démarrage.

### Créer un script de migration automatique :

**server/scripts/runMigration.js**
```javascript
import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('📦 Running migration 012_create_training_plans.sql...');

    const migrationPath = path.join(__dirname, '../migrations/012_create_training_plans.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

**Puis exécuter :**
```bash
cd /home/user/segment/server
node scripts/runMigration.js
```

## Option 3 : Vérifier si la Migration est Déjà Faite

```bash
# Tester si les tables existent déjà
cd /home/user/segment/server
node -e "
import { pool } from './config/database.js';
const result = await pool.query(\`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('training_plans', 'training_sessions')
\`);
console.log('Tables existantes:', result.rows);
await pool.end();
"
```

## ⚙️ Configuration de Connexion

Votre base de données utilise probablement des variables d'environnement.

Vérifiez votre fichier de config :
- Host : Variable `DB_HOST` (probablement distant)
- Port : Variable `DB_PORT` (par défaut 5432)
- Database : `segment`
- User : `stravauser`
- Password : `tonmotdepasse123`

## 🧪 Tester que le Backend Fonctionne

Même sans migration, vous pouvez tester l'API :

```bash
# Vérifier que le backend tourne
curl http://localhost:3001/api/health

# Devrait retourner : {"status":"ok","postgres":"ok","redis":"ok"}
```

## 🚀 Une Fois la Migration Faite

1. **Redémarrer le backend** (si besoin)
2. **Tester l'API Plans** :
```bash
# Récupérer les plans (vide au départ)
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:3001/api/training-plans
```

3. **Accéder à la page** : `https://locked-in.fr/plans`

## 📋 Contenu de la Migration

La migration crée :
- ✅ Table `training_plans` (14 colonnes + contraintes)
- ✅ Table `training_sessions` (16 colonnes + contraintes)
- ✅ Indexes pour performance
- ✅ Triggers pour `updated_at`
- ✅ Functions PostgreSQL

## ❓ Besoin d'Aide ?

Si vous ne savez pas où est hébergée votre base :
1. Vérifiez vos variables d'env backend
2. Regardez dans votre service cloud (Vercel, Railway, Render, etc.)
3. Contactez-moi avec l'erreur exacte

---

**Le système est prêt côté code !** Il suffit juste d'exécuter la migration SQL une seule fois.
