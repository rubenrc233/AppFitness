import { Router, Response } from 'express';
import { pool } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// ============================================
// ADMIN - Obtener suplementación de un cliente
// ============================================
router.get('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM client_supplements 
       WHERE client_id = ? 
       ORDER BY time_of_day, name`,
      [clientId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo suplementos:', error);
    res.status(500).json({ error: 'Error al obtener suplementos' });
  }
});

// ============================================
// ADMIN - Añadir suplemento a un cliente
// ============================================
router.post('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { name, dosage, time_of_day, notes } = req.body;

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Nombre y dosis son requeridos' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO client_supplements (client_id, name, dosage, time_of_day, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, name, dosage, time_of_day || null, notes || null]
    );

    res.json({ 
      id: result.insertId,
      message: 'Suplemento añadido correctamente' 
    });
  } catch (error) {
    console.error('Error añadiendo suplemento:', error);
    res.status(500).json({ error: 'Error al añadir suplemento' });
  }
});

// ============================================
// ADMIN - Actualizar suplemento
// ============================================
router.put('/:supplementId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { supplementId } = req.params;
    const { name, dosage, time_of_day, notes } = req.body;

    await pool.query(
      `UPDATE client_supplements 
       SET name = ?, dosage = ?, time_of_day = ?, notes = ?
       WHERE id = ?`,
      [name, dosage, time_of_day || null, notes || null, supplementId]
    );

    res.json({ message: 'Suplemento actualizado' });
  } catch (error) {
    console.error('Error actualizando suplemento:', error);
    res.status(500).json({ error: 'Error al actualizar suplemento' });
  }
});

// ============================================
// ADMIN - Eliminar suplemento
// ============================================
router.delete('/:supplementId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { supplementId } = req.params;

    await pool.query('DELETE FROM client_supplements WHERE id = ?', [supplementId]);

    res.json({ message: 'Suplemento eliminado' });
  } catch (error) {
    console.error('Error eliminando suplemento:', error);
    res.status(500).json({ error: 'Error al eliminar suplemento' });
  }
});

export default router;
