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
import { dietService, supplementsService } from '../services/api';
import { Diet, MealOption, OptionFood, Supplement } from '../types';
import { AppIcon as Ionicons } from '../components/AppIcon';
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
  const [supplements, setSupplements] = useState<Supplement[]>([]);
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
      const [dietData, supplementsData] = await Promise.all([
        dietService.getDiet(clientId),
        supplementsService.getSupplements(clientId)
      ]);
      setDiet(dietData);
      setSupplements(supplementsData);
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

  const calculateMacros = () => {
    return foods.reduce((totals, food) => {
      const multiplier = food.quantity / 100;
      return {
        protein: totals.protein + (food.protein_per_100g || 0) * multiplier,
        carbs: totals.carbs + (food.carbs_per_100g || 0) * multiplier,
        fat: totals.fat + (food.fat_per_100g || 0) * multiplier,
        fiber: totals.fiber + (food.fiber_per_100g || 0) * multiplier,
        sugar: totals.sugar + (food.sugar_per_100g || 0) * multiplier,
      };
    }, { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });
  };

  const formatSupplementDosage = (dosage: string) => {
    const value = (dosage ?? '').trim();
    if (!value) return '';

    // If it's only a number, add a default unit label so it doesn't look like an unexplained badge.
    if (/^\d+(?:[\.,]\d+)?$/.test(value)) {
      const normalized = value.replace(',', '.');
      const numberValue = Number(normalized);
      const isSingular = Number.isFinite(numberValue) ? numberValue === 1 : value === '1';
      return `${value} ${isSingular ? 'unidad' : 'unidades'}`;
    }

    // Otherwise assume the admin already included units (g, ml, caps, etc.)
    return value;
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

                    {/* Nutritional Info */}
                    <View style={styles.nutritionContainer}>
                      {/* Macros principales */}
                      <View style={styles.macrosRow}>
                        <View style={[styles.macroCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                          <Text style={[styles.macroValueNew, { color: '#EF4444' }]}>{Math.round(calculateMacros().protein)}g</Text>
                          <Text style={styles.macroLabelNew}>Proteína</Text>
                        </View>

                        <View style={[styles.macroCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                          <Text style={[styles.macroValueNew, { color: '#3B82F6' }]}>{Math.round(calculateMacros().carbs)}g</Text>
                          <Text style={styles.macroLabelNew}>Hidratos</Text>
                        </View>

                        <View style={[styles.macroCard, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
                          <Text style={[styles.macroValueNew, { color: '#EAB308' }]}>{Math.round(calculateMacros().fat)}g</Text>
                          <Text style={styles.macroLabelNew}>Grasas</Text>
                        </View>
                      </View>

                      {/* Macros secundarios */}
                      <View style={styles.secondaryMacrosRow}>
                        <View style={styles.secondaryMacroItem}>
                          <Text style={styles.secondaryMacroText}>
                            <Text style={{ fontWeight: '600' }}>{Math.round(calculateMacros().fiber)}g</Text> fibra
                          </Text>
                        </View>
                        <View style={styles.secondaryMacroDivider} />
                        <View style={styles.secondaryMacroItem}>
                          <Text style={styles.secondaryMacroText}>
                            <Text style={{ fontWeight: '600' }}>{Math.round(calculateMacros().sugar)}g</Text> azúcares
                          </Text>
                        </View>
                      </View>

                      {/* Calorías totales */}
                      <View style={styles.caloriesCard}>
                        <Ionicons name="flame" size={24} color="#FF6B35" />
                        <Text style={styles.caloriesValueBig}>{Math.round(calculateTotalCalories())}</Text>
                        <Text style={styles.caloriesLabelBig}>kcal</Text>
                      </View>
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
            
            {/* Sección de Suplementación */}
            {supplements.length > 0 && (
              <View style={styles.supplementsSection}>
                <Text style={styles.supplementsTitle}>Suplementación</Text>
                {supplements.map((supplement) => (
                  <View key={supplement.id} style={styles.supplementCard}>
                    <Text style={styles.supplementName}>{supplement.name}</Text>
                    <Text style={styles.supplementDetail}>
                      <Text style={styles.supplementDetailLabel}>Dosis:</Text>{' '}
                      {formatSupplementDosage(supplement.dosage)}
                    </Text>
                    {supplement.time_of_day && (
                      <Text style={styles.supplementDetail}>
                        <Text style={styles.supplementDetailLabel}>Momento:</Text>{' '}
                        {supplement.time_of_day}
                      </Text>
                    )}
                    {supplement.notes && (
                      <Text style={styles.supplementNotes}>{supplement.notes}</Text>
                    )}
                  </View>
                ))}
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
  nutritionContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  caloriesValueBig: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B35',
  },
  caloriesLabelBig: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    opacity: 0.8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  macroIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  macroValueNew: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabelNew: {
    fontSize: 11,
    color: palette.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  secondaryMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  secondaryMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryMacroText: {
    fontSize: 13,
    color: palette.muted,
  },
  secondaryMacroDivider: {
    width: 1,
    height: 16,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
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
  supplementsSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  supplementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.md,
  },
  supplementCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  supplementName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    flex: 1,
  },
  supplementDetail: {
    fontSize: 13,
    color: palette.muted,
    marginTop: spacing.xs,
  },
  supplementDetailLabel: {
    fontWeight: '700',
    color: palette.textWarm,
  },
  supplementNotes: {
    fontSize: 13,
    color: palette.textWarm,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
