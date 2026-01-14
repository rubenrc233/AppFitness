import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { clientService, stepsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

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

  useEffect(() => {
    loadClientDetails();
    loadStepsGoal();
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
    paddingTop: 54,
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
