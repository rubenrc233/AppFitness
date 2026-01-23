import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function setupPaymentTables() {
  console.log('🔄 Conectando a Railway MySQL...');
  console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  
  let retries = 5;
  let connection: mysql.Connection | null = null;
  
  while (retries > 0 && !connection) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });
      console.log('✅ Conectado a Railway MySQL');
    } catch (error: any) {
      retries--;
      console.log(`⚠️  Intento fallido (${5 - retries}/5): ${error.message}`);
      if (retries > 0) {
        console.log('🔄 Reintentando en 3 segundos...');
        await sleep(3000);
      }
    }
  }

  if (!connection) {
    console.error('❌ No se pudo conectar a la base de datos después de 5 intentos');
    throw new Error('Failed to connect to database');
  }

  try {
    console.log('Creating payment tables...');
    
    // Crear tabla de configuración de pagos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
        start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
        next_payment_date DATE NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_payment (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Crear tabla de histórico de pagos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        frequency VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_payment_history_user (user_id),
        INDEX idx_payment_history_date (payment_date),
        INDEX idx_payment_history_period (period_start, period_end)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Crear índices adicionales para payment_config
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_config_user ON payment_config(user_id);
    `).catch(() => {}); // Ignorar si ya existe
    
    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_config_next_date ON payment_config(next_payment_date);
    `).catch(() => {}); // Ignorar si ya existe
    
    console.log('✅ Payment tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating payment tables:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexión cerrada');
  }
}

if (require.main === module) {
  setupPaymentTables()
    .then(() => {
      console.log('✅ Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}
