import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { clientService, stepsService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import { Picker } from '@react-native-picker/picker';

export default function ClientDetailsScreen({ route, navigation }: any) {
  const { clientId } = route.params;
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { alertState, hideAlert, showError, showSuccess } = useCustomAlert();
  
  // Estado para modal de pasos
  const [stepsModalVisible, setStepsModalVisible] = useState(false);
  const [currentStepsGoal, setCurrentStepsGoal] = useState(10000);
  const [newStepsGoal, setNewStepsGoal] = useState('10000');

  // Estado para modal de pagos
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'quarterly' | 'biannual' | 'annual'>('monthly');
  const [currentPaymentConfig, setCurrentPaymentConfig] = useState<any>(null);

  useEffect(() => {
    loadClientDetails();
    loadStepsGoal();
    loadPaymentConfig();
  }, [clientId]);

  const loadClientDetails = async () => {
    setLoading(true);
    try {
      const response = await clientService.getClientDetails(clientId);
      setClientName(response.client.name);
    } catch (error) {
      showError('Error', 'No se pudieron cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  const loadStepsGoal = async () => {
    try {
      const settings = await stepsService.getSettings(clientId);
      if (settings?.daily_goal) {
        setCurrentStepsGoal(settings.daily_goal);
        setNewStepsGoal(settings.daily_goal.toString());
      }
    } catch (error) {
      console.error('Error loading steps goal:', error);
    }
  };

  const loadPaymentConfig = async () => {
    try {
      const response = await paymentService.getPaymentConfig(clientId);
      if (response.config) {
        setCurrentPaymentConfig(response.config);
        setPaymentAmount(response.config.amount.toString());
        setPaymentFrequency(response.config.frequency);
      }
    } catch (error) {
      console.error('Error loading payment config:', error);
    }
  };

  const handleSavePaymentConfig = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Error', 'Ingresa una cantidad válida');
      return;
    }
    
    try {
      await paymentService.configurePayment(clientId, amount, paymentFrequency);
      showSuccess('Éxito', 'Sistema de pagos configurado');
      setPaymentModalVisible(false);
      loadPaymentConfig();
    } catch (error) {
      showError('Error', 'No se pudo configurar el sistema de pagos');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: { [key: string]: string } = {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual'
    };
    return labels[freq] || freq;
  };

  const handleSaveStepsGoal = async () => {
    const goal = parseInt(newStepsGoal, 10);
    if (isNaN(goal) || goal < 1000 || goal > 50000) {
      showError('Error', 'La meta debe estar entre 1.000 y 50.000 pasos');
      return;
    }
    
    try {
      await stepsService.updateSettings(clientId, goal);
      setCurrentStepsGoal(goal);
      setStepsModalVisible(false);
      showSuccess('Éxito', 'Meta de pasos actualizada');
    } catch (error) {
      showError('Error', 'No se pudo guardar la meta');
    }
  };

  const isAdmin = user?.role === 'admin';

  if (loading || !clientName) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Cargando...</Text>
      </View>
    );
  }

  const menuItems = [
    {
      icon: 'footsteps-outline',
      title: 'Meta de Pasos',
      subtitle: `${currentStepsGoal.toLocaleString()} pasos/día`,
      onPress: () => setStepsModalVisible(true),
    },
    {
      icon: 'wallet-outline',
      title: 'Sistema de Pagos',
      subtitle: currentPaymentConfig 
        ? `${currentPaymentConfig.amount}€ - ${getFrequencyLabel(currentPaymentConfig.frequency)}`
        : 'No configurado',
      onPress: () => setPaymentModalVisible(true),
    },
    {
      icon: 'barbell-outline',
      title: 'Gestionar Rutina',
      onPress: () => navigation.navigate('RoutineManagement', { clientId, clientName }),
    },
    {
      icon: 'restaurant-outline',
      title: 'Gestionar Dieta',
      onPress: () => navigation.navigate('DietManagement', { clientId, clientName }),
    },
    {
      icon: 'stats-chart-outline',
      title: 'Historial de Progreso',
      onPress: () => navigation.navigate('ProgressHistory', { clientId, clientName }),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{clientName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {isAdmin && (
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color={palette.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtext}>{item.subtitle}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Modal para configurar meta de pasos */}
      <Modal visible={stepsModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Meta de Pasos Diarios</Text>
            <Text style={styles.modalSubtitle}>
              Configura la meta diaria de pasos para {clientName}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={newStepsGoal}
              onChangeText={setNewStepsGoal}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor={palette.muted}
            />
            <Text style={styles.modalHint}>Entre 1.000 y 50.000 pasos</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setNewStepsGoal(currentStepsGoal.toString());
                  setStepsModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveStepsGoal}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para configurar sistema de pagos */}
      <Modal visible={paymentModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sistema de Pagos</Text>
              <Text style={styles.modalSubtitle}>
                Configura la cuota de {clientName}
              </Text>
              
              <Text style={styles.modalLabel}>Cantidad (€)</Text>
              <TextInput
                style={styles.modalInput}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                placeholder="50.00"
                placeholderTextColor={palette.muted}
              />
              
              <Text style={styles.modalLabel}>Frecuencia de Pago</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={paymentFrequency}
                  onValueChange={(value) => setPaymentFrequency(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Mensual" value="monthly" />
                  <Picker.Item label="Trimestral (cada 3 meses)" value="quarterly" />
                  <Picker.Item label="Semestral (cada 6 meses)" value="biannual" />
                  <Picker.Item label="Anual" value="annual" />
                </Picker>
              </View>
              
              <Text style={styles.modalHint}>
                {currentPaymentConfig 
                  ? 'Actualizar el sistema creará un nuevo registro de pago' 
                  : 'Al configurar se registrará el primer pago automáticamente'}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    if (currentPaymentConfig) {
                      setPaymentAmount(currentPaymentConfig.amount.toString());
                      setPaymentFrequency(currentPaymentConfig.frequency);
                    }
                    setPaymentModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSavePaymentConfig}
                >
                  <Text style={styles.modalSaveText}>
                    {currentPaymentConfig ? 'Actualizar' : 'Configurar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  loading: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    color: palette.text,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  menuList: {
    gap: spacing.sm,
  },
  menuItem: {
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
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.text,
  },
  menuSubtext: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pickerContainer: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  picker: {
    color: palette.text,
  },
  modalHint: {
    fontSize: 12,
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  modalCancelText: {
    color: palette.muted,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
