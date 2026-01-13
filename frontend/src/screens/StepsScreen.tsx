import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
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

export default function StepsScreen() {
  const { user } = useAuth();
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<string>('checking');
  const [currentSteps, setCurrentSteps] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [weeklySteps, setWeeklySteps] = useState<DaySteps[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);

  useEffect(() => {
    loadDailyGoal();
    checkPedometerAvailability();
    loadTodaySteps();
    loadWeeklySteps();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

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
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(isAvailable ? 'available' : 'unavailable');
      
      if (isAvailable) {
        startPedometer();
        getStepsSinceMidnight();
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
      const result = await Pedometer.getStepCountAsync(midnight, now);
      if (result) {
        setTodaySteps(result.steps);
        saveTodaySteps(result.steps);
      }
    } catch (error) {
      console.error('Error getting steps since midnight:', error);
    }
  };

  const startPedometer = () => {
    const sub = Pedometer.watchStepCount(result => {
      setCurrentSteps(result.steps);
      // Actualizar pasos de hoy sumando los nuevos
      setTodaySteps(prev => {
        const newTotal = prev + result.steps;
        saveTodaySteps(newTotal);
        return newTotal;
      });
    });
    setSubscription(sub);
  };

  const saveTodaySteps = async (steps: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`steps_${today}`, steps.toString());
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  };

  const loadTodaySteps = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`steps_${today}`);
      if (saved) {
        setTodaySteps(parseInt(saved, 10));
      }
    } catch (error) {
      console.error('Error loading today steps:', error);
    }
  };

  const loadWeeklySteps = async () => {
    try {
      const days: DaySteps[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
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
