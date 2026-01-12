import express from 'express';
import { pool } from '../database';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { searchRecipeImage } from '../config/unsplash';

const router = express.Router();

// Obtener todas las recetas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [recipes] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM diet_recipes ORDER BY name'
    );
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
});

// Obtener alimentos de una receta
router.get('/:recipeId/foods', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    const [foods] = await pool.query<RowDataPacket[]>(
      `SELECT rf.*, fl.name as food_name, fl.category, fl.is_custom
       FROM recipe_foods rf
       JOIN food_library fl ON rf.food_id = fl.id
       WHERE rf.recipe_id = ?
       ORDER BY fl.name`,
      [recipeId]
    );
    
    res.json(foods);
  } catch (error) {
    console.error('Error fetching recipe foods:', error);
    res.status(500).json({ error: 'Error al obtener alimentos de la receta' });
  }
});

// Crear receta
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, description, foods } = req.body;
    const userId = (req as any).userId;
    
    if (!name || !foods || foods.length === 0) {
      return res.status(400).json({ error: 'Nombre y alimentos son requeridos' });
    }
    
    await connection.beginTransaction();
    
    // Buscar imagen en Unsplash automáticamente
    console.log(`🔍 Buscando imagen para: ${name}`);
    const imageUrl = await searchRecipeImage(name);
    if (imageUrl) {
      console.log(`✅ Imagen encontrada: ${imageUrl}`);
    } else {
      console.log('⚠️  No se encontró imagen en Unsplash');
    }
    
    // Crear receta con imagen
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO diet_recipes (name, description, image_url, created_by) VALUES (?, ?, ?, ?)',
      [name, description || '', imageUrl, userId]
    );
    
    const recipeId = result.insertId;
    
    // Agregar alimentos
    for (const food of foods) {
      await connection.query(
        'INSERT INTO recipe_foods (recipe_id, food_id, quantity, unit) VALUES (?, ?, ?, ?)',
        [recipeId, food.food_id, food.quantity, food.unit]
      );
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Receta creada',
      recipeId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Error al crear receta' });
  } finally {
    connection.release();
  }
});

// Actualizar receta
router.put('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { name, description } = req.body;
    
    await pool.query(
      'UPDATE diet_recipes SET name = ?, description = ? WHERE id = ?',
      [name, description || '', recipeId]
    );
    
    res.json({ message: 'Receta actualizada' });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
});

// Eliminar receta
router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    await pool.query('DELETE FROM diet_recipes WHERE id = ?', [recipeId]);
    
    res.json({ message: 'Receta eliminada' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
});

// Copiar receta a una comida (crea nueva opción con los alimentos de la receta)
router.post('/:recipeId/copy-to-meal/:mealId', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { recipeId, mealId } = req.params;
    const { modifications } = req.body; // Array: [{ food_id, quantity }]
    
    await connection.beginTransaction();
    
    // Obtener nombre e imagen de la receta para la nueva opción
    const [recipes] = await connection.query<RowDataPacket[]>(
      'SELECT name, image_url FROM diet_recipes WHERE id = ?',
      [recipeId]
    );
    
    if (recipes.length === 0) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    
    // Contar opciones actuales para calcular option_number
    const [existingOptions] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM meal_options WHERE diet_meal_id = ?',
      [mealId]
    );
    const optionNumber = (existingOptions[0].count || 0) + 1;
    
    // Crear nueva opción con imagen de la receta
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO meal_options (diet_meal_id, option_number, name, image_url) VALUES (?, ?, ?, ?)',
      [mealId, optionNumber, recipes[0].name, recipes[0].image_url]
    );
    const newOptionId = result.insertId;
    
    // Obtener alimentos de la receta
    const [recipeFoods] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM recipe_foods WHERE recipe_id = ?',
      [recipeId]
    );
    
    // Copiar alimentos a la opción
    for (const food of recipeFoods) {
      // Buscar si hay modificación de cantidad para este alimento
      const modification = modifications?.find((m: any) => m.food_id === food.food_id);
      const quantity = modification?.quantity || food.quantity;
      
      await connection.query(
        'INSERT INTO option_foods (meal_option_id, food_id, quantity, unit, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [newOptionId, food.food_id, quantity, food.unit, '', 0]
      );
    }
    
    await connection.commit();
    
    // Devolver la nueva opción creada
    const [newOption] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM meal_options WHERE id = ?',
      [newOptionId]
    );
    
    res.json(newOption[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error copying recipe:', error);
    res.status(500).json({ error: 'Error al copiar receta' });
  } finally {
    connection.release();
  }
});

export default router;
