import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { dietService } from '../services/api';
import { Diet } from '../types';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../components/LoadingScreen';
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
  const { alertState, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadDiet();
  }, []);

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

  const onRefresh = () => {
    setRefreshing(true);
    loadDiet();
  };

  const handleMealPress = (meal: any) => {
    if (navigation) {
      navigation.navigate('ClientMealOptions', {
        mealId: meal.id,
        mealName: meal.meal_name,
        mealTime: meal.meal_time,
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando tu dieta..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Dieta</Text>
        <Text style={styles.subtitle}>Tu plan nutricional personalizado</Text>
      </View>

      {diet?.meals && diet.meals.length > 0 ? (
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
          {diet.meals.map((meal, index) => (
            <TouchableOpacity
              key={meal.id}
              style={styles.mealCard}
              onPress={() => handleMealPress(meal)}
              activeOpacity={0.7}
            >
              <View style={styles.mealNumber}>
                <Text style={styles.mealNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>Comida {index + 1}</Text>
                {meal.meal_time && (
                  <Text style={styles.mealTime}>{meal.meal_time}</Text>
                )}
                {meal.notes && (
                  <Text style={styles.mealNotes}>{meal.notes}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.muted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
    marginBottom: spacing.sm,
  },
  mealNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mealNumberText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    color: palette.text,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  mealNotes: {
    fontSize: 12,
    color: palette.mutedAlt,
    marginTop: 2,
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
