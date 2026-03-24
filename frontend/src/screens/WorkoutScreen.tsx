import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  AppState,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { AppIcon as Ionicons } from '../components/AppIcon';
import LoadingScreen from '../components/LoadingScreen';
import { routineService, workoutService } from '../services/api';
import { DayExercise } from '../types';
import { palette, spacing, radius, typography } from '../theme';

const CACHE_KEY_PREFIX = 'workout_cache_';

interface Props {
  route: any;
  navigation: any;
}

export default function WorkoutScreen({ route, navigation }: Props) {
  const { clientId, dayId, dayIndex, dayName } = route.params;
  const cacheKey = `${CACHE_KEY_PREFIX}${clientId}_${dayId}`;

  const [exercises, setExercises] = useState<DayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentWeights, setCurrentWeights] = useState<{ [exerciseId: number]: { [setNum: number]: string } }>({});
  const [previousWeights, setPreviousWeights] = useState<{ [exerciseId: number]: { [setNum: number]: number } }>({});
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(true);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  // Progress chart state
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [chartData, setChartData] = useState<{ date: string; maxWeight: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartExerciseName, setChartExerciseName] = useState('');
  
  const workoutStartTimeRef = useRef<number>(Date.now());
  const restStartTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // --- Cache helpers ---
  const saveCache = useCallback(async (weights: typeof currentWeights, startTime: number) => {
    try {
      const data = {
        currentWeights: weights,
        workoutStartTime: startTime,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
      // silent
    }
  }, [cacheKey]);

  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Expire cache after 6 hours
      if (Date.now() - data.savedAt > 6 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      return data as { currentWeights: typeof currentWeights; workoutStartTime: number };
    } catch {
      return null;
    }
  }, [cacheKey]);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch {
      // silent
    }
  }, [cacheKey]);

  useEffect(() => {
    loadWorkout();
  }, []);

  // Save to cache whenever weights change
  useEffect(() => {
    if (!loading && workoutStarted) {
      saveCache(currentWeights, workoutStartTimeRef.current);
    }
  }, [currentWeights, loading, workoutStarted]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App regresó al frente, recalcular tiempos
        if (workoutStarted) {
          const elapsedSeconds = Math.floor((Date.now() - workoutStartTimeRef.current) / 1000);
          setWorkoutSeconds(elapsedSeconds);
        }
        if (restRunning && restStartTimeRef.current) {
          const elapsedRestSeconds = Math.floor((Date.now() - restStartTimeRef.current) / 1000);
          setRestSeconds(elapsedRestSeconds);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [workoutStarted, restRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutStarted) {
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - workoutStartTimeRef.current) / 1000);
        setWorkoutSeconds(elapsedSeconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restRunning) {
      if (!restStartTimeRef.current) {
        restStartTimeRef.current = Date.now() - (restSeconds * 1000);
      }
      interval = setInterval(() => {
        const elapsedRestSeconds = Math.floor((Date.now() - restStartTimeRef.current!) / 1000);
        setRestSeconds(elapsedRestSeconds);
      }, 1000);
    } else {
      restStartTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [restRunning]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const exercisesList = await routineService.getDayExercises(dayId);
      setExercises(exercisesList);

      const lastWorkout = await workoutService.getLastWorkout(clientId, dayId);
      setPreviousWeights(lastWorkout);

      // Try to restore from cache
      const cached = await loadCache();
      if (cached) {
        setCurrentWeights(cached.currentWeights);
        workoutStartTimeRef.current = cached.workoutStartTime;
        const elapsed = Math.floor((Date.now() - cached.workoutStartTime) / 1000);
        setWorkoutSeconds(elapsed);
      } else {
        const initialWeights: { [exerciseId: number]: { [setNum: number]: string } } = {};
        exercisesList.forEach((exercise: any) => {
          initialWeights[exercise.id] = {};
          for (let i = 1; i <= exercise.sets; i++) {
            initialWeights[exercise.id][i] = '';
          }
        });
        setCurrentWeights(initialWeights);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (exerciseId: number, setNumber: number, value: string) => {
    setCurrentWeights((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNumber]: value,
      },
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkoutPress = () => {
    setWorkoutStarted(false);
    setFinishModalVisible(true);
  };

  const handleCancelFinish = () => {
    setWorkoutStarted(true);
    setFinishModalVisible(false);
  };

  const toggleRestTimer = () => {
    setRestRunning(!restRunning);
  };

  const resetRestTimer = () => {
    setRestSeconds(0);
    setRestRunning(false);
    restStartTimeRef.current = null;
  };

  const handleStartWorkout = () => {
    workoutStartTimeRef.current = Date.now();
    setWorkoutStarted(true);
  };

  const handleFinishWorkout = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const exercisesData = exercises.map((exercise) => ({
        dayExerciseId: exercise.id,
        sets: Object.entries(currentWeights[exercise.id] || {}).map(([setNum, weight]) => ({
          setNumber: parseInt(setNum),
          weight: parseFloat(weight) || 0,
        })),
      }));

      await workoutService.saveWorkout(clientId, dayId, exercisesData);
      await clearCache();
      setFinishModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'No se pudo guardar el entrenamiento. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleShowProgress = async (exercise: DayExercise) => {
    try {
      setChartExerciseName(exercise.exercise_name);
      setChartLoading(true);
      setChartModalVisible(true);
      const history = await workoutService.getExerciseHistory(clientId, exercise.id);
      setChartData(history);
    } catch (error) {
      console.error('Error loading history:', error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando entrenamiento..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Entrenamiento</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{dayName || `Día ${dayIndex + 1}`}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Timers - Solo visibles cuando el entrenamiento ha comenzado */}
      {workoutStarted && (
        <View style={styles.timersRow}>
          <View style={[styles.timerContainer, styles.timerMain]}>
            <View style={styles.timerIconContainer}>
              <Ionicons name="flame" size={22} color={palette.primary} />
            </View>
            <View style={styles.timerContent}>
              <Text style={styles.timerLabel} numberOfLines={1}>TIEMPO ACTIVO</Text>
              <Text style={styles.timerDisplayMain} numberOfLines={1} adjustsFontSizeToFit>{formatTime(workoutSeconds)}</Text>
            </View>
          </View>

          <View style={styles.timerContainer}>
            <View style={styles.timerContentRest}>
              <Text style={styles.timerLabelRest} numberOfLines={1}>DESCANSO</Text>
              <Text style={styles.timerDisplayRest} numberOfLines={1} adjustsFontSizeToFit>{formatRestTime(restSeconds)}</Text>
            </View>
            <View style={styles.timerControls}>
              <TouchableOpacity 
                onPress={toggleRestTimer} 
                style={[styles.timerButton, restRunning && styles.timerButtonActive]}
              >
                <Ionicons name={restRunning ? 'pause' : 'play'} size={18} color={restRunning ? palette.text : palette.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={resetRestTimer} style={styles.timerButtonReset}>
                <Ionicons name="refresh" size={16} color={palette.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Exercise List */}
      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                <View style={styles.exerciseMeta}>
                  <View style={styles.muscleTag}>
                    <Text style={styles.muscleTagText}>{exercise.muscle_group}</Text>
                  </View>
                  <Text style={styles.repsText}>{exercise.reps} reps</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.progressButton}
                onPress={() => handleShowProgress(exercise)}
              >
                <Ionicons name="trending-up" size={18} color={palette.primary} />
              </TouchableOpacity>
            </View>
            
            {exercise.notes && (
              <View style={styles.notesContainer}>
                <Ionicons name="information-circle" size={14} color={palette.textWarm} />
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              </View>
            )}

            {/* Sets Table */}
            <View style={styles.setsTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colSerie]}>SERIE</Text>
                <Text style={[styles.tableHeaderText, styles.colRepes]}>REPES</Text>
                <Text style={[styles.tableHeaderText, styles.colAnterior]}>ANTERIOR</Text>
                <Text style={[styles.tableHeaderText, styles.colHoy]}>HOY (kg)</Text>
              </View>
              {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => (
                <View key={setNum} style={styles.tableRow}>
                  <View style={styles.colSerie}>
                    <View style={styles.setNumberCircle}>
                      <Text style={styles.setNumberText}>{setNum}</Text>
                    </View>
                  </View>
                  <View style={styles.colRepes}>
                    <Text style={styles.repsValue}>{exercise.reps}</Text>
                  </View>
                  <View style={styles.colAnterior}>
                    <Text style={styles.previousWeight}>
                      {previousWeights[exercise.id]?.[setNum]
                        ? `${previousWeights[exercise.id][setNum]} kg`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.colHoy}>
                    <TextInput
                      style={[
                        styles.weightInput,
                        currentWeights[exercise.id]?.[setNum] && styles.weightInputFilled
                      ]}
                      placeholder="0"
                      placeholderTextColor={palette.mutedAlt}
                      keyboardType="numeric"
                      value={currentWeights[exercise.id]?.[setNum] || ''}
                      onChangeText={(value) => handleWeightChange(exercise.id, setNum, value)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Start/Finish Button */}
        {!workoutStarted ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <Ionicons name="play-circle" size={24} color={palette.text} />
            <Text style={styles.startButtonText}>Comenzar Entrenamiento</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkoutPress}>
            <Ionicons name="checkmark-circle" size={22} color={palette.text} />
            <Text style={styles.finishButtonText}>Terminar Entrenamiento</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Finish Workout */}
      <Modal visible={finishModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color={palette.primary} />
            </View>
            <Text style={styles.modalTitle}>¡Finalizar Entrenamiento!</Text>
            <Text style={styles.modalMessage}>Has entrenado durante</Text>
            <Text style={styles.workoutTimeDisplay}>{formatTime(workoutSeconds)}</Text>
            <Text style={styles.modalSubMessage}>¿Deseas guardar tu entrenamiento?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={handleCancelFinish}>
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleFinishWorkout} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Progress Chart */}
      <Modal visible={chartModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.chartModalContainer}>
            <View style={styles.chartModalHeader}>
              <Text style={styles.chartModalTitle} numberOfLines={2}>{chartExerciseName}</Text>
              <TouchableOpacity onPress={() => setChartModalVisible(false)} style={styles.chartCloseButton}>
                <Ionicons name="close" size={22} color={palette.text} />
              </TouchableOpacity>
            </View>
            {chartLoading ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color={palette.primary} />
                <Text style={styles.chartLoadingText}>Cargando historial...</Text>
              </View>
            ) : chartData.length < 2 ? (
              <View style={styles.chartEmptyContainer}>
                <Ionicons name="bar-chart" size={48} color={palette.mutedAlt} />
                <Text style={styles.chartEmptyText}>
                  {chartData.length === 0
                    ? 'Sin datos de entrenamientos anteriores'
                    : 'Se necesitan al menos 2 sesiones para mostrar la gráfica'}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.chartSubtitle}>Peso máximo por sesión (kg)</Text>
                <LineChart
                  data={{
                    labels: chartData.map(d => {
                      const parts = d.date.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    }),
                    datasets: [{ data: chartData.map(d => d.maxWeight) }],
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  yAxisSuffix=" kg"
                  chartConfig={{
                    backgroundColor: palette.surface,
                    backgroundGradientFrom: palette.surface,
                    backgroundGradientTo: palette.surfaceAlt,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(205, 92, 69, ${opacity})`,
                    labelColor: () => palette.muted,
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: palette.primary,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: palette.border,
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.muted,
    fontSize: 16,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  headerBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  headerBadgeText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  timerContainer: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 0,
  },
  timerMain: {
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  timerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  timerContentRest: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  timerLabel: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timerLabelRest: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timerDisplayMain: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerDisplayRest: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  timerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButtonActive: {
    backgroundColor: palette.primary,
  },
  timerButtonReset: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisesList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  exerciseCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  exerciseNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exerciseNumberText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: palette.text,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  muscleTag: {
    backgroundColor: palette.primaryGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  muscleTagText: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  repsText: {
    color: palette.muted,
    fontSize: 13,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  exerciseNotes: {
    color: palette.textWarm,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  setsTable: {
    marginTop: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tableHeaderText: {
    color: palette.muted,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  colSerie: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colRepes: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colAnterior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colHoy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  setNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  repsValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  previousWeight: {
    color: palette.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  weightInput: {
    width: 70,
    backgroundColor: palette.inputBg,
    color: palette.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: palette.border,
  },
  weightInputFilled: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryGlow,
  },
  startButton: {
    backgroundColor: palette.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  startButtonText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  finishButtonText: {
    color: palette.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: palette.muted,
    textAlign: 'center',
  },
  workoutTimeDisplay: {
    fontSize: 40,
    fontWeight: 'bold',
    color: palette.primary,
    marginVertical: spacing.md,
  },
  modalSubMessage: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: palette.border,
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
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonConfirmText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Progress chart button
  progressButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.primaryMuted,
  },
  // Chart modal
  chartModalContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '92%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  chartCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  chart: {
    borderRadius: radius.md,
  },
  chartLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  chartLoadingText: {
    color: palette.muted,
    fontSize: 14,
  },
  chartEmptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chartEmptyText: {
    color: palette.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
