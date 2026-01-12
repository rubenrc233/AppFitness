import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function setupDietTables() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
      multipleStatements: true
    });

    console.log('✅ Conectado a la base de datos');

    // Leer archivo SQL de creación de tablas
    console.log('\n📋 Creando tablas de dietas...');
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, '../create_diet_tables.sql'),
      'utf8'
    );

    // Ejecutar creación de tablas
    const statements = createTablesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.query(statement);
        const match = statement.match(/CREATE\s+(?:TABLE|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
        if (match) {
          console.log(`  ✓ ${match[1]}`);
        }
      } catch (error: any) {
        // Ignorar errores de "ya existe" o índices duplicados
        if (!error.message.includes('already exists') && !error.message.includes('Duplicate key')) {
          console.error(`  ✗ Error:`, error.message);
        }
      }
    }

    // Leer archivo SQL de población de alimentos
    console.log('\n📦 Poblando biblioteca de alimentos...');
    const populateFoodsSQL = fs.readFileSync(
      path.join(__dirname, '../populate_foods.sql'),
      'utf8'
    );

    // Ejecutar población de alimentos
    const insertStatements = populateFoodsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of insertStatements) {
      try {
        await connection.query(statement);
        const match = statement.match(/INSERT\s+INTO\s+(\S+)/i);
        if (match) {
          console.log(`  ✓ Alimentos insertados`);
        }
      } catch (error: any) {
        // Ignorar errores de duplicados
        if (!error.message.includes('Duplicate entry')) {
          console.error(`  ✗ Error:`, error.message);
        }
      }
    }

    console.log('\n✅ Configuración de dietas completada con éxito!');
    console.log('\n📊 Tablas creadas:');
    console.log('   - diets');
    console.log('   - diet_meals');
    console.log('   - meal_options');
    console.log('   - option_foods');
    console.log('   - food_library');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
setupDietTables()
  .then(() => {
    console.log('\n🎉 ¡Listo para usar el sistema de dietas!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
