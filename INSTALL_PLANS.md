# 🚀 Installation du système de Plans d'Entraînement

## 📋 Prérequis

Ce système a été ajouté au projet existant. Voici comment tout installer :

## 1️⃣ Migration Base de Données

```bash
# Depuis le dossier racine du projet
cd server

# Exécuter la migration SQL
psql -U postgres -d segment -f migrations/012_create_training_plans.sql

# OU si vous utilisez un script de migration automatique
npm run migrate  # (si configuré)
```

La migration va créer :
- Table `training_plans` (configuration des plans)
- Table `training_sessions` (séances détaillées jour par jour)
- Indexes pour performance
- Triggers pour `updated_at`

## 2️⃣ Backend (déjà committé ✅)

Le backend est complet et inclut :
- ✅ `server/migrations/012_create_training_plans.sql`
- ✅ `server/models/TrainingPlan.js`
- ✅ `server/routes/trainingPlans.js`
- ✅ `server/utils/planGenerator.js` (algorithme intelligent)
- ✅ Routes ajoutées dans `server/server.js`

**Redémarrez le serveur backend** :
```bash
cd server
npm restart

# OU avec PM2
pm2 restart server
```

## 3️⃣ Frontend - Pages à créer

### A) Service API (✅ Fait)

Déjà ajouté dans `client/src/services/api.js` :
```javascript
import { plansApi } from '../services/api';
```

### B) Pages à créer

