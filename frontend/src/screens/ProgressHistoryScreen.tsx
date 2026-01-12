import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoadingScreen from '../components/LoadingScreen';
import { LineChart } from 'react-native-chart-kit';
import { progressService } from '../services/api';
import { ProgressUpdate, ProgressSettings } from '../types';
import { Picker } from '@react-native-picker/picker';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

interface Props {
  route: {
    params: {
      clientId: number;
      clientName: string;
    };
  };
  navigation: any;
}

const screenWidth = Dimensions.get('window').width;

export default function ProgressHistoryScreen({ route, navigation }: Props) {
  const { clientId, clientName } = route.params;
  const [history, setHistory] = useState<ProgressUpdate[]>([]);
  const [settings, setSettings] = useState<ProgressSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { alertState, hideAlert, showSuccess, showError } = useCustomAlert();

  const [frequencyWeeks, setFrequencyWeeks] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('monday');

  useEffect(() => {
    navigation.setOptions({
      title: `Progreso de ${clientName}`,
    });
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, settingsData] = await Promise.all([
        progressService.getHistory(clientId),
        progressService.getSettings(clientId),
      ]);
      setHistory(historyData);
      setSettings(settingsData);

      if (settingsData) {
        setFrequencyWeeks(settingsData.frequency_weeks);
        setDayOfWeek(settingsData.day_of_week);
      }
    } catch (error) {
      console.error('Error cargando progreso:', error);
      showError('Error', 'No se pudo cargar el progreso');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await progressService.saveSettings(clientId, {
        frequencyWeeks,
        dayOfWeek,
      });
      showSuccess('¡Listo!', 'Configuración guardada correctamente');
      setShowSettingsModal(false);
      loadData();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      showError('Error', 'No se pudo guardar la configuración');
    }
  };

  const getDayLabel = (day: string) => {
    const days: { [key: string]: string } = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    return days[day] || day;
  };

  if (loading) {
    return <LoadingScreen message="Cargando historial..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Config Card */}
        <View style={styles.configCard}>
          <View style={styles.configHeader}>
            <View style={styles.configInfo}>
              <Text style={styles.configTitle}>Configuración</Text>
              {settings ? (
                <Text style={styles.configSubtitle}>
                  Cada {settings.frequency_weeks} semana
                  {settings.frequency_weeks > 1 ? 's' : ''}, los{' '}
                  {getDayLabel(settings.day_of_week)}
                </Text>
              ) : (
                <Text style={styles.configSubtitle}>No configurado</Text>
              )}
              {settings?.next_due_date && (
                <Text style={styles.nextDueDate}>
                  Próxima: {new Date(settings.next_due_date).toLocaleDateString('es-ES')}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.configButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons name="settings-outline" size={22} color={palette.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {history.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Tendencia de Peso</Text>
            <LineChart
              data={{
                labels: history
                  .slice(0, 6)
                  .reverse()
                  .map((h) => {
                    const d = new Date(h.created_at);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }),
                datasets: [
                  {
                    data: history.slice(0, 6).reverse().map((h) => h.weight),
                  },
                ],
              }}
              width={screenWidth - 60}
              height={180}
              yAxisSuffix="kg"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(232, 93, 4, ${opacity})`,
                labelColor: () => palette.muted,
                style: { borderRadius: radius.md },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: palette.primary,
                },
              }}
              bezier
              style={{ borderRadius: radius.md }}
            />
          </View>
        )}

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>
            Historial ({history.length} actualizaciones)
          </Text>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={60} color={palette.muted} />
              <Text style={styles.emptyText}>Sin actualizaciones</Text>
              <Text style={styles.emptySubtext}>
                El cliente aún no ha subido su progreso
              </Text>
            </View>
          ) : (
            history.map((update, index) => (
              <View key={update.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <View>
                    <Text style={styles.updateDate}>
                      {new Date(update.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    {index === 0 && <Text style={styles.latestBadge}>Más reciente</Text>}
                  </View>
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightText}>{update.weight} kg</Text>
                  </View>
                </View>

                <View style={styles.photoGrid}>
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: update.front_photo_url }} style={styles.thumbnail} />
                    <Text style={styles.photoLabel}>Frontal</Text>
                  </View>
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: update.side_photo_url }} style={styles.thumbnail} />
                    <Text style={styles.photoLabel}>Lateral</Text>
                  </View>
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: update.back_photo_url }} style={styles.thumbnail} />
                    <Text style={styles.photoLabel}>Espalda</Text>
                  </View>
                </View>

                {index < history.length - 1 && (
                  <View style={styles.weightDiff}>
                    {update.weight > history[index + 1].weight ? (
                      <Text style={styles.weightDiffUp}>
                        ↑ +{(update.weight - history[index + 1].weight).toFixed(1)} kg
                      </Text>
                    ) : update.weight < history[index + 1].weight ? (
                      <Text style={styles.weightDiffDown}>
                        ↓ {(update.weight - history[index + 1].weight).toFixed(1)} kg
                      </Text>
                    ) : (
                      <Text style={styles.weightDiffSame}>→ Sin cambios</Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Progreso</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={28} color={palette.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Frecuencia</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={frequencyWeeks}
                onValueChange={setFrequencyWeeks}
                style={styles.picker}
                dropdownIconColor={palette.primary}
              >
                <Picker.Item label="Cada 1 semana" value={1} />
                <Picker.Item label="Cada 2 semanas" value={2} />
                <Picker.Item label="Cada 3 semanas" value={3} />
                <Picker.Item label="Cada 4 semanas" value={4} />
              </Picker>
            </View>

            <Text style={styles.modalLabel}>Día de la semana</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={dayOfWeek}
                onValueChange={setDayOfWeek}
                style={styles.picker}
                dropdownIconColor={palette.primary}
              >
                <Picker.Item label="Lunes" value="monday" />
                <Picker.Item label="Martes" value="tuesday" />
                <Picker.Item label="Miércoles" value="wednesday" />
                <Picker.Item label="Jueves" value="thursday" />
                <Picker.Item label="Viernes" value="friday" />
                <Picker.Item label="Sábado" value="saturday" />
                <Picker.Item label="Domingo" value="sunday" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  scrollView: {
    flex: 1,
  },
  configCard: {
    margin: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configInfo: {
    flex: 1,
  },
  configTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  configSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 4,
  },
  nextDueDate: {
    fontSize: 12,
    color: palette.primary,
    marginTop: 4,
  },
  configButton: {
    padding: spacing.sm,
  },
  chartContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: palette.text,
    marginBottom: spacing.md,
  },
  emptyHistory: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  updateCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  updateDate: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  latestBadge: {
    fontSize: 11,
    color: palette.primary,
    marginTop: 3,
  },
  weightBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  weightText: {
    color: palette.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: '31%',
  },
  thumbnail: {
    width: '100%',
    height: 140,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
  },
  photoLabel: {
    fontSize: 11,
    color: palette.muted,
    textAlign: 'center',
    marginTop: 5,
  },
  weightDiff: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    alignItems: 'center',
  },
  weightDiffUp: {
    fontSize: 13,
    color: palette.danger,
    fontWeight: '600',
  },
  weightDiffDown: {
    fontSize: 13,
    color: palette.success,
    fontWeight: '600',
  },
  weightDiffSame: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 22,
    color: palette.text,
  },
  modalLabel: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  pickerContainer: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  picker: {
    color: palette.text,
  },
  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
