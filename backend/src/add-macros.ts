import { pool } from './database';

async function addMacrosToFoods() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Añadiendo columnas de macronutrientes...');
    
    // Verificar si las columnas ya existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'food_library' AND COLUMN_NAME = 'protein_per_100g'
    `) as any[];
    
    if (columns.length === 0) {
      // Añadir columnas de macros
      await connection.query(`
        ALTER TABLE food_library 
        ADD COLUMN protein_per_100g DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN carbs_per_100g DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN fat_per_100g DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN fiber_per_100g DECIMAL(10, 2) DEFAULT 0,
        ADD COLUMN sugar_per_100g DECIMAL(10, 2) DEFAULT 0
      `);
      console.log('✅ Columnas añadidas correctamente');
    } else {
      console.log('ℹ️ Las columnas ya existen');
    }

    // Actualizar macros para alimentos existentes
    console.log('📝 Actualizando valores de macronutrientes...');

    const updates = [
      // Verduras y Vegetales
      { name: 'Verdura', protein: 2.0, carbs: 4.0, fat: 0.3, fiber: 2.0, sugar: 2.0 },
      { name: 'Ensalada', protein: 1.5, carbs: 3.0, fat: 0.2, fiber: 1.5, sugar: 1.5 },
      { name: 'Legumbres', protein: 9.0, carbs: 20.0, fat: 0.5, fiber: 8.0, sugar: 1.0 },
      // Carnes
      { name: 'Pollo', protein: 31.0, carbs: 0.0, fat: 3.6, fiber: 0.0, sugar: 0.0 },
      { name: 'Pavo', protein: 29.0, carbs: 0.0, fat: 1.0, fiber: 0.0, sugar: 0.0 },
      { name: 'Ternera', protein: 26.0, carbs: 0.0, fat: 15.0, fiber: 0.0, sugar: 0.0 },
      { name: 'Cerdo', protein: 27.0, carbs: 0.0, fat: 14.0, fiber: 0.0, sugar: 0.0 },
      // Pescados
      { name: 'Pescado Blanco', protein: 20.0, carbs: 0.0, fat: 1.0, fiber: 0.0, sugar: 0.0 },
      { name: 'Pescado Azul', protein: 20.0, carbs: 0.0, fat: 10.0, fiber: 0.0, sugar: 0.0 },
      { name: 'Marisco', protein: 18.0, carbs: 2.0, fat: 1.5, fiber: 0.0, sugar: 0.0 },
      // Huevos y Lácteos
      { name: 'Huevos', protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0.0, sugar: 1.1 },
      { name: 'Yogur', protein: 5.0, carbs: 4.0, fat: 1.5, fiber: 0.0, sugar: 4.0 },
      { name: 'Queso', protein: 25.0, carbs: 1.3, fat: 22.0, fiber: 0.0, sugar: 0.5 },
      { name: 'Leche', protein: 3.4, carbs: 4.8, fat: 1.0, fiber: 0.0, sugar: 4.8 },
      // Carbohidratos
      { name: 'Arroz', protein: 2.7, carbs: 28.0, fat: 0.3, fiber: 0.4, sugar: 0.0 },
      { name: 'Pasta', protein: 13.0, carbs: 75.0, fat: 1.5, fiber: 3.0, sugar: 2.7 },
      { name: 'Pan', protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7, sugar: 5.0 },
      { name: 'Patata', protein: 2.0, carbs: 17.0, fat: 0.1, fiber: 2.2, sugar: 0.8 },
      { name: 'Avena', protein: 17.0, carbs: 66.0, fat: 7.0, fiber: 11.0, sugar: 0.0 },
      // Frutas
      { name: 'Fruta', protein: 0.5, carbs: 12.0, fat: 0.2, fiber: 2.0, sugar: 10.0 },
      { name: 'Frutos Secos', protein: 15.0, carbs: 21.0, fat: 54.0, fiber: 7.0, sugar: 4.0 },
      // Grasas
      { name: 'Aceite de Oliva', protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0, sugar: 0.0 },
      { name: 'Aguacate', protein: 2.0, carbs: 9.0, fat: 15.0, fiber: 7.0, sugar: 0.7 },
      // Suplementos
      { name: 'Proteína en Polvo', protein: 80.0, carbs: 5.0, fat: 5.0, fiber: 0.0, sugar: 2.0 },
      // Verduras adicionales
      { name: 'Zanahoria', protein: 0.9, carbs: 10.0, fat: 0.2, fiber: 2.8, sugar: 4.7 },
      { name: 'Pimiento', protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, sugar: 4.2 },
      // Frutas adicionales
      { name: 'Manzana', protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4, sugar: 10.0 },
      { name: 'Plátano', protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6, sugar: 12.0 },
      { name: 'Naranja', protein: 0.9, carbs: 12.0, fat: 0.1, fiber: 2.4, sugar: 9.0 },
      { name: 'Fresas', protein: 0.7, carbs: 8.0, fat: 0.3, fiber: 2.0, sugar: 5.0 },
      { name: 'Arándanos', protein: 0.7, carbs: 14.0, fat: 0.3, fiber: 2.4, sugar: 10.0 },
      // Legumbres adicionales
      { name: 'Garbanzos cocidos', protein: 9.0, carbs: 27.0, fat: 3.0, fiber: 8.0, sugar: 0.0 },
      { name: 'Lentejas cocidas', protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 8.0, sugar: 2.0 },
      { name: 'Alubias cocidas', protein: 8.0, carbs: 21.0, fat: 0.5, fiber: 6.0, sugar: 0.0 },
    ];

    for (const food of updates) {
      await connection.query(`
        UPDATE food_library SET 
          protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?, 
          fiber_per_100g = ?, sugar_per_100g = ?
        WHERE name = ? AND is_custom = FALSE
      `, [food.protein, food.carbs, food.fat, food.fiber, food.sugar, food.name]);
    }

    console.log('✅ Macronutrientes actualizados correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addMacrosToFoods();
