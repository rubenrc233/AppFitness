import express, { Request, Response } from 'express';
import { pool } from '../database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// ==================== FOOD LIBRARY ====================

// Obtener todos los alimentos de la biblioteca
router.get('/foods', async (req: Request, res: Response) => {
  try {
    const [foods] = await pool.query<RowDataPacket[]>(
      'SELECT DISTINCT * FROM food_library ORDER BY category, name'
    );
    res.json(foods);
  } catch (error) {
    console.error('Error al obtener alimentos:', error);
    res.status(500).json({ error: 'Error al obtener alimentos' });
  }
});

// Crear alimento custom
router.post('/foods', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      category, 
      created_by_user_id,
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      fiber_per_100g,
      sugar_per_100g
    } = req.body;
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO food_library (
        name, 
        category, 
        is_custom, 
        created_by_user_id,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        fiber_per_100g,
        sugar_per_100g
      ) VALUES (?, ?, TRUE, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        category, 
        created_by_user_id,
        calories_per_100g || null,
        protein_per_100g || null,
        carbs_per_100g || null,
        fat_per_100g || null,
        fiber_per_100g || null,
        sugar_per_100g || null
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      category, 
      is_custom: true,
      created_by_user_id,
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g,
      fiber_per_100g,
      sugar_per_100g
    });
  } catch (error) {
    console.error('Error al crear alimento:', error);
    res.status(500).json({ error: 'Error al crear alimento' });
  }
});

// ==================== DIETS ====================

// Crear nueva dieta
router.post('/', async (req: Request, res: Response) => {
  try {
    const { client_id, name } = req.body;
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id es requerido' });
    }
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO diets (client_id, name) VALUES (?, ?)',
      [client_id, name || 'Mi Dieta']
    );
    
    const [diets] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM diets WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(diets[0]);
  } catch (error) {
    console.error('Error al crear dieta:', error);
    res.status(500).json({ error: 'Error al crear dieta' });
  }
});

// Obtener dieta de un cliente
router.get('/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    const [diets] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM diets WHERE client_id = ?',
      [clientId]
    );
    
    // Si no tiene dieta, retornar null para que el frontend pueda crear una
    if (diets.length === 0) {
      return res.json(null);
    }
    
    const diet = diets[0];
    
    // Obtener todas las comidas de la dieta
    const [meals] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM diet_meals WHERE diet_id = ? ORDER BY meal_number',
      [diet.id]
    );
    
    diet.meals = meals;
    res.json(diet);
  } catch (error) {
    console.error('Error al obtener dieta:', error);
    res.status(500).json({ error: 'Error al obtener dieta' });
  }
});

// Actualizar nombre de la dieta
router.put('/:dietId', async (req: Request, res: Response) => {
  try {
    const { dietId } = req.params;
    const { name } = req.body;
    
    await pool.query<ResultSetHeader>(
      'UPDATE diets SET name = ? WHERE id = ?',
      [name, dietId]
    );
    
    res.json({ message: 'Dieta actualizada' });
  } catch (error) {
    console.error('Error al actualizar dieta:', error);
    res.status(500).json({ error: 'Error al actualizar dieta' });
  }
});

// ==================== DIET MEALS ====================

// Crear comida en la dieta
router.post('/meals/:dietId', async (req: Request, res: Response) => {
  try {
    const { dietId } = req.params;
    const { meal_name, meal_time, notes } = req.body;
    
    // Obtener el siguiente número de comida
    const [maxMeal] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(meal_number), 0) as max_num FROM diet_meals WHERE diet_id = ?',
      [dietId]
    );
    const nextMealNumber = maxMeal[0].max_num + 1;
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO diet_meals (diet_id, meal_number, meal_name, meal_time, notes) VALUES (?, ?, ?, ?, ?)',
      [dietId, nextMealNumber, meal_name || 'Comida', meal_time || '', notes || '']
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      diet_id: dietId,
      meal_number: nextMealNumber,
      meal_name,
      meal_time,
      notes
    });
  } catch (error) {
    console.error('Error al crear comida:', error);
    res.status(500).json({ error: 'Error al crear comida' });
  }
});

// Actualizar comida
router.put('/meals/:mealId', async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    const { meal_name, meal_time, notes } = req.body;
    
    await pool.query<ResultSetHeader>(
      'UPDATE diet_meals SET meal_name = ?, meal_time = ?, notes = ? WHERE id = ?',
      [meal_name, meal_time, notes, mealId]
    );
    
    res.json({ message: 'Comida actualizada' });
  } catch (error) {
    console.error('Error al actualizar comida:', error);
    res.status(500).json({ error: 'Error al actualizar comida' });
  }
});

// Eliminar comida
router.delete('/meals/:mealId', async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    await pool.query<ResultSetHeader>('DELETE FROM diet_meals WHERE id = ?', [mealId]);
    res.json({ message: 'Comida eliminada' });
  } catch (error) {
    console.error('Error al eliminar comida:', error);
    res.status(500).json({ error: 'Error al eliminar comida' });
  }
});

