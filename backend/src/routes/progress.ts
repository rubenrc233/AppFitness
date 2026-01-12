import { Router, Response } from 'express';
import { pool } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Configurar multer para manejar uploads en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max por foto
  }
});

// ============================================
// ADMIN - Configurar periodicidad del progreso
// ============================================
router.post('/settings/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const { frequencyWeeks, dayOfWeek } = req.body;

    if (!frequencyWeeks || !dayOfWeek) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Validar día de la semana
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
      return res.status(400).json({ error: 'Día de la semana inválido' });
    }

    // Calcular primera fecha
    const today = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(dayOfWeek.toLowerCase());
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const nextDueDate = new Date(today);
    nextDueDate.setDate(today.getDate() + daysUntilTarget);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    // Insertar o actualizar configuración
    await pool.query(`
      INSERT INTO progress_settings (client_id, frequency_weeks, day_of_week, next_due_date)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        frequency_weeks = VALUES(frequency_weeks),
        day_of_week = VALUES(day_of_week),
        next_due_date = VALUES(next_due_date),
        is_enabled = true
    `, [clientId, frequencyWeeks, dayOfWeek.toLowerCase(), nextDueDateStr]);

    res.json({ 
      message: 'Configuración guardada',
      nextDueDate: nextDueDateStr
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// ============================================
// ADMIN/CLIENTE - Obtener configuración
// ============================================
router.get('/settings/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM progress_settings WHERE client_id = ?',
      [clientId]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// ============================================
// CLIENTE - Verificar estado del progreso
// ============================================
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Verificar si hay progreso activo
    const [activeRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM active_progress WHERE client_id = ?',
      [userId]
    );

    const canUpload = activeRows.length > 0;

    // Obtener configuración y última actualización
    const [settingsRows] = await pool.query<RowDataPacket[]>(
      'SELECT next_due_date FROM progress_settings WHERE client_id = ?',
      [userId]
    );

    const [lastUpdateRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM progress_updates WHERE client_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    res.json({
      canUpload,
      nextDueDate: settingsRows.length > 0 ? settingsRows[0].next_due_date : null,
      lastUpdate: lastUpdateRows.length > 0 ? lastUpdateRows[0] : null
    });
  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({ error: 'Error al verificar estado' });
  }
});

// ============================================
// CLIENTE - Subir progreso (fotos + peso)
// ============================================
router.post('/upload', 
  authenticateToken,
  upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'sidePhoto', maxCount: 1 },
    { name: 'backPhoto', maxCount: 1 }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { weight } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validar que exista progreso activo
      const [activeRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM active_progress WHERE client_id = ?',
        [userId]
      );

      if (activeRows.length === 0) {
        return res.status(403).json({ error: 'No tienes progreso activo' });
      }

      // Validar datos
      if (!weight || !files.frontPhoto || !files.sidePhoto || !files.backPhoto) {
        return res.status(400).json({ error: 'Faltan fotos o peso' });
      }

      // Subir fotos a Cloudinary
      const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `appfitness/progress/${userId}`,
              resource_type: 'image',
              transformation: [
                { width: 800, height: 1000, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          );
          uploadStream.end(file.buffer);
        });
      };

      console.log('📤 Subiendo fotos a Cloudinary...');
      const [frontUrl, sideUrl, backUrl] = await Promise.all([
        uploadToCloudinary(files.frontPhoto[0]),
        uploadToCloudinary(files.sidePhoto[0]),
        uploadToCloudinary(files.backPhoto[0])
      ]);

      console.log('✅ Fotos subidas correctamente');

      // Guardar en base de datos
      await pool.query(`
        INSERT INTO progress_updates (client_id, weight, front_photo_url, side_photo_url, back_photo_url)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, weight, frontUrl, sideUrl, backUrl]);

      // Eliminar progreso activo
      await pool.query('DELETE FROM active_progress WHERE client_id = ?', [userId]);

      // Actualizar próxima fecha
      const [settingsRows] = await pool.query<RowDataPacket[]>(
        'SELECT frequency_weeks FROM progress_settings WHERE client_id = ?',
        [userId]
      );

      if (settingsRows.length > 0) {
        const frequencyWeeks = settingsRows[0].frequency_weeks;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (frequencyWeeks * 7));
        const nextDateStr = nextDate.toISOString().split('T')[0];

        await pool.query(
          'UPDATE progress_settings SET next_due_date = ? WHERE client_id = ?',
          [nextDateStr, userId]
        );
      }

      res.json({ 
        message: 'Progreso guardado exitosamente',
        urls: { frontUrl, sideUrl, backUrl }
      });
    } catch (error) {
      console.error('Error subiendo progreso:', error);
      res.status(500).json({ error: 'Error al guardar progreso' });
    }
  }
);

// ============================================
// ADMIN/CLIENTE - Ver historial de progreso
// ============================================
router.get('/history/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM progress_updates WHERE client_id = ? ORDER BY created_at DESC',
      [clientId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ============================================
// ADMIN - Activar progreso manualmente (opcional)
// ============================================
router.post('/activate/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    // Verificar que no exista progreso activo
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM active_progress WHERE client_id = ?',
      [clientId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un progreso activo' });
    }

    // Activar progreso
    await pool.query(
      'INSERT INTO active_progress (client_id) VALUES (?)',
      [clientId]
    );

    res.json({ message: 'Progreso activado' });
  } catch (error) {
    console.error('Error activando progreso:', error);
    res.status(500).json({ error: 'Error al activar progreso' });
  }
});

export default router;
