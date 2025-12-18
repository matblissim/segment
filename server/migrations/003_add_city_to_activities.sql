-- Migration: Ajout colonne city pour stocker la ville géocodée
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- Index pour améliorer les performances des requêtes par ville
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city);

-- Commentaire
COMMENT ON COLUMN activities.city IS 'Ville extraite par géocodage inversé des coordonnées GPS';