#### **1. Page liste des plans** (`client/src/pages/Plans.jsx`)

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { plansApi } from '../services/api';
import Layout from '../components/Layout';
import { Card, CardBody, Typography, Button, Progress } from "@material-tailwind/react";
import { CalendarIcon, TrophyIcon, PlusIcon } from "@heroicons/react/24/solid";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await plansApi.getPlans();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <Layout showSportToggle={false}>
        <div className="flex justify-center items-center h-64">
          <Typography>Chargement...</Typography>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSportToggle={false}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <Typography variant="h3" color="blue-gray">
              Mes Plans d'Entraînement
            </Typography>
          </div>
          <Link to="/plans/create">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Créer un plan
            </Button>
          </Link>
        </div>

        {plans.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <Typography variant="h5" color="gray" className="mb-2">
                Aucun plan d'entraînement
              </Typography>
              <Typography color="gray" className="mb-6">
                Créez votre premier plan personnalisé pour atteindre vos objectifs
              </Typography>
              <Link to="/plans/create">
                <Button>Créer mon premier plan</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const progress = (plan.completed_sessions / plan.total_sessions) * 100;
              const daysUntilRace = Math.ceil(
                (new Date(plan.goal_date) - new Date()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Link key={plan.id} to={`/plans/${plan.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardBody>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Typography variant="h5" color="blue-gray">
                            {plan.name}
                          </Typography>
                          {plan.event_name && (
                            <div className="flex items-center gap-2 mt-1">
                              <TrophyIcon className="h-4 w-4 text-yellow-700" />
                              <Typography variant="small" color="gray">
                                {plan.event_name}
                              </Typography>
                            </div>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          daysUntilRace > 14 ? 'bg-blue-100 text-blue-700' :
                          daysUntilRace > 7 ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          J-{daysUntilRace}
                        </Typography>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <Typography variant="small" color="gray">Distance</Typography>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {(plan.goal_distance / 1000).toFixed(0)} km
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="small" color="gray">Date objectif</Typography>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {formatDate(plan.goal_date)}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="small" color="gray">Séances/sem.</Typography>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {plan.sessions_per_week}x
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="small" color="gray">Type</Typography>
                          <Typography variant="small" color="blue-gray" className="font-semibold capitalize">
                            {plan.race_type}
                          </Typography>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Typography variant="small" color="gray">
                            Progression
                          </Typography>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {plan.completed_sessions}/{plan.total_sessions} séances
                          </Typography>
                        </div>
                        <Progress value={progress} color="blue" />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
```

#### **2. Ajouter le bouton dans Events** (`client/src/pages/Events.jsx`)

Dans la carte de chaque événement, ajouter :

```jsx
import { Link } from 'react-router-dom';
import { CalendarIcon } from "@heroicons/react/24/solid";

// Dans le rendu de la carte event
<Link to={`/plans/create?eventId=${event.id}`}>
  <Button size="sm" className="flex items-center gap-2">
    <CalendarIcon className="h-4 w-4" />
    Créer un plan
  </Button>
</Link>
```

#### **3. Ajouter les routes** (`client/src/App.jsx`)

```jsx
import Plans from './pages/Plans';

// Dans les Routes
<Route
  path="/plans"
  element={
    <ProtectedRoute>
      <Plans />
    </ProtectedRoute>
  }
/>
```

## 4️⃣ Test de l'installation

### A) Vérifier que le backend fonctionne

```bash
curl http://localhost:3001/api/health
# Doit retourner: {"status":"ok"}
```

### B) Créer un plan de test

Dans la console navigateur (F12) :

```javascript
// Test API
const plan = await plansApi.createPlan({
  name: "Test Marathon",
  goalDistance: 42.195,
  goalElevation: 0,
  goalDate: "2025-05-01",
  raceType: "route",
  weeksDuration: 12,
  sessionsPerWeek: 4,
  availableDays: [1, 3, 5, 0], // Lundi, Mercredi, Vendredi, Dimanche
  userLevel: "intermediate",
  maxHeartRate: 190,
  vma: 16.5,
});

console.log('Plan créé:', plan);
```

### C) Vérifier que les séances sont générées

```javascript
const planDetails = await plansApi.getPlan(plan.plan.id);
console.log(`${planDetails.plan.sessions.length} séances générées`);
console.log('Première séance:', planDetails.plan.sessions[0]);
```

## 5️⃣ Build production

```bash
# Frontend
cd client
npm run build

# Les fichiers seront dans client/dist/

# Servir avec nginx ou autre
```

## 🎯 Fonctionnalités du système

### Algorithme intelligent inclut :
- ✅ Périodisation automatique (base/intensité/affûtage)
- ✅ Progression max 10%/semaine
- ✅ Semaines récupération tous les 3-4 semaines
- ✅ Calcul zones FC + allures (VMA, seuil, marathon)
- ✅ Spécifique trail si D+/km > 40m
- ✅ Cross-training : vélo, natation, crossfit, hyrox, musculation
- ✅ Adaptation niveau (débutant → expert)
- ✅ Types séances : EF, seuil, VMA, sortie longue, récup, côtes

### Options de création :
- Distance + D+ objectif
- Type course (route/trail/ultra)
- Allure cible (optionnel)
- Nombre semaines (4-52)
- Séances/semaine (3-7)
- Jours disponibles
- Cross-training types
- Niveau utilisateur
- FC max + VMA
- Volume actuel

## 📁 Structure des fichiers

```
server/
├── migrations/
│   └── 012_create_training_plans.sql  ← Migration DB
├── models/
│   └── TrainingPlan.js                ← Modèle backend
├── routes/
│   └── trainingPlans.js               ← Routes API
└── utils/
    └── planGenerator.js               ← Algorithme intelligent

client/
├── src/
│   ├── pages/
│   │   └── Plans.jsx                  ← Page liste (À créer)
│   └── services/
│       └── api.js                     ← Service API (✅ Déjà fait)
```

## 🐛 Dépannage

### Erreur migration DB
```bash
# Vérifier que la DB existe
psql -U postgres -l | grep segment

# Créer si nécessaire
createdb -U postgres segment
```

### Routes backend non trouvées
```bash
# Vérifier que le serveur a redémarré
pm2 logs server

# Tester directement
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/training-plans
```

### Frontend ne compile pas
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## ✅ Checklist installation

- [ ] Migration DB exécutée
- [ ] Serveur backend redémarré
- [ ] Page Plans.jsx créée
- [ ] Bouton ajouté dans Events
- [ ] Routes ajoutées dans App.jsx
- [ ] Test création plan OK
- [ ] Séances générées automatiquement

---

**Besoin d'aide ?** Consultez les logs :
- Backend : `pm2 logs server`
- DB : `sudo tail -f /var/log/postgresql/postgresql-*.log`
