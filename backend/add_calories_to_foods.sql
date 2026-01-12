-- Agregar columna de calorías a food_library (si no existe)
-- ALTER TABLE food_library 
-- ADD COLUMN calories_per_100g DECIMAL(10, 2) DEFAULT 0 COMMENT 'Calorías por 100g/100ml';

-- Actualizar calorías para alimentos existentes (valores aproximados por 100g)

-- Verduras y Vegetales
UPDATE food_library SET calories_per_100g = 25 WHERE name = 'Verdura' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 20 WHERE name = 'Ensalada' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 120 WHERE name = 'Legumbres' AND is_custom = FALSE;

-- Carnes
UPDATE food_library SET calories_per_100g = 165 WHERE name = 'Pollo' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 143 WHERE name = 'Pavo' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 250 WHERE name = 'Ternera' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 242 WHERE name = 'Cerdo' AND is_custom = FALSE;

-- Pescados
UPDATE food_library SET calories_per_100g = 96 WHERE name = 'Pescado Blanco' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 180 WHERE name = 'Pescado Azul' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 90 WHERE name = 'Marisco' AND is_custom = FALSE;

-- Huevos y Lácteos
UPDATE food_library SET calories_per_100g = 155 WHERE name = 'Huevos' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 59 WHERE name = 'Yogur' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 300 WHERE name = 'Queso' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 50 WHERE name = 'Leche' AND is_custom = FALSE;

-- Carbohidratos
UPDATE food_library SET calories_per_100g = 130 WHERE name = 'Arroz' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 371 WHERE name = 'Pasta' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 265 WHERE name = 'Pan' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 77 WHERE name = 'Patata' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 389 WHERE name = 'Avena' AND is_custom = FALSE;

-- Frutas
UPDATE food_library SET calories_per_100g = 50 WHERE name = 'Fruta' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 600 WHERE name = 'Frutos Secos' AND is_custom = FALSE;

-- Grasas
UPDATE food_library SET calories_per_100g = 884 WHERE name = 'Aceite de Oliva' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 160 WHERE name = 'Aguacate' AND is_custom = FALSE;

-- Suplementos
UPDATE food_library SET calories_per_100g = 380 WHERE name = 'Proteína en Polvo' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 41 WHERE name = 'Zanahoria' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 34 WHERE name = 'Pimiento' AND is_custom = FALSE;

-- Frutas
UPDATE food_library SET calories_per_100g = 52 WHERE name = 'Manzana' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 89 WHERE name = 'Plátano' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 47 WHERE name = 'Naranja' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 32 WHERE name = 'Fresas' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 50 WHERE name = 'Arándanos' AND is_custom = FALSE;

-- Legumbres
UPDATE food_library SET calories_per_100g = 164 WHERE name = 'Garbanzos cocidos' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 127 WHERE name = 'Lentejas cocidas' AND is_custom = FALSE;
UPDATE food_library SET calories_per_100g = 132 WHERE name = 'Alubias cocidas' AND is_custom = FALSE;
