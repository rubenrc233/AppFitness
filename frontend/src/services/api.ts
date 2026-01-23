import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend en producción (Render)
const API_URL = 'https://appfitness-l641.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos timeout (Render puede tardar en despertar)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout - El servidor tardó demasiado en responder');
    }
    if (!error.response) {
      console.error('🌐 Error de red - No se pudo conectar al servidor');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (name: string, email: string, password: string, role: 'admin' | 'client' = 'client') => {
    console.log('📝 Register request:', { name, email, role });
    const response = await api.post('/auth/register', { name, email, password, role });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    console.log('🔐 Login request to:', `${API_URL}/auth/login`);
    console.log('📧 Email:', email);
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Login response:', response.data);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: { name?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  deleteAccount: async (password: string) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response.data;
  },
};

export const clientService = {
  getClients: async (pending?: boolean) => {
    const params = pending ? { pending: 'true' } : {};
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getClientDetails: async (clientId: number) => {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  },

  approveClient: async (clientId: number) => {
    const response = await api.post(`/clients/${clientId}/approve`);
    return response.data;
  },

  rejectClient: async (clientId: number) => {
    const response = await api.delete(`/clients/${clientId}/reject`);
    return response.data;
  },
};

export const mealService = {
  getMeals: async (clientId: number) => {
    const response = await api.get(`/meals/${clientId}`);
    return response.data;
  },

  addMeal: async (meal: { client_id: number; meal_name: string; meal_time: string; description?: string }) => {
    const response = await api.post('/meals', meal);
    return response.data;
  },

  updateMeal: async (mealId: number, meal: { meal_name: string; meal_time: string; description?: string }) => {
    const response = await api.put(`/meals/${mealId}`, meal);
    return response.data;
  },

  deleteMeal: async (mealId: number) => {
    const response = await api.delete(`/meals/${mealId}`);
    return response.data;
  },
};

export const exerciseService = {
  getExercises: async (clientId: number) => {
    const response = await api.get(`/exercises/${clientId}`);
    return response.data;
  },

  addExercise: async (exercise: { client_id: number; exercise_name: string; sets?: number; reps?: number; notes?: string; day?: string }) => {
    const response = await api.post('/exercises', exercise);
    return response.data;
  },

  updateExercise: async (exerciseId: number, exercise: { exercise_name: string; sets?: number; reps?: number; notes?: string; day?: string }) => {
    const response = await api.put(`/exercises/${exerciseId}`, exercise);
    return response.data;
  },

  deleteExercise: async (exerciseId: number) => {
    const response = await api.delete(`/exercises/${exerciseId}`);
    return response.data;
  },
};

// Servicios para rutinas de entrenamiento
export const routineService = {
  // Obtener biblioteca de ejercicios (con filtro opcional)
  getExerciseLibrary: async (muscleGroup?: string) => {
    const params = muscleGroup ? { muscleGroup } : {};
    const response = await api.get('/routines/library', { params });
    return response.data;
  },

  // Obtener grupos musculares
  getMuscleGroups: async () => {
    const response = await api.get('/routines/muscle-groups');
    return response.data;
  },

  // Obtener rutina de un cliente (con días)
  getRoutine: async (clientId: number) => {
    const response = await api.get(`/routines/${clientId}`);
    return response.data;
  },

  // Crear rutina (crea automáticamente los días vacíos)
  createRoutine: async (clientId: number, data: { name: string; totalDays: number }) => {
    const response = await api.post(`/routines/${clientId}`, data);
    return response.data;
  },

  // Actualizar rutina (nombre)
  updateRoutine: async (routineId: number, data: { name: string }) => {
    const response = await api.put(`/routines/${routineId}`, data);
    return response.data;
  },

  // Obtener ejercicios de un día
  getDayExercises: async (dayId: number) => {
    const response = await api.get(`/routines/days/${dayId}`);
    return response.data;
  },

  // Actualizar día (nombre, notas y weekday)
  updateDay: async (dayId: number, data: { name: string; custom_name?: string | null; notes?: string; weekday?: number }) => {
    const response = await api.put(`/routines/days/${dayId}`, data);
    return response.data;
  },
  
  // Crear ejercicio personalizado
  createCustomExercise: async (data: { name: string; muscle_group: string; description?: string }) => {
    const response = await api.post('/exercises/custom', data);
    return response.data;
  },

  // Agregar ejercicio a un día
  addExerciseToDay: async (dayId: number, data: { exerciseId: number; sets?: number; reps?: string; notes?: string; orderIndex?: number }) => {
    const response = await api.post(`/routines/days/${dayId}/exercises`, data);
    return response.data;
  },

  // Actualizar ejercicio en día
  updateDayExercise: async (exerciseId: number, data: { sets: number; reps: string; notes: string }) => {
    const response = await api.put(`/routines/days/exercises/${exerciseId}`, data);
    return response.data;
  },

  // Eliminar ejercicio de día
  deleteDayExercise: async (exerciseId: number) => {
    const response = await api.delete(`/routines/days/exercises/${exerciseId}`);
    return response.data;
  },

  // Reordenar ejercicios de un día
  reorderDayExercises: async (dayId: number, exerciseIds: number[]) => {
    const response = await api.put(`/routines/days/${dayId}/exercises/reorder`, { exerciseIds });
    return response.data;
  },

  // Eliminar rutina completa
  deleteRoutine: async (routineId: number) => {
    const response = await api.delete(`/routines/${routineId}`);
    return response.data;
  },
};

// Servicios para dietas
export const dietService = {
  // Obtener biblioteca de alimentos
  getFoodLibrary: async () => {
    const response = await api.get('/diets/foods');
    return response.data;
  },

  // Crear alimento custom
  createCustomFood: async (data: { 
    name: string; 
    category: string; 
    created_by_user_id: number;
    calories_per_100g?: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
  }) => {
    const response = await api.post('/diets/foods', data);
    return response.data;
  },

  // Crear nueva dieta
  createDiet: async (clientId: number, data: { name: string }) => {
    const response = await api.post('/diets', { client_id: clientId, ...data });
    return response.data;
  },

  // Obtener dieta de un cliente (con comidas)
  getDiet: async (clientId: number) => {
    const response = await api.get(`/diets/${clientId}`);
    return response.data;
  },

  // Actualizar nombre de dieta
  updateDiet: async (dietId: number, data: { name: string }) => {
    const response = await api.put(`/diets/${dietId}`, data);
    return response.data;
  },

  // Crear comida en la dieta
  createMeal: async (dietId: number, data: { meal_name: string; meal_time?: string; notes?: string }) => {
    const response = await api.post(`/diets/meals/${dietId}`, data);
    return response.data;
  },

  // Actualizar comida
  updateMeal: async (mealId: number, data: { meal_name: string; meal_time?: string; notes?: string }) => {
    const response = await api.put(`/diets/meals/${mealId}`, data);
    return response.data;
  },

  // Eliminar comida
  deleteMeal: async (mealId: number) => {
    const response = await api.delete(`/diets/meals/${mealId}`);
    return response.data;
  },

  // Obtener opciones de una comida
  getMealOptions: async (mealId: number) => {
    const response = await api.get(`/diets/meals/${mealId}/options`);
    return response.data;
  },

  // Crear opción en una comida
  createOption: async (mealId: number, data: { name: string }) => {
    const response = await api.post(`/diets/options/${mealId}`, data);
    return response.data;
  },

  // Actualizar opción
  updateOption: async (optionId: number, data: { name: string }) => {
    const response = await api.put(`/diets/options/${optionId}`, data);
    return response.data;
  },

  // Eliminar opción
  deleteOption: async (optionId: number) => {
    const response = await api.delete(`/diets/options/${optionId}`);
    return response.data;
  },

  // Obtener alimentos de una opción
  getOptionFoods: async (optionId: number) => {
    const response = await api.get(`/diets/options/${optionId}/foods`);
    return response.data;
  },

  // Añadir alimento a una opción
  addFood: async (optionId: number, data: { food_id: number; quantity: number; unit: 'gramos' | 'unidades'; notes?: string }) => {
    const response = await api.post(`/diets/foods/${optionId}`, data);
    return response.data;
  },

  // Actualizar alimento
  updateFood: async (foodId: number, data: { quantity: number; unit: 'gramos' | 'unidades'; notes: string }) => {
    const response = await api.put(`/diets/foods/${foodId}`, data);
    return response.data;
  },

  // Eliminar alimento
  deleteFood: async (foodId: number) => {
    const response = await api.delete(`/diets/foods/${foodId}`);
    return response.data;
  },

  // Recetas (plantillas de opciones)
  getRecipes: async () => {
    const response = await api.get('/recipes');
    return response.data;
  },

  getRecipeFoods: async (recipeId: number) => {
    const response = await api.get(`/recipes/${recipeId}/foods`);
    return response.data;
  },

  createRecipe: async (data: { name: string; description?: string; foods: Array<{ food_id: number; quantity: number; unit: string }> }) => {
    const response = await api.post('/recipes', data);
    return response.data;
  },

  deleteRecipe: async (recipeId: number) => {
    const response = await api.delete(`/recipes/${recipeId}`);
    return response.data;
  },

  copyRecipeToOption: async (recipeId: number, mealId: number, modifications?: Array<{ food_id: number; quantity: number }>) => {
    const response = await api.post(`/recipes/${recipeId}/copy-to-meal/${mealId}`, { modifications });
    return response.data;
  },
};

export const workoutService = {
  // Obtener el último entrenamiento registrado
  getLastWorkout: async (clientId: number, dayId: number) => {
    const response = await api.get(`/workouts/last/${clientId}/${dayId}`);
    return response.data;
  },

  // Guardar entrenamiento completo
  saveWorkout: async (clientId: number, dayId: number, exercises: any[]) => {
    const response = await api.post('/workouts/save', {
      clientId,
      dayId,
      exercises
    });
    return response.data;
  },
};

// Sistema de Progreso
export const progressService = {
  // Admin - Configurar periodicidad
  saveSettings: async (clientId: number, settings: { frequencyWeeks: number; dayOfWeek: string }) => {
    const response = await api.post(`/progress/settings/${clientId}`, settings);
    return response.data;
  },

  // Admin/Cliente - Obtener configuración
  getSettings: async (clientId: number) => {
    const response = await api.get(`/progress/settings/${clientId}`);
    return response.data;
  },

  // Cliente - Verificar estado
  getStatus: async () => {
    const response = await api.get('/progress/status');
    return response.data;
  },

  // Cliente - Subir progreso (fotos + peso)
  uploadProgress: async (formData: FormData) => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_URL}/progress/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir progreso');
    }
    
    return response.json();
  },

  // Admin/Cliente - Ver historial
  getHistory: async (clientId: number) => {
    const response = await api.get(`/progress/history/${clientId}`);
    return response.data;
  },

  // Admin - Activar progreso manualmente (opcional)
  activateProgress: async (clientId: number) => {
    const response = await api.post(`/progress/activate/${clientId}`);
    return response.data;
  },
};

