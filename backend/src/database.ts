import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Inicializar tablas
export async function initDatabase() {
  let retries = 3;
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully');
      
      // Tabla de usuarios
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'client') DEFAULT 'client',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de comidas (dieta)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS meals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_id INT NOT NULL,
          meal_name VARCHAR(255) NOT NULL,
          meal_time VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Tabla de ejercicios (rutina)
      await connection.query(`
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
        )
      `);

      console.log('✅ Database tables initialized successfully');
      connection.release();
      return;
    } catch (error) {
      retries--;
      console.error(`❌ Error initializing database (${3 - retries}/3):`, error);
      if (retries === 0) {
        console.error('Failed to connect after 3 attempts');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
