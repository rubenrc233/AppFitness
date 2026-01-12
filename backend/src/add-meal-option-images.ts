import { pool } from './database';
import fs from 'fs';
import path from 'path';

async function addMealOptionImages() {
  try {
    console.log('📸 Adding image_url column to meal_options...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '../add_meal_option_images.sql'),
      'utf-8'
    );
    
    await pool.query(sql);
    
    console.log('✅ Successfully added image_url column to meal_options!');
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column image_url already exists in meal_options');
      process.exit(0);
    }
    console.error('❌ Error adding image_url column:', error);
    process.exit(1);
  }
}

addMealOptionImages();
