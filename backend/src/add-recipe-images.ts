import { pool } from './database';
import fs from 'fs';
import path from 'path';

async function addRecipeImages() {
  try {
    console.log('📸 Adding image_url column to diet_recipes...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '../add_recipe_images.sql'),
      'utf-8'
    );
    
    await pool.query(sql);
    
    console.log('✅ Successfully added image_url column!');
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column image_url already exists');
      process.exit(0);
    }
    console.error('❌ Error adding image_url column:', error);
    process.exit(1);
  }
}

addRecipeImages();
