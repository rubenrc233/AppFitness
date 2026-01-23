import { Router, Request, Response } from 'express';
import { pool } from '../database';
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
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const start = startDate ? new Date(startDate) : new Date();
    const nextPayment = calculateNextPaymentDate(start, frequency);
    
    // Verificar si ya existe configuración
    const [existing] = await connection.query(
      'SELECT id FROM payment_config WHERE user_id = ?',
      [userId]
    );
    
    let configResult;
    if (Array.isArray(existing) && existing.length > 0) {
      // Actualizar configuración existente
      await connection.query(
        `UPDATE payment_config 
         SET amount = ?, frequency = ?, start_date = ?, next_payment_date = ?, 
             active = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, frequency, start, nextPayment, userId]
      );
      const [updated] = await connection.query(
        'SELECT * FROM payment_config WHERE user_id = ?',
        [userId]
      );
      configResult = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
    } else {
      // Crear nueva configuración
      await connection.query(
        `INSERT INTO payment_config (user_id, amount, frequency, start_date, next_payment_date)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, amount, frequency, start, nextPayment]
      );
      const [inserted] = await connection.query(
        'SELECT * FROM payment_config WHERE user_id = ?',
        [userId]
      );
      configResult = Array.isArray(inserted) && inserted.length > 0 ? inserted[0] : null;
    }
    
    // Registrar el primer pago en el histórico
    const periodEnd = new Date(nextPayment);
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    await connection.query(
      `INSERT INTO payment_history (user_id, amount, payment_date, period_start, period_end, frequency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, amount, start, start, periodEnd, frequency, 'Configuración inicial del sistema de pagos']
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      config: configResult,
      message: 'Sistema de pagos configurado correctamente'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error configurando sistema de pagos:', error);
    res.status(500).json({ error: 'Error al configurar el sistema de pagos' });
  } finally {
    connection.release();
  }
});

// Obtener configuración de pago de un cliente
router.get('/config/:userId', authenticateToken, async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payment_config WHERE user_id = ?',
      [userId]
    );
    const result = Array.isArray(rows) ? rows : [];
    
    if (result.length === 0) {
      return res.json({ config: null });
    }
    
    res.json({ config: result[0] });
  } catch (error) {
    console.error('Error obteniendo configuración de pago:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Obtener todos los clientes con su configuración de pago (para AdminDashboard)
router.get('/clients-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        ps.is_enabled, ps.next_due_date,
        pc.amount, pc.frequency, pc.start_date, pc.next_payment_date, pc.active,
        CASE 
          WHEN pc.next_payment_date <= CURDATE() THEN TRUE
          ELSE FALSE
        END as payment_due,
        CASE 
          WHEN pc.next_payment_date > CURDATE() 
          THEN DATEDIFF(pc.next_payment_date, CURDATE())
          ELSE 0
        END as days_until_payment
      FROM users u
      LEFT JOIN payment_config pc ON u.id = pc.user_id
      LEFT JOIN progress_settings ps ON u.id = ps.client_id
      WHERE u.role = 'client'
      ORDER BY 
        CASE WHEN pc.next_payment_date <= CURDATE() THEN 0 ELSE 1 END,
        pc.next_payment_date ASC,
        u.name ASC
    `);
    
    res.json({ clients: Array.isArray(rows) ? rows : [] });
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
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Obtener configuración actual
    const [configRows] = await connection.query(
      'SELECT * FROM payment_config WHERE user_id = ?',
      [userId]
    );
    const configs = Array.isArray(configRows) ? configRows : [];
    
    if (configs.length === 0) {
      return res.status(404).json({ error: 'No hay configuración de pago para este usuario' });
    }
    
    const config: any = configs[0];
    const payment = paymentDate ? new Date(paymentDate) : new Date();
    const periodStart = new Date(config.next_payment_date);
    periodStart.setDate(periodStart.getDate() - 1); // Ajuste para inicio del período
    
    // Calcular nueva fecha de próximo pago
    const newNextPayment = calculateNextPaymentDate(new Date(config.next_payment_date), config.frequency);
    const periodEnd = new Date(newNextPayment);
    periodEnd.setDate(periodEnd.getDate() - 1);
    
    // Registrar pago en histórico
    await connection.query(
      `INSERT INTO payment_history (user_id, amount, payment_date, period_start, period_end, frequency)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, config.amount, payment, config.next_payment_date, periodEnd, config.frequency]
    );
    
    // Actualizar próxima fecha de pago
    await connection.query(
      `UPDATE payment_config 
       SET next_payment_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [newNextPayment, userId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      nextPaymentDate: newNextPayment
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  } finally {
    connection.release();
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
      query += ` AND ph.user_id = ?`;
      params.push(userId);
    }
    
    // Filtro por mes y año
    if (month && year) {
      query += ` AND MONTH(ph.payment_date) = ?`;
      params.push(month);
      query += ` AND YEAR(ph.payment_date) = ?`;
      params.push(year);
    }
    
    // Filtro por rango de fechas
    if (startDate) {
      query += ` AND ph.payment_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND ph.payment_date <= ?`;
      params.push(endDate);
    }
    
    query += ' ORDER BY ph.payment_date DESC, ph.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    const result = Array.isArray(rows) ? rows : [];
    
    // Calcular total
    const total = result.reduce((sum: number, row: any) => sum + parseFloat(row.amount), 0);
    
    res.json({
      payments: result,
      total: total.toFixed(2),
      count: result.length
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
    const [monthlyRows] = await pool.query(`
      SELECT 
        MONTH(payment_date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payment_history
      WHERE YEAR(payment_date) = ?
      GROUP BY MONTH(payment_date)
      ORDER BY month
    `, [targetYear]);
    
    // Total general del año
    const [yearlyRows] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM payment_history
      WHERE YEAR(payment_date) = ?
    `, [targetYear]);
    
    // Top clientes por ingresos
    const [topClientsRows] = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        SUM(ph.amount) as total_paid,
        COUNT(ph.id) as payment_count
      FROM users u
      JOIN payment_history ph ON u.id = ph.user_id
      WHERE YEAR(ph.payment_date) = ?
      GROUP BY u.id, u.name, u.email
      ORDER BY total_paid DESC
      LIMIT 10
    `, [targetYear]);
    
    const monthly = Array.isArray(monthlyRows) ? monthlyRows : [];
    const yearly = Array.isArray(yearlyRows) && yearlyRows.length > 0 ? yearlyRows[0] : { total: 0, count: 0 };
    const topClients = Array.isArray(topClientsRows) ? topClientsRows : [];
    
    res.json({
      year: targetYear,
      monthly,
      yearly,
      topClients
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
      'UPDATE payment_config SET active = FALSE WHERE user_id = ?',
      [userId]
    );
    
    res.json({ success: true, message: 'Sistema de pagos desactivado' });
  } catch (error) {
    console.error('Error desactivando sistema de pagos:', error);
    res.status(500).json({ error: 'Error al desactivar sistema de pagos' });
  }
});

export default router;
