import cron from 'node-cron';
import { pool } from '../database';
import { RowDataPacket } from 'mysql2';

// CRONJOB DESHABILITADO - Se ejecutará desde servicio externo (Railway Cron Jobs)
// Ejecutar todos los días a las 6:00 AM
/*
cron.schedule('0 6 * * *', async () => {
  console.log('🔄 [CRON] Verificando progresos pendientes...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar clientes con progreso pendiente para hoy
    const [clients] = await pool.query<RowDataPacket[]>(`
      SELECT ps.client_id, ps.frequency_weeks, ps.day_of_week, u.name
      FROM progress_settings ps
      JOIN users u ON ps.client_id = u.id
      WHERE ps.next_due_date <= ? 
        AND ps.is_enabled = true
        AND ps.client_id NOT IN (SELECT client_id FROM active_progress)
    `, [today]);
    
    if (clients.length === 0) {
      console.log('✅ [CRON] No hay progresos pendientes para hoy');
      return;
    }

    console.log(`📋 [CRON] Encontrados ${clients.length} clientes con progreso pendiente`);
    
    // Activar progreso para cada cliente
    for (const client of clients) {
      try {
        // Insertar en active_progress
        await pool.query(
          'INSERT INTO active_progress (client_id) VALUES (?)',
          [client.client_id]
        );
        
        // Calcular próxima fecha (hoy + frequency_weeks)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (client.frequency_weeks * 7));
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        // Actualizar next_due_date
        await pool.query(
          'UPDATE progress_settings SET next_due_date = ? WHERE client_id = ?',
          [nextDateStr, client.client_id]
        );
        
        console.log(`✅ [CRON] Progreso activado para ${client.name} (ID: ${client.client_id})`);
        console.log(`   Próxima fecha: ${nextDateStr}`);
      } catch (error) {
        console.error(`❌ [CRON] Error activando progreso para cliente ${client.client_id}:`, error);
      }
    }
    
    console.log('🎉 [CRON] Proceso completado');
    
  } catch (error) {
    console.error('❌ [CRON] Error en cron de progreso:', error);
  }
});
*/

// Verificación inicial deshabilitada
/*
setTimeout(async () => {
  console.log('🚀 [CRON] Verificación inicial de progresos...');
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const [clients] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count
      FROM progress_settings
      WHERE next_due_date <= ? 
        AND is_enabled = true
        AND client_id NOT IN (SELECT client_id FROM active_progress)
    `, [today]);
    
    console.log(`📊 [CRON] Clientes con progreso pendiente: ${(clients[0] as any).count}`);
  } catch (error) {
    console.error('❌ [CRON] Error en verificación inicial:', error);
  }
}, 5000);
*/

console.log('⏰ Cron job deshabilitado - se ejecutará desde servicio externo');

export default cron;
