import { pool } from './database';

async function migrateToRoutines() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🚀 Iniciando migración a sistema de rutinas...');
    
    // Eliminar tablas antiguas
    console.log('❌ Eliminando tablas antiguas...');
    await connection.query('DROP TABLE IF EXISTS pack_exercises');
    await connection.query('DROP TABLE IF EXISTS workout_packs');
    console.log('✅ Tablas antiguas eliminadas');
    
    // Crear tabla de rutinas
    console.log('📋 Creando tabla routines...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS routines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_client_routine (client_id)
      )
    `);
    console.log('✅ Tabla routines creada');
    
    // Crear tabla de días de rutina
    console.log('📅 Creando tabla routine_days...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS routine_days (
        id INT AUTO_INCREMENT PRIMARY KEY,
        routine_id INT NOT NULL,
        day_number INT NOT NULL,
        name VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
        UNIQUE KEY unique_routine_day (routine_id, day_number),
        CHECK (day_number >= 1 AND day_number <= 7)
      )
    `);
    console.log('✅ Tabla routine_days creada');
    
    // Crear tabla de ejercicios por día
    console.log('💪 Creando tabla day_exercises...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS day_exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        routine_day_id INT NOT NULL,
        exercise_id INT NOT NULL,
        sets INT,
        reps VARCHAR(50),
        notes TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (routine_day_id) REFERENCES routine_days(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercise_library(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla day_exercises creada');
    
    // Crear índices
    console.log('🔍 Creando índices...');
    try {
      await connection.query('CREATE INDEX idx_routine_client ON routines(client_id)');
    } catch (e) {
      // Índice ya existe, ignorar
    }
    try {
      await connection.query('CREATE INDEX idx_day_routine ON routine_days(routine_id)');
    } catch (e) {
      // Índice ya existe, ignorar
    }
    try {
      await connection.query('CREATE INDEX idx_day_number ON routine_days(day_number)');
    } catch (e) {
      // Índice ya existe, ignorar
    }
    try {
      await connection.query('CREATE INDEX idx_exercise_day ON day_exercises(routine_day_id)');
    } catch (e) {
      // Índice ya existe, ignorar
    }
    try {
      await connection.query('CREATE INDEX idx_exercise_order ON day_exercises(order_index)');
    } catch (e) {
      // Índice ya existe, ignorar
    }
    console.log('✅ Índices creados');
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('Nueva estructura:');
    console.log('- routines: 1 rutina por cliente');
    console.log('- routine_days: días de la rutina (1-7)');
    console.log('- day_exercises: ejercicios por día');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

migrateToRoutines()
  .then(() => {
    console.log('✅ Proceso de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
