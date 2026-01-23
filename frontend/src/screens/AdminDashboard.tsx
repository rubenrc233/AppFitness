import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { clientService, paymentService } from '../services/api';
import { Client, ClientWithPaymentStatus } from '../types';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { palette, spacing, radius, typography } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

type SortType = 'alphabetic' | 'review' | 'payment';
type TabType = 'clients' | 'pending';

export default function AdminDashboard({ navigation }: any) {
  const [clients, setClients] = useState<ClientWithPaymentStatus[]>([]);
  const [pendingClients, setPendingClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('alphabetic');
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const { user, signOut } = useAuth();
  const { alertState, hideAlert, showError, showConfirm, showSuccess } = useCustomAlert();

  useEffect(() => {
    loadClients();
    loadPendingClients();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadClients();
      loadPendingClients();
    });
    return unsubscribe;
  }, [navigation]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getClientsPaymentStatus();
      setClients(data.clients);
    } catch (error: any) {
      showError('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingClients = async () => {
    try {
      const data = await clientService.getClients(true);
      setPendingClients(data.clients);
    } catch (error: any) {
      console.error('Error loading pending clients:', error);
    }
  };

  const handleApproveClient = (client: Client) => {
    showConfirm(
      'Aprobar Cliente',
      `¿Aprobar a ${client.name} como cliente?`,
      async () => {
        try {
          await clientService.approveClient(client.id);
          showSuccess('¡Aprobado!', `${client.name} ahora es un cliente activo`);
          loadClients();
          loadPendingClients();
        } catch (error) {
          showError('Error', 'No se pudo aprobar al cliente');
        }
      }
    );
  };

  const handleRejectClient = (client: Client) => {
    showConfirm(
      'Rechazar Solicitud',
      `¿Rechazar la solicitud de ${client.name}? Se eliminará su cuenta.`,
      async () => {
        try {
          await clientService.rejectClient(client.id);
          showSuccess('Rechazado', 'La solicitud ha sido rechazada');
          loadPendingClients();
        } catch (error) {
          showError('Error', 'No se pudo rechazar la solicitud');
        }
      }
    );
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
    const sortClients = (clientList: ClientWithPaymentStatus[]) => {
      if (sortType === 'alphabetic') {
        return [...clientList].sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      } else if (sortType === 'review') {
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
      } else {
        // Ordenar por próximo pago
        return [...clientList].sort((a, b) => {
          // Si no tiene configuración de pago, va al final
          if (!a.next_payment_date && !b.next_payment_date) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          }
          if (!a.next_payment_date) return 1;
          if (!b.next_payment_date) return -1;
          
          return new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime();
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

  const formatPaymentDate = (dateStr?: string, daysUntil?: number) => {
    if (!dateStr) return null;
    
    if (daysUntil === 0) {
      return { text: '💰 Pago hoy', isDue: true, isOverdue: false };
    } else if (daysUntil && daysUntil < 0) {
      return { text: `💰 Hace ${Math.abs(daysUntil)} días`, isDue: true, isOverdue: true };
    } else if (daysUntil === 1) {
      return { text: '💰 Mañana', isDue: false, isOverdue: false };
    } else if (daysUntil && daysUntil <= 7) {
      return { text: `💰 En ${daysUntil} días`, isDue: false, isOverdue: false };
    } else if (daysUntil && daysUntil <= 30) {
      return { text: `💰 ${daysUntil} días`, isDue: false, isOverdue: false };
    }
    
    return null;
  };

  const calculateDaysUntilPayment = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date(date);
    paymentDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Hace ${Math.abs(diffDays)} días`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Hoy', isOverdue: false, isDue: true };
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

  const handleRegisterPayment = (client: ClientWithPaymentStatus) => {
    showConfirm(
      'Registrar Pago',
      `¿Confirmar pago de ${client.amount?.toFixed(2)}€ de ${client.name}?`,
      async () => {
        try {
          await paymentService.registerPayment(client.id);
          showSuccess('¡Registrado!', 'El pago ha sido registrado correctamente');
          loadClients();
        } catch (error) {
          showError('Error', 'No se pudo registrar el pago');
        }
      }
    );
  };

  const activeCount = clients.filter(c => c.is_enabled !== false).length;
  const blockedCount = clients.filter(c => c.is_enabled === false).length;
  const pendingCount = pendingClients.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HypertrOffice</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'clients' && styles.tabActive]}
          onPress={() => setActiveTab('clients')}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === 'clients' ? palette.primary : palette.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'clients' && styles.tabTextActive]}>
            Clientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons 
            name="hourglass-outline" 
            size={18} 
            color={activeTab === 'pending' ? palette.primary : palette.muted} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendientes
          </Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'clients' ? (
          <>
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
          <TouchableOpacity
            style={[styles.filterButton, sortType === 'payment' && styles.filterButtonActive]}
            onPress={() => setSortType('payment')}
          >
            <Ionicons 
              name="wallet" 
              size={16} 
              color={sortType === 'payment' ? palette.text : palette.muted} 
            />
            <Text style={[styles.filterText, sortType === 'payment' && styles.filterTextActive]}>
              Próx. pago
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
            const paymentInfo = formatPaymentDate(item.next_payment_date, item.days_until_payment);
            const hasPaymentDue = item.payment_due && item.active;
            
            // Calcular si la revisión es en menos de 5 días
            const isReviewSoon = item.next_due_date && !isBlocked ? (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const reviewDate = new Date(item.next_due_date);
              reviewDate.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays < 5;
            })() : false;
            
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[
                      styles.clientName, 
                      isBlocked && styles.clientNameBlocked,
                      isReviewSoon && styles.clientNameUrgent
                    ]}>
                      {item.name || 'Sin nombre'}
                    </Text>
                    {hasPaymentDue && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRegisterPayment(item);
                        }}
                        style={styles.paymentDueButton}
                      >
                        <Ionicons name="cash" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.clientEmail}>{item.email || 'Sin email'}</Text>
                  {reviewInfo && !isBlocked && (
                    <View style={[
                      styles.reviewBadge,
                      isReviewSoon && styles.reviewBadgeUrgent
                    ]}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={12} 
                        color={reviewInfo.isOverdue ? palette.danger : isReviewSoon ? palette.warning : palette.primaryLight} 
                      />
                      <Text style={[
                        styles.reviewText,
                        reviewInfo.isOverdue && styles.reviewTextOverdue,
                        isReviewSoon && styles.reviewTextUrgent
                      ]}>
                        Revisión: {reviewInfo.text}
                      </Text>
                    </View>
                  )}
                  {(() => {
                    const daysUntilPayment = calculateDaysUntilPayment(item.next_payment_date);
                    if (!daysUntilPayment || isBlocked) return null;
                    return (
                      <View style={[
                        styles.paymentBadge,
                        daysUntilPayment.isDue && styles.paymentBadgeDue,
                        daysUntilPayment.isOverdue && styles.paymentBadgeOverdue
                      ]}>
                        <Ionicons 
                          name="wallet-outline" 
                          size={12} 
                          color={daysUntilPayment.isOverdue ? palette.danger : daysUntilPayment.isDue ? palette.success : palette.muted} 
                        />
                        <Text style={[
                          styles.paymentText,
                          daysUntilPayment.isDue && styles.paymentTextDue,
                          daysUntilPayment.isOverdue && styles.paymentTextOverdue
                        ]}>
                          Pago: {daysUntilPayment.text}
                        </Text>
                      </View>
                    );
                  })()}
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
        </>
        ) : (
          /* Tab de Pendientes */
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="hourglass-outline" size={20} color={palette.warning} />
                <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
              </View>
            </View>

            <FlatList
              data={pendingClients}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl 
                  refreshing={loading} 
                  onRefresh={() => { loadClients(); loadPendingClients(); }}
                  tintColor={palette.primary}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.pendingCard}>
                  <View style={styles.pendingCardHeader}>
                    <View style={styles.pendingAvatar}>
                      <Ionicons name="person-add" size={22} color={palette.warning} />
                    </View>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>{item.name}</Text>
                      <Text style={styles.pendingEmail}>{item.email}</Text>
                    </View>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity 
                      style={styles.rejectButton}
                      onPress={() => handleRejectClient(item)}
                    >
                      <Ionicons name="close" size={20} color={palette.danger} />
                      <Text style={styles.rejectText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleApproveClient(item)}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.approveText}>Aprobar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={palette.success} />
                  <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
                  <Text style={styles.emptySubtext}>Todas las solicitudes han sido procesadas</Text>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Menú Inferior */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity
          style={styles.bottomMenuItem}
          onPress={() => navigation.navigate('PaymentHistory')}
        >
          <Ionicons name="wallet" size={24} color={palette.text} />
          <Text style={styles.bottomMenuText}>Pagos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomMenuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={24} color={palette.text} />
          <Text style={styles.bottomMenuText}>Ajustes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomMenuItem}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={palette.danger} />
          <Text style={[styles.bottomMenuText, styles.bottomMenuTextDanger]}>Salir</Text>
        </TouchableOpacity>
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
    paddingTop: spacing.md,
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
  clientNameUrgent: {
    color: palette.warning,
    fontWeight: '700',
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
  reviewBadgeUrgent: {
    // Sin fondo para evitar el subrayado visual
  },
  reviewText: {
    fontSize: 12,
    color: palette.primaryLight,
  },
  reviewTextOverdue: {
    color: palette.danger,
  },
  reviewTextUrgent: {
    color: palette.warning,
    fontWeight: '600',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: palette.primaryMuted,
    alignSelf: 'flex-start',
    gap: 4,
  },
  paymentBadgeDue: {
    backgroundColor: '#FFF3CD',
  },
  paymentBadgeOverdue: {
    backgroundColor: '#F8D7DA',
  },
  paymentText: {
    fontSize: 11,
    color: palette.primary,
    fontWeight: '600',
  },
  paymentTextDue: {
    color: '#856404',
  },
  paymentTextOverdue: {
    color: palette.danger,
  },
  paymentDueButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
  emptySubtext: {
    fontSize: 13,
    color: palette.mutedAlt,
    marginTop: spacing.xs,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: palette.primaryMuted,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.muted,
  },
  tabTextActive: {
    color: palette.primary,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: palette.warning,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  // Pending cards
  pendingCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.warning,
    overflow: 'hidden',
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  pendingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.warningMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  pendingEmail: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    backgroundColor: palette.surfaceAlt,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.danger,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    backgroundColor: palette.success,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Menú Inferior
  bottomMenu: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  bottomMenuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  bottomMenuText: {
    fontSize: 11,
    color: palette.text,
    marginTop: 4,
    fontWeight: '500',
  },
  bottomMenuTextDanger: {
    color: palette.danger,
  },
});
