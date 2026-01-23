import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView } from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { paymentService, clientService } from '../services/api';
import { PaymentHistory, PaymentStats, Client } from '../types';
import { palette, spacing, radius } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';
import { Picker } from '@react-native-picker/picker';

export default function PaymentHistoryScreen({ navigation }: any) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [clients, setClients] = useState<Client[]>([]);
  
  const { alertState, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadClients();
    loadPayments();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientService.getClients();
      setClients(response.clients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadPayments = async (filters?: any) => {
    setLoading(true);
    try {
      const response = await paymentService.getPaymentHistory(filters);
      setPayments(response.payments);
      setTotalIncome(parseFloat(response.total));
    } catch (error) {
      showError('Error', 'No se pudieron cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filters: any = {};
    
    if (selectedUserId) {
      filters.userId = selectedUserId;
    }
    
    if (selectedMonth) {
      filters.month = selectedMonth;
      filters.year = selectedYear;
    } else if (selectedYear) {
      filters.year = selectedYear;
    }
    
    loadPayments(filters);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setSelectedUserId(undefined);
    setSelectedMonth(undefined);
    setSelectedYear(new Date().getFullYear());
    loadPayments();
    setFilterModalVisible(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
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

  const months = [
    { label: 'Todos los meses', value: undefined },
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const hasActiveFilters = selectedUserId || selectedMonth;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Pagos</Text>
        <TouchableOpacity 
          onPress={() => setFilterModalVisible(true)} 
          style={styles.filterButton}
        >
          <Ionicons 
            name={hasActiveFilters ? "funnel" : "funnel-outline"} 
            size={22} 
            color={hasActiveFilters ? palette.primary : palette.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Total Card */}
      <View style={styles.totalCard}>
        <View style={styles.totalIcon}>
          <Ionicons name="wallet" size={32} color={palette.primary} />
        </View>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total Ingresado</Text>
          <Text style={styles.totalAmount}>{totalIncome.toFixed(2)}€</Text>
          <Text style={styles.totalCount}>{payments.length} pago{payments.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Filters Info */}
      {hasActiveFilters && (
        <View style={styles.filtersInfo}>
          <Text style={styles.filtersText}>
            {selectedUserId && `Cliente: ${clients.find(c => c.id === selectedUserId)?.name}`}
            {selectedUserId && selectedMonth && ' • '}
            {selectedMonth && `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilters}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payments List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => loadPayments()}
            tintColor={palette.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentAvatar}>
                <Ionicons name="person" size={20} color={palette.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{item.user_name}</Text>
                <Text style={styles.paymentDate}>{formatDate(item.payment_date)}</Text>
              </View>
              <Text style={styles.paymentAmount}>{parseFloat(item.amount.toString()).toFixed(2)}€</Text>
            </View>
            <View style={styles.paymentDetails}>
              <View style={styles.paymentDetailRow}>
                <Ionicons name="calendar-outline" size={14} color={palette.muted} />
                <Text style={styles.paymentDetailText}>
                  Período: {formatPeriod(item.period_start, item.period_end)}
                </Text>
              </View>
              <View style={styles.paymentDetailRow}>
                <Ionicons name="repeat-outline" size={14} color={palette.muted} />
                <Text style={styles.paymentDetailText}>
                  {getFrequencyLabel(item.frequency)}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.paymentDetailRow}>
                  <Ionicons name="information-circle-outline" size={14} color={palette.muted} />
                  <Text style={styles.paymentDetailText}>{item.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={palette.muted} />
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No se encontraron pagos con estos filtros' : 'No hay pagos registrados'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Pagos</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filtro por Cliente */}
              <Text style={styles.filterLabel}>Cliente</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedUserId}
                  onValueChange={(value) => setSelectedUserId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Todos los clientes" value={undefined} />
                  {clients.map((client) => (
                    <Picker.Item 
                      key={client.id} 
                      label={client.name} 
                      value={client.id} 
                    />
                  ))}
                </Picker>
              </View>

              {/* Filtro por Mes */}
              <Text style={styles.filterLabel}>Mes</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={(value) => setSelectedMonth(value)}
                  style={styles.picker}
                >
                  {months.map((month) => (
                    <Picker.Item 
                      key={month.label} 
                      label={month.label} 
                      value={month.value} 
                    />
                  ))}
                </Picker>
              </View>

              {/* Filtro por Año */}
              <Text style={styles.filterLabel}>Año</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(value) => setSelectedYear(value)}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item 
                      key={year} 
                      label={year.toString()} 
                      value={year} 
                    />
                  ))}
                </Picker>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.md,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  filterButton: {
    padding: spacing.xs,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryMuted,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.primaryLight + '30',
  },
  totalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.text,
    marginTop: 2,
  },
  totalCount: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  filtersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filtersText: {
    fontSize: 13,
    color: palette.text,
    flex: 1,
  },
  clearFilters: {
    fontSize: 13,
    color: palette.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  paymentCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  paymentDate: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  paymentDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.xs,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentDetailText: {
    fontSize: 12,
    color: palette.muted,
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
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  modalBody: {
    padding: spacing.lg,
  },
  filterLabel: {
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
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  clearButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
  },
  clearButtonText: {
    color: palette.muted,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
