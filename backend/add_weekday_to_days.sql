-- Añadir campo weekday a routine_days
-- 0 = Lunes, 1 = Martes, 2 = Miércoles, 3 = Jueves, 4 = Viernes, 5 = Sábado, 6 = Domingo

ALTER TABLE routine_days ADD COLUMN weekday INT DEFAULT NULL;

-- Actualizar días existentes con valores por defecto basados en day_number
UPDATE routine_days SET weekday = day_number - 1 WHERE weekday IS NULL;
