import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingScreen from '../components/LoadingScreen';
import AppHeader from '../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { routineService } from '../services/api';
import { RoutineDay, DayExercise } from '../types';
import { palette, spacing, radius, typography } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  clientId: number;
  navigation: any;
}

// Días de la semana
const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ClientExerciseScreen({ clientId, navigation }: Props) {
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    loadRoutine();
  }, [clientId]);

  useEffect(() => {
    if (days.length > 0) {
      loadDayExercises(days[currentDayIndex].id);
    }
  }, [currentDayIndex, days]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const routine = await routineService.getRoutine(clientId);
      
      if (routine && routine.days) {
        setDays(routine.days);
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

  const loadDayExercises = async (dayId: number) => {
    try {
      setLoadingExercises(true);
      const exercisesList = await routineService.getDayExercises(dayId);
      setExercises(exercisesList);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex < days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handleStartWorkout = () => {
    const weekdayName = currentDay?.weekday !== undefined && currentDay?.weekday !== null && WEEKDAYS[currentDay.weekday] 
      ? WEEKDAYS[currentDay.weekday] 
      : `Día ${currentDayIndex + 1}`;
    navigation.navigate('Workout', {
      clientId: clientId,
      dayId: days[currentDayIndex].id,
      dayIndex: currentDayIndex,
      dayName: weekdayName
    });
  };

  if (loading) {
    return <LoadingScreen message="Cargando rutina..." />;
  }

  const currentDay = days[currentDayIndex];

  return (
    <View style={styles.container}>
      <AppHeader title="Mi Rutina" />

      {days.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={64} color={palette.muted} />
          <Text style={styles.emptyText}>Sin rutina asignada</Text>
          <Text style={styles.emptySubtext}>Tu entrenador te asignará una pronto</Text>
        </View>
      ) : (
        <>
          {/* Panel horizontal de días */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScrollContainer}
            style={styles.daysScroll}
          >
            {days.map((day, index) => {
              const isActive = index === currentDayIndex;
              const dayName = day.weekday !== undefined && day.weekday !== null && WEEKDAYS[day.weekday]
                ? WEEKDAYS[day.weekday].substring(0, 3)
                : `D${index + 1}`;
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentDayIndex(index)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={[palette.primary, '#FF8A3D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.dayButton}
                    >
                      <Text style={styles.dayButtonTextActive}>{dayName}</Text>
                      <Text style={styles.dayButtonSubtextActive}>
                        {day.custom_name || day.name || ''}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.dayButtonInactive}>
                      <Text style={styles.dayButtonText}>{dayName}</Text>
                      <Text style={styles.dayButtonSubtext}>
                        {day.custom_name || day.name || ''}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loadingExercises ? (
              <View style={styles.loadingExercisesContainer}>
                <Text style={styles.loadingExercisesText}>Cargando ejercicios...</Text>
              </View>
            ) : exercises.length > 0 ? (
              <>
                {/* Lista de ejercicios como tarjetas */}
                {exercises.map((exercise, idx) => (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <TouchableOpacity 
                      style={styles.videoThumbnail}
                      activeOpacity={0.9}
                    >
                      {exercise.video_url ? (
                        <Image 
                          source={{ uri: exercise.video_url }} 
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Ionicons name="videocam-outline" size={32} color={palette.muted} />
                        </View>
                      )}
                      <View style={styles.playOverlay}>
                        <View style={styles.playButton}>
                          <Ionicons name="play" size={24} color="#FFF" />
                        </View>
                      </View>
                      <View style={styles.exerciseNumberBadge}>
                        <Text style={styles.exerciseNumberBadgeText}>{idx + 1}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Pestaña flotante con info debajo del video */}
                    <View style={styles.floatingInfoWrapper}>
                      <View style={styles.floatingInfoCard}>
                        <Text style={styles.floatingInfoName}>{exercise.exercise_name}</Text>
                        <Text style={styles.floatingInfoMeta}>
                          {exercise.muscle_group} · {exercise.sets} × {exercise.reps}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Botón de comenzar */}
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={handleStartWorkout}
                  activeOpacity={0.85}
                >
                  <Ionicons name="play" size={20} color={palette.text} />
                  <Text style={styles.startButtonText}>Comenzar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noExercisesContainer}>
                <Ionicons name="barbell-outline" size={48} color={palette.muted} />
                <Text style={styles.noExercisesText}>Sin ejercicios</Text>
                <Text style={styles.noExercisesSubtext}>Este día aún no tiene ejercicios asignados</Text>
              </View>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  daysScroll: {
    maxHeight: 90,
  },
  daysScrollContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  dayButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  dayButtonInactive: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayButtonTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayButtonSubtext: {
    fontSize: 11,
    color: palette.mutedAlt,
    marginTop: 2,
  },
  dayButtonSubtextActive: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingExercisesContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadingExercisesText: {
    color: palette.muted,
    fontSize: 14,
  },
  exerciseCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  exerciseNumberBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: palette.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingInfoWrapper: {
    alignItems: 'center',
    marginTop: -16,
    marginBottom: spacing.md,
  },
  floatingInfoCard: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  floatingInfoName: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
  floatingInfoMeta: {
    fontSize: 13,
    color: palette.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignSelf: 'center',
  },
  startButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  noExercisesContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  noExercisesText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginTop: spacing.md,
  },
  noExercisesSubtext: {
    fontSize: 14,
    color: palette.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
