import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, TextInput } from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { paymentService } from '../services/api';
import { PaymentHistory } from '../types';
import { palette, spacing, radius } from '../theme';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

export default function PaymentHistoryScreen({ navigation }: any) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  
  // Filtros
  const [clientNameFilter, setClientNameFilter] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const { alertState, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadPayments();
  }, []);

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

  const clearFilters = () => {
    setClientNameFilter('');
    setSelectedMonth(undefined);
    setSelectedYear(new Date().getFullYear());
    loadPayments();
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

  const hasActiveFilters = clientNameFilter.trim() !== '' || selectedMonth;

  const getMonthLabel = () => {
    if (!selectedMonth) return 'Todos los meses';
    return months.find(m => m.value === selectedMonth)?.label || 'Todos los meses';
  };

  const handleMonthSelect = (value: number | undefined) => {
    setSelectedMonth(value);
    setMonthModalVisible(false);
    const filters: any = {};
    if (clientNameFilter.trim()) filters.userName = clientNameFilter.trim();
    if (value) {
      filters.month = value;
      filters.year = selectedYear;
    } else if (selectedYear) {
      filters.year = selectedYear;
    }
    loadPayments(filters);
  };

  const handleYearSelect = (value: number) => {
    setSelectedYear(value);
    setYearModalVisible(false);
    const filters: any = {};
    if (clientNameFilter.trim()) filters.userName = clientNameFilter.trim();
    if (selectedMonth) {
      filters.month = selectedMonth;
      filters.year = value;
    } else {
      filters.year = value;
    }
    loadPayments(filters);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Pagos</Text>
        <View style={{ width: 40 }} />
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

      {/* Filtros */}
      <View style={styles.filtersSection}>
        <Text style={styles.filtersSectionTitle}>Filtros</Text>
        
        {/* Filtro de Cliente - Línea Superior */}
        <View style={styles.filterItemFull}>
          <Text style={styles.filterItemLabel}>Cliente</Text>
          <View style={styles.filterInputWrapper}>
            <TextInput
              style={styles.filterInput}
              placeholder="Buscar por nombre..."
              placeholderTextColor={palette.muted}
              value={clientNameFilter}
              onChangeText={(text) => {
                setClientNameFilter(text);
                const filters: any = {};
                if (text.trim()) filters.userName = text.trim();
                if (selectedMonth) {
                  filters.month = selectedMonth;
                  filters.year = selectedYear;
                } else if (selectedYear) {
                  filters.year = selectedYear;
                }
                loadPayments(filters);
              }}
            />
            {clientNameFilter && (
              <TouchableOpacity
                onPress={() => {
                  setClientNameFilter('');
                  const filters: any = {};
                  if (selectedMonth) {
                    filters.month = selectedMonth;
                    filters.year = selectedYear;
                  } else if (selectedYear) {
                    filters.year = selectedYear;
                  }
                  loadPayments(filters);
                }}
                style={styles.clearIcon}
              >
                <Ionicons name="close-circle" size={16} color={palette.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Filtros de Mes y Año - Línea Inferior */}
        <View style={styles.filtersRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterItemLabel}>Mes</Text>
            <TouchableOpacity 
              style={styles.customPickerButton}
              onPress={() => setMonthModalVisible(true)}
            >
              <Text style={styles.customPickerText}>{getMonthLabel()}</Text>
              <Ionicons name="chevron-down" size={16} color={palette.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterItemLabel}>Año</Text>
            <TouchableOpacity 
              style={styles.customPickerButton}
              onPress={() => setYearModalVisible(true)}
            >
              <Text style={styles.customPickerText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={16} color={palette.muted} />
            </TouchableOpacity>
          </View>
        </View>
        
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
            <Ionicons name="close-circle" size={16} color={palette.primary} />
            <Text style={styles.clearFiltersText}>Limpiar Filtros</Text>
          </TouchableOpacity>
        )}
      </View>

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

      {/* Month Modal */}
      <Modal
        visible={monthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthModalVisible(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Seleccionar Mes</Text>
              <TouchableOpacity onPress={() => setMonthModalVisible(false)}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.label}
                  style={[
                    styles.pickerModalItem,
                    selectedMonth === month.value && styles.pickerModalItemSelected
                  ]}
                  onPress={() => handleMonthSelect(month.value)}
                >
                  <Text style={[
                    styles.pickerModalItemText,
                    selectedMonth === month.value && styles.pickerModalItemTextSelected
                  ]}>
                    {month.label}
                  </Text>
                  {selectedMonth === month.value && (
                    <Ionicons name="checkmark" size={20} color={palette.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Modal */}
      <Modal
        visible={yearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setYearModalVisible(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Seleccionar Año</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}>
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerModalItem,
                    selectedYear === year && styles.pickerModalItemSelected
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text style={[
                    styles.pickerModalItemText,
                    selectedYear === year && styles.pickerModalItemTextSelected
                  ]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <Ionicons name="checkmark" size={20} color={palette.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  // Filtros
  filtersSection: {
    backgroundColor: palette.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filtersSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterItem: {
    flex: 1,
  },
  filterItemFull: {
    marginBottom: spacing.sm,
  },
  filterItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: 4,
  },
  filterInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.sm,
    height: 40,
  },
  filterInput: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearIcon: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  customPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.sm,
    height: 40,
  },
  customPickerText: {
    color: palette.text,
    fontSize: 14,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  clearFiltersText: {
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
  // Custom Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  pickerModalList: {
    maxHeight: 400,
  },
  pickerModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  pickerModalItemSelected: {
    backgroundColor: palette.primaryMuted,
  },
  pickerModalItemText: {
    fontSize: 16,
    color: palette.text,
  },
  pickerModalItemTextSelected: {
    color: palette.primary,
    fontWeight: '600',
  },
});
