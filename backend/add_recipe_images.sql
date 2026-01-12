-- Agregar columna image_url a la tabla diet_recipes
ALTER TABLE diet_recipes 
ADD COLUMN image_url VARCHAR(500) NULL;
