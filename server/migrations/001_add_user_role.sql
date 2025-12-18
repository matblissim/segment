-- Migration: Ajout du champ role aux users
-- Date: 2025-12-18

-- Ajouter la colonne role avec une valeur par défaut 'user'
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Créer un index pour les requêtes de recherche par rôle
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Mettre à jour le premier utilisateur (ID=1) en tant qu'admin
-- Ceci peut être modifié selon l'ID de votre compte
UPDATE users SET role = 'admin' WHERE id = 1;

-- Note: Pour mettre un utilisateur spécifique en admin par son strava_id:
-- UPDATE users SET role = 'admin' WHERE strava_id = YOUR_STRAVA_ID;
