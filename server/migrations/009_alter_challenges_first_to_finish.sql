-- Migration pour modifier le système de challenges vers "premier arrivé, premier gagnant"

-- Rendre end_date optionnel (nullable)
ALTER TABLE challenges ALTER COLUMN end_date DROP NOT NULL;

-- Ajouter la colonne completed_at pour tracker quand le gagnant a terminé
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Supprimer la contrainte de validité des dates (end_date peut maintenant être NULL)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_dates;

-- Mettre à jour les commentaires
COMMENT ON TABLE challenges IS 'Challenges sportifs entre amis - premier arrivé, premier gagnant';
COMMENT ON COLUMN challenges.end_date IS 'Date de fin optionnelle, par défaut 30 jours après start_date';
COMMENT ON COLUMN challenges.completed_at IS 'Date et heure à laquelle le gagnant a atteint l''objectif';
COMMENT ON COLUMN challenges.winner_id IS 'ID du gagnant (premier à atteindre l''objectif)';

-- Mettre à jour les challenges existants sans end_date explicite
UPDATE challenges
SET end_date = start_date + INTERVAL '30 days'
WHERE end_date IS NULL;
