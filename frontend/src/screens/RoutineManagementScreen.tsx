import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { AppIcon as Ionicons } from '../components/AppIcon';
import LoadingScreen from '../components/LoadingScreen';
import { palette, spacing, radius, typography } from '../theme';
import { routineService } from '../services/api';
import { Routine, RoutineDay, ExerciseLibrary, DayExercise } from '../types';
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

export default function RoutineManagementScreen({ route, navigation }: Props) {
  const { clientId, clientName } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibrary[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [dayExercisesMap, setDayExercisesMap] = useState<{ [key: number]: DayExercise[] }>({});
  const [needsSave, setNeedsSave] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom alert hook
  const { alertState, hideAlert, showSuccess, showError, showConfirm, showWarning } = useCustomAlert();

  // Modals
  const [wizardVisible, setWizardVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editRoutineModalVisible, setEditRoutineModalVisible] = useState(false);
  const [viewDayModalVisible, setViewDayModalVisible] = useState(false);
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [createExerciseModalVisible, setCreateExerciseModalVisible] = useState(false);

  // Días de la semana
  const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Wizard states
  const [wizardRoutineName, setWizardRoutineName] = useState('');
  const [wizardSelectedWeekdays, setWizardSelectedWeekdays] = useState<number[]>([]);
  const [wizardDayNames, setWizardDayNames] = useState<string[]>([]);
  const [wizardDayExercises, setWizardDayExercises] = useState<{ [key: number]: any[] }>({});
  const [wizardCurrentDay, setWizardCurrentDay] = useState(0);
  const [wizardSelectedExercise, setWizardSelectedExercise] = useState<ExerciseLibrary | null>(null);
  const [wizardExerciseSets, setWizardExerciseSets] = useState('3');
  const [wizardExerciseReps, setWizardExerciseReps] = useState('12');
  const [wizardExerciseNotes, setWizardExerciseNotes] = useState('');

  // Edit routine states
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editTotalDays, setEditTotalDays] = useState(5);

  // Selected day states
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [selectedDayWeekday, setSelectedDayWeekday] = useState<number>(0);
  const [dayExercises, setDayExercises] = useState<DayExercise[]>([]);
  const [dayNotes, setDayNotes] = useState('');
  const [dayTitle, setDayTitle] = useState('');
  const [dayModalDirty, setDayModalDirty] = useState(false);
  const [dayModalSaving, setDayModalSaving] = useState(false);

  // Edit exercise modal states
  const [editingExercise, setEditingExercise] = useState<DayExercise | null>(null);
  const [editExerciseModalVisible, setEditExerciseModalVisible] = useState(false);
  const [editExerciseSets, setEditExerciseSets] = useState('3');
  const [editExerciseReps, setEditExerciseReps] = useState('12');
  const [editExerciseNotes, setEditExerciseNotes] = useState('');

  // Add exercise states
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibrary | null>(null);
  const [exerciseSets, setExerciseSets] = useState('3');
  const [exerciseReps, setExerciseReps] = useState('12');
  const [exerciseNotes, setExerciseNotes] = useState('');

  // Custom exercise states
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseMuscleGroup, setCustomExerciseMuscleGroup] = useState('');
  const [customExerciseDescription, setCustomExerciseDescription] = useState('');

  useEffect(() => {
    loadRoutine();
    loadMuscleGroups();
  }, []);

  const loadRoutine = async () => {
    setLoading(true);
    try {
      const data = await routineService.getRoutine(clientId);
      setRoutine(data);

      if (data && data.days) {
        const exercisesMap: { [key: number]: DayExercise[] } = {};
        // Cargar todos los ejercicios en paralelo
        await Promise.all(
          data.days.map(async (day: RoutineDay) => {
            try {
              const exercises = await routineService.getDayExercises(day.id);
              exercisesMap[day.id] = exercises;
            } catch (error) {
              console.error(`Error loading exercises for day ${day.id}:`, error);
              exercisesMap[day.id] = [];
            }
          })
        );
        setDayExercisesMap(exercisesMap);
      }
    } catch (error) {
      console.error('Error loading routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMuscleGroups = async () => {
    try {
      const groups = await routineService.getMuscleGroups();
      setMuscleGroups(groups);
    } catch (error) {
      console.error('Error loading muscle groups:', error);
    }
  };

  const loadExerciseLibrary = async (muscleGroup?: string) => {
    try {
      const exercises = await routineService.getExerciseLibrary(muscleGroup);
      setExerciseLibrary(exercises);
    } catch (error) {
      console.error('Error loading exercise library:', error);
    }
  };

  const loadDayExercises = async (dayId: number) => {
    try {
      const exercises = await routineService.getDayExercises(dayId);
      setDayExercises(exercises);
      setDayExercisesMap((prev) => ({
        ...prev,
        [dayId]: exercises,
      }));
    } catch (error) {
      console.error('Error loading day exercises:', error);
    }
  };

  const openWizard = () => {
    setWizardVisible(true);
    setWizardStep(1);
    setWizardRoutineName('');
    setWizardSelectedWeekdays([]);
    setWizardDayNames([]);
    setWizardDayExercises({});
    setWizardCurrentDay(0);
    loadMuscleGroups();
  };

  const closeWizard = () => {
    showConfirm(
      'Cancelar creación',
      '¿Deseas cancelar? Se perderán todos los cambios.',
      () => {
        hideAlert();
        setWizardVisible(false);
        setWizardStep(1);
        setWizardRoutineName('');
        setWizardSelectedWeekdays([]);
        setWizardDayNames([]);
        setWizardDayExercises({});
        setWizardCurrentDay(0);
      },
      () => {
        hideAlert();
      }
    );
  };

  const handleWizardNext = () => {
    if (wizardStep === 1) {
      if (!wizardRoutineName.trim()) {
        showError('Error', 'El nombre de la rutina es requerido');
        return;
      }
      if (wizardSelectedWeekdays.length === 0) {
        showError('Error', 'Debes seleccionar al menos un día de la semana');
        return;
      }
      // Ordenar días seleccionados
      const sortedWeekdays = [...wizardSelectedWeekdays].sort((a, b) => a - b);
      setWizardSelectedWeekdays(sortedWeekdays);
      // Inicializar nombres de días con el nombre del día de la semana
      setWizardDayNames(sortedWeekdays.map(d => WEEKDAYS[d]));
      // Inicializar ejercicios vacíos para cada día
      const emptyExercises: { [key: number]: any[] } = {};
      for (let i = 0; i < sortedWeekdays.length; i++) {
        emptyExercises[i] = [];
      }
      setWizardDayExercises(emptyExercises);
      setWizardStep(2);
    } else if (wizardStep === 2) {
      const emptyNames = wizardDayNames.filter((name) => !name.trim());
      if (emptyNames.length > 0) {
        showError('Error', 'Todos los días deben tener un nombre');
        return;
      }
      setWizardCurrentDay(0);
      loadExerciseLibrary();
      setWizardStep(3);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleWizardAddExercise = () => {
    if (!wizardSelectedExercise) {
      showWarning('Selección requerida', 'Debes seleccionar un ejercicio');
      return;
    }

    const newExercise = {
      exercise: wizardSelectedExercise,
      sets: parseInt(wizardExerciseSets) || 3,
      reps: wizardExerciseReps,
      notes: wizardExerciseNotes,
    };

    setWizardDayExercises({
      ...wizardDayExercises,
      [wizardCurrentDay]: [...(wizardDayExercises[wizardCurrentDay] || []), newExercise],
    });

    // Reset exercise selection
    setWizardSelectedExercise(null);
    setWizardExerciseSets('3');
    setWizardExerciseReps('12');
    setWizardExerciseNotes('');
  };

  const handleWizardRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    const updatedExercises = [...wizardDayExercises[dayIndex]];
    updatedExercises.splice(exerciseIndex, 1);
    setWizardDayExercises({
      ...wizardDayExercises,
      [dayIndex]: updatedExercises,
    });
  };

  const handleWizardFinish = async () => {
    // Validar que todos los días tengan al menos un ejercicio
    const daysWithoutExercises: string[] = [];
    for (let i = 0; i < wizardSelectedWeekdays.length; i++) {
      if (!wizardDayExercises[i] || wizardDayExercises[i].length === 0) {
        daysWithoutExercises.push(WEEKDAYS[wizardSelectedWeekdays[i]]);
      }
    }

    if (daysWithoutExercises.length > 0) {
      showError(
        'Rutina incompleta',
        `Los siguientes días no tienen ejercicios: ${daysWithoutExercises.join(', ')}. Todos los días deben tener al menos un ejercicio.`
      );
      return;
    }

    try {
      // Crear rutina
      const newRoutine = await routineService.createRoutine(clientId, {
        name: wizardRoutineName,
        totalDays: wizardSelectedWeekdays.length,
      });

      // Obtener rutina creada con días
      const createdRoutine = await routineService.getRoutine(clientId);

      if (createdRoutine && createdRoutine.days) {
        // Actualizar nombres de días, weekday y agregar ejercicios
        for (let i = 0; i < createdRoutine.days.length; i++) {
          const day = createdRoutine.days[i];
          const weekday = wizardSelectedWeekdays[i];
          
          // Actualizar nombre del día y weekday
          await routineService.updateDay(day.id, {
            name: day.name,
            custom_name: wizardDayNames[i].trim(),
            notes: undefined,
            weekday: weekday,
          });

          // Agregar ejercicios al día
          const exercises = wizardDayExercises[i] || [];
          for (let j = 0; j < exercises.length; j++) {
            const ex = exercises[j];
            await routineService.addExerciseToDay(day.id, {
              exerciseId: ex.exercise.id,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes,
              orderIndex: j,
            });
          }
        }
      }

      showSuccess('¡Éxito!', 'Rutina creada correctamente');
      setWizardVisible(false);
      setWizardStep(1);
      await loadRoutine();
    } catch (error) {
      console.error('Error creating routine:', error);
      showError('Error', 'No se pudo crear la rutina');
    }
  };

  const openDayDetails = (day: RoutineDay) => {
    setSelectedDay(day);
    setSelectedDayWeekday(day.weekday ?? 0);
    setDayNotes(day.notes || '');
    setDayTitle(day.custom_name || day.name || '');
    setDayModalDirty(false);
    loadDayExercises(day.id);
    loadMuscleGroups();
    loadExerciseLibrary();
    setSelectedExercise(null);
    setExerciseSets('3');
    setExerciseReps('12');
    setExerciseNotes('');
    setViewDayModalVisible(true);
  };

  const handleUpdateDay = async (overrides?: { weekday?: number; notes?: string; title?: string }) => {
    if (!selectedDay) return false;

    const nextWeekday = overrides?.weekday ?? selectedDayWeekday;
    const nextNotes = overrides?.notes ?? dayNotes;
    const nextTitle = overrides?.title ?? dayTitle;
    const currentWeekday = selectedDay.weekday ?? 0;
    const currentNotes = selectedDay.notes || '';
    const currentTitle = selectedDay.custom_name || selectedDay.name || '';

    // Evitar llamadas innecesarias
    if (nextWeekday === currentWeekday && nextNotes === currentNotes && nextTitle === currentTitle) {
      return true;
    }

    try {
      await routineService.updateDay(selectedDay.id, {
        name: selectedDay.name,
        custom_name: nextTitle,
        notes: nextNotes,
        weekday: nextWeekday,
      });

      // Mantener el state consistente aunque el setState sea async
      setSelectedDayWeekday(nextWeekday);
      setDayNotes(nextNotes);

      const updatedDay = { ...selectedDay, notes: nextNotes, weekday: nextWeekday };
      setSelectedDay(updatedDay);

      if (routine && routine.days) {
        const updatedDays = routine.days.map((d) =>
          d.id === selectedDay.id ? updatedDay : d
        );
        setRoutine({ ...routine, days: updatedDays });
      }

      setNeedsSave(true);
      return true;
    } catch (error) {
      console.error('Error updating day:', error);
      showError('Error', 'No se pudo actualizar el día');
      return false;
    }
  };

  const closeDayModal = async () => {
    if (!dayModalDirty) {
      setViewDayModalVisible(false);
      return;
    }

    showConfirm(
      'Guardar cambios',
      'Tienes cambios sin guardar. ¿Quieres guardarlos antes de salir?',
      async () => {
        hideAlert();
        await saveDayModal();
      },
      () => {
        hideAlert();
        setDayModalDirty(false);
        setViewDayModalVisible(false);
      },
      'Guardar',
      'Salir sin guardar'
    );
  };

  const saveDayModal = async () => {
    if (dayModalSaving) return;
    setDayModalSaving(true);
    try {
      const ok = await handleUpdateDay();
      if (ok) {
        // Refrescar por si el título/listado depende de weekday
        await loadRoutine();
        setDayModalDirty(false);
        setViewDayModalVisible(false);
      }
    } finally {
      setDayModalSaving(false);
    }
  };

  const openAddExerciseModal = () => {
    setViewDayModalVisible(false);
    loadExerciseLibrary();
    setAddExerciseModalVisible(true);
  };

  const handleAddExercise = async (exercise: ExerciseLibrary) => {
    if (!selectedDay) return;

    try {
      // Agregar ejercicio con valores por defecto al inicio (order_index 0)
      await routineService.addExerciseToDay(selectedDay.id, {
        exerciseId: exercise.id,
        sets: 3,
        reps: '12',
        notes: '',
        orderIndex: 0,
      });

      setNeedsSave(true);
      setDayModalDirty(true);
      await loadDayExercises(selectedDay.id);
    } catch (error) {
      console.error('Error adding exercise:', error);
      showError('Error', 'No se pudo agregar el ejercicio');
    }
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    try {
      await routineService.deleteDayExercise(exerciseId);
      if (selectedDay) {
        setNeedsSave(true);
        setDayModalDirty(true);
        loadDayExercises(selectedDay.id);
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      showError('Error', 'No se pudo eliminar el ejercicio');
    }
  };

  const openEditExerciseModal = (exercise: DayExercise) => {
    setEditingExercise(exercise);
    setEditExerciseSets(String(exercise.sets));
    setEditExerciseReps(String(exercise.reps));
    setEditExerciseNotes(exercise.notes || '');
    setEditExerciseModalVisible(true);
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;

    try {
      await routineService.updateDayExercise(editingExercise.id, {
        sets: parseInt(editExerciseSets) || 3,
        reps: editExerciseReps,
        notes: editExerciseNotes,
      });

      setEditExerciseModalVisible(false);
      setEditingExercise(null);
      setNeedsSave(true);
      setDayModalDirty(true);
      if (selectedDay) {
        loadDayExercises(selectedDay.id);
      }
      showSuccess('Éxito', 'Ejercicio actualizado');
    } catch (error) {
      console.error('Error updating exercise:', error);
      showError('Error', 'No se pudo actualizar el ejercicio');
    }
  };

  const handleMoveExercise = async (exerciseId: number, direction: 'up' | 'down') => {
    if (!selectedDay) return;

    const currentIndex = dayExercises.findIndex((ex) => ex.id === exerciseId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= dayExercises.length) return;

    // Crear nueva lista con el orden cambiado
    const newExercises = [...dayExercises];
    [newExercises[currentIndex], newExercises[newIndex]] = [newExercises[newIndex], newExercises[currentIndex]];

    setDayExercises(newExercises);
    setDayModalDirty(true);
    setNeedsSave(true);

    try {
      await routineService.reorderDayExercises(
        selectedDay.id,
        newExercises.map((ex) => ex.id)
      );
    } catch (error) {
      console.error('Error reordering exercises:', error);
      showError('Error', 'No se pudo cambiar el orden');
      loadDayExercises(selectedDay.id);
    }
  };

  const handleCreateCustomExercise = async () => {
    if (!customExerciseName.trim() || !customExerciseMuscleGroup.trim()) {
      showError('Error', 'Nombre y grupo muscular son requeridos');
      return;
    }

    try {
      await routineService.createCustomExercise({
        name: customExerciseName,
        muscle_group: customExerciseMuscleGroup,
        description: customExerciseDescription,
      });

      showSuccess('Éxito', 'Ejercicio personalizado creado');
      setCreateExerciseModalVisible(false);
      setCustomExerciseName('');
      setCustomExerciseMuscleGroup('');
      setCustomExerciseDescription('');
      loadExerciseLibrary(selectedMuscleGroup);
      
      // Volver al modal de editar día si hay uno seleccionado
      if (selectedDay) {
        setViewDayModalVisible(true);
      }
    } catch (error) {
      console.error('Error creating custom exercise:', error);
      showError('Error', 'No se pudo crear el ejercicio');
    }
  };

  const openEditRoutineModal = () => {
    if (!routine) return;
    setEditRoutineName(routine.name);
    setEditTotalDays(routine.days?.length || 5);
    setEditRoutineModalVisible(true);
  };

  const handleEditRoutine = async () => {
    if (!routine || !editRoutineName.trim()) {
      showError('Error', 'El nombre de la rutina es requerido');
      return;
    }

    if (editTotalDays < 1 || editTotalDays > 7) {
      showError('Error', 'Los días deben estar entre 1 y 7');
      return;
    }

    try {
      if (editTotalDays !== routine.days?.length) {
        await routineService.deleteRoutine(routine.id);
        await routineService.createRoutine(clientId, {
          name: editRoutineName,
          totalDays: editTotalDays,
        });
        showSuccess('Éxito', 'Rutina actualizada (días recreados)');
      } else {
        await routineService.updateRoutine(routine.id, {
          name: editRoutineName,
        });
        showSuccess('Éxito', 'Rutina actualizada');
      }

      setEditRoutineModalVisible(false);
      loadRoutine();
    } catch (error) {
      console.error('Error updating routine:', error);
      showError('Error', 'No se pudo actualizar la rutina');
    }
  };

  const handleDeleteRoutine = async () => {
    if (!routine) return;

    showConfirm(
      'Confirmar eliminación',
      '¿Eliminar toda la rutina? Esta acción no se puede deshacer.',
      async () => {
        try {
          await routineService.deleteRoutine(routine.id);
          setRoutine(null);
          setDayExercisesMap({});
          showSuccess('Éxito', 'Rutina eliminada');
        } catch (error) {
          console.error('Error deleting routine:', error);
          showError('Error', 'No se pudo eliminar la rutina');
        }
      }
    );
  };

  const filterExercisesByMuscleGroup = (muscleGroup: string) => {
    setSelectedMuscleGroup(muscleGroup);
    loadExerciseLibrary(muscleGroup);
  };

  const handleSaveRoutine = () => {
    if (!routine || !routine.days) return;

    const daysWithoutExercises: number[] = [];
    routine.days.forEach((day) => {
      const exercises = dayExercisesMap[day.id] || [];
      if (exercises.length === 0) {
        daysWithoutExercises.push(day.day_number);
      }
    });

    if (daysWithoutExercises.length > 0) {
      showError(
        'Rutina incompleta',
        `Los siguientes días no tienen ejercicios: ${daysWithoutExercises.join(', ')}. Todos los días deben tener al menos un ejercicio.`
      );
      return;
    }

    setNeedsSave(false);
    showSuccess('Éxito', 'Rutina guardada correctamente');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutina de {clientName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <LoadingScreen message="Cargando rutina..." />
      ) : (
        <ScrollView style={styles.content}>
        {!routine ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={80} color={palette.primary} />
            <Text style={styles.emptyText}>Este cliente no tiene rutina</Text>
            <Text style={styles.emptySubtext}>Crea una rutina personalizada para comenzar</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={openWizard}
            >
              <Ionicons name="add-circle-outline" size={24} color={palette.text} />
              <Text style={styles.createButtonText}>Crear Rutina</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.routineHeader}>
              <View>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                <Text style={styles.routineSubtitle}>{routine.days?.length || 0} días</Text>
              </View>

              <View style={styles.routineActions}>
                <TouchableOpacity style={styles.actionButton} onPress={openEditRoutineModal}>
                  <Ionicons name="create-outline" size={18} color={palette.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleDeleteRoutine}>
                  <Ionicons name="trash-outline" size={18} color={palette.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {routine.days?.map((day, index) => {
              const exercises = dayExercisesMap[day.id] || [];
              return (
                <TouchableOpacity
                  key={day.id}
                  onPress={() => openDayDetails(day)}
                  style={styles.dayCard}
                >
                  <View style={styles.dayCardContent}>
                    <View style={styles.dayNumber}>
                      <Text style={styles.dayNumberText}>
                        {day.weekday !== undefined && day.weekday !== null 
                          ? WEEKDAYS[day.weekday].substring(0, 3) 
                          : day.day_number}
                      </Text>
                    </View>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayWeekdayLabel}>
                        {day.weekday !== undefined && day.weekday !== null ? WEEKDAYS[day.weekday] : `Día ${day.day_number}`}
                      </Text>
                      <Text style={styles.dayName}>{day.custom_name || day.name}</Text>
                      {day.notes && <Text style={styles.dayNotes}>{day.notes}</Text>}

                      {exercises.length > 0 && (
                        <View style={styles.exercisesPreview}>
                          {exercises.map((ex, idx) => (
                            <Text key={ex.id} style={styles.exercisePreviewText}>
                              {idx + 1}. {ex.exercise_name} - {ex.sets}x{ex.reps}
                            </Text>
                          ))}
                        </View>
                      )}
                      {exercises.length === 0 && (
                        <Text style={styles.noExercisesPreview}>Sin ejercicios</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={palette.muted} />
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.saveRoutineButton, !needsSave && styles.saveRoutineButtonDisabled]}
              onPress={handleSaveRoutine}
              disabled={!needsSave}
            >
              <Ionicons name="checkmark-circle" size={20} color={palette.text} />
              <Text style={styles.saveRoutineButtonText}>
                {needsSave ? 'Guardar Rutina' : 'Rutina Guardada'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      )}

      {/* Wizard: Crear Rutina */}
      <Modal visible={wizardVisible} animationType="slide" transparent={false}>
        <View style={styles.wizardContainer}>
          {/* Header */}
          <View style={styles.wizardHeader}>
            <TouchableOpacity onPress={closeWizard} style={styles.wizardCloseButton}>
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>
            <Text style={styles.wizardHeaderTitle}>Nueva Rutina</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.wizardProgress}>
            <View style={styles.wizardProgressBar}>
              <View style={[styles.wizardProgressFill, { width: `${(wizardStep / 3) * 100}%` }]} />
            </View>
            <Text style={styles.wizardProgressText}>
              Paso {wizardStep} de 3
            </Text>
          </View>

          {/* Step Content */}
          <ScrollView 
            style={styles.wizardContent} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {wizardStep === 1 && (
              <View style={styles.wizardStepContainer}>
                <View style={styles.wizardStepHeader}>
                  <View style={styles.wizardStepIcon}>
                    <Ionicons name="fitness" size={32} color={palette.primary} />
                  </View>
                  <Text style={styles.wizardStepTitle}>Información Básica</Text>
                  <Text style={styles.wizardStepSubtitle}>
                    Comienza definiendo el nombre y los días de tu rutina
                  </Text>
                </View>

                <View style={styles.wizardInputGroup}>
                  <Text style={styles.wizardInputLabel}>NOMBRE DE LA RUTINA</Text>
                  <View style={styles.wizardInputWrapper}>
                    <Ionicons name="document-text-outline" size={20} color={palette.muted} style={styles.wizardInputIcon} />
                    <TextInput
                      style={styles.wizardInput}
                      placeholder="Ej: Hipertrofia Avanzada"
                      placeholderTextColor={palette.mutedAlt}
                      value={wizardRoutineName}
                      onChangeText={setWizardRoutineName}
                    />
                  </View>
                </View>

                <View style={styles.wizardInputGroup}>
                  <Text style={styles.wizardInputLabel}>DÍAS DE ENTRENAMIENTO</Text>
                  <Text style={styles.wizardDaysHintTop}>
                    Selecciona los días de la semana que entrenará
                  </Text>
                  <View style={styles.wizardWeekdaysSelector}>
                    {WEEKDAYS.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.wizardWeekdayButton,
                          wizardSelectedWeekdays.includes(index) && styles.wizardWeekdayButtonActive,
                        ]}
                        onPress={() => {
                          if (wizardSelectedWeekdays.includes(index)) {
                            setWizardSelectedWeekdays(wizardSelectedWeekdays.filter(d => d !== index));
                          } else {
                            setWizardSelectedWeekdays([...wizardSelectedWeekdays, index].sort((a, b) => a - b));
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.wizardWeekdayButtonText,
                            wizardSelectedWeekdays.includes(index) && styles.wizardWeekdayButtonTextActive,
                          ]}
                        >
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.wizardDaysHint}>
                    {wizardSelectedWeekdays.length} {wizardSelectedWeekdays.length === 1 ? 'día' : 'días'} seleccionado{wizardSelectedWeekdays.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}

            {wizardStep === 2 && (
              <View style={styles.wizardStepContainer}>
                <View style={styles.wizardStepHeader}>
                  <View style={styles.wizardStepIcon}>
                    <Ionicons name="calendar" size={32} color={palette.primary} />
                  </View>
                  <Text style={styles.wizardStepTitle}>Nombrar Días</Text>
                  <Text style={styles.wizardStepSubtitle}>
                    Asigna un nombre descriptivo a cada día de entrenamiento
                  </Text>
                </View>

                {wizardDayNames.map((name, index) => (
                  <View key={index} style={styles.wizardDayNameItem}>
                    <View style={styles.wizardDayNameNumber}>
                      <Text style={styles.wizardDayNameNumberText}>{WEEKDAYS[wizardSelectedWeekdays[index]].substring(0, 3)}</Text>
                    </View>
                    <View style={styles.wizardDayNameInputWrapper}>
                      <TextInput
                        style={styles.wizardDayNameInput}
                        placeholder={`Ej: Pecho y Tríceps`}
                        placeholderTextColor={palette.mutedAlt}
                        value={name}
                        onChangeText={(text) => {
                          const newNames = [...wizardDayNames];
                          newNames[index] = text;
                          setWizardDayNames(newNames);
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {wizardStep === 3 && (
              <View style={styles.wizardStepContainer}>
                <View style={styles.wizardStepHeader}>
                  <View style={styles.wizardStepIcon}>
                    <Ionicons name="barbell" size={32} color={palette.primary} />
                  </View>
                  <Text style={styles.wizardStepTitle}>Configurar Ejercicios</Text>
                  <Text style={styles.wizardStepSubtitle}>
                    Añade ejercicios a cada día de entrenamiento
                  </Text>
                </View>

                {/* Day Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.wizardDayTabs}
                  contentContainerStyle={styles.wizardDayTabsContent}
                >
                  {wizardDayNames.map((name, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.wizardDayTab,
                        wizardCurrentDay === index && styles.wizardDayTabActive,
                      ]}
                      onPress={() => setWizardCurrentDay(index)}
                    >
                      <Text
                        style={[
                          styles.wizardDayTabNumber,
                          wizardCurrentDay === index && styles.wizardDayTabNumberActive,
                        ]}
                      >
                        {WEEKDAYS[wizardSelectedWeekdays[index]].substring(0, 3)}
                      </Text>
                      <Text
                        style={[
                          styles.wizardDayTabText,
                          wizardCurrentDay === index && styles.wizardDayTabTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {name || WEEKDAYS[wizardSelectedWeekdays[index]]}
                      </Text>
                      {wizardDayExercises[index] && wizardDayExercises[index].length > 0 && (
                        <View style={styles.wizardDayTabBadge}>
                          <Text style={styles.wizardDayTabBadgeText}>
                            {wizardDayExercises[index].length}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Current Day Exercises */}
                <View style={styles.wizardDayExercisesContainer}>
                  <Text style={styles.wizardDayExercisesTitle}>
                    {wizardDayNames[wizardCurrentDay]} - Ejercicios
                  </Text>

                  {wizardDayExercises[wizardCurrentDay] &&
                  wizardDayExercises[wizardCurrentDay].length > 0 ? (
                    <View style={styles.wizardExercisesList}>
                      {wizardDayExercises[wizardCurrentDay].map((ex, idx) => (
                        <View key={idx} style={styles.wizardExerciseItem}>
                          <Text style={styles.wizardExerciseNumber}>{idx + 1}</Text>
                          <View style={styles.wizardExerciseInfo}>
                            <Text style={styles.wizardExerciseName}>{ex.exercise.name}</Text>
                            <Text style={styles.wizardExerciseDetails}>
                              {ex.sets} × {ex.reps}
                            </Text>
                            {ex.notes && (
                              <Text style={styles.wizardExerciseNotes}>{ex.notes}</Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleWizardRemoveExercise(wizardCurrentDay, idx)}
                            style={styles.wizardExerciseDelete}
                          >
                            <Ionicons name="trash-outline" size={18} color={palette.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.wizardEmptyExercises}>
                      <Ionicons name="barbell-outline" size={48} color={palette.muted} />
                      <Text style={styles.wizardEmptyExercisesText}>
                        No hay ejercicios en este día
                      </Text>
                    </View>
                  )}

                  {/* Add Exercise Section */}
                  <View style={styles.wizardAddExerciseSection}>
                    <View style={styles.wizardAddExerciseHeader}>
                      <Text style={styles.wizardAddExerciseTitle}>Agregar Ejercicio</Text>
                      <TouchableOpacity
                        style={styles.wizardCreateCustomButton}
                        onPress={() => setCreateExerciseModalVisible(true)}
                      >
                        <Ionicons name="add-circle" size={16} color={palette.primary} />
                        <Text style={styles.wizardCreateCustomButtonText}>Custom</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Muscle Group Filter */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.wizardMuscleGroupScroll}
                    >
                      <TouchableOpacity
                        style={[
                          styles.wizardMuscleGroupButton,
                          !selectedMuscleGroup && styles.wizardMuscleGroupButtonActive,
                        ]}
                        onPress={() => filterExercisesByMuscleGroup('')}
                      >
                        <Text
                          style={[
                            styles.wizardMuscleGroupButtonText,
                            !selectedMuscleGroup && styles.wizardMuscleGroupButtonTextActive,
                          ]}
                        >
                          Todos
                        </Text>
                      </TouchableOpacity>
                      {muscleGroups.map((group) => (
                        <TouchableOpacity
                          key={group}
                          style={[
                            styles.wizardMuscleGroupButton,
                            selectedMuscleGroup === group && styles.wizardMuscleGroupButtonActive,
                          ]}
                          onPress={() => filterExercisesByMuscleGroup(group)}
                        >
                          <Text
                            style={[
                              styles.wizardMuscleGroupButtonText,
                              selectedMuscleGroup === group &&
                                styles.wizardMuscleGroupButtonTextActive,
                            ]}
                          >
                            {group}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Exercise Library */}
                    <ScrollView 
                      style={styles.wizardExerciseLibrary}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {exerciseLibrary.map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          style={[
                            styles.wizardLibraryItem,
                            wizardSelectedExercise?.id === exercise.id &&
                              styles.wizardLibraryItemSelected,
                          ]}
                          onPress={() => setWizardSelectedExercise(exercise)}
                        >
                          <Text style={styles.wizardLibraryItemName}>{exercise.name}</Text>
                          <Text style={styles.wizardLibraryItemGroup}>{exercise.muscle_group}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Exercise Configuration */}
                    {wizardSelectedExercise && (
                      <View style={styles.wizardExerciseConfig}>
                        <Text style={styles.wizardExerciseConfigTitle}>
                          {wizardSelectedExercise.name}
                        </Text>
                        <View style={styles.wizardExerciseConfigRow}>
                          <View style={styles.wizardExerciseConfigItem}>
                            <Text style={styles.wizardExerciseConfigLabel}>Series:</Text>
                            <TextInput
                              style={styles.wizardExerciseConfigInput}
                              keyboardType="numeric"
                              value={wizardExerciseSets}
                              onChangeText={setWizardExerciseSets}
                            />
                          </View>
                          <View style={styles.wizardExerciseConfigItem}>
                            <Text style={styles.wizardExerciseConfigLabel}>Reps:</Text>
                            <TextInput
                              style={styles.wizardExerciseConfigInput}
                              value={wizardExerciseReps}
                              onChangeText={setWizardExerciseReps}
                            />
                          </View>
                        </View>
                        <TextInput
                          style={styles.wizardExerciseConfigNotes}
                          placeholder="Observaciones (opcional)"
                          placeholderTextColor={palette.mutedAlt}
                          value={wizardExerciseNotes}
                          onChangeText={setWizardExerciseNotes}
                          multiline
                        />
                        <TouchableOpacity
                          style={styles.wizardAddButton}
                          onPress={handleWizardAddExercise}
                        >
                          <Ionicons name="add" size={20} color={palette.text} />
                          <Text style={styles.wizardAddButtonText}>Añadir al día</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.wizardFooter}>
            {wizardStep > 1 && (
              <TouchableOpacity style={styles.wizardBackButton} onPress={handleWizardBack}>
                <Ionicons name="arrow-back" size={20} color={palette.text} />
                <Text style={styles.wizardBackButtonText}>Atrás</Text>
              </TouchableOpacity>
            )}
            {wizardStep < 3 ? (
              <TouchableOpacity
                style={[
                  styles.wizardNextButton,
                  wizardStep === 1 && (!wizardRoutineName.trim() || wizardSelectedWeekdays.length === 0) && styles.wizardButtonDisabled,
                ]}
                onPress={handleWizardNext}
                disabled={wizardStep === 1 && (!wizardRoutineName.trim() || wizardSelectedWeekdays.length === 0)}
              >
                <Text style={styles.wizardNextButtonText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={20} color={palette.text} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.wizardFinishButton} onPress={handleWizardFinish}>
                <Ionicons name="checkmark-circle" size={20} color={palette.text} />
                <Text style={styles.wizardFinishButtonText}>Crear Rutina</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Modificar Rutina */}
      <Modal visible={editRoutineModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modificar Rutina</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la rutina"
              placeholderTextColor={palette.mutedAlt}
              value={editRoutineName}
              onChangeText={setEditRoutineName}
            />

            <Text style={styles.label}>Número de días:</Text>
            <Text style={styles.warningText}>Cambiar días recreará la rutina</Text>
            <View style={styles.daysSelector}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.dayButton, editTotalDays === num && styles.dayButtonActive]}
                  onPress={() => setEditTotalDays(num)}
                >
                  <Text style={[styles.dayButtonText, editTotalDays === num && styles.dayButtonTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditRoutineModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEditRoutine}>
                <Text style={styles.primaryButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Ver/Editar Día - Wizard integrado */}
      <Modal visible={viewDayModalVisible} animationType="slide" transparent={false}>
        <View style={styles.wizardContainer}>
          <View style={styles.wizardHeader}>
            <TouchableOpacity onPress={() => void closeDayModal()} style={styles.wizardCloseButton}>
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>
            <Text style={styles.wizardHeaderTitle}>
              {typeof selectedDayWeekday === 'number'
                ? WEEKDAYS[selectedDayWeekday]
                : `Día ${selectedDay?.day_number}`}
            </Text>
            <TouchableOpacity
              onPress={() => void saveDayModal()}
              style={[styles.wizardSaveButton, (!dayModalDirty || dayModalSaving) && styles.wizardSaveButtonDisabled]}
              disabled={!dayModalDirty || dayModalSaving}
            >
              <Ionicons name="checkmark" size={22} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.wizardContentFlex}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.wizardStepContainer}>
              {/* Day Info */}
              <View style={styles.dayEditHeader}>
                <Text style={styles.wizardInputLabel}>TÍTULO DEL DÍA</Text>
                <TextInput
                  style={styles.dayTitleInput}
                  placeholder="Ej: Pecho y Tríceps"
                  placeholderTextColor={palette.mutedAlt}
                  value={dayTitle}
                  onChangeText={(text) => {
                    setDayTitle(text);
                    setDayModalDirty(true);
                  }}
                />
                <Text style={styles.dayEditSubtitle}>
                  Configura los ejercicios y notas de este día
                </Text>
              </View>

              {/* Selector de día de la semana */}
              <View style={styles.wizardInputGroup}>
                <Text style={styles.wizardInputLabel}>DÍA DE LA SEMANA</Text>
                <View style={styles.weekdaySelectorRow}>
                  {WEEKDAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekdaySelectorButton,
                        selectedDayWeekday === index && styles.weekdaySelectorButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedDayWeekday(index);
                        setDayModalDirty(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.weekdaySelectorButtonText,
                          selectedDayWeekday === index && styles.weekdaySelectorButtonTextActive,
                        ]}
                      >
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day Notes */}
              <View style={styles.wizardInputGroup}>
                <Text style={styles.wizardInputLabel}>NOTAS DEL DÍA</Text>
                <TextInput
                  style={[styles.wizardInput, styles.wizardTextArea]}
                  placeholder="Observaciones para este día..."
                  placeholderTextColor={palette.mutedAlt}
                  value={dayNotes}
                  onChangeText={(text) => {
                    setDayNotes(text);
                    setDayModalDirty(true);
                  }}
                  multiline
                />
              </View>

              {/* Current Exercises */}
              <View style={styles.dayExercisesSection}>
                <Text style={styles.sectionTitle}>Ejercicios actuales</Text>
                {dayExercises.length === 0 ? (
                  <View style={styles.wizardEmptyExercises}>
                    <Ionicons name="barbell-outline" size={40} color={palette.muted} />
                    <Text style={styles.wizardEmptyExercisesText}>
                      No hay ejercicios en este día
                    </Text>
                  </View>
                ) : (
                  <View style={styles.exercisesList}>
                    {dayExercises.map((ex, index) => (
                      <View key={ex.id} style={styles.wizardExerciseItem}>
                        <Text style={styles.wizardExerciseNumber}>{index + 1}</Text>
                        <TouchableOpacity
                          style={styles.wizardExerciseInfo}
                          onPress={() => openEditExerciseModal(ex)}
                        >
                          <Text style={styles.wizardExerciseName}>{ex.exercise_name}</Text>
                          <Text style={styles.wizardExerciseDetails}>
                            {ex.sets} × {ex.reps}
                          </Text>
                          {ex.notes && (
                            <Text style={styles.wizardExerciseNotes}>{ex.notes}</Text>
                          )}
                        </TouchableOpacity>
                        <View style={styles.exerciseActions}>
                          <TouchableOpacity
                            onPress={() => handleMoveExercise(ex.id, 'up')}
                            disabled={index === 0}
                            style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                          >
                            <Ionicons name="chevron-up" size={20} color={index === 0 ? palette.muted : palette.text} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMoveExercise(ex.id, 'down')}
                            disabled={index === dayExercises.length - 1}
                            style={[styles.moveButton, index === dayExercises.length - 1 && styles.moveButtonDisabled]}
                          >
                            <Ionicons name="chevron-down" size={20} color={index === dayExercises.length - 1 ? palette.muted : palette.text} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteExercise(ex.id)}
                            style={styles.wizardExerciseDelete}
                          >
                            <Ionicons name="trash-outline" size={18} color={palette.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add Exercise Section */}
              <View style={styles.wizardAddExerciseSection}>
                <View style={styles.wizardAddExerciseHeader}>
                  <Text style={styles.sectionTitle}>Agregar Ejercicio</Text>
                  <TouchableOpacity
                    style={styles.wizardCreateCustomButton}
                    onPress={() => {
                      setViewDayModalVisible(false);
                      setCreateExerciseModalVisible(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={16} color={palette.primary} />
                    <Text style={styles.wizardCreateCustomButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>

                {/* Muscle Group Filter */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.wizardMuscleGroupScroll}
                >
                  <TouchableOpacity
                    style={[
                      styles.wizardMuscleGroupButton,
                      !selectedMuscleGroup && styles.wizardMuscleGroupButtonActive,
                    ]}
                    onPress={() => filterExercisesByMuscleGroup('')}
                  >
                    <Text
                      style={[
                        styles.wizardMuscleGroupButtonText,
                        !selectedMuscleGroup && styles.wizardMuscleGroupButtonTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {muscleGroups.map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[
                        styles.wizardMuscleGroupButton,
                        selectedMuscleGroup === group && styles.wizardMuscleGroupButtonActive,
                      ]}
                      onPress={() => filterExercisesByMuscleGroup(group)}
                    >
                      <Text
                        style={[
                          styles.wizardMuscleGroupButtonText,
                          selectedMuscleGroup === group &&
                            styles.wizardMuscleGroupButtonTextActive,
                        ]}
                      >
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Exercise Library */}
                <ScrollView 
                  style={styles.wizardExerciseLibrary}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {exerciseLibrary.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.wizardLibraryItem}
                      onPress={() => handleAddExercise(exercise)}
                    >
                      <View style={styles.wizardLibraryItemContent}>
                        <Text style={styles.wizardLibraryItemName}>{exercise.name}</Text>
                        <Text style={styles.wizardLibraryItemGroup}>{exercise.muscle_group}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={palette.primary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: Crear Ejercicio Custom */}
      <Modal visible={createExerciseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Ejercicio Personalizado</Text>

            <Text style={styles.label}>Nombre del ejercicio:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Press Arnold"
              placeholderTextColor={palette.mutedAlt}
              value={customExerciseName}
              onChangeText={setCustomExerciseName}
            />

            <Text style={styles.label}>Grupo muscular:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleGroupScroll}>
              {muscleGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.muscleGroupButton,
                    customExerciseMuscleGroup === group && styles.muscleGroupButtonActive,
                  ]}
                  onPress={() => setCustomExerciseMuscleGroup(group)}
                >
                  <Text
                    style={[
                      styles.muscleGroupButtonText,
                      customExerciseMuscleGroup === group && styles.muscleGroupButtonTextActive,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Descripción (opcional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción del ejercicio..."
              placeholderTextColor={palette.mutedAlt}
              value={customExerciseDescription}
              onChangeText={setCustomExerciseDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setCreateExerciseModalVisible(false);
                  setCustomExerciseName('');
                  setCustomExerciseMuscleGroup('');
                  setCustomExerciseDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!customExerciseName.trim() || !customExerciseMuscleGroup) && styles.disabledButton,
                ]}
                onPress={handleCreateCustomExercise}
                disabled={!customExerciseName.trim() || !customExerciseMuscleGroup}
              >
                <Text style={styles.primaryButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Editar Ejercicio */}
      <Modal visible={editExerciseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {editingExercise && (
              <>
                <Text style={styles.exerciseNameLabel}>{editingExercise.exercise_name}</Text>
                
                <Text style={styles.label}>Series:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 3"
                  placeholderTextColor={palette.mutedAlt}
                  keyboardType="numeric"
                  value={editExerciseSets}
                  onChangeText={setEditExerciseSets}
                />

                <Text style={styles.label}>Repeticiones:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 12 o 8-12"
                  placeholderTextColor={palette.mutedAlt}
                  value={editExerciseReps}
                  onChangeText={setEditExerciseReps}
                />

                <Text style={styles.label}>Notas (opcional):</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observaciones del ejercicio..."
                  placeholderTextColor={palette.mutedAlt}
                  value={editExerciseNotes}
                  onChangeText={setEditExerciseNotes}
                  multiline
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditExerciseModalVisible(false);
                  setEditingExercise(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpdateExercise}
              >
                <Text style={styles.primaryButtonText}>Guardar</Text>
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
    paddingTop: 54,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: palette.text,
    fontSize: 18,
    marginTop: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    width: '85%',
  },
  createButtonText: {
    color: palette.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  routineTitle: {
    ...typography.title,
    color: palette.text,
  },
  routineSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 4,
  },
  routineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  dayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dayNumberText: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayInfo: {
    flex: 1,
  },
  dayWeekdayLabel: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dayName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayNotes: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  exercisesPreview: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  exercisePreviewText: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 3,
  },
  noExercisesPreview: {
    color: palette.muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  saveRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.success,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  saveRoutineButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveRoutineButtonDisabled: {
    opacity: 0.5,
    backgroundColor: palette.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  // Estilos modernos para el modal de crear rutina
  createRoutineModal: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  createModalSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  modernInput: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  modernDaysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  modernDayButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modernDayButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  modernDayButtonText: {
    color: palette.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  modernDayButtonTextActive: {
    color: palette.text,
  },
  daysHint: {
    fontSize: 12,
    color: palette.textWarm,
    marginTop: spacing.sm,
    textAlign: 'center',
    opacity: 0.8,
  },
  modernModalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modernCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCancelButtonText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  modernPrimaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  modernPrimaryButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  modernButtonDisabled: {
    opacity: 0.4,
  },
  // Estilos para nombrar días
  dayNamesScrollModern: {
    maxHeight: 280,
    marginBottom: spacing.md,
  },
  dayNameItemModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayNameNumberModern: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  dayNameNumberTextModern: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  dayNameInputWrapper: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayNameInputModern: {
    color: palette.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subtitle,
    color: palette.text,
  },
  input: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: palette.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    height: 60,
    textAlignVertical: 'top',
  },
  label: {
    color: palette.muted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  warningText: {
    color: palette.muted,
    fontSize: 11,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dayEditHeader: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  dayEditTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: 6,
  },
  dayTitleInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  exerciseNameLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  dayEditSubtitle: {
    fontSize: 13,
    color: palette.muted,
  },
  weekdaySelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  weekdaySelectorButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 44,
    alignItems: 'center',
  },
  weekdaySelectorButtonActive: {
    backgroundColor: palette.primaryGlow,
    borderColor: palette.primary,
  },
  weekdaySelectorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  weekdaySelectorButtonTextActive: {
    color: palette.primary,
  },
  dayExercisesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: spacing.md,
  },
  wizardTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createCustomSection: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  exerciseLibraryScroll: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  libraryItem: {
    backgroundColor: palette.inputBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  libraryItemSelected: {
    borderColor: palette.primary,
    borderWidth: 2,
  },
  libraryItemName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  libraryItemGroup: {
    color: palette.muted,
    fontSize: 11,
  },
  exerciseConfigTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  exerciseConfigRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseConfigItem: {
    flex: 1,
  },
  exerciseConfigLabel: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  exerciseConfigInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    textAlign: 'center',
    fontSize: 14,
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  dayButtonText: {
    color: palette.muted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayButtonTextActive: {
    color: palette.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  dayNamesScroll: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  dayNameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayNameNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dayNameNumberText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayNameInput: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 14,
  },
  exercisesList: {
    maxHeight: 300,
    marginTop: spacing.md,
  },
  emptyExercises: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noExercisesText: {
    color: palette.muted,
    textAlign: 'center',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    color: palette.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: palette.text,
    fontSize: 15,
    marginBottom: 2,
  },
  exerciseDetails: {
    color: palette.primary,
    fontSize: 13,
  },
  exerciseNotes: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  exerciseItemNotes: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteExerciseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  addExerciseButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryMuted,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  createCustomButtonText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  muscleGroupScroll: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  muscleGroupButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: palette.inputBg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  muscleGroupButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  muscleGroupButtonText: {
    color: palette.muted,
    fontSize: 12,
  },
  muscleGroupButtonTextActive: {
    color: palette.text,
    fontWeight: 'bold',
  },
  exerciseLibraryList: {
    maxHeight: 180,
    marginBottom: spacing.md,
  },
  exerciseLibraryItem: {
    backgroundColor: palette.inputBg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exerciseLibraryItemSelected: {
    borderColor: palette.primary,
  },
  exerciseLibraryName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseLibraryGroup: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 2,
  },
  exerciseConfig: {
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  selectedExerciseTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  configRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  configItem: {
    flex: 1,
  },
  configLabel: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  configInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    textAlign: 'center',
  },
  // Wizard styles
  wizardContainer: {
    flex: 1,
    backgroundColor: palette.background,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  wizardCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardSaveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: palette.surface,
  },
  wizardHeaderTitle: {
    ...typography.title,
    fontSize: 22,
    color: palette.text,
  },
  wizardProgress: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  wizardProgressBar: {
    height: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  wizardProgressFill: {
    height: '100%',
    backgroundColor: palette.primary,
  },
  wizardProgressText: {
    fontSize: 12,
    color: palette.muted,
    textAlign: 'center',
  },
  wizardContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  wizardContentFlex: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  wizardStepContainer: {
    paddingBottom: spacing.xl,
  },
  wizardStepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  wizardStepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  wizardStepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  wizardStepSubtitle: {
    fontSize: 14,
    color: palette.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  wizardInputGroup: {
    marginBottom: spacing.lg,
  },
  wizardInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  wizardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
  },
  wizardInputIcon: {
    marginRight: spacing.sm,
  },
  wizardInput: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  wizardDaysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  wizardWeekdaysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  wizardWeekdayButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
  },
  wizardWeekdayButtonActive: {
    backgroundColor: palette.primaryGlow,
    borderColor: palette.primary,
  },
  wizardWeekdayButtonText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  wizardWeekdayButtonTextActive: {
    color: palette.primary,
  },
  wizardDaysHintTop: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  wizardDayButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: radius.sm,
    backgroundColor: palette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardDayButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  wizardDayButtonText: {
    color: palette.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  wizardDayButtonTextActive: {
    color: palette.text,
  },
  wizardDaysHint: {
    fontSize: 12,
    color: palette.textWarm,
    marginTop: spacing.sm,
    textAlign: 'center',
    opacity: 0.8,
  },
  wizardDayNameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wizardDayNameNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  wizardDayNameNumberText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  wizardDayNameInputWrapper: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardDayNameInput: {
    color: palette.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wizardDayTabs: {
    maxHeight: 80,
    marginBottom: spacing.md,
  },
  wizardDayTabsContent: {
    paddingRight: spacing.lg,
  },
  wizardDayTab: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    minWidth: 100,
    position: 'relative',
  },
  wizardDayTabActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  wizardDayTabNumber: {
    fontSize: 11,
    color: palette.muted,
    fontWeight: '600',
  },
  wizardDayTabNumberActive: {
    color: palette.text,
  },
  wizardDayTabText: {
    fontSize: 14,
    color: palette.text,
    fontWeight: '500',
    marginTop: 2,
  },
  wizardDayTabTextActive: {
    fontWeight: '700',
  },
  wizardDayTabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: palette.success,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  wizardDayTabBadgeText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  wizardDayExercisesContainer: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardDayExercisesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.md,
  },
  wizardExercisesList: {
    marginBottom: spacing.md,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  wizardExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  wizardExerciseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.muted,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  wizardExerciseInfo: {
    flex: 1,
  },
  wizardExerciseName: {
    color: palette.text,
    fontSize: 15,
    marginBottom: 2,
  },
  wizardExerciseDetails: {
    color: palette.primary,
    fontSize: 13,
  },
  wizardExerciseNotes: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  wizardExerciseDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardEmptyExercises: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  wizardEmptyExercisesText: {
    color: palette.muted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  wizardAddExerciseSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  wizardAddExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  wizardAddExerciseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  wizardCreateCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryMuted,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  wizardCreateCustomButtonText: {
    color: palette.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  wizardMuscleGroupScroll: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  wizardMuscleGroupButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: palette.inputBg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardMuscleGroupButtonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  wizardMuscleGroupButtonText: {
    color: palette.muted,
    fontSize: 11,
  },
  wizardMuscleGroupButtonTextActive: {
    color: palette.text,
    fontWeight: 'bold',
  },
  wizardExerciseLibrary: {
    height: 200,
    marginBottom: spacing.md,
  },
  wizardLibraryItem: {
    backgroundColor: palette.inputBg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wizardLibraryItemContent: {
    flex: 1,
  },
  wizardLibraryItemSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryGlow,
  },
  wizardLibraryItemName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  wizardLibraryItemGroup: {
    color: palette.muted,
    fontSize: 10,
    marginTop: 2,
  },
  wizardExerciseConfig: {
    backgroundColor: palette.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  wizardExerciseConfigTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  wizardExerciseConfigRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  wizardExerciseConfigItem: {
    flex: 1,
  },
  wizardExerciseConfigLabel: {
    color: palette.muted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  wizardExerciseConfigInput: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.xs,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    textAlign: 'center',
    fontSize: 14,
  },
  wizardExerciseConfigNotes: {
    backgroundColor: palette.inputBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 13,
    marginBottom: spacing.sm,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  wizardAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  wizardAddButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  wizardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.background,
  },
  wizardBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    flex: 1,
  },
  wizardBackButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  wizardNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    flex: 2,
  },
  wizardNextButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  wizardFinishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.success,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
    flex: 2,
  },
  wizardFinishButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  wizardButtonDisabled: {
    opacity: 0.4,
  },
});