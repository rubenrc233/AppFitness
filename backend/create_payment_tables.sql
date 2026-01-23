-- Tabla de configuración de pagos para cada cliente
CREATE TABLE IF NOT EXISTS payment_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL, -- Cantidad a pagar
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'biannual', 'annual')), -- Periodicidad
    start_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha de inicio del sistema de pago
    next_payment_date DATE NOT NULL, -- Próxima fecha de pago calculada
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabla de histórico de pagos
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Fecha en que se registró el pago
    period_start DATE NOT NULL, -- Inicio del período cubierto
    period_end DATE NOT NULL, -- Fin del período cubierto
    frequency VARCHAR(20) NOT NULL,
    notes TEXT, -- Notas opcionales
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_payment_config_user ON payment_config(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_config_next_date ON payment_config(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_period ON payment_history(period_start, period_end);
