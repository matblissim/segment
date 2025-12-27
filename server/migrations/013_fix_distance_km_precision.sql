-- Augmenter la précision de distance_km pour supporter les ultras (jusqu'à 9999.99 km)
ALTER TABLE training_sessions
ALTER COLUMN distance_km TYPE DECIMAL(6,2);
