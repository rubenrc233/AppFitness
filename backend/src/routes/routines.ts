import express from 'express';
import { pool } from '../database';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Obtener biblioteca de ejercicios (con filtro opcional por grupo muscular)
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const { muscleGroup } = req.query;
    
    let query = 'SELECT * FROM exercise_library';
    const params: any[] = [];
    
    if (muscleGroup) {
      query += ' WHERE muscle_group = ?';
      params.push(muscleGroup);
    }
    
    query += ' ORDER BY muscle_group, name';
    
    const [exercises] = await pool.query<RowDataPacket[]>(query, params);
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercise library:', error);
    res.status(500).json({ error: 'Error al obtener biblioteca de ejercicios' });
  }
});

// Obtener grupos musculares únicos
router.get('/muscle-groups', authenticateToken, async (req, res) => {
  try {
    const [groups] = await pool.query<RowDataPacket[]>(
      'SELECT DISTINCT muscle_group FROM exercise_library ORDER BY muscle_group'
    );
    res.json(groups.map(g => g.muscle_group));
  } catch (error) {
    console.error('Error fetching muscle groups:', error);
    res.status(500).json({ error: 'Error al obtener grupos musculares' });
  }
});

// Obtener rutina de un cliente (incluye días)
router.get('/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Obtener rutina del cliente
    const [routines] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM routines WHERE client_id = ?',
      [clientId]
    );
    
    if (routines.length === 0) {
      return res.json(null);
    }
    
    const routine = routines[0];
    
    // Obtener días de la rutina
    const [days] = await pool.query<RowDataPacket[]>(
      'SELECT id, routine_id, day_number, weekday, COALESCE(custom_name, name) as name, custom_name, notes FROM routine_days WHERE routine_id = ? ORDER BY weekday, day_number',
      [routine.id]
    );
    
    res.json({
      ...routine,
      days
    });
  } catch (error) {
    console.error('Error fetching routine:', error);
    res.status(500).json({ error: 'Error al obtener rutina' });
  }
});

// Crear rutina para un cliente (crea automáticamente los días vacíos)
router.post('/:clientId', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { clientId } = req.params;
    const { name, totalDays } = req.body;
    
    if (!name || !totalDays || totalDays < 1 || totalDays > 7) {
      return res.status(400).json({ error: 'Nombre y días (1-7) son requeridos' });
    }
    
    await connection.beginTransaction();
    
    // Eliminar rutina anterior si existe
    await connection.query('DELETE FROM routines WHERE client_id = ?', [clientId]);
    
    // Crear nueva rutina
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO routines (client_id, name) VALUES (?, ?)',
      [clientId, name]
    );
    
    const routineId = result.insertId;
    
    // Crear días vacíos automáticamente
    for (let i = 1; i <= totalDays; i++) {
      await connection.query(
        'INSERT INTO routine_days (routine_id, day_number, weekday, name, notes) VALUES (?, ?, ?, ?, ?)',
        [routineId, i, i - 1, `Día ${i}`, '']
      );
    }
    
    await connection.commit();
    
    // Obtener rutina completa con días
    const [routines] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM routines WHERE id = ?',
      [routineId]
    );
    
    const [days] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM routine_days WHERE routine_id = ? ORDER BY day_number',
      [routineId]
    );
    
    res.json({
      ...routines[0],
      days
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating routine:', error);
    res.status(500).json({ error: 'Error al crear rutina' });
  } finally {
    connection.release();
  }
});

// Actualizar rutina (nombre)
router.put('/:routineId', authenticateToken, async (req, res) => {
  try {
    const { routineId } = req.params;
    const { name } = req.body;
    
    await pool.query(
      'UPDATE routines SET name = ? WHERE id = ?',
      [name, routineId]
    );
    
    res.json({ message: 'Rutina actualizada' });
  } catch (error) {
    console.error('Error updating routine:', error);
    res.status(500).json({ error: 'Error al actualizar rutina' });
  }
});

