#!/bin/bash

echo "🚀 Exécution de la migration des Plans d'Entraînement..."
echo ""

cd /home/user/segment/server

# Exécuter le script de migration
node scripts/runMigration.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration réussie !"
    echo "✅ Le système de Plans d'Entraînement est maintenant actif"
    echo ""
    echo "📍 Accédez à https://locked-in.fr/plans"
else
    echo ""
    echo "❌ Erreur lors de la migration"
    echo "Vérifiez que la base de données est accessible"
fi
