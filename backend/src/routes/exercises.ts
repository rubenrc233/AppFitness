import { Router, Response } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Get all exercises from library (includes system and custom)
router.get('/library', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [exercises] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.name,
        e.muscle_group,
        e.description,
        'system' as type
      FROM exercises_library e
      UNION ALL
      SELECT 
        ce.id,
        ce.name,
        ce.muscle_group,
        ce.description,
        'custom' as type
      FROM custom_exercises ce
      ORDER BY name`
    );
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises library error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create custom exercise (admin only)
router.post('/custom', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, muscle_group, description } = req.body;

    if (!name || !muscle_group) {
      return res.status(400).json({ error: 'Name and muscle_group are required' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO custom_exercises (name, muscle_group, description, created_by) VALUES (?, ?, ?, ?)',
      [name, muscle_group, description || '', req.userId]
    );

    res.status(201).json({
      message: 'Custom exercise created',
      exerciseId: result.insertId
    });
  } catch (error) {
    console.error('Create custom exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update exercise (admin only)
router.put('/:exerciseId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const { exercise_name, sets, reps, notes, day } = req.body;

    await pool.query(
      'UPDATE exercises SET exercise_name = ?, sets = ?, reps = ?, notes = ?, day = ? WHERE id = ?',
      [exercise_name, sets || null, reps || null, notes || '', day || 'Monday', exerciseId]
    );

    res.json({ message: 'Exercise updated successfully' });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete exercise (admin only)
router.delete('/:exerciseId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { exerciseId } = req.params;

    await pool.query('DELETE FROM exercises WHERE id = ?', [exerciseId]);

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
