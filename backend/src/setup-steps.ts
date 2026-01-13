import { pool } from './database';

async function setupStepsTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Creando tabla steps_settings...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS steps_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL UNIQUE,
        daily_goal INT NOT NULL DEFAULT 10000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Tabla steps_settings creada correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

setupStepsTable();
