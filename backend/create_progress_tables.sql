-- ============================================
-- Tablas del Sistema de Progreso
-- ============================================

-- Tabla 1: Configuración de periodicidad por cliente
CREATE TABLE IF NOT EXISTS progress_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL UNIQUE,
  frequency_weeks INT NOT NULL,                    -- Cada cuántas semanas (1, 2, 3, etc.)
  day_of_week VARCHAR(10) NOT NULL,               -- 'monday', 'tuesday', 'wednesday', etc.
  next_due_date DATE,                              -- Próxima fecha calculada automáticamente
  is_enabled BOOLEAN DEFAULT true,                 -- Si el sistema está activo para este cliente
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla 2: Historial completo de actualizaciones de progreso
CREATE TABLE IF NOT EXISTS progress_updates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,                    -- Peso en kg
  front_photo_url TEXT NOT NULL,                   -- URL de Cloudinary (foto frontal)
  side_photo_url TEXT NOT NULL,                    -- URL de Cloudinary (foto lateral)
  back_photo_url TEXT NOT NULL,                    -- URL de Cloudinary (foto espalda)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_client_date (client_id, created_at DESC)
);

-- Tabla 3: Progreso actualmente activo (clientes que pueden subir)
CREATE TABLE IF NOT EXISTS active_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL UNIQUE,                   -- Solo puede haber 1 activo por cliente
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,                       -- Opcional: límite de 7 días
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar performance
CREATE INDEX idx_next_due_date ON progress_settings(next_due_date, is_enabled);
CREATE INDEX idx_active_client ON active_progress(client_id);
