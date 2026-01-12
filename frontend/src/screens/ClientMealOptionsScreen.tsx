import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../components/LoadingScreen';
import { dietService } from '../services/api';
import { MealOption, OptionFood } from '../types';
import { palette, spacing, radius, typography } from '../theme';

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

            <View style={styles.caloriesContainer}>
              <Text style={styles.caloriesLabel}>Total kcal</Text>
              <Text style={styles.caloriesValue}>{Math.round(calculateTotalCalories())}</Text>
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
});
