-- Tabla para registros de entrenamientos
CREATE TABLE IF NOT EXISTS workout_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  day_id INT NOT NULL,
  day_exercise_id INT NOT NULL,
  set_number INT NOT NULL,
  weight DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (day_id) REFERENCES routine_days(id) ON DELETE CASCADE,
  FOREIGN KEY (day_exercise_id) REFERENCES day_exercises(id) ON DELETE CASCADE,
  INDEX idx_client_day (client_id, day_id),
  INDEX idx_exercise (day_exercise_id)
);
