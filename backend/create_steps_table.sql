-- Crear tabla para configuración de pasos por cliente
CREATE TABLE IF NOT EXISTS steps_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL UNIQUE,
  daily_goal INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índice para búsqueda rápida
CREATE INDEX idx_steps_settings_client ON steps_settings(client_id);
