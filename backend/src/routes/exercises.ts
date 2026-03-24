import { Router, Response } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Get all exercises from library
router.get('/library', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [exercises] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, muscle_group, description FROM exercise_library ORDER BY muscle_group, name`
    );
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises library error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create custom exercise (admin only) - inserts into exercise_library so it can be used in routines
router.post('/custom', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, muscle_group, description } = req.body;

    if (!name || !muscle_group) {
      return res.status(400).json({ error: 'Name and muscle_group are required' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO exercise_library (name, muscle_group, description) VALUES (?, ?, ?)',
      [name, muscle_group, description || '']
    );

    res.status(201).json({
      message: 'Custom exercise created',
      exerciseId: result.insertId,
      exercise: {
        id: result.insertId,
        name,
        muscle_group,
        description: description || ''
      }
    });
  } catch (error) {
    console.error('Create custom exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update exercise in library (admin only)
router.put('/:exerciseId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const { name, muscle_group, description } = req.body;

    await pool.query(
      'UPDATE exercise_library SET name = ?, muscle_group = ?, description = ? WHERE id = ?',
      [name, muscle_group, description || '', exerciseId]
    );

    res.json({ message: 'Exercise updated successfully' });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete exercise from library (admin only)
router.delete('/:exerciseId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { exerciseId } = req.params;

    await pool.query('DELETE FROM exercise_library WHERE id = ?', [exerciseId]);

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
