import { pool } from './database';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  try {
    console.log('🔄 Ejecutando migración de calorías...');
    
    const sql = fs.readFileSync(path.join(__dirname, '..', 'add_calories_to_foods.sql'), 'utf-8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          if (!error.message.includes('Duplicate column')) {
            console.error('❌ Error:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Columna de calorías agregada y valores actualizados');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
})();
