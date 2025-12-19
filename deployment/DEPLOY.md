# 🚀 Déploiement Production - locked-in.fr

## Problème Actuel

- ✅ Backend fonctionne sur port 3001
- ✅ Frontend build existe dans dist/
- ✅ Nginx configuré pour HTTP (port 80)
- ❌ Pas de SSL → https://locked-in.fr ne fonctionne pas (erreur 521)
- ❌ CORS error car frontend en HTTP appelle API en HTTPS

## Solution: Configurer SSL avec Let's Encrypt

### Étape 1: Désactiver le Proxy Cloudflare (IMPORTANT!)

**Pourquoi?** Let's Encrypt doit accéder directement au serveur pour valider le domaine.

1. Va sur https://dash.cloudflare.com
2. Sélectionne le domaine `locked-in.fr`
3. Onglet **DNS**
4. Pour l'enregistrement `locked-in.fr` (type A):
   - Clique sur le **cloud orange** pour le rendre **gris**
   - État final: "DNS only" (cloud gris)
5. Fais pareil pour `www.locked-in.fr` si présent

### Étape 2: Vérifier la Configuration Cloudflare SSL

1. Toujours sur Cloudflare, onglet **SSL/TLS**
2. Mode de chiffrement: doit être **"Full"** (pas Flexible)
3. Si ce n'est pas le cas, change-le maintenant

### Étape 3: Sur le Serveur - Pull les Derniers Changements

```bash
# Connexion SSH au serveur
ssh ton-utilisateur@51.159.67.199

# Aller dans le dossier du projet
cd /home/mathieudottir/strava-gamification

# Pull les derniers changements
git pull origin claude/strava-gamification-site-01E9bN6HuQ7eBJySCGgPM7zi

# Créer le dossier deployment s'il n'existe pas
mkdir -p deployment
```

### Étape 4: Lancer le Script d'Installation SSL

```bash
# Rendre le script exécutable
chmod +x deployment/setup-ssl.sh

# Lancer le script (avec sudo)
sudo bash deployment/setup-ssl.sh
```

**Ce que fait le script:**
1. Installe Certbot (Let's Encrypt)
2. Demande confirmation que Cloudflare proxy est désactivé
3. Configure Nginx temporairement pour HTTP
4. Obtient les certificats SSL
5. Configure Nginx avec SSL complet
6. Redémarre Nginx

### Étape 5: Réactiver le Proxy Cloudflare

**Une fois le script terminé avec succès:**

1. Retourne sur Cloudflare → DNS
2. Clique sur le **cloud gris** pour le rendre **orange**
3. État final: "Proxied" (cloud orange)

### Étape 6: Vérifier que Tout Fonctionne

```bash
# Vérifier que Nginx écoute sur port 443
sudo netstat -tlnp | grep 443

# Doit afficher quelque chose comme:
# tcp    0    0 0.0.0.0:443    0.0.0.0:*    LISTEN    12345/nginx

# Vérifier le statut Nginx
sudo systemctl status nginx

# Tester la configuration
sudo nginx -t
```

### Étape 7: Tester le Site

1. Ouvre https://locked-in.fr dans un navigateur
2. Le site doit charger en HTTPS (cadenas dans la barre d'adresse)
3. Clique sur le bouton "Se connecter avec Strava"
4. Tu dois être redirigé vers Strava pour l'authentification

## 🔧 En Cas de Problème

### Erreur "Port 80 already in use"

```bash
# Vérifier quel processus utilise le port 80
sudo netstat -tlnp | grep :80

# Arrêter Nginx s'il tourne déjà
sudo systemctl stop nginx

# Relancer le script
sudo bash deployment/setup-ssl.sh
```

### Erreur Certbot "Failed authorization procedure"

**Cause:** Le proxy Cloudflare est encore activé

**Solution:**
1. Désactive le proxy Cloudflare (cloud gris)
2. Attends 2-3 minutes
3. Relance le script

### Le Site Ne Charge Pas Après SSL

```bash
# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Vérifier que le backend tourne
pm2 status

# Si backend arrêté, le redémarrer
pm2 restart strava-gamification-backend
```

### CORS Error Persiste

**Vérifier que le frontend est bien build avec HTTPS:**

```bash
cd /home/mathieudottir/strava-gamification/client

# Vérifier le .env
cat .env
# Doit contenir: VITE_API_URL=https://locked-in.fr/api

# Si ce n'est pas le cas:
echo "VITE_API_URL=https://locked-in.fr/api" > .env

# Rebuild
npm run build

# Recharger Nginx
sudo systemctl reload nginx
```

## 📋 Checklist Finale

- [ ] Cloudflare proxy désactivé avant setup SSL
- [ ] Script setup-ssl.sh exécuté avec succès
- [ ] Certificats SSL créés dans `/etc/letsencrypt/live/locked-in.fr/`
- [ ] Nginx écoute sur port 443
- [ ] Cloudflare proxy réactivé après SSL
- [ ] Cloudflare SSL mode = "Full"
- [ ] https://locked-in.fr charge correctement
- [ ] Login Strava fonctionne
- [ ] Callback OAuth redirige vers https://locked-in.fr

## 🔄 Renouvellement Automatique SSL

Certbot configure automatiquement un cronjob pour renouveler les certificats.

**Vérifier le renouvellement automatique:**
```bash
sudo certbot renew --dry-run
```

Les certificats Let's Encrypt sont valables 90 jours et se renouvellent automatiquement.
