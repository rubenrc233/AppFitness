import { pool } from './database';

async function setupWorkoutTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🏋️ Configurando tablas de entrenamientos...');
    
    // Eliminar tabla antigua
    console.log('Eliminando tabla antigua exercises...');
    await connection.query('DROP TABLE IF EXISTS exercises');
    
    // Crear tabla de biblioteca de ejercicios
    console.log('Creando tabla exercise_library...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exercise_library (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        muscle_group VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de packs de entrenamiento
    console.log('Creando tabla workout_packs...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_packs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        week_number INT DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Crear tabla de ejercicios por pack
    console.log('Creando tabla pack_exercises...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pack_exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pack_id INT NOT NULL,
        exercise_id INT NOT NULL,
        sets INT,
        reps VARCHAR(50),
        notes TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pack_id) REFERENCES workout_packs(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercise_library(id) ON DELETE CASCADE
      )
    `);
    
    // Verificar si ya hay ejercicios
    const [existing]: any = await connection.query('SELECT COUNT(*) as count FROM exercise_library');
    
    if (existing[0].count === 0) {
      console.log('📚 Poblando biblioteca de ejercicios...');
      
      // PECHO
      const pecho = [
        ['Press Banca Plano', 'pecho', 'Ejercicio básico de empuje horizontal para pectoral mayor'],
        ['Press Banca Inclinado', 'pecho', 'Enfoque en pectoral superior con banca inclinada 30-45°'],
        ['Press Banca Declinado', 'pecho', 'Trabaja la porción inferior del pectoral'],
        ['Aperturas con Mancuernas', 'pecho', 'Aislamiento de pectoral con movimiento de apertura'],
        ['Fondos en Paralelas', 'pecho', 'Ejercicio de peso corporal para pecho y tríceps'],
        ['Cruces en Polea Alta', 'pecho', 'Aislamiento con polea, enfoque en contracción'],
        ['Press con Mancuernas Plano', 'pecho', 'Mayor rango de movimiento que barra'],
        ['Flexiones', 'pecho', 'Ejercicio básico de peso corporal'],
      ];
      
      // ESPALDA
      const espalda = [
        ['Dominadas', 'espalda', 'Ejercicio rey para dorsal ancho'],
        ['Remo con Barra', 'espalda', 'Desarrollo completo de la espalda media'],
        ['Peso Muerto', 'espalda', 'Ejercicio compuesto para toda la cadena posterior'],
        ['Jalones al Pecho', 'espalda', 'Alternativa a dominadas, enfoque en dorsal'],
        ['Remo con Mancuerna', 'espalda', 'Trabajo unilateral de la espalda'],
        ['Remo en Polea Baja', 'espalda', 'Aislamiento de espalda media y baja'],
        ['Face Pulls', 'espalda', 'Deltoides posterior y trapecio'],
      ];
      
      // PIERNAS
      const piernas = [
        ['Sentadilla con Barra', 'piernas', 'Ejercicio rey para desarrollo de piernas'],
        ['Prensa de Piernas', 'piernas', 'Máquina para cuádriceps y glúteos'],
        ['Peso Muerto Rumano', 'piernas', 'Enfoque en femorales y glúteos'],
        ['Zancadas con Mancuernas', 'piernas', 'Trabajo unilateral de piernas'],
        ['Curl Femoral', 'piernas', 'Aislamiento de femorales'],
        ['Extensión de Cuádriceps', 'piernas', 'Aislamiento de cuádriceps'],
        ['Hip Thrust', 'piernas', 'Desarrollo de glúteos'],
      ];
      
      // HOMBROS
      const hombros = [
        ['Press Militar con Barra', 'hombros', 'Desarrollo completo de hombros'],
        ['Press con Mancuernas', 'hombros', 'Mayor rango de movimiento'],
        ['Elevaciones Laterales', 'hombros', 'Aislamiento de deltoides lateral'],
        ['Elevaciones Frontales', 'hombros', 'Enfoque en deltoides anterior'],
        ['Pájaros con Mancuernas', 'hombros', 'Deltoides posterior'],
        ['Remo al Mentón', 'hombros', 'Deltoides y trapecio superior'],
      ];
      
      // BÍCEPS
      const biceps = [
        ['Curl con Barra Z', 'biceps', 'Desarrollo general del bíceps'],
        ['Curl con Mancuernas', 'biceps', 'Trabajo unilateral con supinación'],
        ['Curl Martillo', 'biceps', 'Enfoque en braquial y braquiorradial'],
        ['Curl en Banco Scott', 'biceps', 'Aislamiento del bíceps'],
        ['Curl Concentrado', 'biceps', 'Máximo aislamiento del bíceps'],
      ];
      
      // TRÍCEPS
      const triceps = [
        ['Press Francés', 'triceps', 'Aislamiento de tríceps tumbado'],
        ['Fondos en Paralelas', 'triceps', 'Ejercicio compuesto para tríceps'],
        ['Extensiones en Polea', 'triceps', 'Aislamiento con agarre de cuerda'],
        ['Patada de Tríceps', 'triceps', 'Trabajo unilateral de tríceps'],
        ['Press Cerrado', 'triceps', 'Variación de press para tríceps'],
      ];
      
      // ABDOMEN
      const abdomen = [
        ['Crunch Abdominal', 'abdomen', 'Ejercicio básico de abdomen'],
        ['Plancha Frontal', 'abdomen', 'Isométrico para core'],
        ['Elevación de Piernas', 'abdomen', 'Trabajo del abdomen inferior'],
        ['Bicicleta Abdominal', 'abdomen', 'Rotación para oblicuos'],
        ['Plancha Lateral', 'abdomen', 'Isométrico para oblicuos'],
      ];
      
      // CARDIO
      const cardio = [
        ['Carrera Continua', 'cardio', 'Trote a ritmo constante'],
        ['HIIT en Cinta', 'cardio', 'Intervalos de alta intensidad'],
        ['Bicicleta Estática', 'cardio', 'Bajo impacto cardiovascular'],
        ['Elíptica', 'cardio', 'Bajo impacto, movimiento natural'],
        ['Burpees', 'cardio', 'Ejercicio de cuerpo completo'],
      ];
      
      const allExercises = [...pecho, ...espalda, ...piernas, ...hombros, ...biceps, ...triceps, ...abdomen, ...cardio];
      
      for (const [name, group, desc] of allExercises) {
        await connection.query(
          'INSERT INTO exercise_library (name, muscle_group, description) VALUES (?, ?, ?)',
          [name, group, desc]
        );
      }
      
      console.log(`✅ ${allExercises.length} ejercicios agregados a la biblioteca`);
    } else {
      console.log('✅ La biblioteca de ejercicios ya está poblada');
    }
    
    console.log('✅ Tablas de entrenamientos configuradas correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

setupWorkoutTables();