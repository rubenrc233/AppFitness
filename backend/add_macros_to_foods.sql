-- Agregar columnas de macronutrientes a food_library
ALTER TABLE food_library 
ADD COLUMN protein_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Proteínas por 100g',
ADD COLUMN carbs_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Hidratos de carbono por 100g',
ADD COLUMN fat_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Grasas por 100g',
ADD COLUMN fiber_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Fibra por 100g',
ADD COLUMN sugar_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Azúcares por 100g';

-- Actualizar macros para alimentos existentes (valores aproximados por 100g)

-- Verduras y Vegetales
UPDATE food_library SET 
  protein_per_100g = 2.0, carbs_per_100g = 4.0, fat_per_100g = 0.3, fiber_per_100g = 2.0, sugar_per_100g = 2.0 
WHERE name = 'Verdura' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 1.5, carbs_per_100g = 3.0, fat_per_100g = 0.2, fiber_per_100g = 1.5, sugar_per_100g = 1.5 
WHERE name = 'Ensalada' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 9.0, carbs_per_100g = 20.0, fat_per_100g = 0.5, fiber_per_100g = 8.0, sugar_per_100g = 1.0 
WHERE name = 'Legumbres' AND is_custom = FALSE;

-- Carnes
UPDATE food_library SET 
  protein_per_100g = 31.0, carbs_per_100g = 0.0, fat_per_100g = 3.6, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Pollo' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 29.0, carbs_per_100g = 0.0, fat_per_100g = 1.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Pavo' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 26.0, carbs_per_100g = 0.0, fat_per_100g = 15.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Ternera' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 27.0, carbs_per_100g = 0.0, fat_per_100g = 14.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Cerdo' AND is_custom = FALSE;

-- Pescados
UPDATE food_library SET 
  protein_per_100g = 20.0, carbs_per_100g = 0.0, fat_per_100g = 1.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Pescado Blanco' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 20.0, carbs_per_100g = 0.0, fat_per_100g = 10.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Pescado Azul' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 18.0, carbs_per_100g = 2.0, fat_per_100g = 1.5, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Marisco' AND is_custom = FALSE;

-- Huevos y Lácteos
UPDATE food_library SET 
  protein_per_100g = 13.0, carbs_per_100g = 1.1, fat_per_100g = 11.0, fiber_per_100g = 0.0, sugar_per_100g = 1.1 
WHERE name = 'Huevos' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 5.0, carbs_per_100g = 4.0, fat_per_100g = 1.5, fiber_per_100g = 0.0, sugar_per_100g = 4.0 
WHERE name = 'Yogur' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 25.0, carbs_per_100g = 1.3, fat_per_100g = 22.0, fiber_per_100g = 0.0, sugar_per_100g = 0.5 
WHERE name = 'Queso' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 3.4, carbs_per_100g = 4.8, fat_per_100g = 1.0, fiber_per_100g = 0.0, sugar_per_100g = 4.8 
WHERE name = 'Leche' AND is_custom = FALSE;

-- Carbohidratos
UPDATE food_library SET 
  protein_per_100g = 2.7, carbs_per_100g = 28.0, fat_per_100g = 0.3, fiber_per_100g = 0.4, sugar_per_100g = 0.0 
WHERE name = 'Arroz' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 13.0, carbs_per_100g = 75.0, fat_per_100g = 1.5, fiber_per_100g = 3.0, sugar_per_100g = 2.7 
WHERE name = 'Pasta' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 9.0, carbs_per_100g = 49.0, fat_per_100g = 3.2, fiber_per_100g = 2.7, sugar_per_100g = 5.0 
WHERE name = 'Pan' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 2.0, carbs_per_100g = 17.0, fat_per_100g = 0.1, fiber_per_100g = 2.2, sugar_per_100g = 0.8 
WHERE name = 'Patata' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 17.0, carbs_per_100g = 66.0, fat_per_100g = 7.0, fiber_per_100g = 11.0, sugar_per_100g = 0.0 
WHERE name = 'Avena' AND is_custom = FALSE;

-- Frutas
UPDATE food_library SET 
  protein_per_100g = 0.5, carbs_per_100g = 12.0, fat_per_100g = 0.2, fiber_per_100g = 2.0, sugar_per_100g = 10.0 
WHERE name = 'Fruta' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 15.0, carbs_per_100g = 21.0, fat_per_100g = 54.0, fiber_per_100g = 7.0, sugar_per_100g = 4.0 
WHERE name = 'Frutos Secos' AND is_custom = FALSE;

-- Grasas
UPDATE food_library SET 
  protein_per_100g = 0.0, carbs_per_100g = 0.0, fat_per_100g = 100.0, fiber_per_100g = 0.0, sugar_per_100g = 0.0 
WHERE name = 'Aceite de Oliva' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 2.0, carbs_per_100g = 9.0, fat_per_100g = 15.0, fiber_per_100g = 7.0, sugar_per_100g = 0.7 
WHERE name = 'Aguacate' AND is_custom = FALSE;

-- Suplementos
UPDATE food_library SET 
  protein_per_100g = 80.0, carbs_per_100g = 5.0, fat_per_100g = 5.0, fiber_per_100g = 0.0, sugar_per_100g = 2.0 
WHERE name = 'Proteína en Polvo' AND is_custom = FALSE;

-- Verduras adicionales (si existen)
UPDATE food_library SET 
  protein_per_100g = 0.9, carbs_per_100g = 10.0, fat_per_100g = 0.2, fiber_per_100g = 2.8, sugar_per_100g = 4.7 
WHERE name = 'Zanahoria' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 1.0, carbs_per_100g = 6.0, fat_per_100g = 0.3, fiber_per_100g = 2.1, sugar_per_100g = 4.2 
WHERE name = 'Pimiento' AND is_custom = FALSE;

-- Frutas adicionales (si existen)
UPDATE food_library SET 
  protein_per_100g = 0.3, carbs_per_100g = 14.0, fat_per_100g = 0.2, fiber_per_100g = 2.4, sugar_per_100g = 10.0 
WHERE name = 'Manzana' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 1.1, carbs_per_100g = 23.0, fat_per_100g = 0.3, fiber_per_100g = 2.6, sugar_per_100g = 12.0 
WHERE name = 'Plátano' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 0.9, carbs_per_100g = 12.0, fat_per_100g = 0.1, fiber_per_100g = 2.4, sugar_per_100g = 9.0 
WHERE name = 'Naranja' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 0.7, carbs_per_100g = 8.0, fat_per_100g = 0.3, fiber_per_100g = 2.0, sugar_per_100g = 5.0 
WHERE name = 'Fresas' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 0.7, carbs_per_100g = 14.0, fat_per_100g = 0.3, fiber_per_100g = 2.4, sugar_per_100g = 10.0 
WHERE name = 'Arándanos' AND is_custom = FALSE;

-- Legumbres adicionales (si existen)
UPDATE food_library SET 
  protein_per_100g = 9.0, carbs_per_100g = 27.0, fat_per_100g = 3.0, fiber_per_100g = 8.0, sugar_per_100g = 0.0 
WHERE name = 'Garbanzos cocidos' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 9.0, carbs_per_100g = 20.0, fat_per_100g = 0.4, fiber_per_100g = 8.0, sugar_per_100g = 2.0 
WHERE name = 'Lentejas cocidas' AND is_custom = FALSE;

UPDATE food_library SET 
  protein_per_100g = 8.0, carbs_per_100g = 21.0, fat_per_100g = 0.5, fiber_per_100g = 6.0, sugar_per_100g = 0.0 
WHERE name = 'Alubias cocidas' AND is_custom = FALSE;
