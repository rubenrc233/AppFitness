import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';
import { routineService } from '../services/api';
import { RoutineDay } from '../types';
import { palette, spacing, radius, typography } from '../theme';

interface Props {
  clientId: number;
  navigation: any;
}

export default function ClientExerciseScreen({ clientId, navigation }: Props) {
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseSummaries, setExerciseSummaries] = useState<{ [dayId: number]: { [muscle: string]: number } }>({});
  const [startWorkoutModalVisible, setStartWorkoutModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ day: RoutineDay; index: number } | null>(null);

  useEffect(() => {
    loadRoutine();
  }, [clientId]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const routine = await routineService.getRoutine(clientId);
      
      if (routine && routine.days) {
        setDays(routine.days);
        
        const summaries: { [dayId: number]: { [muscle: string]: number } } = {};
        for (const day of routine.days) {
          const exercises = await routineService.getDayExercises(day.id);
          const muscleCounts: { [muscle: string]: number } = {};
          
          exercises.forEach((exercise: any) => {
            const muscle = exercise.muscle_group;
            muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
          });
          
          summaries[day.id] = muscleCounts;
        }
        setExerciseSummaries(summaries);
      } else {
        setDays([]);
      }
    } catch (error) {
      console.error('Error loading routine:', error);
      setDays([]);
    } finally {
      setLoading(false);
    }
  };

  const openDayDetails = async (day: RoutineDay, index: number) => {
    setSelectedDay({ day, index });
    setStartWorkoutModalVisible(true);
  };

  const handleStartWorkout = () => {
    setStartWorkoutModalVisible(false);
    if (selectedDay) {
      navigation.navigate('Workout', {
        clientId: clientId,
        dayId: selectedDay.day.id,
        dayIndex: selectedDay.index
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutina..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Rutina</Text>
          <Text style={styles.subtitle}>Entrena duro, logra resultados</Text>
        </View>

        {days.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color={palette.muted} />
            <Text style={styles.emptyText}>Sin rutina asignada</Text>
            <Text style={styles.emptySubtext}>Tu entrenador te asignará una pronto</Text>
          </View>
        ) : (
          <View style={styles.daysList}>
            {days.map((day, index) => {
              const summary = exerciseSummaries[day.id] || {};
              const totalExercises = Object.values(summary).reduce((sum, count) => sum + count, 0);
              
              return (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayCard}
                  onPress={() => openDayDetails(day, index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.custom_name || `Día ${index + 1}`}</Text>
                    {totalExercises > 0 && (
                      <Text style={styles.exerciseSummary}>
                        {Object.entries(summary).map(([muscle, count], idx) => 
                          `${count} ${muscle.toLowerCase()}${idx < Object.entries(summary).length - 1 ? ' · ' : ''}`
                        ).join('')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={palette.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={startWorkoutModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="fitness" size={48} color={palette.primary} />
            <Text style={styles.modalTitle}>Iniciar Entrenamiento</Text>
            <Text style={styles.modalMessage}>
              ¿Listo para comenzar tu sesión?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setStartWorkoutModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleStartWorkout}
              >
                <Text style={styles.modalButtonConfirmText}>¡Comenzar!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.muted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    color: palette.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  daysList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dayNumberText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseSummary: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    marginTop: spacing.md,
  },
  modalMessage: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
