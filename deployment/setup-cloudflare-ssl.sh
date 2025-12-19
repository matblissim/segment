#!/bin/bash
# Script de configuration SSL avec Cloudflare Origin Certificate
# Usage: sudo bash setup-cloudflare-ssl.sh

set -e

echo "🔐 Configuration SSL Cloudflare pour locked-in.fr"
echo "=================================================="
echo ""

# Vérifier qu'on est bien root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté avec sudo"
  exit 1
fi

# Créer le dossier pour les certificats
mkdir -p /etc/nginx/ssl

echo "📝 Tu vas avoir besoin de 2 fichiers de Cloudflare:"
echo "   1. Le certificat (origin-cert.pem)"
echo "   2. La clé privée (origin-key.pem)"
echo ""
echo "Va sur Cloudflare et suis ces étapes:"
echo "   → SSL/TLS → Origin Server → Create Certificate"
echo "   → Laisse les options par défaut (RSA, 15 ans)"
echo "   → Click 'Create'"
echo ""
read -p "Appuie sur Entrée quand tu es prêt à coller les certificats..."

echo ""
echo "📋 ÉTAPE 1: Copie le CERTIFICAT (Origin Certificate)"
echo "Colle tout le contenu (de -----BEGIN à -----END)"
echo "Puis appuie sur Ctrl+D quand c'est terminé:"
echo ""

cat > /etc/nginx/ssl/cloudflare-origin.pem

echo ""
echo "✅ Certificat sauvegardé"
echo ""
echo "📋 ÉTAPE 2: Copie la CLÉ PRIVÉE (Private Key)"
echo "Colle tout le contenu (de -----BEGIN à -----END)"
echo "Puis appuie sur Ctrl+D quand c'est terminé:"
echo ""

cat > /etc/nginx/ssl/cloudflare-origin-key.pem

echo ""
echo "✅ Clé privée sauvegardée"

# Sécuriser la clé privée
chmod 600 /etc/nginx/ssl/cloudflare-origin-key.pem
chmod 644 /etc/nginx/ssl/cloudflare-origin.pem

# Créer la configuration Nginx avec SSL
echo ""
echo "📝 Configuration de Nginx..."

cat > /etc/nginx/sites-available/locked-in.fr << 'EOF'
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name locked-in.fr www.locked-in.fr;

    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name locked-in.fr www.locked-in.fr;

    # Certificats Cloudflare Origin
    ssl_certificate /etc/nginx/ssl/cloudflare-origin.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare-origin-key.pem;

    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # API Backend - Proxy vers Node.js
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Routes d'authentification
    location /auth {
        proxy_pass http://localhost:3001/auth;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend - Fichiers statiques
    location / {
        root /home/mathieudottir/strava-gamification/client/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/locked-in.fr /etc/nginx/sites-enabled/

# Tester la configuration
echo ""
echo "🔍 Test de la configuration Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valide"
    echo ""
    echo "🔄 Redémarrage de Nginx..."
    systemctl restart nginx
    echo "✅ Nginx redémarré"
else
    echo "❌ Erreur dans la configuration Nginx"
    exit 1
fi

echo ""
echo "✅ Configuration SSL terminée avec succès!"
echo ""
echo "📋 Vérifie que tout fonctionne:"
echo "   1. https://locked-in.fr doit charger"
echo "   2. Le cadenas doit apparaître dans le navigateur"
echo "   3. Le login Strava doit fonctionner"
echo ""
echo "🔍 Pour vérifier que Nginx écoute bien sur port 443:"
echo "   sudo netstat -tlnp | grep 443"