export const recipeService = {
  // Obtener todas las recetas
  getRecipes: async () => {
    const response = await api.get('/recipes');
    return response.data;
  },
  
  // Obtener alimentos de una receta
  getRecipeFoods: async (recipeId: number) => {
    const response = await api.get(`/recipes/${recipeId}/foods`);
    return response.data;
  },

  // Crear receta
  createRecipe: async (data: { name: string; description?: string; foods: Array<{ food_id: number; quantity: number; unit: string }> }) => {
    const response = await api.post('/recipes', data);
    return response.data;
  },

  // Actualizar receta
  updateRecipe: async (recipeId: number, data: { name: string; description?: string }) => {
    const response = await api.put(`/recipes/${recipeId}`, data);
    return response.data;
  },

  // Eliminar receta
  deleteRecipe: async (recipeId: number) => {
    const response = await api.delete(`/recipes/${recipeId}`);
    return response.data;
  },

  // Copiar receta a opción de comida
  copyRecipeToOption: async (recipeId: number, mealId: number, modifications?: Array<{ food_id: number; quantity: number }>) => {
    const response = await api.post(`/recipes/${recipeId}/copy-to-meal/${mealId}`, { modifications });
    return response.data;
  },
};

// Servicio de pasos
export const stepsService = {
  // Obtener configuración de pasos de un cliente
  getSettings: async (clientId: number) => {
    const response = await api.get(`/steps/settings/${clientId}`);
    return response.data;
  },

  // Actualizar meta de pasos (admin)
  updateSettings: async (clientId: number, dailyGoal: number) => {
    const response = await api.post(`/steps/settings/${clientId}`, { daily_goal: dailyGoal });
    return response.data;
  },
};

