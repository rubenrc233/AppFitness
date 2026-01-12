-- EJECUTA ESTE SCRIPT EN RAILWAY DIRECTAMENTE
-- Variables → Connect → Query → Ejecuta este SQL

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'client') DEFAULT 'client',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de comidas (dieta)
CREATE TABLE IF NOT EXISTS meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  meal_name VARCHAR(255) NOT NULL,
  meal_time VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear tabla de ejercicios (rutina)
CREATE TABLE IF NOT EXISTS exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  sets INT,
  reps INT,
  notes TEXT,
  day VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verificar que se crearon las tablas
SHOW TABLES;

-- Ver estructura de las tablas
DESCRIBE users;
DESCRIBE meals;
DESCRIBE exercises;
