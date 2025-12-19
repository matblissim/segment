#!/bin/bash
# Script d'installation SSL pour locked-in.fr
# Usage: sudo bash setup-ssl.sh

set -e  # Arrêter en cas d'erreur

echo "🔐 Configuration SSL pour locked-in.fr"
echo "======================================"
echo ""

# Vérifier qu'on est bien root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté avec sudo"
  exit 1
fi

# 1. Installer Certbot si nécessaire
echo "📦 Installation de Certbot..."
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
else
    echo "✅ Certbot déjà installé"
fi

# 2. Vérifier que Cloudflare est bien configuré
echo ""
echo "⚠️  IMPORTANT: Avant de continuer, vérifie que:"
echo "   1. Cloudflare DNS: locked-in.fr pointe vers 51.159.67.199"
echo "   2. Cloudflare SSL/TLS: Mode 'Full' (pas 'Flexible')"
echo "   3. Cloudflare Proxy: DÉSACTIVÉ (cloud gris, pas orange)"
echo ""
echo "Le proxy Cloudflare doit être DÉSACTIVÉ temporairement pour Let's Encrypt."
echo ""
read -p "As-tu désactivé le proxy Cloudflare (cloud gris) ? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Va sur Cloudflare et désactive le proxy (clique sur le cloud orange)"
    exit 1
fi

# 3. Copier la configuration Nginx temporaire (sans SSL)
echo ""
echo "📝 Configuration Nginx temporaire..."
cat > /etc/nginx/sites-available/locked-in.fr << 'EOF'
server {
    listen 80;
    server_name locked-in.fr www.locked-in.fr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        root /home/mathieudottir/strava-gamification/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Activer le site si pas déjà fait
ln -sf /etc/nginx/sites-available/locked-in.fr /etc/nginx/sites-enabled/

# Tester et recharger Nginx
nginx -t
systemctl reload nginx
echo "✅ Nginx configuré"

# 4. Obtenir le certificat SSL
echo ""
echo "🔐 Obtention du certificat SSL..."
certbot --nginx -d locked-in.fr -d www.locked-in.fr --non-interactive --agree-tos --email mathieu@locked-in.fr --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificat SSL obtenu avec succès!"
else
    echo "❌ Erreur lors de l'obtention du certificat"
    exit 1
fi

# 5. Copier la configuration Nginx complète avec SSL
echo ""
echo "📝 Configuration Nginx finale avec SSL..."
cp /home/mathieudottir/strava-gamification/deployment/nginx-ssl.conf /etc/nginx/sites-available/locked-in.fr

# Tester et recharger
nginx -t
systemctl reload nginx

echo ""
echo "✅ SSL configuré avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Retourne sur Cloudflare"
echo "   2. Réactive le proxy (cloud orange)"
echo "   3. SSL/TLS mode: garde 'Full'"
echo "   4. Teste https://locked-in.fr"
echo ""
echo "🔄 Renouvellement automatique: Certbot est configuré pour renouveler automatiquement"
