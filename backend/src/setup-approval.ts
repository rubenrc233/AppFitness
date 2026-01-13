import { pool } from './database';

async function run() {
  console.log('🔧 Añadiendo sistema de aprobación de clientes...');
  
  // Añadir columna is_approved (por defecto TRUE para los existentes)
  try {
    await pool.query('ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT TRUE');
    console.log('✅ Columna is_approved añadida');
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ La columna is_approved ya existe');
    } else {
      throw e;
    }
  }
  
  // Asegurar que los admins están aprobados
  await pool.query('UPDATE users SET is_approved = TRUE WHERE role = "admin"');
  console.log('✅ Admins marcados como aprobados');
  
  // Los clientes existentes quedan aprobados (por el DEFAULT TRUE)
  console.log('✅ Sistema de aprobación configurado');
  
  process.exit(0);
}

run().catch(e => {
  console.log('Error:', e.message);
  process.exit(1);
});
