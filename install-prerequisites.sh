#!/bin/bash

# Script d'installation complète du site Strava Gamification
# Pour Ubuntu vierge

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation du site Strava Gamification"
echo "==========================================="

# 1. Mise à jour du système
echo ""
echo "📦 Étape 1/8: Mise à jour du système..."
sudo apt update
sudo apt upgrade -y

# 2. Installation de curl et build-essential (nécessaires)
echo ""
echo "🔧 Étape 2/8: Installation des outils de base..."
sudo apt install -y curl build-essential

# 3. Installation de Node.js 22.x
echo ""
echo "📦 Étape 3/8: Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Installation de Git
echo ""
echo "📦 Étape 4/8: Installation de Git..."
sudo apt install -y git

# 5. Configuration de Git
echo ""
echo "🔧 Étape 5/8: Configuration de Git..."
git config --global user.name "Mathieu"
git config --global user.email "mathieudottir@example.com"

# 6. Vérification des versions
echo ""
echo "✅ Versions installées:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Git: $(git --version)"

# 7. Création du dossier de travail
echo ""
echo "📁 Étape 6/8: Création du dossier de travail..."
mkdir -p ~/strava-gamification
cd ~/strava-gamification

echo ""
echo "✅ Installation des prérequis terminée!"
echo ""
echo "📍 Vous êtes maintenant dans: $(pwd)"
echo ""
echo "⏭️  Prochaine étape: Télécharger le code du projet"
