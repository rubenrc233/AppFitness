import express, { Request, Response } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Obtener configuración de pasos de un cliente
router.get('/settings/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    
    const [settings] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM steps_settings WHERE client_id = ?',
      [clientId]
    );
    
    if (settings.length === 0) {
      // Devolver configuración por defecto
      return res.json({ daily_goal: 10000 });
    }
    
    res.json(settings[0]);
  } catch (error) {
    console.error('Error al obtener configuración de pasos:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Actualizar/crear configuración de pasos (admin)
router.post('/settings/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { daily_goal } = req.body;
    
    if (!daily_goal || daily_goal < 1000 || daily_goal > 50000) {
      return res.status(400).json({ error: 'Meta debe estar entre 1000 y 50000 pasos' });
    }
    
    // Usar INSERT ... ON DUPLICATE KEY UPDATE para crear o actualizar
    await pool.query<ResultSetHeader>(
      `INSERT INTO steps_settings (client_id, daily_goal) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE daily_goal = ?`,
      [clientId, daily_goal, daily_goal]
    );
    
    res.json({ message: 'Configuración guardada', daily_goal });
  } catch (error) {
    console.error('Error al guardar configuración de pasos:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

export default router;
