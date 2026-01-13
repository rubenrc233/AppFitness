-- Tabla para suplementación de clientes
CREATE TABLE IF NOT EXISTS client_supplements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    time_of_day VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);
