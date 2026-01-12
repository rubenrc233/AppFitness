import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clientService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

export default function ClientDetailsScreen({ route, navigation }: any) {
  const { clientId } = route.params;
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { alertState, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadClientDetails();
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
                <Text style={styles.menuText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={palette.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: palette.text,
  },
});
