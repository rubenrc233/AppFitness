-- Agregar columna image_url a la tabla meal_options
ALTER TABLE meal_options 
ADD COLUMN image_url VARCHAR(500) NULL;
