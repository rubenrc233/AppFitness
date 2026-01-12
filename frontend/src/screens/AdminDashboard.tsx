import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/api';
import { Client } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

type SortType = 'alphabetic' | 'review';

export default function AdminDashboard({ navigation }: any) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('alphabetic');
  const { user, signOut } = useAuth();
  const { alertState, hideAlert, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadClients();
    });
    return unsubscribe;
  }, [navigation]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientService.getClients();
      setClients(data.clients);
    } catch (error: any) {
      showError('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Cerrar Sesión',
      '¿Estás seguro?',
      signOut
    );
  };

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    // Primero filtrar por búsqueda
    let filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separar en activos (is_enabled = true o sin configurar) y bloqueados (is_enabled = false)
    const activeClients = filtered.filter(c => c.is_enabled !== false);
    const blockedClients = filtered.filter(c => c.is_enabled === false);

    // Función para ordenar
    const sortClients = (clientList: Client[]) => {
      if (sortType === 'alphabetic') {
        return [...clientList].sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      } else {
        // Ordenar por próxima revisión
        return [...clientList].sort((a, b) => {
          // Si no tiene fecha de revisión, va al final
          if (!a.next_due_date && !b.next_due_date) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          }
          if (!a.next_due_date) return 1;
          if (!b.next_due_date) return -1;
          
          return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
        });
      }
    };

    // Ordenar cada grupo y combinar (activos primero, luego bloqueados)
    return [...sortClients(activeClients), ...sortClients(blockedClients)];
  }, [clients, searchQuery, sortType]);

  const formatReviewDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(date);
    reviewDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Hace ${Math.abs(diffDays)} días`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Hoy', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Mañana', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `En ${diffDays} días`, isOverdue: false };
    } else {
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'short' });
      return { text: `${day} ${month}`, isOverdue: false };
    }
  };

  const activeCount = clients.filter(c => c.is_enabled !== false).length;
  const blockedCount = clients.filter(c => c.is_enabled === false).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incinerador</Text>
          <Text style={styles.headerSubtitle}>Hola, {user?.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')} 
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={22} color={palette.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={22} color={palette.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={palette.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            placeholderTextColor={palette.mutedAlt}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={palette.primary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={palette.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, sortType === 'alphabetic' && styles.filterButtonActive]}
            onPress={() => setSortType('alphabetic')}
          >
            <Ionicons 
              name="text" 
              size={16} 
              color={sortType === 'alphabetic' ? palette.text : palette.muted} 
            />
            <Text style={[styles.filterText, sortType === 'alphabetic' && styles.filterTextActive]}>
              A-Z
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, sortType === 'review' && styles.filterButtonActive]}
            onPress={() => setSortType('review')}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={sortType === 'review' ? palette.text : palette.muted} 
            />
            <Text style={[styles.filterText, sortType === 'review' && styles.filterTextActive]}>
              Próx. revisión
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header con conteo */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="people" size={20} color={palette.primary} />
            <Text style={styles.sectionTitle}>Mis Clientes</Text>
          </View>
          <View style={styles.counters}>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{activeCount}</Text>
              <Ionicons name="checkmark-circle" size={14} color={palette.success} />
            </View>
            {blockedCount > 0 && (
              <View style={[styles.counterBadge, styles.counterBadgeBlocked]}>
                <Text style={styles.counterText}>{blockedCount}</Text>
                <Ionicons name="lock-closed" size={14} color={palette.muted} />
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={filteredAndSortedClients}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadClients}
              tintColor={palette.primary}
            />
          }
          renderItem={({ item }) => {
            const isBlocked = item.is_enabled === false;
            const reviewInfo = formatReviewDate(item.next_due_date);
            
            return (
              <TouchableOpacity
                style={[styles.clientCard, isBlocked && styles.clientCardBlocked]}
                onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.clientAvatar, isBlocked && styles.clientAvatarBlocked]}>
                  <Ionicons 
                    name={isBlocked ? "lock-closed" : "person"} 
                    size={22} 
                    color={isBlocked ? palette.muted : palette.primary} 
                  />
                </View>
                <View style={styles.clientInfo}>
                  <Text style={[styles.clientName, isBlocked && styles.clientNameBlocked]}>
                    {item.name}
                  </Text>
                  <Text style={styles.clientEmail}>{item.email}</Text>
                  {reviewInfo && !isBlocked && (
                    <View style={styles.reviewBadge}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={12} 
                        color={reviewInfo.isOverdue ? palette.danger : palette.primaryLight} 
                      />
                      <Text style={[
                        styles.reviewText,
                        reviewInfo.isOverdue && styles.reviewTextOverdue
                      ]}>
                        {reviewInfo.text}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.muted} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="person-add-outline" size={48} color={palette.muted} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </Text>
            </View>
          }
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  headerTitle: {
    ...typography.title,
    color: palette.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.textWarm,
    marginTop: 2,
    opacity: 0.7,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: palette.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: palette.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.primaryLight,
  },
  counters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  counterBadgeBlocked: {
    backgroundColor: palette.surfaceAlt,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.text,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  clientCardBlocked: {
    borderLeftColor: palette.muted,
    opacity: 0.7,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  clientAvatarBlocked: {
    backgroundColor: palette.surfaceAlt,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  clientNameBlocked: {
    color: palette.muted,
  },
  clientEmail: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reviewText: {
    fontSize: 12,
    color: palette.primaryLight,
  },
  reviewTextOverdue: {
    color: palette.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: palette.muted,
    marginTop: spacing.md,
  },
});
