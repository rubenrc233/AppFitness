-- Crear tabla de dietas (1 por cliente)
CREATE TABLE IF NOT EXISTS diets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Mi Dieta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla de comidas diarias (Desayuno, Almuerzo, Cena, etc.)
CREATE TABLE IF NOT EXISTS diet_meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  diet_id INT NOT NULL,
  meal_number INT NOT NULL,
  meal_name VARCHAR(100) NOT NULL DEFAULT 'Comida',
  meal_time VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (diet_id) REFERENCES diets(id) ON DELETE CASCADE
);

-- Crear tabla de opciones de comida (2-3 opciones por comida)
CREATE TABLE IF NOT EXISTS meal_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  diet_meal_id INT NOT NULL,
  option_number INT NOT NULL,
  name VARCHAR(100) DEFAULT 'Opción',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diet_meal_id) REFERENCES diet_meals(id) ON DELETE CASCADE
);

-- Crear tabla de biblioteca de alimentos (DEBE IR ANTES DE option_foods)
CREATE TABLE IF NOT EXISTS food_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Crear tabla de alimentos en cada opción
CREATE TABLE IF NOT EXISTS option_foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meal_option_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit ENUM('gramos', 'unidades') NOT NULL DEFAULT 'gramos',
  notes TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meal_option_id) REFERENCES meal_options(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food_library(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_diets_client ON diets(client_id);
CREATE INDEX idx_diet_meals_diet ON diet_meals(diet_id);
CREATE INDEX idx_meal_options_meal ON meal_options(diet_meal_id);
CREATE INDEX idx_option_foods_option ON option_foods(meal_option_id);
CREATE INDEX idx_food_library_category ON food_library(category);
