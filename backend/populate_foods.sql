-- Poblar biblioteca de alimentos con categorías predefinidas

-- Verduras y Vegetales
INSERT INTO food_library (name, category, is_custom) VALUES
('Verdura', 'Verduras', FALSE),
('Ensalada', 'Verduras', FALSE),
('Legumbres', 'Verduras', FALSE);

-- Carnes
INSERT INTO food_library (name, category, is_custom) VALUES
('Pollo', 'Carnes', FALSE),
('Pavo', 'Carnes', FALSE),
('Ternera', 'Carnes', FALSE),
('Cerdo', 'Carnes', FALSE);

-- Pescados
INSERT INTO food_library (name, category, is_custom) VALUES
('Pescado Blanco', 'Pescados', FALSE),
('Pescado Azul', 'Pescados', FALSE),
('Marisco', 'Pescados', FALSE);

-- Huevos y Lácteos
INSERT INTO food_library (name, category, is_custom) VALUES
('Huevos', 'Proteínas', FALSE),
('Yogur', 'Lácteos', FALSE),
('Queso', 'Lácteos', FALSE),
('Leche', 'Lácteos', FALSE);

-- Carbohidratos
INSERT INTO food_library (name, category, is_custom) VALUES
('Arroz', 'Carbohidratos', FALSE),
('Pasta', 'Carbohidratos', FALSE),
('Pan', 'Carbohidratos', FALSE),
('Patata', 'Carbohidratos', FALSE),
('Avena', 'Carbohidratos', FALSE);

-- Frutas
INSERT INTO food_library (name, category, is_custom) VALUES
('Fruta', 'Frutas', FALSE),
('Frutos Secos', 'Frutas', FALSE);

-- Grasas
INSERT INTO food_library (name, category, is_custom) VALUES
('Aceite de Oliva', 'Grasas', FALSE),
('Aguacate', 'Grasas', FALSE);

-- Otros
INSERT INTO food_library (name, category, is_custom) VALUES
('Proteína en Polvo', 'Suplementos', FALSE);
