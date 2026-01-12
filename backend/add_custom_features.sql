-- Modificar tabla routine_days para agregar nombre personalizado
ALTER TABLE routine_days ADD COLUMN custom_name VARCHAR(100) AFTER day_number;

-- Crear tabla de ejercicios personalizados
CREATE TABLE IF NOT EXISTS custom_exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  muscle_group VARCHAR(50) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by)
);

-- Crear tabla de recetas
CREATE TABLE IF NOT EXISTS diet_recipes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by)
);

-- Crear tabla de alimentos de recetas
CREATE TABLE IF NOT EXISTS recipe_foods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit ENUM('gramos', 'unidades') NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES diet_recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food_library(id) ON DELETE CASCADE,
  INDEX idx_recipe (recipe_id)
);