// Servicio de suplementación
export const supplementsService = {
  // Obtener suplementos de un cliente
  getSupplements: async (clientId: number) => {
    const response = await api.get(`/supplements/${clientId}`);
    return response.data;
  },

  // Añadir suplemento
  addSupplement: async (clientId: number, data: { name: string; dosage: string; time_of_day?: string; notes?: string }) => {
    const response = await api.post(`/supplements/${clientId}`, data);
    return response.data;
  },

  // Actualizar suplemento
  updateSupplement: async (supplementId: number, data: { name: string; dosage: string; time_of_day?: string; notes?: string }) => {
    const response = await api.put(`/supplements/${supplementId}`, data);
    return response.data;
  },

  // Eliminar suplemento
  deleteSupplement: async (supplementId: number) => {
    const response = await api.delete(`/supplements/${supplementId}`);
    return response.data;
  },
};

export const paymentService = {
  // Configurar sistema de pagos de un cliente
  configurePayment: async (userId: number, amount: number, frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual', startDate?: string) => {
    const response = await api.post('/payments/config', { userId, amount, frequency, startDate });
    return response.data;
  },

  // Obtener configuración de pago de un cliente
  getPaymentConfig: async (userId: number) => {
    const response = await api.get(`/payments/config/${userId}`);
    return response.data;
  },

  // Obtener todos los clientes con su estado de pago
  getClientsPaymentStatus: async () => {
    const response = await api.get('/payments/clients-status');
    return response.data;
  },

  // Registrar un pago
  registerPayment: async (userId: number, paymentDate?: string) => {
    const response = await api.post('/payments/register', { userId, paymentDate });
    return response.data;
  },

  // Obtener histórico de pagos
  getPaymentHistory: async (filters?: { userId?: number; userName?: string; month?: number; year?: number; startDate?: string; endDate?: string }) => {
    const response = await api.get('/payments/history', { params: filters });
    return response.data;
  },

  // Obtener estadísticas de pagos
  getPaymentStats: async (year?: number) => {
    const response = await api.get('/payments/stats', { params: { year } });
    return response.data;
  },

  // Desactivar sistema de pagos
  deactivatePayment: async (userId: number) => {
    const response = await api.delete(`/payments/config/${userId}`);
    return response.data;
  },
};

export default api;

