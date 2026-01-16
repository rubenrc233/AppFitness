import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Linking,
  AppState,
} from 'react-native';
import { Pedometer } from 'expo-sensors';
import { AppIcon as Ionicons } from '../components/AppIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../components/AppHeader';
import { stepsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { palette, spacing, radius } from '../theme';

const { width } = Dimensions.get('window');
const DEFAULT_DAILY_GOAL = 10000; // Meta por defecto

interface DaySteps {
  date: string;
  steps: number;
}

const getLocalDateKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StepsScreen() {
  const { user } = useAuth();
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<string>('checking');
  const [currentSteps, setCurrentSteps] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState<DaySteps[]>([]);
  const subscriptionRef = useRef<any>(null);
  const baselineTodayStepsRef = useRef<number>(0);
  const todayStepsRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);
  const [isActivityPermissionBlocked, setIsActivityPermissionBlocked] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);

  useEffect(() => {
    loadDailyGoal();
    loadWeeklySteps();

    // IMPORTANTE: cargar lo guardado ANTES de arrancar el podómetro.
    // Si no, loadTodaySteps() puede pisar el valor calculado por sensor con 0.
    const init = async () => {
      const saved = await loadTodaySteps();
      baselineTodayStepsRef.current = saved;
      await checkPedometerAvailability();
    };

    void init();
    
    return () => {
      subscriptionRef.current?.remove?.();
      subscriptionRef.current = null;
    };
  }, []);

  useEffect(() => {
    todayStepsRef.current = todaySteps;
  }, [todaySteps]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      // Al volver a primer plano, recalculamos desde medianoche.
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        getStepsSinceMidnight();
        loadWeeklySteps();
      }

      // Al ir a background, guardamos el último valor como fallback.
      if (nextState === 'background') {
        saveTodaySteps(todayStepsRef.current);
      }

      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, []);

  const ensureActivityRecognitionPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const sdkInt = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
    if (!Number.isFinite(sdkInt) || sdkInt < 29) {
      // Android < 10 no requiere ACTIVITY_RECOGNITION
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;

    try {
      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        setIsActivityPermissionBlocked(false);
        return true;
      }

      const result = await PermissionsAndroid.request(permission, {
        title: 'Permiso para contar pasos',
        message: 'Necesitamos permiso de actividad física para registrar tus pasos.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      });

      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      setIsActivityPermissionBlocked(result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
      return granted;
    } catch (error) {
      console.error('Error requesting ACTIVITY_RECOGNITION:', error);
      return false;
    }
  };

  const loadDailyGoal = async () => {
    if (!user) return;
    try {
      const settings = await stepsService.getSettings(user.id);
      if (settings?.daily_goal) {
        setDailyGoal(settings.daily_goal);
      }
    } catch (error) {
      console.error('Error loading daily goal:', error);
      // Usar meta por defecto si hay error
    }
  };

  const checkPedometerAvailability = async () => {
    try {
      const hasPermission = await ensureActivityRecognitionPermission();
      if (!hasPermission) {
        setIsPedometerAvailable('permissionDenied');
        return;
      }

      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(isAvailable ? 'available' : 'unavailable');
      
      if (isAvailable) {
        // Primero calculamos el total del día, luego iniciamos la suscripción.
        await getStepsSinceMidnight();
        startPedometer();
      }
    } catch (error) {
      console.error('Error checking pedometer:', error);
      setIsPedometerAvailable('unavailable');
    }
  };

  const getStepsSinceMidnight = async () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    try {
      const todayKey = getLocalDateKey(now);
      const saved = await AsyncStorage.getItem(`steps_${todayKey}`);
      const savedSteps = saved ? parseInt(saved, 10) : 0;

      const result = await Pedometer.getStepCountAsync(midnight, now);
      if (result) {
        // En algunos dispositivos/roms el histórico puede fallar puntualmente.
        // Nunca bajamos el contador por debajo de lo ya guardado.
        const sensorSteps = result.steps ?? 0;
        const merged = Math.max(sensorSteps, savedSteps, baselineTodayStepsRef.current);

        baselineTodayStepsRef.current = merged;
        setTodaySteps(merged);
        saveTodaySteps(merged);
      }
    } catch (error) {
      console.error('Error getting steps since midnight:', error);
    }
  };

  const startPedometer = () => {
    // Evitar duplicar suscripciones
    subscriptionRef.current?.remove?.();

    const sub = Pedometer.watchStepCount(result => {
      setCurrentSteps(result.steps);

      // `result.steps` suele ser el conteo desde que se inició la suscripción.
      // Sumamos a la base obtenida desde medianoche para no duplicar.
      const newTotal = baselineTodayStepsRef.current + result.steps;
      setTodaySteps(newTotal);
      saveTodaySteps(newTotal);
    });
    subscriptionRef.current = sub;
  };

  const saveTodaySteps = async (steps: number) => {
    try {
      const todayKey = getLocalDateKey(new Date());
      await AsyncStorage.setItem(`steps_${todayKey}`, steps.toString());

      // Mantener gráfico semanal en sync sin recargar todo
      setWeeklySteps((prev) => {
        if (!prev?.length) return prev;
        return prev.map((d) => (d.date === todayKey ? { ...d, steps } : d));
      });
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  };

  const loadTodaySteps = async (): Promise<number> => {
    try {
      const todayKey = getLocalDateKey(new Date());
      const saved = await AsyncStorage.getItem(`steps_${todayKey}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        const value = Number.isFinite(parsed) ? parsed : 0;
        setTodaySteps(value);
        return value;
      }
    } catch (error) {
      console.error('Error loading today steps:', error);
    }

    setTodaySteps(0);
    return 0;
  };

  const loadWeeklySteps = async () => {
    try {
      const days: DaySteps[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateKey(date);
        const saved = await AsyncStorage.getItem(`steps_${dateStr}`);
        days.push({
          date: dateStr,
          steps: saved ? parseInt(saved, 10) : 0,
        });
      }
      
      setWeeklySteps(days);
    } catch (error) {
      console.error('Error loading weekly steps:', error);
    }
  };

  const progress = Math.min((todaySteps / dailyGoal) * 100, 100);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES');
  };

  const getWeekTotal = () => {
    return weeklySteps.reduce((sum, day) => sum + day.steps, 0);
  };

  const getWeekAverage = () => {
    const total = getWeekTotal();
    return Math.round(total / 7);
  };

  const estimatedCalories = Math.round(todaySteps * 0.04);
  const estimatedKm = (todaySteps * 0.0008).toFixed(2);

  return (
    <View style={styles.container}>
      <AppHeader title="Mis Pasos" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estado del podómetro */}
        {isPedometerAvailable === 'checking' && (
          <View style={styles.statusCard}>
            <Ionicons name="hourglass-outline" size={24} color={palette.muted} />
            <Text style={styles.statusText}>Comprobando sensor...</Text>
          </View>
        )}

        {isPedometerAvailable === 'unavailable' && (
          <View style={[styles.statusCard, styles.statusWarning]}>
            <Ionicons name="warning-outline" size={24} color="#F59E0B" />
            <Text style={styles.statusTextWarning}>
              El podómetro no está disponible en este dispositivo
            </Text>
          </View>
        )}

        {isPedometerAvailable === 'permissionDenied' && (
          <View style={[styles.statusCard, styles.statusWarning, styles.permissionCard]}>
            <Ionicons name="lock-closed-outline" size={24} color="#F59E0B" />
            <View style={styles.permissionTextContainer}>
              <Text style={styles.statusTextWarning}>
                Permiso de actividad física denegado
              </Text>
              <Text style={styles.permissionHint}>
                {isActivityPermissionBlocked
                  ? 'Actívalo en Ajustes para contar pasos.'
                  : 'Permite el acceso para poder contar pasos.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.permissionButtonText}>Ajustes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Círculo de progreso principal */}
        <View style={styles.mainCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <View style={styles.progressInner}>
                <Ionicons name="footsteps" size={32} color={palette.primary} />
                <Text style={styles.stepsCount}>{formatNumber(todaySteps)}</Text>
                <Text style={styles.stepsLabel}>pasos hoy</Text>
              </View>
              {/* Barra de progreso circular usando View */}
              <View style={[styles.progressRing, { 
                borderColor: `rgba(255, 107, 53, ${Math.min(progress / 100, 1)})`,
                borderWidth: progress > 0 ? 8 : 0,
              }]} />
            </View>
            <Text style={styles.goalText}>
              Meta: {formatNumber(dailyGoal)} pasos ({Math.round(progress)}%)
            </Text>
          </View>

          {/* Estadísticas rápidas */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Ionicons name="flame" size={20} color="#EF4444" />
              <Text style={styles.quickStatValue}>{estimatedCalories}</Text>
              <Text style={styles.quickStatLabel}>kcal</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="navigate" size={20} color="#3B82F6" />
              <Text style={styles.quickStatValue}>{estimatedKm}</Text>
              <Text style={styles.quickStatLabel}>km</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Ionicons name="time" size={20} color="#22C55E" />
              <Text style={styles.quickStatValue}>{Math.round(todaySteps / 100)}</Text>
              <Text style={styles.quickStatLabel}>min activo</Text>
            </View>
          </View>
        </View>

        {/* Resumen semanal */}
        <View style={styles.weeklyCard}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{formatNumber(getWeekTotal())}</Text>
              <Text style={styles.weeklyStatLabel}>pasos totales</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{formatNumber(getWeekAverage())}</Text>
              <Text style={styles.weeklyStatLabel}>promedio diario</Text>
            </View>
          </View>

          {/* Gráfico de barras semanal */}
          <View style={styles.weeklyChart}>
            {weeklySteps.map((day, index) => {
              const maxSteps = Math.max(...weeklySteps.map(d => d.steps), dailyGoal);
              const barHeight = Math.max((day.steps / maxSteps) * 100, 5);
              const isToday = index === weeklySteps.length - 1;
              
              return (
                <View key={day.date} style={styles.chartBarContainer}>
                  <Text style={styles.chartBarValue}>
                    {day.steps > 0 ? (day.steps / 1000).toFixed(1) + 'k' : '0'}
                  </Text>
                  <View style={styles.chartBarWrapper}>
                    <View 
                      style={[
                        styles.chartBar,
                        { 
                          height: `${barHeight}%`,
                          backgroundColor: isToday ? palette.primary : 'rgba(255, 107, 53, 0.4)',
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, isToday && styles.chartBarLabelToday]}>
                    {getDayName(day.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statusWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusText: {
    color: palette.muted,
    fontSize: 14,
  },
  statusTextWarning: {
    color: '#F59E0B',
    fontSize: 14,
    flex: 1,
  },
  permissionCard: {
    alignItems: 'flex-start',
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionHint: {
    color: '#B45309',
    fontSize: 12,
    marginTop: 2,
  },
  permissionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  permissionButtonText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  mainCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressCircle: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderColor: palette.primary,
  },
  progressInner: {
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
  },
  stepsCount: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.xs,
  },
  stepsLabel: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 2,
  },
  goalText: {
    fontSize: 14,
    color: palette.muted,
    marginTop: spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    marginTop: spacing.xs,
  },
  quickStatLabel: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: palette.border,
  },
  weeklyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.md,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.primary,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarValue: {
    fontSize: 10,
    color: palette.muted,
    marginBottom: 4,
  },
  chartBarWrapper: {
    width: 24,
    height: 80,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  chartBarLabel: {
    fontSize: 11,
    color: palette.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  chartBarLabelToday: {
    color: palette.primary,
    fontWeight: '700',
  },
  motivationCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: palette.text,
    fontWeight: '500',
  },
});
