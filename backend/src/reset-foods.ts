import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function resetFoods() {
  console.log('🔄 Conectando a Railway MySQL...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000,
      multipleStatements: true
    });
    
    console.log('✅ Conectado a Railway MySQL');
    
    // Leer el archivo SQL
    const sqlFile = fs.readFileSync(
      path.join(__dirname, '../reset_foods.sql'),
      'utf8'
    );
    
    console.log('🗑️  Eliminando alimentos duplicados...');
    
    // Ejecutar el SQL
    await connection.query(sqlFile);
    
    console.log('✅ Alimentos limpiados y repoblados correctamente');
    
    // Verificar el resultado
    const [foods] = await connection.query('SELECT COUNT(*) as total FROM food_library');
    console.log(`📊 Total de alimentos en la base de datos: ${(foods as any)[0].total}`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetFoods();
