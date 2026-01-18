import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import LoadingScreen from '../components/LoadingScreen';
import { dietService } from '../services/api';
import { MealOption, OptionFood } from '../types';
import { palette, spacing, radius, typography, withOpacity } from '../theme';

interface Props {
  route: any;
  navigation: any;
}

export default function ClientMealOptionsScreen({ route, navigation }: Props) {
  const { mealId, mealName, mealTime } = route.params;
  
  const [options, setOptions] = useState<MealOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<MealOption | null>(null);
  const [foods, setFoods] = useState<OptionFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const data = await dietService.getMealOptions(mealId);
      setOptions(data);
      
      // Seleccionar automáticamente la primera opción
      if (data.length > 0) {
        setSelectedOption(data[0]);
        const foodsData = await dietService.getOptionFoods(data[0].id);
        setFoods(foodsData);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <LoadingScreen message="Cargando opciones..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{mealName}</Text>
          {mealTime && <Text style={styles.headerSubtitle}>{mealTime}</Text>}
        </View>
      </View>

      <ScrollView style={styles.content}>
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
                <View style={[styles.macroCard, { backgroundColor: withOpacity(palette.danger, 0.12) }]}>
                  <Text style={[styles.macroValueNew, { color: palette.danger }]}>{Math.round(calculateMacros().protein)}g</Text>
                  <Text style={styles.macroLabelNew}>Proteína</Text>
                </View>

                <View style={[styles.macroCard, { backgroundColor: withOpacity(palette.accent, 0.12) }]}>
                  <Text style={[styles.macroValueNew, { color: palette.accent }]}>{Math.round(calculateMacros().carbs)}g</Text>
                  <Text style={styles.macroLabelNew}>Hidratos</Text>
                </View>

                <View style={[styles.macroCard, { backgroundColor: withOpacity(palette.warning, 0.12) }]}>
                  <Text style={[styles.macroValueNew, { color: palette.warning }]}>{Math.round(calculateMacros().fat)}g</Text>
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
                <Ionicons name="flame" size={24} color={palette.primary} />
                <Text style={styles.caloriesValueBig}>{Math.round(calculateTotalCalories())}</Text>
                <Text style={styles.caloriesLabelBig}>kcal</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: palette.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.textWarm,
    marginTop: 2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.inputBg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionChipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  optionChipText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: palette.text,
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
    backgroundColor: withOpacity(palette.primary, 0.12),
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  caloriesValueBig: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.primary,
  },
  caloriesLabelBig: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary,
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
});