// Obtener opciones de una comida
router.get('/meals/:mealId/options', async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    
    const [options] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM meal_options WHERE diet_meal_id = ? ORDER BY option_number',
      [mealId]
    );
    
    res.json(options);
  } catch (error) {
    console.error('Error al obtener opciones:', error);
    res.status(500).json({ error: 'Error al obtener opciones' });
  }
});

// ==================== MEAL OPTIONS ====================

// Crear opción de comida
router.post('/options/:mealId', async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    const { name } = req.body;
    
    // Obtener el siguiente número de opción
    const [maxOption] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(option_number), 0) as max_num FROM meal_options WHERE diet_meal_id = ?',
      [mealId]
    );
    const nextOptionNumber = maxOption[0].max_num + 1;
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO meal_options (diet_meal_id, option_number, name) VALUES (?, ?, ?)',
      [mealId, nextOptionNumber, name || `Opción ${nextOptionNumber}`]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      diet_meal_id: mealId,
      option_number: nextOptionNumber,
      name
    });
  } catch (error) {
    console.error('Error al crear opción:', error);
    res.status(500).json({ error: 'Error al crear opción' });
  }
});

// Actualizar opción
router.put('/options/:optionId', async (req: Request, res: Response) => {
  try {
    const { optionId } = req.params;
    const { name } = req.body;
    
    await pool.query<ResultSetHeader>(
      'UPDATE meal_options SET name = ? WHERE id = ?',
      [name, optionId]
    );
    
    res.json({ message: 'Opción actualizada' });
  } catch (error) {
    console.error('Error al actualizar opción:', error);
    res.status(500).json({ error: 'Error al actualizar opción' });
  }
});

// Eliminar opción
router.delete('/options/:optionId', async (req: Request, res: Response) => {
  try {
    const { optionId } = req.params;
    await pool.query<ResultSetHeader>('DELETE FROM meal_options WHERE id = ?', [optionId]);
    res.json({ message: 'Opción eliminada' });
  } catch (error) {
    console.error('Error al eliminar opción:', error);
    res.status(500).json({ error: 'Error al eliminar opción' });
  }
});

// Obtener alimentos de una opción
router.get('/options/:optionId/foods', async (req: Request, res: Response) => {
  try {
    const { optionId } = req.params;
    
    const [foods] = await pool.query<RowDataPacket[]>(
      `SELECT opt_f.*, fl.name as food_name, fl.category as food_category, 
              fl.calories_per_100g, fl.protein_per_100g, fl.carbs_per_100g, 
              fl.fat_per_100g, fl.fiber_per_100g, fl.sugar_per_100g
       FROM option_foods opt_f
       JOIN food_library fl ON opt_f.food_id = fl.id
       WHERE opt_f.meal_option_id = ?
       ORDER BY opt_f.order_index`,
      [optionId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Error al obtener alimentos:', error);
    res.status(500).json({ error: 'Error al obtener alimentos' });
  }
});

// ==================== OPTION FOODS ====================

// Añadir alimento a una opción
router.post('/foods/:optionId', async (req: Request, res: Response) => {
  try {
    const { optionId } = req.params;
    const { food_id, quantity, unit, notes } = req.body;
    
    // Obtener el siguiente order_index
    const [maxOrder] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(MAX(order_index), -1) as max_order FROM option_foods WHERE meal_option_id = ?',
      [optionId]
    );
    const nextOrder = maxOrder[0].max_order + 1;
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO option_foods (meal_option_id, food_id, quantity, unit, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [optionId, food_id, quantity, unit || 'gramos', notes || '', nextOrder]
    );
    
    // Obtener el alimento creado con info completa
    const [foods] = await pool.query<RowDataPacket[]>(
      `SELECT opt_f.*, fl.name as food_name, fl.category as food_category
       FROM option_foods opt_f
       JOIN food_library fl ON opt_f.food_id = fl.id
       WHERE opt_f.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(foods[0]);
  } catch (error) {
    console.error('Error al añadir alimento:', error);
    res.status(500).json({ error: 'Error al añadir alimento' });
  }
});

// Actualizar alimento
router.put('/foods/:foodId', async (req: Request, res: Response) => {
  try {
    const { foodId } = req.params;
    const { quantity, unit, notes } = req.body;
    
    await pool.query<ResultSetHeader>(
      'UPDATE option_foods SET quantity = ?, unit = ?, notes = ? WHERE id = ?',
      [quantity, unit, notes, foodId]
    );
    
    res.json({ message: 'Alimento actualizado' });
  } catch (error) {
    console.error('Error al actualizar alimento:', error);
    res.status(500).json({ error: 'Error al actualizar alimento' });
  }
});

// Eliminar alimento
router.delete('/foods/:foodId', async (req: Request, res: Response) => {
  try {
    const { foodId } = req.params;
    await pool.query<ResultSetHeader>('DELETE FROM option_foods WHERE id = ?', [foodId]);
    res.json({ message: 'Alimento eliminado' });
  } catch (error) {
    console.error('Error al eliminar alimento:', error);
    res.status(500).json({ error: 'Error al eliminar alimento' });
  }
});

export default router;
