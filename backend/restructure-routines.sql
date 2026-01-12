-- NUEVA ESTRUCTURA: RUTINAS Y DÍAS
-- Cada cliente tiene 1 rutina
-- Cada rutina tiene de 1 a 7 días
-- Cada día tiene ejercicios

-- Eliminar tablas antiguas
DROP TABLE IF EXISTS pack_exercises;
DROP TABLE IF EXISTS workout_packs;

-- Tabla de rutinas (1 por cliente)
CREATE TABLE IF NOT EXISTS routines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_client_routine (client_id)
);

-- Tabla de días de rutina (antes eran "packs")
CREATE TABLE IF NOT EXISTS routine_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  routine_id INT NOT NULL,
  day_number INT NOT NULL,
  name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
  UNIQUE KEY unique_routine_day (routine_id, day_number),
  CHECK (day_number >= 1 AND day_number <= 7)
);

-- Tabla de ejercicios por día
CREATE TABLE IF NOT EXISTS day_exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  routine_day_id INT NOT NULL,
  exercise_id INT NOT NULL,
  sets INT,
  reps VARCHAR(50),
  notes TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routine_day_id) REFERENCES routine_days(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercise_library(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_routine_client ON routines(client_id);
CREATE INDEX idx_day_routine ON routine_days(routine_id);
CREATE INDEX idx_day_number ON routine_days(day_number);
CREATE INDEX idx_exercise_day ON day_exercises(routine_day_id);
CREATE INDEX idx_exercise_order ON day_exercises(order_index);
