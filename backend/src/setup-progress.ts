import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function setupProgress() {
  console.log('🚀 Iniciando configuración de tablas de progreso...');

  // Crear conexión con multipleStatements habilitado
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'nozomi.proxy.rlwy.net',
    port: Number(process.env.DB_PORT) || 37833,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'lTafMfRpFqaAhkHYGsjFIJJxvxhWLULG',
    database: process.env.DB_NAME || 'railway',
    multipleStatements: true // Permitir múltiples statements en una consulta
  });

  try {
    // Leer archivo SQL completo
    const sqlFile = path.join(__dirname, '..', 'create_progress_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📋 Ejecutando SQL para crear tablas y índices...');
    
    // Ejecutar todo el SQL de una vez
    await connection.query(sql);

    console.log('✅ Tabla progress_settings creada/verificada');
    console.log('✅ Tabla progress_updates creada/verificada');
    console.log('✅ Tabla active_progress creada/verificada');
    console.log('✅ Índices creados/verificados');

    console.log('\n🎉 ¡Tablas de progreso configuradas correctamente!');
    console.log('\n📊 Tablas creadas:');
    console.log('   - progress_settings (configuración por cliente)');
    console.log('   - progress_updates (historial completo)');
    console.log('   - active_progress (progresos activos)');
    console.log('\n⏰ Cron job: Se ejecutará diariamente a las 6:00 AM');
    console.log('💡 Configura el progreso desde la app (Admin → Cliente → Ver Progreso)');

  } catch (error) {
    console.error('❌ Error configurando tablas de progreso:', error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

setupProgress();
