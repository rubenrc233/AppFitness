import { Router, Response } from 'express';
import { pool } from '../database';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Get all clients (admin only) with review info
router.get('/', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { pending } = req.query;
    
    let whereClause = 'WHERE u.role = "client"';
    if (pending === 'true') {
      whereClause += ' AND u.is_approved = FALSE';
    }
    
    const [clients] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        u.is_approved,
        ps.next_due_date,
        COALESCE(ps.is_enabled, 0) as is_enabled
      FROM users u
      LEFT JOIN progress_settings ps ON u.id = ps.client_id
      ${whereClause}
      ORDER BY u.is_approved ASC, u.created_at DESC
    `);
    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Aprobar cliente (admin only)
router.post('/:clientId/approve', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    
    await pool.query('UPDATE users SET is_approved = TRUE WHERE id = ?', [clientId]);
    
    res.json({ message: 'Cliente aprobado correctamente' });
  } catch (error) {
    console.error('Approve client error:', error);
    res.status(500).json({ error: 'Error al aprobar cliente' });
  }
});

// Rechazar/eliminar cliente pendiente (admin only)
router.delete('/:clientId/reject', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    
    // Solo permitir eliminar si no está aprobado
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT is_approved FROM users WHERE id = ?',
      [clientId]
    );
    
    if (users.length > 0 && users[0].is_approved) {
      return res.status(400).json({ error: 'No se puede rechazar un cliente ya aprobado' });
    }
    
    await pool.query('DELETE FROM users WHERE id = ? AND is_approved = FALSE', [clientId]);
    
    res.json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Reject client error:', error);
    res.status(500).json({ error: 'Error al rechazar cliente' });
  }
});

// Get client details with meals and exercises
router.get('/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    // Check authorization
    if (req.userRole !== 'admin' && req.userId !== parseInt(clientId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get client info
    const [clients] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ? AND role = "client"',
      [clientId]
    );

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get meals
    const [meals] = await pool.query(
      'SELECT * FROM meals WHERE client_id = ? ORDER BY meal_time',
      [clientId]
    );

    // Ya no obtenemos ejercicios aquí, ahora usamos packs de entrenamientos
    // La ruta /workouts/:clientId/packs proporciona esta información
    const exercises: any[] = [];

    res.json({
      client: clients[0],
      meals,
      exercises
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
