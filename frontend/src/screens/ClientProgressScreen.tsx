import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import LoadingScreen from '../components/LoadingScreen';
import { LineChart } from 'react-native-chart-kit';
import { progressService } from '../services/api';
import { ProgressStatus, ProgressUpdate } from '../types';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

const screenWidth = Dimensions.get('window').width;

interface Props {
  clientId: number;
}

export default function ClientProgressScreen({ clientId }: Props) {
  const [status, setStatus] = useState<ProgressStatus | null>(null);
  const [history, setHistory] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { alertState, hideAlert, showSuccess, showError, showWarning } = useCustomAlert();
  
  // Modal para selección de foto
  const [photoPickerModalVisible, setPhotoPickerModalVisible] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'front' | 'side' | 'back'>('front');

  const [weight, setWeight] = useState('');
  const [photos, setPhotos] = useState<{
    front: ImagePicker.ImagePickerAsset | null;
    side: ImagePicker.ImagePickerAsset | null;
    back: ImagePicker.ImagePickerAsset | null;
  }>({
    front: null,
    side: null,
    back: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, historyData] = await Promise.all([
        progressService.getStatus(),
        progressService.getHistory(clientId),
      ]);
      setStatus(statusData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error cargando progreso:', error);
      showError('Error', 'No se pudo cargar el progreso');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'front' | 'side' | 'back') => {
    setSelectedPhotoType(type);
    setPhotoPickerModalVisible(true);
  };

  const takePhoto = async (type: 'front' | 'side' | 'back') => {
    setPhotoPickerModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showWarning('Permiso Denegado', 'Necesitamos acceso a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({ ...prev, [type]: result.assets[0] }));
    }
  };

  const chooseFromGallery = async (type: 'front' | 'side' | 'back') => {
    setPhotoPickerModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showWarning('Permiso Denegado', 'Necesitamos acceso a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotos((prev) => ({ ...prev, [type]: result.assets[0] }));
    }
  };

  const uploadProgress = async () => {
    if (!photos.front || !photos.side || !photos.back || !weight) {
      showWarning('Datos Incompletos', 'Debes completar todos los campos y fotos');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      showWarning('Peso Inválido', 'Introduce un peso válido');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('weight', weight);

      formData.append('frontPhoto', {
        uri: photos.front.uri,
        type: 'image/jpeg',
        name: 'front.jpg',
      } as any);

      formData.append('sidePhoto', {
        uri: photos.side.uri,
        type: 'image/jpeg',
        name: 'side.jpg',
      } as any);

      formData.append('backPhoto', {
        uri: photos.back.uri,
        type: 'image/jpeg',
        name: 'back.jpg',
      } as any);

      await progressService.uploadProgress(formData);

      showSuccess('¡Éxito!', 'Tu progreso ha sido guardado correctamente');
      
      setPhotos({ front: null, side: null, back: null });
      setWeight('');
      
      await loadData();
    } catch (error: any) {
      console.error('Error subiendo progreso:', error);
      showError('Error', error.message || 'No se pudo guardar el progreso');
    } finally {
      setUploading(false);
    }
  };

  const getPhotoButtonLabel = (type: 'front' | 'side' | 'back') => {
    const labels = { front: 'Frontal', side: 'Lateral', back: 'Espalda' };
    return labels[type];
  };

  const calculateWeightChange = () => {
    if (history.length < 2) return null;
    
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstWeight = sortedHistory[0].weight;
    const lastWeight = sortedHistory[sortedHistory.length - 1].weight;
    const change = lastWeight - firstWeight;
    
    return {
      change: Math.abs(change),
      type: change >= 0 ? 'ganado' : 'perdido',
      isPositive: change >= 0
    };
  };

  const getChartData = () => {
    if (history.length === 0) return null;

    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      labels: sortedHistory.map(update => {
        const date = new Date(update.created_at);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [{
        data: sortedHistory.map(update => update.weight),
        strokeWidth: 2,
      }]
    };
  };

  if (loading) {
    return <LoadingScreen message="Cargando progreso..." />;
  }

  const weightChange = calculateWeightChange();
  const chartData = getChartData();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Progreso</Text>
          <Text style={styles.subtitle}>
            {status?.canUpload 
              ? 'Actualiza tu progreso' 
              : `Próxima: ${status?.nextDueDate 
                  ? new Date(status.nextDueDate).toLocaleDateString('es-ES')
                  : 'No configurada'}`
            }
          </Text>
        </View>

        {chartData && history.length >= 2 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Evolución de Peso</Text>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={200}
                chartConfig={{
                  backgroundColor: palette.surface,
                  backgroundGradientFrom: palette.surface,
                  backgroundGradientTo: palette.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(232, 93, 4, ${opacity})`,
                  labelColor: () => palette.muted,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: palette.primary
                  },
                  propsForBackgroundLines: {
                    stroke: palette.border,
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {weightChange && (
              <View style={styles.weightChangeContainer}>
                <Ionicons 
                  name={weightChange.isPositive ? 'trending-up' : 'trending-down'} 
                  size={24} 
                  color={weightChange.isPositive ? palette.danger : palette.success} 
                />
                <Text style={styles.weightChangeText}>
                  Has {weightChange.type} {weightChange.change.toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
        )}

        {status?.canUpload ? (
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Nueva Actualización</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="75.5"
                placeholderTextColor={palette.mutedAlt}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.photosGrid}>
              {(['front', 'side', 'back'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.photoButton}
                  onPress={() => pickImage(type)}
                >
                  {photos[type] ? (
                    <Image source={{ uri: photos[type]!.uri }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={24} color={palette.muted} />
                      <Text style={styles.photoLabel}>{getPhotoButtonLabel(type)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
              onPress={uploadProgress}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={palette.text} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Progreso</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lockedSection}>
            <Ionicons name="lock-closed" size={24} color={palette.muted} />
            <Text style={styles.lockedText}>
              Próxima revisión: {status?.nextDueDate
                ? new Date(status.nextDueDate).toLocaleDateString('es-ES')
                : 'No configurada'}
            </Text>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial</Text>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={40} color={palette.muted} />
              <Text style={styles.emptyHistoryText}>Sin actualizaciones</Text>
            </View>
          ) : (
            history.map((update) => (
              <View key={update.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <Text style={styles.updateDate}>
                    {new Date(update.created_at).toLocaleDateString('es-ES')}
                  </Text>
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightBadgeText}>{update.weight} kg</Text>
                  </View>
                </View>
                <View style={styles.photoGrid}>
                  <Image source={{ uri: update.front_photo_url }} style={styles.thumbnail} />
                  <Image source={{ uri: update.side_photo_url }} style={styles.thumbnail} />
                  <Image source={{ uri: update.back_photo_url }} style={styles.thumbnail} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal para selección de foto */}
      <Modal visible={photoPickerModalVisible} transparent animationType="fade">
        <View style={styles.photoPickerOverlay}>
          <View style={styles.photoPickerModal}>
            <Text style={styles.photoPickerTitle}>Seleccionar Foto</Text>
            <Text style={styles.photoPickerSubtitle}>¿Cómo quieres añadir la foto?</Text>
            
            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={() => takePhoto(selectedPhotoType)}
            >
              <Ionicons name="camera" size={24} color={palette.primary} />
              <Text style={styles.photoPickerButtonText}>Tomar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoPickerButton}
              onPress={() => chooseFromGallery(selectedPhotoType)}
            >
              <Ionicons name="images" size={24} color={palette.primary} />
              <Text style={styles.photoPickerButtonText}>Elegir de Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoPickerCancelButton}
              onPress={() => setPhotoPickerModalVisible(false)}
            >
              <Text style={styles.photoPickerCancelText}>Cancelar</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primaryLight,
    marginBottom: spacing.md,
  },
  chartSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chart: {
    borderRadius: radius.sm,
  },
  weightChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  weightChangeText: {
    color: palette.text,
    fontSize: 14,
  },
  uploadSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLabel: {
    color: palette.muted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  photoPreview: {
    flex: 1,
    borderRadius: radius.md,
  },
  saveButton: {
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: palette.mutedAlt,
  },
  saveButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  lockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  lockedText: {
    color: palette.muted,
    fontSize: 14,
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyHistoryText: {
    color: palette.muted,
    fontSize: 14,
    marginTop: spacing.sm,
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  updateDate: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  weightBadge: {
    backgroundColor: palette.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  weightBadgeText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbnail: {
    flex: 1,
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: palette.surfaceAlt,
  },
  photoPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  photoPickerModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: palette.border,
  },
  photoPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  photoPickerSubtitle: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  photoPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  photoPickerButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '500',
  },
  photoPickerCancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  photoPickerCancelText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
