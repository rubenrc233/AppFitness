import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import LoadingScreen from '../components/LoadingScreen';
import { dietService, supplementsService } from '../services/api';
import { Diet, DietMeal, MealOption, OptionFood, FoodItem, Supplement } from '../types';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

// Tipo para recetas guardadas
interface SavedRecipe {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
}

export default function DietManagementScreen({ route, navigation }: any) {
  const { clientId, clientName } = route.params;

  const [diet, setDiet] = useState<Diet | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom alert hook
  const { alertState, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  // Food library for wizard
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);

  // Wizard - Crear comida completa
  const [wizardVisible, setWizardVisible] = useState(false);
  const [wizardEditingMealId, setWizardEditingMealId] = useState<number | null>(null);
  const [wizardMealName, setWizardMealName] = useState('');
  const [wizardMealNotes, setWizardMealNotes] = useState('');
  const [wizardOptions, setWizardOptions] = useState<{
    id: number;
    name: string;
    foods: { foodId: number; foodName: string; quantity: string; unit: string }[];
  }[]>([]);
  const [wizardEditingOptionIndex, setWizardEditingOptionIndex] = useState<number | null>(null);
  const [wizardFoodSearch, setWizardFoodSearch] = useState('');

  // Recetas guardadas (plantillas)
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [recipeFoodsMap, setRecipeFoodsMap] = useState<{ [recipeId: number]: { food_name: string; quantity: number; unit: string }[] }>({});

  // Modal para guardar receta
  const [showSaveRecipeModal, setShowSaveRecipeModal] = useState(false);
  const [saveRecipeName, setSaveRecipeName] = useState('');
  const [saveRecipeOptionIndex, setSaveRecipeOptionIndex] = useState<number | null>(null);

  // Maps
  const [mealOptionsMap, setMealOptionsMap] = useState<{ [mealId: number]: MealOption[] }>({});
  const [optionFoodsMap, setOptionFoodsMap] = useState<{ [optionId: number]: OptionFood[] }>({});

  // Suplementación
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [showSupplementsModal, setShowSupplementsModal] = useState(false);
  const [supplementsButtonHeight, setSupplementsButtonHeight] = useState(0);
  const [supplementName, setSupplementName] = useState('');
  const [supplementDosage, setSupplementDosage] = useState('');
  const [supplementTime, setSupplementTime] = useState('');
  const [supplementNotes, setSupplementNotes] = useState('');
  const [editingSupplementId, setEditingSupplementId] = useState<number | null>(null);

  // Alimento Custom
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodCategory, setCustomFoodCategory] = useState('');
  const [customFoodCalories, setCustomFoodCalories] = useState('');
  const [customFoodProtein, setCustomFoodProtein] = useState('');
  const [customFoodCarbs, setCustomFoodCarbs] = useState('');
  const [customFoodFat, setCustomFoodFat] = useState('');

  useEffect(() => {
    loadDiet();
    loadFoodLibrary();
    loadSavedRecipes();
    loadSupplements();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const recipes = await dietService.getRecipes();
      setSavedRecipes(recipes);
      
      // Cargar ingredientes de cada receta
      const foodsMap: { [recipeId: number]: { food_name: string; quantity: number; unit: string }[] } = {};
      for (const recipe of recipes) {
        try {
          const foods = await dietService.getRecipeFoods(recipe.id);
          foodsMap[recipe.id] = foods;
        } catch (e) {
          foodsMap[recipe.id] = [];
        }
      }
      setRecipeFoodsMap(foodsMap);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    }
  };

  const loadSupplements = async () => {
    try {
      const data = await supplementsService.getSupplements(clientId);
      setSupplements(data);
    } catch (error) {
      console.error('Error al cargar suplementos:', error);
    }
  };

  const handleAddSupplement = async () => {
    if (!supplementName.trim() || !supplementDosage.trim()) {
      showError('Error', 'Nombre y dosis son requeridos');
      return;
    }

    try {
      if (editingSupplementId) {
        await supplementsService.updateSupplement(editingSupplementId, {
          name: supplementName,
          dosage: supplementDosage,
          time_of_day: supplementTime || undefined,
          notes: supplementNotes || undefined,
        });
        showSuccess('¡Listo!', 'Suplemento actualizado');
      } else {
        await supplementsService.addSupplement(clientId, {
          name: supplementName,
          dosage: supplementDosage,
          time_of_day: supplementTime || undefined,
          notes: supplementNotes || undefined,
        });
        showSuccess('¡Listo!', 'Suplemento añadido');
      }
      
      resetSupplementForm();
      await loadSupplements();
      // No cerramos el modal para poder añadir más suplementos
    } catch (error) {
      showError('Error', 'No se pudo guardar el suplemento');
    }
  };

  const handleDeleteSupplement = (supplementId: number) => {
    showConfirm(
      'Eliminar Suplemento',
      '¿Estás seguro de que quieres eliminar este suplemento?',
      async () => {
        try {
          await supplementsService.deleteSupplement(supplementId);
          loadSupplements();
          showSuccess('¡Listo!', 'Suplemento eliminado');
        } catch (error) {
          showError('Error', 'No se pudo eliminar');
        }
      }
    );
  };

  const editSupplement = (supplement: Supplement) => {
    setEditingSupplementId(supplement.id);
    setSupplementName(supplement.name);
    setSupplementDosage(supplement.dosage);
    setSupplementTime(supplement.time_of_day || '');
    setSupplementNotes(supplement.notes || '');
    setShowSupplementsModal(true);
  };

  const resetSupplementForm = () => {
    setSupplementName('');
    setSupplementDosage('');
    setSupplementTime('');
    setSupplementNotes('');
    setEditingSupplementId(null);
  };

  const loadDiet = async () => {
    try {
      setLoading(true);

      if (!clientId || isNaN(clientId)) {
        showError('Error', 'ID de cliente inválido');
        setLoading(false);
        return;
      }

      const data = await dietService.getDiet(clientId);

      if (!data) {
        setDiet(null);
        return;
      }

      setDiet(data);

      if (data.meals) {
        const optionsMap: { [mealId: number]: MealOption[] } = {};
        const foodsMap: { [optionId: number]: OptionFood[] } = {};

        for (const meal of data.meals) {
          const options = await dietService.getMealOptions(meal.id);
          optionsMap[meal.id] = options;

          for (const option of options) {
            const foods = await dietService.getOptionFoods(option.id);
            foodsMap[option.id] = foods;
          }
        }

        setMealOptionsMap(optionsMap);
        setOptionFoodsMap(foodsMap);
      }
    } catch (error) {
      console.error('Error al cargar dieta:', error);
      showError('Error', 'No se pudo cargar la dieta');
    } finally {
      setLoading(false);
    }
  };

  const loadFoodLibrary = async () => {
    try {
      const foods = await dietService.getFoodLibrary();
      const uniqueFoods = foods.filter(
        (food: any, index: number, self: any[]) =>
          index === self.findIndex((f: any) => f.id === food.id)
      );
      setFoodLibrary(uniqueFoods);
    } catch (error) {
      console.error('Error al cargar alimentos:', error);
    }
  };

  const handleCreateDiet = async () => {
    try {
      const newDiet = await dietService.createDiet(clientId, {
        name: `Dieta de ${clientName}`,
      });
      setDiet({ ...newDiet, meals: [] });
    } catch (error) {
      console.error('Error al crear dieta:', error);
      showError('Error', 'No se pudo crear la dieta');
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    showConfirm(
      'Eliminar Comida',
      '¿Estás seguro de eliminar esta comida?',
      async () => {
        try {
          await dietService.deleteMeal(mealId);
          const updatedMeals = diet?.meals?.filter((m) => m.id !== mealId);
          if (diet) {
            setDiet({ ...diet, meals: updatedMeals });
          }
          const newOptionsMap = { ...mealOptionsMap };
          delete newOptionsMap[mealId];
          setMealOptionsMap(newOptionsMap);
          hideAlert();
        } catch (error) {
          console.error('Error al eliminar comida:', error);
          showError('Error', 'No se pudo eliminar la comida');
        }
      },
      hideAlert,
      'Eliminar',
      'Cancelar',
      true
    );
  };

  // === WIZARD FUNCTIONS ===
  const openWizard = () => {
    const mealNumber = (diet?.meals?.length || 0) + 1;
    setWizardEditingMealId(null); // Modo crear
    setWizardMealName(`Comida ${mealNumber}`);
    setWizardMealNotes('');
    // Crear una opción por defecto ya expandida
    const defaultOption = {
      id: Date.now(),
      name: 'Opción 1',
      foods: [],
    };
    setWizardOptions([defaultOption]);
    setWizardEditingOptionIndex(null); // Todas cerradas por defecto
    setWizardFoodSearch('');
    setWizardVisible(true);
  };

  // Abrir wizard para editar una comida existente
  const openWizardForEdit = (meal: DietMeal) => {
    setWizardEditingMealId(meal.id);
    setWizardMealName(meal.meal_name);
    setWizardMealNotes(meal.notes || '');
    
    // Cargar opciones existentes
    const existingOptions = mealOptionsMap[meal.id] || [];
    const wizardOpts = existingOptions.map(opt => {
      const foods = optionFoodsMap[opt.id] || [];
      return {
        id: opt.id,
        name: opt.name,
        foods: foods.map(f => ({
          foodId: f.food_id,
          foodName: f.food_name,
          quantity: String(Math.round(f.quantity)),
          unit: f.unit,
        })),
      };
    });
    
    if (wizardOpts.length === 0) {
      // Si no hay opciones, crear una por defecto
      wizardOpts.push({
        id: Date.now(),
        name: 'Opción 1',
        foods: [],
      });
    }
    
    setWizardOptions(wizardOpts);
    setWizardEditingOptionIndex(null); // Todas cerradas por defecto
    setWizardFoodSearch('');
    setWizardVisible(true);
  };

  const wizardAddOption = () => {
    setShowTemplateSelector(true);
  };

  const wizardAddNewOption = () => {
    const optionNumber = wizardOptions.length + 1;
    const newOption = {
      id: Date.now(),
      name: `Opción ${optionNumber}`,
      foods: [],
    };
    const newOptions = [...wizardOptions, newOption];
    setWizardOptions(newOptions);
    setWizardEditingOptionIndex(newOptions.length - 1);
    setShowTemplateSelector(false);
  };

  const wizardAddFromRecipe = async (recipe: SavedRecipe) => {
    try {
      const recipeFoods = await dietService.getRecipeFoods(recipe.id);
      const newOption = {
        id: Date.now(),
        name: recipe.name,
        foods: recipeFoods.map((f: any) => ({
          foodId: f.food_id,
          foodName: f.food_name,
          quantity: String(Math.round(f.quantity)),
          unit: f.unit,
        })),
      };
      const newOptions = [...wizardOptions, newOption];
      setWizardOptions(newOptions);
      setWizardEditingOptionIndex(newOptions.length - 1);
      setShowTemplateSelector(false);
    } catch (error) {
      console.error('Error al cargar receta:', error);
      showError('Error', 'No se pudo cargar la receta');
    }
  };

  const saveOptionAsRecipe = (optIndex: number) => {
    const option = wizardOptions[optIndex];
    if (option.foods.length === 0) {
      showError('Error', 'La opción debe tener al menos un alimento para guardarla');
      return;
    }
    setSaveRecipeOptionIndex(optIndex);
    setSaveRecipeName(option.name);
    setShowSaveRecipeModal(true);
  };

  const confirmSaveRecipe = async () => {
    if (saveRecipeOptionIndex === null || !saveRecipeName.trim()) return;
    
    const option = wizardOptions[saveRecipeOptionIndex];
    try {
      const foods = option.foods.map(f => ({
        food_id: f.foodId,
        quantity: parseFloat(f.quantity),
        unit: f.unit,
      }));
      
      await dietService.createRecipe({ name: saveRecipeName.trim(), foods });
      await loadSavedRecipes();
      setShowSaveRecipeModal(false);
      setSaveRecipeName('');
      setSaveRecipeOptionIndex(null);
      showSuccess('Éxito', 'Receta guardada correctamente');
    } catch (error) {
      console.error('Error al guardar receta:', error);
      showError('Error', 'No se pudo guardar la receta');
    }
  };

  // Añadir alimento con un solo tap (cantidad default 100g)
  const wizardQuickAddFood = (foodId: number) => {
    if (wizardEditingOptionIndex === null) return;
    
    const food = foodLibrary.find(f => f.id === foodId);
    if (!food) return;

    const updatedOptions = [...wizardOptions];
    updatedOptions[wizardEditingOptionIndex].foods.push({
      foodId: foodId,
      foodName: food.name,
      quantity: '100',
      unit: 'gramos',
    });
    setWizardOptions(updatedOptions);
    setWizardFoodSearch('');
  };

  // Actualizar cantidad de un alimento ya añadido
  const wizardUpdateFoodQuantity = (optionIndex: number, foodIndex: number, quantity: string) => {
    const updatedOptions = [...wizardOptions];
    updatedOptions[optionIndex].foods[foodIndex].quantity = quantity;
    setWizardOptions(updatedOptions);
  };

  // Cambiar unidad de un alimento
  const wizardToggleFoodUnit = (optionIndex: number, foodIndex: number) => {
    const updatedOptions = [...wizardOptions];
    const currentUnit = updatedOptions[optionIndex].foods[foodIndex].unit;
    updatedOptions[optionIndex].foods[foodIndex].unit = currentUnit === 'gramos' ? 'unidades' : 'gramos';
    setWizardOptions(updatedOptions);
  };

  const wizardRemoveFood = (optionIndex: number, foodIndex: number) => {
    const updatedOptions = [...wizardOptions];
    updatedOptions[optionIndex].foods.splice(foodIndex, 1);
    setWizardOptions(updatedOptions);
  };

  const wizardRemoveOption = (optionIndex: number) => {
    const updatedOptions = wizardOptions.filter((_, i) => i !== optionIndex);
    setWizardOptions(updatedOptions);
    if (wizardEditingOptionIndex === optionIndex) {
      setWizardEditingOptionIndex(null);
    } else if (wizardEditingOptionIndex !== null && wizardEditingOptionIndex > optionIndex) {
      setWizardEditingOptionIndex(wizardEditingOptionIndex - 1);
    }
  };

  const wizardSaveComplete = async () => {
    if (!diet) return;

    if (wizardOptions.length === 0) {
      showError('Error', 'Añade al menos una opción con alimentos');
      return;
    }

    const hasEmptyOption = wizardOptions.some(opt => opt.foods.length === 0);
    if (hasEmptyOption) {
      showError('Error', 'Todas las opciones deben tener al menos un alimento');
      return;
    }

    try {
      if (wizardEditingMealId) {
        // === MODO EDICIÓN ===
        // 1. Actualizar nombre de la comida (si el API lo soporta, sino solo localmente)
        const mealToUpdate = diet.meals?.find(m => m.id === wizardEditingMealId);
        if (mealToUpdate) {
          // Actualizar localmente
          const updatedMeals = diet.meals?.map(m => 
            m.id === wizardEditingMealId 
              ? { ...m, meal_name: wizardMealName.trim(), notes: wizardMealNotes }
              : m
          );
          setDiet({ ...diet, meals: updatedMeals });
        }

        // 2. Eliminar opciones antiguas y crear las nuevas
        const oldOptions = mealOptionsMap[wizardEditingMealId] || [];
        for (const oldOpt of oldOptions) {
          try {
            await dietService.deleteOption(oldOpt.id);
          } catch (e) {
            console.log('Error deleting option:', e);
          }
        }

        // 3. Crear nuevas opciones y alimentos
        const newOptionsMap: MealOption[] = [];
        const newFoodsMap: { [optionId: number]: OptionFood[] } = {};

        for (const opt of wizardOptions) {
          const newOption = await dietService.createOption(wizardEditingMealId, { name: opt.name });
          newOptionsMap.push(newOption);

          const optionFoodsList: OptionFood[] = [];
          for (const food of opt.foods) {
            const newFood = await dietService.addFood(newOption.id, {
              food_id: food.foodId,
              quantity: parseFloat(food.quantity),
              unit: food.unit as 'gramos' | 'unidades',
            });
            optionFoodsList.push(newFood);
          }
          newFoodsMap[newOption.id] = optionFoodsList;
        }

        // Limpiar foods de opciones antiguas del map
        const cleanedFoodsMap = { ...optionFoodsMap };
        for (const oldOpt of oldOptions) {
          delete cleanedFoodsMap[oldOpt.id];
        }

        setMealOptionsMap({ ...mealOptionsMap, [wizardEditingMealId]: newOptionsMap });
        setOptionFoodsMap({ ...cleanedFoodsMap, ...newFoodsMap });

        setWizardVisible(false);
        showSuccess('Éxito', 'Comida actualizada correctamente');
      } else {
        // === MODO CREAR ===
        const newMeal = await dietService.createMeal(diet.id, {
          meal_name: wizardMealName.trim() || `Comida ${(diet.meals?.length || 0) + 1}`,
          notes: wizardMealNotes,
        });

        const updatedMeals = [...(diet.meals || []), newMeal];
        setDiet({ ...diet, meals: updatedMeals });

        const newOptionsMap: MealOption[] = [];
        const newFoodsMap: { [optionId: number]: OptionFood[] } = {};

        for (const opt of wizardOptions) {
          const newOption = await dietService.createOption(newMeal.id, { name: opt.name });
          newOptionsMap.push(newOption);

          const optionFoodsList: OptionFood[] = [];
          for (const food of opt.foods) {
            const newFood = await dietService.addFood(newOption.id, {
              food_id: food.foodId,
              quantity: parseFloat(food.quantity),
              unit: food.unit as 'gramos' | 'unidades',
            });
            optionFoodsList.push(newFood);
          }
          newFoodsMap[newOption.id] = optionFoodsList;
        }

        setMealOptionsMap({ ...mealOptionsMap, [newMeal.id]: newOptionsMap });
        setOptionFoodsMap({ ...optionFoodsMap, ...newFoodsMap });

        setWizardVisible(false);
        showSuccess('Éxito', 'Comida creada correctamente');
      }
    } catch (error) {
      console.error('Error al guardar comida:', error);
      showError('Error', 'No se pudo guardar la comida');
    }
  };

  const filteredFoods = wizardFoodSearch.trim()
    ? foodLibrary.filter(f => 
        f.name.toLowerCase().includes(wizardFoodSearch.toLowerCase()) ||
        f.category.toLowerCase().includes(wizardFoodSearch.toLowerCase())
      )
    : foodLibrary;

  const handleCreateCustomFood = async () => {
    if (!customFoodName.trim()) {
      showError('Error', 'El nombre del alimento es requerido');
      return;
    }

    try {
      const userId = 1; // TODO: Obtener del contexto de autenticación
      const newFood = await dietService.createCustomFood({
        name: customFoodName.trim(),
        category: customFoodCategory.trim() || 'Otro',
        created_by_user_id: userId,
        calories_per_100g: parseFloat(customFoodCalories) || 0,
        protein_per_100g: parseFloat(customFoodProtein) || 0,
        carbs_per_100g: parseFloat(customFoodCarbs) || 0,
        fat_per_100g: parseFloat(customFoodFat) || 0,
      });

      // Añadir a la biblioteca local
      setFoodLibrary([...foodLibrary, newFood]);
      
      // Limpiar y cerrar modal
      setCustomFoodName('');
      setCustomFoodCategory('');
      setCustomFoodCalories('');
      setCustomFoodProtein('');
      setCustomFoodCarbs('');
      setCustomFoodFat('');
      setShowCustomFoodModal(false);
      
      showSuccess('Éxito', 'Alimento personalizado creado');
    } catch (error) {
      console.error('Error creating custom food:', error);
      showError('Error', 'No se pudo crear el alimento');
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando dieta..." />;
  }

  const foodsByCategory = foodLibrary.reduce((acc, food) => {
    if (!acc[food.category]) {
      acc[food.category] = [];
    }
    acc[food.category].push(food);
    return acc;
  }, {} as { [category: string]: FoodItem[] });

  const scrollBottomPadding = supplementsButtonHeight > 0 ? supplementsButtonHeight + 48 : 160;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dieta de {clientName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {!diet ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color={palette.primary} />
            <Text style={styles.emptyText}>Este cliente no tiene dieta</Text>
            <Text style={styles.emptySubtext}>Crea una dieta personalizada para comenzar</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateDiet}>
              <Ionicons name="add-circle-outline" size={24} color={palette.text} />
              <Text style={styles.createButtonText}>Crear Dieta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={openWizard}
            >
              <Ionicons name="add-circle-outline" size={20} color={palette.primary} />
              <Text style={styles.addMealButtonText}>Nueva Comida</Text>
            </TouchableOpacity>

            {diet.meals && diet.meals.length > 0 ? (
              diet.meals.map((meal) => {
                const options = mealOptionsMap[meal.id] || [];
                return (
                  <TouchableOpacity 
                    key={meal.id} 
                    style={styles.mealCard}
                    onPress={() => openWizardForEdit(meal)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mealHeader}>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.meal_name}</Text>
                        {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
                      </View>
                      <View style={styles.mealActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteMeal(meal.id);
                          }}
                          style={styles.iconButton}
                        >
                          <Ionicons name="trash-outline" size={20} color={palette.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {options.length > 0 ? (
                      <View style={styles.optionsContainer}>
                        {options.map((option) => {
                          const foods = optionFoodsMap[option.id] || [];
                          return (
                            <View
                              key={option.id}
                              style={styles.optionCard}
                            >
                              <Text style={styles.optionName}>{option.name}</Text>
                              {foods.length > 0 ? (
                                <View style={styles.foodsList}>
                                  {foods.map((food) => (
                                    <Text key={food.id} style={styles.foodText}>
                                      • {food.food_name}: {Math.round(food.quantity)} {food.unit}
                                    </Text>
                                  ))}
                                </View>
                              ) : (
                                <Text style={styles.noFoodsText}>Sin alimentos</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.noOptionsText}>Sin opciones creadas</Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyMealsContainer}>
                <Text style={styles.emptyMealsText}>
                  No hay comidas creadas. Añade la primera comida.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal: WIZARD - Crear Comida Completa */}
      <Modal visible={wizardVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.wizardModal}>
            {/* Header del Wizard */}
            <View style={styles.wizardHeader}>
              <View style={styles.wizardHeaderLeft}>
                <View style={styles.wizardIconContainer}>
                  <Ionicons name="restaurant" size={24} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.wizardTitleInput}
                    value={wizardMealName}
                    onChangeText={setWizardMealName}
                    placeholder="Nombre de la comida"
                    placeholderTextColor={palette.mutedAlt}
                  />
                  <Text style={styles.wizardSubtitle}>
                    {wizardOptions.length === 0 
                      ? 'Añade opciones y alimentos' 
                      : `${wizardOptions.length} opción${wizardOptions.length > 1 ? 'es' : ''} creada${wizardOptions.length > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.wizardCloseButton}
                onPress={() => setWizardVisible(false)}
              >
                <Ionicons name="close" size={22} color={palette.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.wizardContent}
              contentContainerStyle={styles.wizardContentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {/* Lista de opciones - La primera ya viene creada */}
              {wizardOptions.map((option, optIndex) => (
                <View 
                  key={option.id} 
                  style={[
                    styles.wizardOptionCard,
                    wizardEditingOptionIndex === optIndex && styles.wizardOptionCardActive
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.wizardOptionHeader}
                    onPress={() => setWizardEditingOptionIndex(
                      wizardEditingOptionIndex === optIndex ? null : optIndex
                    )}
                  >
                    <View style={styles.wizardOptionHeaderLeft}>
                      <View style={styles.wizardOptionNumber}>
                        <Text style={styles.wizardOptionNumberText}>{optIndex + 1}</Text>
                      </View>
                      <TextInput
                        style={styles.wizardOptionNameInput}
                        value={option.name}
                        onChangeText={(text) => {
                          const updated = [...wizardOptions];
                          updated[optIndex].name = text;
                          setWizardOptions(updated);
                        }}
                        placeholder="Nombre opción"
                        placeholderTextColor={palette.mutedAlt}
                      />
                    </View>
                    <View style={styles.wizardOptionActions}>
                      <Text style={styles.wizardOptionFoodCount}>
                        ({option.foods.length})
                      </Text>
                      <Ionicons 
                        name={wizardEditingOptionIndex === optIndex ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={palette.muted}
                      />
                      {option.foods.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => saveOptionAsRecipe(optIndex)}
                          style={styles.wizardSaveTemplateBtn}
                        >
                          <Ionicons name="bookmark-outline" size={18} color={palette.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => wizardRemoveOption(optIndex)}>
                        <Ionicons name="trash-outline" size={18} color={palette.danger} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Expandido: Añadir alimentos */}
                  {wizardEditingOptionIndex === optIndex && (
                    <View style={styles.wizardOptionExpanded}>
                      {/* Lista de alimentos añadidos - Editable inline */}
                      {option.foods.length > 0 && (
                        <View style={styles.wizardFoodsList}>
                          {option.foods.map((food, foodIndex) => (
                            <View key={foodIndex} style={styles.wizardFoodItemEditable}>
                              <Text style={styles.wizardFoodItemName}>{food.foodName}</Text>
                              <View style={styles.wizardFoodItemControls}>
                                <TextInput
                                  style={styles.wizardFoodItemQuantity}
                                  value={food.quantity}
                                  onChangeText={(val) => wizardUpdateFoodQuantity(optIndex, foodIndex, val)}
                                  keyboardType="numeric"
                                />
                                <TouchableOpacity 
                                  style={styles.wizardFoodItemUnit}
                                  onPress={() => wizardToggleFoodUnit(optIndex, foodIndex)}
                                >
                                  <Text style={styles.wizardFoodItemUnitText}>
                                    {food.unit === 'gramos' ? 'g' : 'uds'}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => wizardRemoveFood(optIndex, foodIndex)}>
                                  <Ionicons name="close-circle" size={20} color={palette.danger} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Buscador de alimentos */}
                      <View style={styles.wizardFoodSearch}>
                        <Ionicons name="search" size={18} color={palette.muted} />
                        <TextInput
                          style={styles.wizardFoodSearchInput}
                          placeholder="Buscar y tocar para añadir..."
                          placeholderTextColor={palette.mutedAlt}
                          value={wizardFoodSearch}
                          onChangeText={setWizardFoodSearch}
                        />
                      </View>

                      {/* Lista de alimentos - Un tap añade directamente */}
                      <ScrollView
                        style={styles.wizardFoodLibrary}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {filteredFoods.slice(0, 20).map((food) => (
                          <TouchableOpacity
                            key={food.id}
                            style={styles.wizardFoodLibraryItem}
                            onPress={() => wizardQuickAddFood(food.id)}
                          >
                            <View style={styles.wizardFoodLibraryInfo}>
                              <Text style={styles.wizardFoodLibraryName}>{food.name}</Text>
                              <Text style={styles.wizardFoodLibraryCategory}>{food.category}</Text>
                            </View>
                            <Ionicons name="add-circle" size={24} color={palette.primary} />
                          </TouchableOpacity>
                        ))}
                        
                        {/* Botón para crear alimento custom */}
                        <TouchableOpacity
                          style={styles.customFoodButton}
                          onPress={() => setShowCustomFoodModal(true)}
                        >
                          <Ionicons name="add-circle-outline" size={20} color={palette.primary} />
                          <Text style={styles.customFoodButtonText}>Crear Alimento Personalizado</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
              ))}

              {/* Botón añadir más opciones */}
              <TouchableOpacity style={styles.wizardAddMoreBtn} onPress={wizardAddOption}>
                <Ionicons name="add-circle-outline" size={20} color={palette.primary} />
                <Text style={styles.wizardAddMoreBtnText}>Añadir otra opción</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer con botón guardar */}
            <View style={styles.wizardFooter}>
              <TouchableOpacity
                style={styles.wizardCancelBtn}
                onPress={() => setWizardVisible(false)}
              >
                <Text style={styles.wizardCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.wizardSaveBtn,
                  (wizardOptions.length === 0 || wizardOptions.every(o => o.foods.length === 0)) && styles.wizardSaveBtnDisabled
                ]}
                onPress={wizardSaveComplete}
                disabled={wizardOptions.length === 0 || wizardOptions.every(o => o.foods.length === 0)}
              >
                <Ionicons name="checkmark" size={20} color={palette.text} />
                <Text style={styles.wizardSaveBtnText}>
                  {wizardEditingMealId ? 'Guardar Cambios' : 'Crear Comida'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Selector de plantillas */}
      <Modal visible={showTemplateSelector} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.templateSelectorModal}>
            <View style={styles.templateSelectorHeader}>
              <Text style={styles.templateSelectorTitle}>Añadir Opción</Text>
              <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
                <Ionicons name="close" size={24} color={palette.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.templateNewOption}
              onPress={wizardAddNewOption}
            >
              <View style={styles.templateNewOptionIcon}>
                <Ionicons name="add" size={24} color={palette.primary} />
              </View>
              <View style={styles.templateNewOptionText}>
                <Text style={styles.templateNewOptionTitle}>Nueva opción vacía</Text>
                <Text style={styles.templateNewOptionSubtitle}>Crear desde cero</Text>
              </View>
            </TouchableOpacity>

            {savedRecipes.length > 0 && (
              <>
                <Text style={styles.templateSectionLabel}>Recetas guardadas</Text>
                <ScrollView style={styles.templateList}>
                  {savedRecipes.map((recipe) => {
                    const foods = recipeFoodsMap[recipe.id] || [];
                    return (
                      <TouchableOpacity 
                        key={recipe.id}
                        style={styles.templateItem}
                        onPress={() => wizardAddFromRecipe(recipe)}
                      >
                        <View style={styles.templateItemContent}>
                          <View style={styles.templateItemHeader}>
                            <View style={styles.templateItemIcon}>
                              <Ionicons name="bookmark" size={20} color={palette.primary} />
                            </View>
                            <Text style={styles.templateItemName}>{recipe.name}</Text>
                            <TouchableOpacity 
                              onPress={(e) => {
                                e.stopPropagation();
                                showConfirm(
                                  'Eliminar receta',
                                  `¿Eliminar "${recipe.name}"?`,
                                  async () => {
                                    await dietService.deleteRecipe(recipe.id);
                                    loadSavedRecipes();
                                    hideAlert();
                                  },
                                  hideAlert,
                                  'Eliminar',
                                  'Cancelar',
                                  true
                                );
                              }}
                              style={styles.templateItemDelete}
                            >
                              <Ionicons name="trash-outline" size={18} color={palette.danger} />
                            </TouchableOpacity>
                          </View>
                          {foods.length > 0 && (
                            <View style={styles.templateItemFoods}>
                              <Text style={styles.templateItemFoodsText} numberOfLines={2}>
                                {foods.map(f => `${f.food_name} (${Math.round(f.quantity)}${f.unit === 'gramos' ? 'g' : 'u'})`).join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Guardar receta */}
      <Modal visible={showSaveRecipeModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.saveRecipeModal}>
            <Text style={styles.saveRecipeTitle}>Guardar como receta</Text>
            <Text style={styles.saveRecipeSubtitle}>Introduce un nombre para la receta:</Text>
            <TextInput
              style={styles.saveRecipeInput}
              value={saveRecipeName}
              onChangeText={setSaveRecipeName}
              placeholder="Nombre de la receta"
              placeholderTextColor={palette.mutedAlt}
              autoFocus
            />
            <View style={styles.saveRecipeButtons}>
              <TouchableOpacity 
                style={styles.saveRecipeCancelBtn}
                onPress={() => {
                  setShowSaveRecipeModal(false);
                  setSaveRecipeName('');
                  setSaveRecipeOptionIndex(null);
                }}
              >
                <Text style={styles.saveRecipeCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveRecipeConfirmBtn, !saveRecipeName.trim() && styles.saveRecipeConfirmBtnDisabled]}
                onPress={confirmSaveRecipe}
                disabled={!saveRecipeName.trim()}
              >
                <Text style={styles.saveRecipeConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Suplementación */}
      <Modal
        visible={showSupplementsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSupplementsModal(false);
          resetSupplementForm();
        }}
      >
        <View style={styles.supplementModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.supplementModalContent}>
              <View style={styles.supplementModalHeader}>
                <Text style={styles.supplementModalTitle}>
                  {editingSupplementId ? 'Editar Suplemento' : 'Añadir Suplemento'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowSupplementsModal(false);
                  resetSupplementForm();
                }}>
                  <Ionicons name="close" size={28} color={palette.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.supplementModalScroll}
                contentContainerStyle={styles.supplementModalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.supplementLabel}>Nombre *</Text>
                <TextInput
                  style={styles.supplementInput}
                  placeholder="Ej: Proteína Whey"
                  placeholderTextColor={palette.muted}
                  value={supplementName}
                  onChangeText={setSupplementName}
                />

                <Text style={styles.supplementLabel}>Dosis *</Text>
                <TextInput
                  style={styles.supplementInput}
                  placeholder="Ej: 30g / 2 cápsulas"
                  placeholderTextColor={palette.muted}
                  value={supplementDosage}
                  onChangeText={setSupplementDosage}
                />

                <Text style={styles.supplementLabel}>Momento del día</Text>
                <TextInput
                  style={styles.supplementInput}
                  placeholder="Ej: Desayuno, Post-entreno, Antes de dormir"
                  placeholderTextColor={palette.muted}
                  value={supplementTime}
                  onChangeText={setSupplementTime}
                />

                <Text style={styles.supplementLabel}>Notas</Text>
                <TextInput
                  style={[styles.supplementInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Instrucciones adicionales..."
                  placeholderTextColor={palette.muted}
                  value={supplementNotes}
                  onChangeText={setSupplementNotes}
                  multiline
                />

                <TouchableOpacity 
                  style={styles.supplementSaveBtn}
                  onPress={handleAddSupplement}
                >
                  <Text style={styles.supplementSaveBtnText}>
                    {editingSupplementId ? 'Actualizar' : 'Añadir Suplemento'}
                  </Text>
                </TouchableOpacity>

                {/* Lista de suplementos actuales */}
                {supplements.length > 0 && (
                  <View style={styles.supplementsList}>
                    <Text style={styles.supplementsListTitle}>Suplementos actuales</Text>
                    {supplements.map((supp) => (
                      <View key={supp.id} style={styles.supplementListItem}>
                        <View style={styles.supplementListInfo}>
                          <Text style={styles.supplementListName}>{supp.name}</Text>
                          <Text style={styles.supplementListDosage}>{supp.dosage}</Text>
                          {supp.time_of_day && (
                            <Text style={styles.supplementListTime}>{supp.time_of_day}</Text>
                          )}
                        </View>
                        <View style={styles.supplementListActions}>
                          <TouchableOpacity onPress={() => editSupplement(supp)} style={styles.supplementListBtn}>
                            <Ionicons name="pencil" size={18} color={palette.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteSupplement(supp.id)} style={styles.supplementListBtn}>
                            <Ionicons name="trash" size={18} color={palette.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Botón de suplementación */}
      <TouchableOpacity 
        style={styles.supplementsButton}
        onLayout={(e) => {
          const height = e.nativeEvent.layout.height;
          setSupplementsButtonHeight((prev) => (prev === height ? prev : height));
        }}
        onPress={() => setShowSupplementsModal(true)}
      >
        <View style={styles.supplementsButtonContent}>
          <View style={styles.supplementsButtonTextContainer}>
            <Text style={styles.supplementsButtonTitle}>Suplementación</Text>
            <Text style={styles.supplementsButtonSubtitle}>
              {supplements.length === 0 
                ? 'Añadir suplementos' 
                : `${supplements.length} suplemento${supplements.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.muted} />
        </View>
      </TouchableOpacity>

      {/* Modal: Crear Alimento Custom */}
      <Modal visible={showCustomFoodModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.customFoodModalContainer}
          >
            <View style={styles.customFoodModal}>
              <View style={styles.customFoodModalHeader}>
                <Text style={styles.customFoodModalTitle}>Crear Alimento Personalizado</Text>
                <TouchableOpacity onPress={() => setShowCustomFoodModal(false)}>
                  <Ionicons name="close" size={28} color={palette.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.customFoodModalScroll}
                contentContainerStyle={styles.customFoodModalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text style={styles.customFoodLabel}>Nombre del alimento *</Text>
                <TextInput
                  style={styles.customFoodInput}
                  placeholder="Ej: Pollo al curry casero"
                  placeholderTextColor={palette.muted}
                  value={customFoodName}
                  onChangeText={setCustomFoodName}
                />

                <Text style={styles.customFoodLabel}>Categoría</Text>
                <TextInput
                  style={styles.customFoodInput}
                  placeholder="Ej: Carnes, Lácteos, Otro"
                  placeholderTextColor={palette.muted}
                  value={customFoodCategory}
                  onChangeText={setCustomFoodCategory}
                />

                <Text style={styles.customFoodSectionTitle}>Valores nutricionales (por 100g)</Text>
                <Text style={styles.customFoodSectionSubtitle}>Opcional - Puedes dejarlo en blanco</Text>

                <View style={styles.customFoodRow}>
                  <View style={styles.customFoodRowItem}>
                    <Text style={styles.customFoodLabel}>Calorías</Text>
                    <TextInput
                      style={styles.customFoodInput}
                      placeholder="0"
                      placeholderTextColor={palette.muted}
                      keyboardType="numeric"
                      value={customFoodCalories}
                      onChangeText={setCustomFoodCalories}
                    />
                  </View>
                  <View style={styles.customFoodRowItem}>
                    <Text style={styles.customFoodLabel}>Proteínas (g)</Text>
                    <TextInput
                      style={styles.customFoodInput}
                      placeholder="0"
                      placeholderTextColor={palette.muted}
                      keyboardType="numeric"
                      value={customFoodProtein}
                      onChangeText={setCustomFoodProtein}
                    />
                  </View>
                </View>

                <View style={styles.customFoodRow}>
                  <View style={styles.customFoodRowItem}>
                    <Text style={styles.customFoodLabel}>Carbohidratos (g)</Text>
                    <TextInput
                      style={styles.customFoodInput}
                      placeholder="0"
                      placeholderTextColor={palette.muted}
                      keyboardType="numeric"
                      value={customFoodCarbs}
                      onChangeText={setCustomFoodCarbs}
                    />
                  </View>
                  <View style={styles.customFoodRowItem}>
                    <Text style={styles.customFoodLabel}>Grasas (g)</Text>
                    <TextInput
                      style={styles.customFoodInput}
                      placeholder="0"
                      placeholderTextColor={palette.muted}
                      keyboardType="numeric"
                      value={customFoodFat}
                      onChangeText={setCustomFoodFat}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.customFoodModalFooter}>
                <TouchableOpacity
                  style={styles.customFoodCancelBtn}
                  onPress={() => {
                    setShowCustomFoodModal(false);
                    setCustomFoodName('');
                    setCustomFoodCategory('');
                    setCustomFoodCalories('');
                    setCustomFoodProtein('');
                    setCustomFoodCarbs('');
                    setCustomFoodFat('');
                  }}
                >
                  <Text style={styles.customFoodCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.customFoodSaveBtn,
                    !customFoodName.trim() && styles.customFoodSaveBtnDisabled,
                  ]}
                  onPress={handleCreateCustomFood}
                  disabled={!customFoodName.trim()}
                >
                  <Ionicons name="checkmark" size={20} color={palette.text} />
                  <Text style={styles.customFoodSaveText}>Crear Alimento</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: palette.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    color: palette.text,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    width: '80%',
  },
  createButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  addMealButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMealsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMealsText: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  mealNotes: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 4,
  },
  mealActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: 4,
  },
  optionsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  optionCard: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  foodsList: {
    gap: 2,
  },
  foodText: {
    fontSize: 12,
    color: palette.muted,
  },
  noFoodsText: {
    fontSize: 12,
    color: palette.muted,
    fontStyle: 'italic',
  },
  noOptionsText: {
    fontSize: 13,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: palette.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  addOptionButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  optionsScrollView: {
    maxHeight: 300,
  },
  optionItem: {
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  optionItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
  },
  optionItemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  foodsPreview: {
    gap: 2,
  },
  foodPreviewText: {
    fontSize: 12,
    color: palette.muted,
  },
  noFoodsPreviewText: {
    fontSize: 12,
    color: palette.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  loadRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryMuted,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  loadRecipeButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveRecipeButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.primaryMuted,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  saveRecipeButtonSmallText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  addFoodButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  foodsScrollView: {
    maxHeight: 250,
  },
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
  },
  foodItemDetails: {
    fontSize: 12,
    color: palette.primary,
  },
  foodItemNotes: {
    fontSize: 11,
    color: palette.muted,
    marginTop: 2,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.primaryMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  createCustomButtonText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  selectFoodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  foodLibraryScroll: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  foodLibraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.inputBg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  foodLibraryItemSelected: {
    borderColor: palette.primary,
  },
  foodLibraryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  foodLibraryItemText: {
    fontSize: 14,
    color: palette.text,
  },
  foodLibraryItemTextSelected: {
    fontWeight: '600',
  },
  customBadge: {
    backgroundColor: palette.primaryMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  customBadgeText: {
    fontSize: 10,
    color: palette.primary,
    fontWeight: '600',
  },
  foodDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quantityInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  unitButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  unitButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  unitButtonText: {
    fontSize: 12,
    color: palette.muted,
  },
  unitButtonTextActive: {
    color: palette.text,
    fontWeight: '600',
  },
  customCategoryNote: {
    fontSize: 12,
    color: palette.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  manageRecipesButton: {
    padding: spacing.xs,
  },
  recipesList: {
    maxHeight: 300,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  recipeCardSelected: {
    borderColor: palette.primary,
  },
  recipeImage: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
  },
  recipeDescription: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  recipeManageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  recipeImageSmall: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  deleteRecipeButton: {
    padding: spacing.xs,
  },
  
  wizardModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    width: '100%',
    height: '90%',
    borderWidth: 1,
    borderColor: palette.border,
    display: 'flex',
    flexDirection: 'column',
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  wizardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wizardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  wizardTitleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    padding: 0,
    margin: 0,
  },
  wizardSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  wizardCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  wizardContent: {
    flex: 1,
  },
  wizardContentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  wizardSection: {
    marginBottom: spacing.lg,
  },
  wizardSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  wizardInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardOptionCreate: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wizardOptionInput: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardAddOptionBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardOptionCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  wizardOptionCardActive: {
    borderColor: palette.primary,
  },
  wizardOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    position: 'relative',
  },
  wizardOptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wizardOptionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.primary,
  },
  wizardOptionNumberText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  wizardOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  wizardOptionNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
    padding: 0,
    marginRight: spacing.sm,
  },
  wizardOptionFoodCount: {
    fontSize: 12,
    color: palette.muted,
    marginRight: 8,
  },
  wizardAddMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  wizardAddMoreBtnText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  wizardOptionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    right: 12,
  },
  wizardOptionExpanded: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  wizardFoodsList: {
    marginBottom: spacing.sm,
  },
  wizardFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  wizardFoodItemText: {
    color: palette.text,
    fontSize: 13,
  },
  wizardFoodItemEditable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardFoodItemName: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
  },
  wizardFoodItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  wizardFoodItemQuantity: {
    backgroundColor: palette.inputBg,
    color: palette.text,
    fontSize: 14,
    width: 65,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardFoodItemUnit: {
    backgroundColor: palette.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  wizardFoodItemUnitText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  wizardFoodSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardFoodSearchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
    marginLeft: spacing.xs,
  },
  wizardFoodLibrary: {
    maxHeight: 220,
    marginBottom: spacing.sm,
  },
  wizardFoodLibraryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardFoodLibraryInfo: {
    flex: 1,
  },
  wizardFoodLibraryName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '500',
  },
  wizardFoodLibraryCategory: {
    color: palette.muted,
    fontSize: 11,
  },
  wizardFoodQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wizardQuantityInput: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: palette.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.border,
    textAlign: 'center',
  },
  wizardUnitSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  wizardUnitBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardUnitBtnActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  wizardUnitBtnText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  wizardUnitBtnTextActive: {
    color: palette.text,
  },
  wizardAddFoodBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  wizardEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginTop: spacing.md,
  },
  wizardEmptySubtext: {
    fontSize: 13,
    color: palette.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  wizardFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  wizardCancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardCancelBtnText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  wizardSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  wizardSaveBtnDisabled: {
    opacity: 0.4,
  },
  wizardSaveBtnText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  wizardSaveTemplateBtn: {
    padding: 2,
  },
  // Template selector modal styles
  templateSelectorModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    width: '90%',
    maxHeight: '60%',
    padding: spacing.lg,
  },
  templateSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  templateSelectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  templateNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  templateNewOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  templateNewOptionText: {
    flex: 1,
  },
  templateNewOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  templateNewOptionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  templateSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  templateList: {
    maxHeight: 300,
  },
  templateItem: {
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  templateItemContent: {
    flex: 1,
  },
  templateItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  templateItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  templateItemDelete: {
    padding: spacing.xs,
  },
  templateItemFoods: {
    marginTop: spacing.xs,
    marginLeft: 52,
  },
  templateItemFoodsText: {
    fontSize: 12,
    color: palette.muted,
    lineHeight: 16,
  },
  // Modal guardar receta
  saveRecipeModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    width: '85%',
    padding: spacing.lg,
  },
  saveRecipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  saveRecipeSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: spacing.md,
  },
  saveRecipeInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    fontSize: 16,
    color: palette.text,
    marginBottom: spacing.lg,
  },
  saveRecipeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveRecipeCancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  saveRecipeCancelText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  saveRecipeConfirmBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  saveRecipeConfirmBtnDisabled: {
    opacity: 0.4,
  },
  saveRecipeConfirmText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  // Estilos de Suplementación
  supplementsButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  supplementsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  supplementsButtonIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  supplementsButtonTextContainer: {
    flex: 1,
  },
  supplementsButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  supplementsButtonSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  supplementModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  supplementModalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    height: '90%',
  },
  supplementModalScroll: {
    flex: 1,
    minHeight: 0,
  },
  supplementModalScrollContent: {
    paddingBottom: spacing.xl,
  },
  supplementModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  supplementModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  supplementLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  supplementInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    fontSize: 15,
    color: palette.text,
  },
  supplementSaveBtn: {
    backgroundColor: '#9C27B0',
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  supplementSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  supplementsList: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.lg,
  },
  supplementsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  supplementListItem: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  supplementListInfo: {
    flex: 1,
  },
  supplementListName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  supplementListDosage: {
    fontSize: 13,
    color: palette.primary,
    marginTop: 2,
  },
  supplementListTime: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  supplementListActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  supplementListBtn: {
    padding: spacing.xs,
  },
  // Estilos para alimento custom
  customFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: palette.primary,
    borderStyle: 'dashed',
    gap: spacing.xs,
  },
  customFoodButtonText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  customFoodModalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  customFoodModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    margin: spacing.lg,
    flex: 1,
    maxHeight: '85%',
  },
  customFoodModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  customFoodModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.text,
  },
  customFoodModalScroll: {
    flex: 1,
    padding: spacing.lg,
  },
  customFoodModalScrollContent: {
    paddingBottom: spacing.xl,
  },
  customFoodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  customFoodInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  customFoodSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  customFoodSectionSubtitle: {
    fontSize: 12,
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  customFoodRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  customFoodRowItem: {
    flex: 1,
  },
  customFoodModalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.md,
  },
  customFoodCancelBtn: {
    flex: 1,
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  customFoodCancelText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  customFoodSaveBtn: {
    flex: 1,
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  customFoodSaveBtnDisabled: {
    opacity: 0.5,
  },
  customFoodSaveText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
