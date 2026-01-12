import { Router, Response } from 'express';
import { pool } from '../database';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Get meals for a client
router.get('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    // Check authorization
    if (req.userRole !== 'admin' && req.userId !== parseInt(clientId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [meals] = await pool.query(
      'SELECT * FROM meals WHERE client_id = ? ORDER BY meal_time',
      [clientId]
    );

    res.json({ meals });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add meal (admin only)
router.post('/', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { client_id, meal_name, meal_time, description } = req.body;

    if (!client_id || !meal_name || !meal_time) {
      return res.status(400).json({ error: 'client_id, meal_name, and meal_time are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO meals (client_id, meal_name, meal_time, description) VALUES (?, ?, ?, ?)',
      [client_id, meal_name, meal_time, description || '']
    );

    const insertResult = result as any;

    res.status(201).json({
      message: 'Meal added successfully',
      mealId: insertResult.insertId
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update meal (admin only)
router.put('/:mealId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { mealId } = req.params;
    const { meal_name, meal_time, description } = req.body;

    await pool.query(
      'UPDATE meals SET meal_name = ?, meal_time = ?, description = ? WHERE id = ?',
      [meal_name, meal_time, description || '', mealId]
    );

    res.json({ message: 'Meal updated successfully' });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete meal (admin only)
router.delete('/:mealId', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { mealId } = req.params;

    await pool.query('DELETE FROM meals WHERE id = ?', [mealId]);

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
