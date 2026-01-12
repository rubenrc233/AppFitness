-- Eliminar tabla antigua de ejercicios
DROP TABLE IF EXISTS exercises;

-- Biblioteca de ejercicios predefinidos
CREATE TABLE IF NOT EXISTS exercise_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    muscle_group VARCHAR(100) NOT NULL, -- pecho, espalda, piernas, hombros, biceps, triceps, abdomen, cardio
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packs de entrenamiento (rutinas semanales)
CREATE TABLE IF NOT EXISTS workout_packs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    week_number INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ejercicios asignados a cada pack
CREATE TABLE IF NOT EXISTS pack_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pack_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT,
    reps VARCHAR(50), -- Puede ser "10-12" o "20"
    notes TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pack_id) REFERENCES workout_packs(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise_library(id) ON DELETE CASCADE
);

-- Índices para mejor rendimiento
CREATE INDEX idx_workout_packs_client ON workout_packs(client_id);
CREATE INDEX idx_pack_exercises_pack ON pack_exercises(pack_id);
CREATE INDEX idx_exercise_library_muscle ON exercise_library(muscle_group);
