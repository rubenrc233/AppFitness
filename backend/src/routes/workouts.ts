import express from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Obtener el último entrenamiento registrado para un día específico
router.get('/last/:clientId/:dayId', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const dayId = parseInt(req.params.dayId);

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
        wl.day_exercise_id,
        wl.set_number,
        wl.weight,
        wl.completed_at
      FROM workout_logs wl
      WHERE wl.client_id = ? 
        AND wl.day_id = ?
      ORDER BY wl.completed_at DESC
      LIMIT 1000`,
      [clientId, dayId]
    );

    // Agrupar por ejercicio y serie
    const lastWorkout: { [exerciseId: number]: { [setNumber: number]: number } } = {};
    
    if (logs.length > 0) {
      // Obtener la fecha del último entrenamiento
      const lastDate = logs[0].completed_at;
      
      // Filtrar solo los registros de esa fecha
      const lastSessionLogs = logs.filter(log => 
        new Date(log.completed_at).getTime() === new Date(lastDate).getTime()
      );
      
      lastSessionLogs.forEach(log => {
        if (!lastWorkout[log.day_exercise_id]) {
          lastWorkout[log.day_exercise_id] = {};
        }
        lastWorkout[log.day_exercise_id][log.set_number] = log.weight;
      });
    }

    res.json(lastWorkout);
  } catch (error) {
    console.error('Error getting last workout:', error);
    res.status(500).json({ error: 'Error al obtener el último entrenamiento' });
  }
});

// Guardar un entrenamiento completo
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { clientId, dayId, exercises } = req.body;

    // exercises: [{ dayExerciseId, sets: [{ setNumber, weight }] }]
    
    // Insertar todos los registros
    const values: any[] = [];
    
    exercises.forEach((exercise: any) => {
      exercise.sets.forEach((set: any) => {
        values.push([
          clientId,
          dayId,
          exercise.dayExerciseId,
          set.setNumber,
          set.weight || 0
        ]);
      });
    });

    if (values.length > 0) {
      await pool.query<ResultSetHeader>(
        `INSERT INTO workout_logs 
        (client_id, day_id, day_exercise_id, set_number, weight) 
        VALUES ?`,
        [values]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({ error: 'Error al guardar el entrenamiento' });
  }
});

// Historial de un ejercicio específico (para gráficas de progreso)
router.get('/history/:clientId/:dayExerciseId', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const dayExerciseId = parseInt(req.params.dayExerciseId);

    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
        wl.set_number,
        wl.weight,
        DATE(wl.completed_at) as date
      FROM workout_logs wl
      WHERE wl.client_id = ? 
        AND wl.day_exercise_id = ?
      ORDER BY wl.completed_at ASC`,
      [clientId, dayExerciseId]
    );

    // Agrupar por fecha y calcular el peso máximo de cada sesión
    const sessionMap: { [date: string]: number } = {};
    logs.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      if (!sessionMap[dateStr] || log.weight > sessionMap[dateStr]) {
        sessionMap[dateStr] = log.weight;
      }
    });

    const history = Object.entries(sessionMap).map(([date, maxWeight]) => ({
      date,
      maxWeight,
    }));

    res.json(history);
  } catch (error) {
    console.error('Error getting exercise history:', error);
    res.status(500).json({ error: 'Error al obtener el historial del ejercicio' });
  }
});

export default router;
