export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
  is_approved?: boolean;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  created_at: string;
  next_due_date?: string;
  is_enabled?: boolean; // false = bloqueado
  is_approved?: boolean;
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
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
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
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
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
  weekday: number; // 0 = Lunes, 1 = Martes, ..., 6 = Domingo
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
  video_url?: string;
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
  extra_photo_url?: string;
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

// Suplementación
export interface Supplement {
  id: number;
  client_id: number;
  name: string;
  dosage: string;
  time_of_day: string | null;
  notes: string | null;
  created_at: string;
}

// Sistema de Pagos
export interface PaymentConfig {
  id: number;
  user_id: number;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  start_date: string;
  next_payment_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: number;
  user_id: number;
  amount: number;
  payment_date: string;
  period_start: string;
  period_end: string;
  frequency: string;
  notes?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface ClientWithPaymentStatus extends Client {
  amount?: number;
  frequency?: string;
  start_date?: string;
  next_payment_date?: string;
  active?: boolean;
  payment_due?: boolean;
  days_until_payment?: number;
}

export interface PaymentStats {
  year: number;
  monthly: Array<{
    month: number;
    total: number;
    count: number;
  }>;
  yearly: {
    total: number;
    count: number;
  };
  topClients: Array<{
    id: number;
    name: string;
    email: string;
    total_paid: number;
    payment_count: number;
  }>;
}