// Obtener detalles de un día (con ejercicios)
router.get('/days/:dayId', authenticateToken, async (req, res) => {
  try {
    const { dayId } = req.params;
    
    const [exercises] = await pool.query<RowDataPacket[]>(
      `SELECT de.*, el.name as exercise_name, el.muscle_group, el.description
       FROM day_exercises de
       JOIN exercise_library el ON de.exercise_id = el.id
       WHERE de.routine_day_id = ?
       ORDER BY de.order_index, de.id`,
      [dayId]
    );
    
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching day exercises:', error);
    res.status(500).json({ error: 'Error al obtener ejercicios del día' });
  }
});

// Actualizar día (nombre, notas y weekday)
router.put('/days/:dayId', authenticateToken, async (req, res) => {
  try {
    const { dayId } = req.params;
    const { name, notes, custom_name, weekday } = req.body;
    
    if (weekday !== undefined) {
      await pool.query(
        'UPDATE routine_days SET name = ?, notes = ?, custom_name = ?, weekday = ? WHERE id = ?',
        [name, notes || '', custom_name || null, weekday, dayId]
      );
    } else {
      await pool.query(
        'UPDATE routine_days SET name = ?, notes = ?, custom_name = ? WHERE id = ?',
        [name, notes || '', custom_name || null, dayId]
      );
    }
    
    res.json({ message: 'Día actualizado' });
  } catch (error) {
    console.error('Error updating day:', error);
    res.status(500).json({ error: 'Error al actualizar día' });
  }
});

// Agregar ejercicio a un día
router.post('/days/:dayId/exercises', authenticateToken, async (req, res) => {
  try {
    const { dayId } = req.params;
    const { exerciseId, sets, reps, notes, orderIndex } = req.body;
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO day_exercises (routine_day_id, exercise_id, sets, reps, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [dayId, exerciseId, sets, reps, notes, orderIndex || 0]
    );
    
    res.json({ id: result.insertId, message: 'Ejercicio agregado' });
  } catch (error) {
    console.error('Error adding exercise to day:', error);
    res.status(500).json({ error: 'Error al agregar ejercicio' });
  }
});

// Actualizar ejercicio de un día
router.put('/days/exercises/:exerciseId', authenticateToken, async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { sets, reps, notes } = req.body;
    
    await pool.query(
      'UPDATE day_exercises SET sets = ?, reps = ?, notes = ? WHERE id = ?',
      [sets, reps, notes, exerciseId]
    );
    
    res.json({ message: 'Ejercicio actualizado' });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: 'Error al actualizar ejercicio' });
  }
});

// Eliminar ejercicio de un día
router.delete('/days/exercises/:exerciseId', authenticateToken, async (req, res) => {
  try {
    const { exerciseId } = req.params;
    
    await pool.query('DELETE FROM day_exercises WHERE id = ?', [exerciseId]);
    
    res.json({ message: 'Ejercicio eliminado' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: 'Error al eliminar ejercicio' });
  }
});

// Reordenar ejercicios de un día
router.put('/days/:dayId/exercises/reorder', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { dayId } = req.params;
    const { exerciseIds } = req.body;

    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return res.status(400).json({ error: 'exerciseIds debe ser un array no vacío' });
    }

    await connection.beginTransaction();

    // Actualizar el order_index de cada ejercicio según su nueva posición
    for (let i = 0; i < exerciseIds.length; i++) {
      await connection.query(
        'UPDATE day_exercises SET order_index = ? WHERE id = ? AND routine_day_id = ?',
        [i, exerciseIds[i], dayId]
      );
    }

    await connection.commit();
    res.json({ message: 'Ejercicios reordenados correctamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error reordering exercises:', error);
    res.status(500).json({ error: 'Error al reordenar ejercicios' });
  } finally {
    connection.release();
  }
});

// Eliminar rutina completa
router.delete('/:routineId', authenticateToken, async (req, res) => {
  try {
    const { routineId } = req.params;
    
    await pool.query('DELETE FROM routines WHERE id = ?', [routineId]);
    
    res.json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    res.status(500).json({ error: 'Error al eliminar rutina' });
  }
});

export default router;
