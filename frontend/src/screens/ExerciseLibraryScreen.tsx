import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppIcon as Ionicons } from '../components/AppIcon';
import { palette, spacing, radius, typography } from '../theme';
import { exerciseLibraryService } from '../services/api';
import { ExerciseLibrary } from '../types';
import CustomAlert, { useCustomAlert } from '../components/CustomAlert';

const MUSCLE_GROUP_ICONS: { [key: string]: string } = {
  pecho: 'body-outline',
  espalda: 'fitness-outline',
  piernas: 'walk-outline',
  hombros: 'arrow-up-outline',
  biceps: 'barbell-outline',
  triceps: 'barbell-outline',
  abdomen: 'ellipse-outline',
  cardio: 'heart-outline',
};

const MUSCLE_GROUP_LABELS: { [key: string]: string } = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  piernas: 'Piernas',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdomen: 'Abdomen',
  cardio: 'Cardio',
};

const ALL_MUSCLE_GROUPS = ['pecho', 'espalda', 'piernas', 'hombros', 'biceps', 'triceps', 'abdomen', 'cardio'];

export default function ExerciseLibraryScreen({ navigation }: any) {
  const [exercises, setExercises] = useState<ExerciseLibrary[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibrary | null>(null);
  const [formName, setFormName] = useState('');
  const [formMuscleGroup, setFormMuscleGroup] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { alertState, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exercisesData, groupsData] = await Promise.all([
        exerciseLibraryService.getAll(),
        exerciseLibraryService.getMuscleGroups(),
      ]);
      setExercises(exercisesData);
      setMuscleGroups(groupsData);
    } catch (error) {
      console.error('Error loading exercises:', error);
      showError('Error', 'No se pudieron cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [exercisesData, groupsData] = await Promise.all([
        exerciseLibraryService.getAll(),
        exerciseLibraryService.getMuscleGroups(),
      ]);
      setExercises(exercisesData);
      setMuscleGroups(groupsData);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    if (selectedGroup) {
      filtered = filtered.filter(e => e.muscle_group === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [exercises, selectedGroup, searchQuery]);

  // Group exercises by muscle group for section display
  const groupedExercises = useMemo(() => {
    const groups: { title: string; data: ExerciseLibrary[] }[] = [];
    const map: { [key: string]: ExerciseLibrary[] } = {};

    filteredExercises.forEach(ex => {
      if (!map[ex.muscle_group]) map[ex.muscle_group] = [];
      map[ex.muscle_group].push(ex);
    });

    Object.keys(map)
      .sort()
      .forEach(group => {
        groups.push({
          title: group,
          data: map[group].sort((a, b) => a.name.localeCompare(b.name)),
        });
      });

    return groups;
  }, [filteredExercises]);

  const openCreateModal = () => {
    setEditingExercise(null);
    setFormName('');
    setFormMuscleGroup('');
    setFormDescription('');
    setModalVisible(true);
  };

  const openEditModal = (exercise: ExerciseLibrary) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormMuscleGroup(exercise.muscle_group);
    setFormDescription(exercise.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showError('Error', 'El nombre del ejercicio es obligatorio');
      return;
    }
    if (!formMuscleGroup) {
      showError('Error', 'Debes seleccionar un grupo muscular');
      return;
    }

    setSaving(true);
    try {
      if (editingExercise) {
        await exerciseLibraryService.update(editingExercise.id, {
          name: formName.trim(),
          muscle_group: formMuscleGroup,
          description: formDescription.trim(),
        });
        showSuccess('Actualizado', `"${formName.trim()}" se actualizó correctamente`);
      } else {
        await exerciseLibraryService.create({
          name: formName.trim(),
          muscle_group: formMuscleGroup,
          description: formDescription.trim(),
        });
        showSuccess('Creado', `"${formName.trim()}" se añadió a la biblioteca`);
      }
      setModalVisible(false);
      await loadData();
    } catch (error) {
      console.error('Error saving exercise:', error);
      showError('Error', 'No se pudo guardar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exercise: ExerciseLibrary) => {
    showConfirm(
      'Eliminar ejercicio',
      `¿Eliminar "${exercise.name}" de la biblioteca?\n\nSi está asignado a alguna rutina, también se eliminará de las rutinas.`,
      async () => {
        try {
          await exerciseLibraryService.delete(exercise.id);
          showSuccess('Eliminado', `"${exercise.name}" se eliminó de la biblioteca`);
          await loadData();
        } catch (error) {
          console.error('Error deleting exercise:', error);
          showError('Error', 'No se pudo eliminar el ejercicio');
        }
      }
    );
  };

  const renderExerciseItem = ({ item }: { item: ExerciseLibrary }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.exerciseIconContainer}>
        <Ionicons
          name={MUSCLE_GROUP_ICONS[item.muscle_group] || 'barbell-outline'}
          size={20}
          color={palette.primary}
        />
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.exerciseDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={palette.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons
          name={MUSCLE_GROUP_ICONS[title] || 'barbell-outline'}
          size={18}
          color={palette.primary}
        />
        <Text style={styles.sectionTitle}>
          {MUSCLE_GROUP_LABELS[title] || title}
        </Text>
      </View>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  );

  // Flatten grouped data with headers for FlatList
  const flatData = useMemo(() => {
    const result: Array<{ type: 'header'; title: string; count: number } | { type: 'exercise'; data: ExerciseLibrary }> = [];
    groupedExercises.forEach(group => {
      result.push({ type: 'header', title: group.title, count: group.data.length });
      group.data.forEach(ex => result.push({ type: 'exercise', data: ex }));
    });
    return result;
  }, [groupedExercises]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ejercicios</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={palette.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
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

      {/* Muscle group filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedGroup && styles.filterChipActive]}
          onPress={() => setSelectedGroup('')}
        >
          <Text style={[styles.filterChipText, !selectedGroup && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {ALL_MUSCLE_GROUPS.filter(g => muscleGroups.includes(g) || ALL_MUSCLE_GROUPS.includes(g)).map(group => (
          <TouchableOpacity
            key={group}
            style={[styles.filterChip, selectedGroup === group && styles.filterChipActive]}
            onPress={() => setSelectedGroup(selectedGroup === group ? '' : group)}
          >
            <Ionicons
              name={MUSCLE_GROUP_ICONS[group] || 'barbell-outline'}
              size={14}
              color={selectedGroup === group ? palette.text : palette.muted}
            />
            <Text style={[styles.filterChipText, selectedGroup === group && styles.filterChipTextActive]}>
              {MUSCLE_GROUP_LABELS[group] || group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? 's' : ''}
          {selectedGroup ? ` en ${MUSCLE_GROUP_LABELS[selectedGroup] || selectedGroup}` : ''}
        </Text>
      </View>

      {/* Exercise list */}
      <FlatList
        data={flatData}
        keyExtractor={(item, index) => (item.type === 'header' ? `header-${item.title}` : `exercise-${item.data.id}`)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title, item.count);
          }
          return renderExerciseItem({ item: item.data });
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={48} color={palette.muted} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedGroup ? 'No se encontraron ejercicios' : 'No hay ejercicios en la biblioteca'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>Crear ejercicio</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={palette.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Name input */}
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Press Banca Inclinado"
                placeholderTextColor={palette.mutedAlt}
                value={formName}
                onChangeText={setFormName}
                selectionColor={palette.primary}
                autoFocus={!editingExercise}
              />

              {/* Muscle group selector */}
              <Text style={styles.inputLabel}>Grupo muscular *</Text>
              <View style={styles.muscleGroupGrid}>
                {ALL_MUSCLE_GROUPS.map(group => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.muscleGroupOption,
                      formMuscleGroup === group && styles.muscleGroupOptionActive,
                    ]}
                    onPress={() => setFormMuscleGroup(group)}
                  >
                    <Ionicons
                      name={MUSCLE_GROUP_ICONS[group] || 'barbell-outline'}
                      size={18}
                      color={formMuscleGroup === group ? '#fff' : palette.muted}
                    />
                    <Text
                      style={[
                        styles.muscleGroupOptionText,
                        formMuscleGroup === group && styles.muscleGroupOptionTextActive,
                      ]}
                    >
                      {MUSCLE_GROUP_LABELS[group] || group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description input */}
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del ejercicio..."
                placeholderTextColor={palette.mutedAlt}
                value={formDescription}
                onChangeText={setFormDescription}
                selectionColor={palette.primary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name={editingExercise ? 'checkmark' : 'add'} size={18} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Guardando...' : editingExercise ? 'Guardar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.title,
    color: palette.text,
    fontSize: 24,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
  // Filter chips
  filterChipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: palette.text,
    fontWeight: '600',
  },
  // Stats
  statsBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  statsText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.primaryLight,
    textTransform: 'capitalize',
  },
  sectionBadge: {
    backgroundColor: palette.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primaryLight,
  },
  // Exercise card
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  exerciseDescription: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.primaryLight,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm + 2,
  },
  // Muscle group grid
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  muscleGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  muscleGroupOptionActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  muscleGroupOptionText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '500',
  },
  muscleGroupOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal actions
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.muted,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
