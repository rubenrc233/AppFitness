import { pool } from './database';

async function updateCalories() {
  try {
    console.log('Actualizando calorías de alimentos...');

    // Verduras y Vegetales
    await pool.query("UPDATE food_library SET calories_per_100g = 25 WHERE name = 'Verdura' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 20 WHERE name = 'Ensalada' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 120 WHERE name = 'Legumbres' AND is_custom = FALSE");

    // Carnes
    await pool.query("UPDATE food_library SET calories_per_100g = 165 WHERE name = 'Pollo' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 143 WHERE name = 'Pavo' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 250 WHERE name = 'Ternera' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 242 WHERE name = 'Cerdo' AND is_custom = FALSE");

    // Pescados
    await pool.query("UPDATE food_library SET calories_per_100g = 96 WHERE name = 'Pescado Blanco' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 180 WHERE name = 'Pescado Azul' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 90 WHERE name = 'Marisco' AND is_custom = FALSE");

    // Huevos y Lácteos
    await pool.query("UPDATE food_library SET calories_per_100g = 155 WHERE name = 'Huevos' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 59 WHERE name = 'Yogur' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 300 WHERE name = 'Queso' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 50 WHERE name = 'Leche' AND is_custom = FALSE");

    // Carbohidratos
    await pool.query("UPDATE food_library SET calories_per_100g = 130 WHERE name = 'Arroz' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 371 WHERE name = 'Pasta' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 265 WHERE name = 'Pan' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 77 WHERE name = 'Patata' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 389 WHERE name = 'Avena' AND is_custom = FALSE");

    // Frutas
    await pool.query("UPDATE food_library SET calories_per_100g = 50 WHERE name = 'Fruta' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 600 WHERE name = 'Frutos Secos' AND is_custom = FALSE");

    // Grasas
    await pool.query("UPDATE food_library SET calories_per_100g = 884 WHERE name = 'Aceite de Oliva' AND is_custom = FALSE");
    await pool.query("UPDATE food_library SET calories_per_100g = 160 WHERE name = 'Aguacate' AND is_custom = FALSE");

    // Suplementos
    await pool.query("UPDATE food_library SET calories_per_100g = 380 WHERE name = 'Proteína en Polvo' AND is_custom = FALSE");

    console.log('✅ Calorías actualizadas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error actualizando calorías:', error);
    process.exit(1);
  }
}

updateCalories();
