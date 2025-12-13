# 🚀 INSTALLATION SIMPLE - COPIER-COLLER

## ÉTAPE 1: Connexion au serveur
```bash
ssh mathieudottir@51.159.67.199
```

## ÉTAPE 2: Installer les prérequis (copier TOUT d'un coup)
```bash
sudo apt update && \
sudo apt upgrade -y && \
sudo apt install -y curl build-essential git && \
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && \
sudo apt install -y nodejs && \
echo "✅ Node.js: $(node --version)" && \
echo "✅ npm: $(npm --version)"
```

## ÉTAPE 3: Créer le projet avec Vite (copier TOUT d'un coup)
```bash
cd ~ && \
npm create vite@latest strava-gamification -- --template react && \
cd strava-gamification && \
npm install && \
npm install -D tailwindcss postcss autoprefixer && \
npm install axios react-router-dom && \
npx tailwindcss init -p
```

## ÉTAPE 4: Créer le backend (copier TOUT d'un coup)
```bash
mkdir -p ~/strava-gamification/server/routes && \
cd ~/strava-gamification && \
npm install concurrently
```

## ÉTAPE 5: Configurer TailwindCSS
```bash
cat > tailwind.config.js << 'EOF'
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { strava: '#FC4C02' },
    },
  },
  plugins: [],
}
EOF
```

```bash
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
EOF
```

## ÉTAPE 6: Modifier package.json racine
```bash
cat > package.json << 'EOF'
{
  "name": "strava-gamification",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.1.2",
    "eslint": "^9.17.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.13.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.5"
  }
}
EOF
```

## ÉTAPE 7: Créer le backend package.json
```bash
cat > server/package.json << 'EOF'
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.11"
  }
}
EOF
```

## ÉTAPE 8: Installer les dépendances backend
```bash
cd ~/strava-gamification/server && npm install && cd ..
```

---

**⏸️ PAUSE ICI**

Maintenant je vais vous donner les fichiers à créer un par un.
Voulez-vous que je continue avec les fichiers du serveur ou du client en premier?

Ou préférez-vous que je vous donne un lien pour télécharger tout le code directement?
