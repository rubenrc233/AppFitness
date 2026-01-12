export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
}

export interface Client {
  id: number;
  name: string;
  email: string;
  created_at: string;
  next_due_date?: string;
  is_enabled?: boolean; // false = bloqueado
}

export interface Meal {
  id: number;
  client_id: number;
  meal_name: string;
  meal_time: string;
  description: string;
  created_at: string;
}

// Nuevos tipos para sistema de dietas
export interface FoodItem {
  id: number;
  name: string;
  category: string;
  is_custom: boolean;
  created_by_user_id?: number;
}

export interface Diet {
  id: number;
  client_id: number;
  name: string;
  created_at: string;
  meals?: DietMeal[];
}

export interface DietMeal {
  id: number;
  diet_id: number;
  meal_number: number;
  meal_name: string;
  meal_time: string;
  notes: string;
  created_at: string;
}

export interface MealOption {
  id: number;
  diet_meal_id: number;
  option_number: number;
  name: string;
  image_url?: string | null;
  created_at: string;
}

export interface OptionFood {
  id: number;
  meal_option_id: number;
  food_id: number;
  food_name: string;
  food_category: string;
  quantity: number;
  unit: 'gramos' | 'unidades';
  notes: string;
  order_index: number;
  calories_per_100g?: number;
}

// Nuevos tipos para sistema de rutinas y días
export interface ExerciseLibrary {
  id: number;
  name: string;
  muscle_group: string;
  description: string;
  type?: 'system' | 'custom';
}

export interface Routine {
  id: number;
  client_id: number;
  name: string;
  created_at: string;
  days?: RoutineDay[];
}

export interface RoutineDay {
  id: number;
  routine_id: number;
  day_number: number;
  name: string;
  custom_name?: string;
  notes: string;
  created_at: string;
}

export interface DayExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  description: string;
  sets: number;
  reps: string;
  notes: string;
  order_index: number;
}

export interface Exercise {
  id: number;
  client_id: number;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  notes: string;
  day: string;
  created_at: string;
}

export interface ClientDetails {
  client: Client;
  meals: Meal[];
  exercises: Exercise[];
}

// Sistema de Progreso
export interface ProgressSettings {
  id: number;
  client_id: number;
  frequency_weeks: number;
  day_of_week: string;
  next_due_date: string;
  is_enabled: boolean;
  created_at: string;
}

export interface ProgressUpdate {
  id: number;
  client_id: number;
  weight: number;
  front_photo_url: string;
  side_photo_url: string;
  back_photo_url: string;
  created_at: string;
}

export interface ProgressStatus {
  canUpload: boolean;
  nextDueDate: string | null;
  lastUpdate: ProgressUpdate | null;
}

// Sistema de Recetas
export interface Recipe {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  created_by: number;
  created_at: string;
}

export interface RecipeFood {
  id: number;
  recipe_id: number;
  food_id: number;
  food_name: string;
  category: string;
  quantity: number;
  unit: 'gramos' | 'unidades';
}
