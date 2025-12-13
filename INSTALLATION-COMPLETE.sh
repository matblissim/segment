#!/bin/bash
# SCRIPT D'INSTALLATION COMPLÈTE - STRAVA GAMIFICATION
# Copiez ce fichier COMPLET et exécutez-le sur votre serveur

set -e

echo "🚀 Installation automatique Strava Gamification"
echo "================================================"

# 1. Installation prérequis
echo "📦 Installation des prérequis..."
sudo apt update -qq
sudo apt upgrade -y -qq
sudo apt install -y curl build-essential git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "✅ Node: $(node --version) | npm: $(npm --version)"

# 2. Création projet
echo "📁 Création du projet..."
cd ~
npm create vite@latest strava-gamification -- --template react -y 2>/dev/null || true
cd ~/strava-gamification || exit

# 3. Installation dépendances de base
echo "📦 Installation dépendances React..."
npm install --silent
npm install --silent axios react-router-dom
npm install --silent -D tailwindcss postcss autoprefixer concurrently
npx tailwindcss init -p 2>/dev/null || true

# 4. Création structure serveur  
echo "🔧 Création du backend..."
mkdir -p server/routes

# Tous les fichiers seront créés ci-dessous...
echo "📄 Création des fichiers de configuration..."

