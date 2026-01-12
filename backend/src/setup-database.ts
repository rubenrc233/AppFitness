import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupDatabase() {
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
    console.error('\n❌ No se pudo conectar después de 5 intentos');
    console.error('💡 Railway puede estar bloqueando conexiones desde tu red');
    console.error('💡 Alternativa: Ejecuta create_tables.sql directamente en Railway Dashboard');
    process.exit(1);
  }

  try {
    // Crear tabla de usuarios
    console.log('📋 Creando tabla users...');
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
    console.log('✅ Tabla users creada');

    // Crear tabla de comidas
    console.log('📋 Creando tabla meals...');
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
    console.log('✅ Tabla meals creada');

    // Crear tabla de ejercicios
    console.log('📋 Creando tabla exercises...');
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
    console.log('✅ Tabla exercises creada');

    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tablas en la base de datos:', tables);

    await connection.end();
    console.log('\n✅ Setup completado exitosamente!');
    console.log('🚀 Ahora puedes ejecutar: npm start');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

setupDatabase();
