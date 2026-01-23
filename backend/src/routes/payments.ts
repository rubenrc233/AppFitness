import { Router, Request, Response } from 'express';
import pool from '../database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Calcular próxima fecha de pago basada en frecuencia
function calculateNextPaymentDate(startDate: Date, frequency: string): Date {
  const next = new Date(startDate);
  
  switch (frequency) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'biannual':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
}

// Configurar o actualizar el sistema de pagos de un cliente
router.post('/config', authenticateToken, async (req: Request, res: Response) => {
  const { userId, amount, frequency, startDate } = req.body;
  
  if (!userId || !amount || !frequency) {
    return res.status(400).json({ error: 'userId, amount y frequency son requeridos' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const start = startDate ? new Date(startDate) : new Date();
    const nextPayment = calculateNextPaymentDate(start, frequency);
    
    // Verificar si ya existe configuración
    const existing = await client.query(
      'SELECT id FROM payment_config WHERE user_id = $1',
      [userId]
    );
    
    let configResult;
    if (existing.rows.length > 0) {
      // Actualizar configuración existente
      configResult = await client.query(
        `UPDATE payment_config 
         SET amount = $1, frequency = $2, start_date = $3, next_payment_date = $4, 
             active = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5
         RETURNING *`,
        [amount, frequency, start, nextPayment, userId]
      );
    } else {
      // Crear nueva configuración
      configResult = await client.query(
        `INSERT INTO payment_config (user_id, amount, frequency, start_date, next_payment_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, amount, frequency, start, nextPayment]
      );
    }
    
    // Registrar el primer pago en el histórico
    const periodEnd = new Date(nextPayment);
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    await client.query(
      `INSERT INTO payment_history (user_id, amount, payment_date, period_start, period_end, frequency, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, amount, start, start, periodEnd, frequency, 'Configuración inicial del sistema de pagos']
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      config: configResult.rows[0],
      message: 'Sistema de pagos configurado correctamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error configurando sistema de pagos:', error);
    res.status(500).json({ error: 'Error al configurar el sistema de pagos' });
  } finally {
    client.release();
  }
});

// Obtener configuración de pago de un cliente
router.get('/config/:userId', authenticateToken, async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM payment_config WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ config: null });
    }
    
    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo configuración de pago:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Obtener todos los clientes con su configuración de pago (para AdminDashboard)
router.get('/clients-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        pc.amount, pc.frequency, pc.start_date, pc.next_payment_date, pc.active,
        CASE 
          WHEN pc.next_payment_date <= CURRENT_DATE THEN TRUE
          ELSE FALSE
        END as payment_due,
        CASE 
          WHEN pc.next_payment_date > CURRENT_DATE 
          THEN pc.next_payment_date - CURRENT_DATE
          ELSE 0
        END as days_until_payment
      FROM users u
      LEFT JOIN payment_config pc ON u.id = pc.user_id
      WHERE u.role = 'client'
      ORDER BY 
        CASE WHEN pc.next_payment_date <= CURRENT_DATE THEN 0 ELSE 1 END,
        pc.next_payment_date ASC,
        u.name ASC
    `);
    
    res.json({ clients: result.rows });
  } catch (error) {
    console.error('Error obteniendo estado de pagos:', error);
    res.status(500).json({ error: 'Error al obtener estado de pagos' });
  }
});

// Registrar un pago
router.post('/register', authenticateToken, async (req: Request, res: Response) => {
  const { userId, paymentDate } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Obtener configuración actual
    const configResult = await client.query(
      'SELECT * FROM payment_config WHERE user_id = $1',
      [userId]
    );
    
    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'No hay configuración de pago para este usuario' });
    }
    
    const config = configResult.rows[0];
    const payment = paymentDate ? new Date(paymentDate) : new Date();
    const periodStart = new Date(config.next_payment_date);
    periodStart.setDate(periodStart.getDate() - 1); // Ajuste para inicio del período
    
    // Calcular nueva fecha de próximo pago
    const newNextPayment = calculateNextPaymentDate(new Date(config.next_payment_date), config.frequency);
    const periodEnd = new Date(newNextPayment);
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    // Registrar pago en histórico
    await client.query(
      `INSERT INTO payment_history (user_id, amount, payment_date, period_start, period_end, frequency)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, config.amount, payment, config.next_payment_date, periodEnd, config.frequency]
    );
    
    // Actualizar próxima fecha de pago
    await client.query(
      `UPDATE payment_config 
       SET next_payment_date = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [newNextPayment, userId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      nextPaymentDate: newNextPayment
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  } finally {
    client.release();
  }
});

// Obtener histórico de pagos con filtros
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  const { userId, month, year, startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT 
        ph.*,
        u.name as user_name,
        u.email as user_email
      FROM payment_history ph
      JOIN users u ON ph.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    // Filtro por usuario
    if (userId) {
      query += ` AND ph.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }
    
    // Filtro por mes y año
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM ph.payment_date) = $${paramCount}`;
      params.push(month);
      paramCount++;
      query += ` AND EXTRACT(YEAR FROM ph.payment_date) = $${paramCount}`;
      params.push(year);
      paramCount++;
    }
    
    // Filtro por rango de fechas
    if (startDate) {
      query += ` AND ph.payment_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND ph.payment_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    query += ' ORDER BY ph.payment_date DESC, ph.created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Calcular total
    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
    
    res.json({
      payments: result.rows,
      total: total.toFixed(2),
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo histórico de pagos:', error);
    res.status(500).json({ error: 'Error al obtener histórico de pagos' });
  }
});

// Obtener estadísticas de pagos
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear();
  
  try {
    // Total por mes del año
    const monthlyResult = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM payment_date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payment_history
      WHERE EXTRACT(YEAR FROM payment_date) = $1
      GROUP BY EXTRACT(MONTH FROM payment_date)
      ORDER BY month
    `, [targetYear]);
    
    // Total general del año
    const yearlyResult = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM payment_history
      WHERE EXTRACT(YEAR FROM payment_date) = $1
    `, [targetYear]);
    
    // Top clientes por ingresos
    const topClientsResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        SUM(ph.amount) as total_paid,
        COUNT(ph.id) as payment_count
      FROM users u
      JOIN payment_history ph ON u.id = ph.user_id
      WHERE EXTRACT(YEAR FROM ph.payment_date) = $1
      GROUP BY u.id, u.name, u.email
      ORDER BY total_paid DESC
      LIMIT 10
    `, [targetYear]);
    
    res.json({
      year: targetYear,
      monthly: monthlyResult.rows,
      yearly: yearlyResult.rows[0] || { total: 0, count: 0 },
      topClients: topClientsResult.rows
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Desactivar sistema de pagos de un cliente
router.delete('/config/:userId', authenticateToken, async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    await pool.query(
      'UPDATE payment_config SET active = FALSE WHERE user_id = $1',
      [userId]
    );
    
    res.json({ success: true, message: 'Sistema de pagos desactivado' });
  } catch (error) {
    console.error('Error desactivando sistema de pagos:', error);
    res.status(500).json({ error: 'Error al desactivar sistema de pagos' });
  }
});

export default router;
