import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dietService } from '../services/api';
import { Diet, MealOption, OptionFood } from '../types';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../components/LoadingScreen';
import AppHeader from '../components/AppHeader';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

interface Props {
  clientId: number;
  navigation?: any;
}

export default function ClientDietScreen({ clientId, navigation }: Props) {
  const [diet, setDiet] = useState<Diet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [options, setOptions] = useState<MealOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MealOption | null>(null);
  const [foods, setFoods] = useState<OptionFood[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { alertState, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadDiet();
  }, []);

  useEffect(() => {
    if (diet?.meals && diet.meals.length > 0) {
      loadMealOptions(diet.meals[currentMealIndex].id);
    }
  }, [currentMealIndex, diet]);

  const loadDiet = async () => {
    try {
      setLoading(true);
      const data = await dietService.getDiet(clientId);
      setDiet(data);
    } catch (error) {
      console.error('Error al cargar dieta:', error);
      showError('Error', 'No se pudo cargar la dieta');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMealOptions = async (mealId: number) => {
    try {
      setLoadingOptions(true);
      const data = await dietService.getMealOptions(mealId);
      setOptions(data);
      
      if (data.length > 0) {
        setSelectedOption(data[0]);
        const foodsData = await dietService.getOptionFoods(data[0].id);
        setFoods(foodsData);
      } else {
        setSelectedOption(null);
        setFoods([]);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSelectOption = async (option: MealOption) => {
    setSelectedOption(option);
    try {
      const foodsData = await dietService.getOptionFoods(option.id);
      setFoods(foodsData);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDiet();
  };

  const goToPreviousMeal = () => {
    if (currentMealIndex > 0) {
      setCurrentMealIndex(currentMealIndex - 1);
    }
  };

  const goToNextMeal = () => {
    if (diet?.meals && currentMealIndex < diet.meals.length - 1) {
      setCurrentMealIndex(currentMealIndex + 1);
    }
  };

  const formatFoodText = (food: OptionFood) => {
    const quantity = Math.round(food.quantity);
    return `${quantity} ${food.unit} de ${food.food_name}`;
  };

  const calculateTotalCalories = () => {
    return foods.reduce((total, food) => {
      if (food.calories_per_100g) {
        const caloriesForQuantity = (food.quantity / 100) * food.calories_per_100g;
        return total + caloriesForQuantity;
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <LoadingScreen message="Cargando tu dieta..." />;
  }

  const currentMeal = diet?.meals?.[currentMealIndex];

  return (
    <View style={styles.container}>
      <AppHeader title="Mi Dieta" />

      {diet?.meals && diet.meals.length > 0 ? (
        <>
          {/* Panel horizontal de comidas */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mealsScrollContainer}
            style={styles.mealsScroll}
          >
            {diet.meals.map((meal, index) => {
              const isActive = index === currentMealIndex;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentMealIndex(index)}
                  activeOpacity={0.7}
                  style={isActive ? styles.mealButtonActive : styles.mealButtonInactive}
                >
                  <Text style={isActive ? styles.mealButtonTextActive : styles.mealButtonText}>
                    Comida {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={palette.primary}
              />
            }
          >
            {loadingOptions ? (
              <View style={styles.loadingOptionsContainer}>
                <Text style={styles.loadingOptionsText}>Cargando opciones...</Text>
              </View>
            ) : options.length > 0 ? (
              <>
                {/* Selector de opciones */}
                <View style={styles.optionsRow}>
                  {options.map((option, index) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionChip,
                        selectedOption?.id === option.id && styles.optionChipSelected,
                      ]}
                      onPress={() => handleSelectOption(option)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selectedOption?.id === option.id && styles.optionChipTextSelected,
                        ]}
                      >
                        Opción {index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Detalle de la opción seleccionada */}
                {selectedOption && (
                  <View style={styles.detailsContainer}>
                    {selectedOption.image_url ? (
                      <Image
                        source={{ uri: selectedOption.image_url }}
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="restaurant-outline" size={40} color={palette.muted} />
                      </View>
                    )}

                    <Text style={styles.foodTitle}>{selectedOption.name}</Text>

                    <View style={styles.ingredientsList}>
                      {foods.map((food) => (
                        <View key={food.id} style={styles.ingredientRow}>
                          <View style={styles.ingredientDot} />
                          <Text style={styles.ingredientText}>{formatFoodText(food)}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.caloriesContainer}>
                      <Text style={styles.caloriesLabel}>Total kcal</Text>
                      <Text style={styles.caloriesValue}>{Math.round(calculateTotalCalories())}</Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noOptionsContainer}>
                <Ionicons name="restaurant-outline" size={48} color={palette.muted} />
                <Text style={styles.noOptionsText}>Sin opciones disponibles</Text>
                <Text style={styles.noOptionsSubtext}>Esta comida aún no tiene opciones asignadas</Text>
              </View>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color={palette.muted} />
          <Text style={styles.emptyText}>Sin dieta asignada</Text>
          <Text style={styles.emptySubtext}>Tu entrenador te asignará un plan pronto</Text>
        </View>
      )}

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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  title: {
    ...typography.title,
    color: palette.text,
  },
  subtitle: {
    fontSize: 14,
    color: palette.textWarm,
    marginTop: 4,
    opacity: 0.7,
  },
  mealsScroll: {
    flexGrow: 0,
  },
  mealsScrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  mealButtonActive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: palette.primary,
  },
  mealButtonInactive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  mealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  mealButtonTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingOptionsContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingOptionsText: {
    color: palette.muted,
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  optionChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  optionChipSelected: {
    borderBottomColor: palette.primary,
  },
  optionChipText: {
    fontSize: 14,
    color: palette.muted,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: palette.primary,
  },
  detailsContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  foodImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  foodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
    marginRight: spacing.sm,
  },
  ingredientText: {
    fontSize: 15,
    color: palette.text,
    flex: 1,
  },
  caloriesContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesLabel: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  caloriesValue: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  noOptionsContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginTop: spacing.md,
  },
  noOptionsSubtext: {
    fontSize: 14,
    color: palette.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
