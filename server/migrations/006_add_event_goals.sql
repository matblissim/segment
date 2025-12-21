-- Migration pour ajouter les objectifs de distance et D+ aux events

-- Ajouter les colonnes pour distance et dénivelé cible
ALTER TABLE events
ADD COLUMN IF NOT EXISTS target_distance DECIMAL,
ADD COLUMN IF NOT EXISTS target_elevation DECIMAL;

COMMENT ON COLUMN events.target_distance IS 'Distance cible en mètres (optionnel)';
COMMENT ON COLUMN events.target_elevation IS 'D+ cible en mètres (optionnel)';
