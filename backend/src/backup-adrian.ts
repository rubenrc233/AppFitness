import { pool } from './database';
import { RowDataPacket } from 'mysql2';
import * as fs from 'fs';
import * as path from 'path';

async function backupAdrian() {
  try {
    console.log('🔍 Buscando usuario Adrian Estrada...');

    // 1. Find Adrian Estrada's user
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE name LIKE '%Adrian%Estrada%'"
    );

    if (users.length === 0) {
      console.error('❌ No se encontró el usuario Adrian Estrada');
      // List all users for reference
      const [allUsers] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, email, role FROM users"
      );
      console.log('Usuarios disponibles:');
      allUsers.forEach(u => console.log(`  ID: ${u.id} - ${u.name} (${u.email}) [${u.role}]`));
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Usuario encontrado: ID=${user.id}, Name=${user.name}, Email=${user.email}`);

    const clientId = user.id;
    const lines: string[] = [];

    lines.push('-- =====================================================');
    lines.push(`-- BACKUP COMPLETO DE RUTINA - ${user.name}`);
    lines.push(`-- Generado: ${new Date().toISOString()}`);
    lines.push(`-- Client ID: ${clientId}`);
    lines.push('-- =====================================================');
    lines.push('-- INSTRUCCIONES: Ejecutar este script si se borran los datos');
    lines.push('-- El script restaura la rutina, días, ejercicios y logs');
    lines.push('-- =====================================================');
    lines.push('');

    // 2. Get routine
    const [routines] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM routines WHERE client_id = ?',
      [clientId]
    );

    if (routines.length === 0) {
      console.log('⚠️ No se encontró rutina para este usuario');
      // Still backup workout logs if they exist
    } else {
      const routine = routines[0];
      console.log(`📋 Rutina encontrada: ID=${routine.id}, Name="${routine.name}"`);

      lines.push('-- === PASO 1: Eliminar datos existentes (si los hay) para evitar duplicados ===');
      lines.push(`DELETE FROM routines WHERE client_id = ${clientId};`);
      lines.push('');

      lines.push('-- === PASO 2: Restaurar rutina ===');
      lines.push(`INSERT INTO routines (id, client_id, name, created_at, updated_at) VALUES (${routine.id}, ${clientId}, ${escapeString(routine.name)}, ${escapeDate(routine.created_at)}, ${escapeDate(routine.updated_at)});`);
      lines.push('');

      // 3. Get routine days
      const [days] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY day_number',
        [routine.id]
      );

      console.log(`📅 Días encontrados: ${days.length}`);

      if (days.length > 0) {
        lines.push('-- === PASO 3: Restaurar días de rutina ===');
        for (const day of days) {
          lines.push(`INSERT INTO routine_days (id, routine_id, day_number, weekday, name, custom_name, notes, created_at, updated_at) VALUES (${day.id}, ${routine.id}, ${day.day_number}, ${day.weekday !== null && day.weekday !== undefined ? day.weekday : 'NULL'}, ${escapeString(day.name)}, ${day.custom_name ? escapeString(day.custom_name) : 'NULL'}, ${day.notes ? escapeString(day.notes) : 'NULL'}, ${escapeDate(day.created_at)}, ${escapeDate(day.updated_at)});`);
        }
        lines.push('');

        // 4. Get exercises for each day
        const dayIds = days.map(d => d.id);
        const [exercises] = await pool.query<RowDataPacket[]>(
          `SELECT de.*, el.name as exercise_name, el.muscle_group 
           FROM day_exercises de
           JOIN exercise_library el ON de.exercise_id = el.id
           WHERE de.routine_day_id IN (${dayIds.join(',')})
           ORDER BY de.routine_day_id, de.order_index, de.id`
        );

        console.log(`💪 Ejercicios encontrados: ${exercises.length}`);

        if (exercises.length > 0) {
          lines.push('-- === PASO 4: Restaurar ejercicios por día ===');
          lines.push('-- Formato: (id, routine_day_id, exercise_id, sets, reps, notes, order_index)');

          let currentDay = -1;
          for (const ex of exercises) {
            if (ex.routine_day_id !== currentDay) {
              const dayInfo = days.find(d => d.id === ex.routine_day_id);
              lines.push(`-- --- ${dayInfo?.custom_name || dayInfo?.name || `Día ${dayInfo?.day_number}`} (day_id=${ex.routine_day_id}) ---`);
              currentDay = ex.routine_day_id;
            }
            lines.push(`INSERT INTO day_exercises (id, routine_day_id, exercise_id, sets, reps, notes, order_index, created_at) VALUES (${ex.id}, ${ex.routine_day_id}, ${ex.exercise_id}, ${ex.sets || 'NULL'}, ${ex.reps ? escapeString(ex.reps) : 'NULL'}, ${ex.notes ? escapeString(ex.notes) : 'NULL'}, ${ex.order_index || 0}, ${escapeDate(ex.created_at)}); -- ${ex.exercise_name} (${ex.muscle_group})`);
          }
          lines.push('');
        }

        // 5. Get workout logs
        const [logs] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM workout_logs WHERE client_id = ? ORDER BY completed_at`,
          [clientId]
        );

        console.log(`📊 Workout logs encontrados: ${logs.length}`);

        if (logs.length > 0) {
          lines.push('-- === PASO 5: Restaurar historial de entrenamientos (workout_logs) ===');
          lines.push(`-- Total: ${logs.length} registros`);

          // Batch inserts for performance
          const batchSize = 50;
          for (let i = 0; i < logs.length; i += batchSize) {
            const batch = logs.slice(i, i + batchSize);
            lines.push(`INSERT INTO workout_logs (id, client_id, day_id, day_exercise_id, set_number, weight, completed_at) VALUES`);
            const valueLines = batch.map((log, idx) => {
              const comma = idx < batch.length - 1 ? ',' : ';';
              return `  (${log.id}, ${clientId}, ${log.day_id}, ${log.day_exercise_id}, ${log.set_number}, ${log.weight}, ${escapeDate(log.completed_at)})${comma}`;
            });
            lines.push(...valueLines);
            lines.push('');
          }
        }
      }
    }

    // 6. Also backup the exercise_library entries referenced by this client's exercises
    if (routines.length > 0) {
      const [referencedExercises] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT el.* FROM exercise_library el
         INNER JOIN day_exercises de ON de.exercise_id = el.id
         INNER JOIN routine_days rd ON rd.id = de.routine_day_id
         INNER JOIN routines r ON r.id = rd.routine_id
         WHERE r.client_id = ?
         ORDER BY el.id`,
        [clientId]
      );

      if (referencedExercises.length > 0) {
        lines.push('-- === REFERENCIA: Ejercicios de la biblioteca usados ===');
        lines.push('-- (Solo como referencia, NO ejecutar si la biblioteca ya existe)');
        lines.push('-- Si algún ejercicio fue borrado de la biblioteca, descomenta las líneas necesarias');
        for (const ex of referencedExercises) {
          lines.push(`-- INSERT IGNORE INTO exercise_library (id, name, muscle_group, description) VALUES (${ex.id}, ${escapeString(ex.name)}, ${escapeString(ex.muscle_group)}, ${ex.description ? escapeString(ex.description) : 'NULL'});`);
        }
        lines.push('');
      }
    }

    lines.push('-- =====================================================');
    lines.push('-- FIN DEL BACKUP');
    lines.push('-- =====================================================');

    // Write to file
    const outputPath = path.join(__dirname, '..', `backup_adrian_estrada_${formatDateForFilename(new Date())}.sql`);
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    console.log(`\n✅ Backup generado exitosamente: ${outputPath}`);
    console.log(`📄 Total líneas: ${lines.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando backup:', error);
    process.exit(1);
  }
}

function escapeString(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  const str = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${str}'`;
}

function escapeDate(value: any): string {
  if (!value) return 'NOW()';
  const d = new Date(value);
  return `'${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}'`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDateForFilename(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

backupAdrian();
