# 🚀 Guide de Déploiement Complet - Serveur Ubuntu Vierge

## 📋 Prérequis
- Serveur: mathieudottir@51.159.67.199
- Système: Ubuntu vierge
- Accès: SSH

---

## 🔧 ÉTAPE 1: Connexion au serveur

```bash
ssh mathieudottir@51.159.67.199
```

---

## 📦 ÉTAPE 2: Installation des prérequis (Node.js, npm, Git)

Copiez-collez ces commandes UNE PAR UNE:

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de curl et build-essential
sudo apt install -y curl build-essential

# Installation de Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de Git
sudo apt install -y git

# Vérification
node --version  # Doit afficher v22.x.x
npm --version   # Doit afficher 10.x.x
git --version   # Doit afficher git version 2.x.x
```

---

## 📁 ÉTAPE 3: Créer le dossier du projet

```bash
# Créer et entrer dans le dossier
mkdir -p ~/strava-gamification
cd ~/strava-gamification
```

---

## 📥 ÉTAPE 4: Transférer le code sur le serveur

**Sur VOTRE ORDINATEUR LOCAL** (pas sur le serveur), ouvrez un nouveau terminal et tapez:

```bash
# Télécharger l'archive du code
# (Remplacez /chemin/vers/ par le vrai chemin où vous téléchargez le fichier)
scp strava-gamification-code.tar.gz mathieudottir@51.159.67.199:~/strava-gamification/
```

**Retournez sur le serveur SSH** et tapez:

```bash
# Décompresser l'archive
cd ~/strava-gamification
tar -xzf strava-gamification-code.tar.gz

# Vérifier que tout est là
ls -la
# Vous devriez voir: client/ server/ package.json README.md
```

---

## 📦 ÉTAPE 5: Installer toutes les dépendances

```bash
cd ~/strava-gamification

# Installer concurrently (pour lancer les 2 serveurs)
npm install

# Installer les dépendances du serveur
cd server
npm install

# Installer les dépendances du client
cd ../client
npm install

# Retourner à la racine
cd ..
```

⏱️ **Cette étape prend 2-3 minutes**

---

## 🔑 ÉTAPE 6: Obtenir vos clés Strava API

**Sur votre ordinateur**, ouvrez un navigateur:

1. Allez sur: https://www.strava.com/settings/api
2. Cliquez sur **"Create An App"**
3. Remplissez:
   - Application Name: `Strava Gamification`
   - Category: `Training`
   - Website: `http://51.159.67.199:5173`
   - Authorization Callback Domain: `51.159.67.199`
4. Cliquez sur **"Create"**

Vous obtiendrez:
- **Client ID**: un nombre (ex: 123456)
- **Client Secret**: une chaîne (ex: abc123def456...)

**NOTEZ-LES quelque part!**

---

## ⚙️ ÉTAPE 7: Configurer les variables d'environnement

**Sur le serveur SSH:**

```bash
cd ~/strava-gamification

# Créer le fichier .env du serveur
cat > server/.env << 'EOF'
STRAVA_CLIENT_ID=VOTRE_CLIENT_ID_ICI
STRAVA_CLIENT_SECRET=VOTRE_CLIENT_SECRET_ICI
REDIRECT_URI=http://51.159.67.199:5173/auth/callback
PORT=3001
EOF

# Créer le fichier .env du client
cat > client/.env << 'EOF'
VITE_API_URL=http://51.159.67.199:3001/api
EOF
```

**IMPORTANT**: Éditez le fichier server/.env pour mettre vos VRAIES clés:

```bash
nano server/.env
```

Remplacez:
- `VOTRE_CLIENT_ID_ICI` → par votre vrai Client ID
- `VOTRE_CLIENT_SECRET_ICI` → par votre vrai Client Secret

Puis:
- Appuyez sur `Ctrl+X`
- Tapez `Y`
- Appuyez sur `Entrée`

---

## 🔥 ÉTAPE 8: Ouvrir les ports du firewall

```bash
# Si vous utilisez UFW (firewall Ubuntu)
sudo ufw allow 3001/tcp   # Backend
sudo ufw allow 5173/tcp   # Frontend
sudo ufw status
```

**Si UFW n'est pas installé/activé, pas grave, passez à l'étape suivante.**

---

## 🚀 ÉTAPE 9: Lancer le site en mode développement

```bash
cd ~/strava-gamification
npm run dev
```

Vous devriez voir:
```
🚀 Server running on http://localhost:3001
  ➜  Local:   http://localhost:5173/
```

**Ouvrez votre navigateur sur:**
```
http://51.159.67.199:5173
```

✅ **BRAVO! Le site est en ligne!**

---

## 🔄 ÉTAPE 10 (OPTIONNEL): Lancer en production avec PM2

Pour que le site reste actif même après fermeture du terminal:

```bash
# Installer PM2
sudo npm install -g pm2

# Créer un script de démarrage
cat > ~/strava-gamification/start.sh << 'EOF'
#!/bin/bash
cd ~/strava-gamification/server && npm start &
cd ~/strava-gamification/client && npm run preview &
EOF

chmod +x ~/strava-gamification/start.sh

# Lancer avec PM2
pm2 start ~/strava-gamification/server/server.js --name strava-backend
pm2 start "cd ~/strava-gamification/client && npm run preview" --name strava-frontend

# Sauvegarder pour redémarrage auto
pm2 save
pm2 startup
```

---

## 📝 Commandes utiles

```bash
# Voir les logs
pm2 logs

# Redémarrer
pm2 restart all

# Arrêter
pm2 stop all

# Statut
pm2 status
```

---

## 🆘 Dépannage

### Le site ne charge pas
```bash
# Vérifier que les services tournent
pm2 status
# ou si en mode dev:
ps aux | grep node
```

### Erreur de port déjà utilisé
```bash
# Tuer les processus Node.js
killall node
# Puis relancer
```

### Vérifier les logs d'erreur
```bash
# Logs backend
cd ~/strava-gamification/server
npm run dev

# Dans un autre terminal
# Logs frontend
cd ~/strava-gamification/client
npm run dev
```

---

## ✅ Checklist finale

- [ ] Node.js installé (v22.x)
- [ ] npm installé (v10.x)
- [ ] Git installé
- [ ] Code transféré et décompressé
- [ ] Dépendances installées (root + server + client)
- [ ] Clés Strava obtenues et configurées dans server/.env
- [ ] Ports 3001 et 5173 ouverts
- [ ] Site accessible sur http://51.159.67.199:5173

**C'est prêt! 🎉**
