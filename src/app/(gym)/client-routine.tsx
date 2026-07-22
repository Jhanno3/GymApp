import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useGymRoutines } from '@/hooks/use-gym-routines';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type AssignedRoutine = {
  id: string;
  nombre: string;
  exerciseCount: number;
  diasSemana: number[];
};

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

function WeekdayPicker({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <View style={styles.weekdayRow}>
      {WEEKDAYS.map((day) => {
        const isSelected = selected.includes(day.value);
        return (
          <Pressable
            key={day.value}
            style={[styles.weekdayChip, isSelected && styles.weekdayChipSelected]}
            onPress={() => onToggle(day.value)}>
            <Text style={[styles.weekdayChipText, isSelected && styles.weekdayChipTextSelected]}>
              {day.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ClientRoutineScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { dni, name } = useLocalSearchParams<{ dni: string; name?: string }>();
  const { routines, isLoading: isLoadingLibrary, reload: reloadLibrary } = useGymRoutines(
    session?.user.id
  );

  const [assignedRoutines, setAssignedRoutines] = useState<AssignedRoutine[]>([]);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDias, setNewRoutineDias] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadAssigned();
  }, [dni]);

  async function loadAssigned() {
    setIsLoadingAssigned(true);

    const { data } = await supabase
      .from('Cliente_rutina')
      .select('dias_semana, Rutina(id, nombre, Rutina_ejercicio(id))')
      .eq('cliente_dni', dni);

    type Row = {
      dias_semana: number[] | null;
      Rutina: { id: string; nombre: string; Rutina_ejercicio: { id: string }[] } | null;
    };

    setAssignedRoutines(
      ((data as unknown as Row[]) ?? [])
        .filter((row) => row.Rutina)
        .map((row) => ({
          id: row.Rutina!.id,
          nombre: row.Rutina!.nombre,
          exerciseCount: row.Rutina!.Rutina_ejercicio?.length ?? 0,
          diasSemana: row.dias_semana ?? [],
        }))
    );
    setIsLoadingAssigned(false);
  }

  async function handleToggleDia(rutinaId: string, currentDias: number[], day: number) {
    const nextDias = currentDias.includes(day)
      ? currentDias.filter((d) => d !== day)
      : [...currentDias, day];

    setAssignedRoutines((prev) =>
      prev.map((r) => (r.id === rutinaId ? { ...r, diasSemana: nextDias } : r))
    );

    const { error } = await supabase.rpc('set_rutina_dias', {
      p_client_dni: dni,
      p_rutina_id: rutinaId,
      p_dias_semana: nextDias,
    });

    if (error) {
      setAssignError(error.message);
      await loadAssigned();
    }
  }

  async function handleAssignExisting(rutinaId: string) {
    setAssignError(null);
    setAssigningId(rutinaId);

    const { error } = await supabase.rpc('assign_existing_rutina', {
      p_client_dni: dni,
      p_rutina_id: rutinaId,
    });
    setAssigningId(null);

    if (error) {
      setAssignError(error.message);
      return;
    }

    await loadAssigned();
  }

  async function handleUnassign(rutinaId: string) {
    setAssignError(null);
    setRemovingId(rutinaId);

    const { error } = await supabase.rpc('unassign_rutina', {
      p_client_dni: dni,
      p_rutina_id: rutinaId,
    });
    setRemovingId(null);

    if (error) {
      setAssignError(error.message);
      return;
    }

    await loadAssigned();
  }

  function closeCreateModal() {
    setIsCreateVisible(false);
    setNewRoutineName('');
    setNewRoutineDias([]);
    setCreateError(null);
  }

  function toggleNewRoutineDia(day: number) {
    setNewRoutineDias((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleCreateForClient() {
    setCreateError(null);

    if (!newRoutineName.trim()) {
      setCreateError('Ingresá un nombre para la rutina.');
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase.rpc('assign_rutina', {
      p_client_dni: dni,
      p_nombre: newRoutineName.trim(),
      p_dias_semana: newRoutineDias,
    });
    setIsCreating(false);

    if (error) {
      setCreateError(error.message);
      return;
    }

    const rutinaId = data as string;
    const routineName = newRoutineName.trim();
    closeCreateModal();
    await Promise.all([loadAssigned(), reloadLibrary()]);
    router.push({ pathname: '/routine-builder', params: { rutinaId, name: routineName } });
  }

  const isLoading = isLoadingAssigned || isLoadingLibrary;
  const assignedIds = new Set(assignedRoutines.map((r) => r.id));

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/clients'))}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name ?? 'Rutina'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rutinas asignadas ({assignedRoutines.length})</Text>

            {assignError && <Text style={styles.error}>{assignError}</Text>}

            {assignedRoutines.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no tiene rutinas asignadas.</Text>
            ) : (
              <View style={styles.list}>
                {assignedRoutines.map((routine) => (
                  <View key={routine.id} style={styles.assignedCard}>
                    <View style={styles.assignedCardTop}>
                      <View style={styles.assignedInfo}>
                        <Text style={styles.assignedName}>{routine.nombre}</Text>
                        <Text style={styles.assignedDetail}>
                          {routine.exerciseCount}{' '}
                          {routine.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() =>
                          router.push({
                            pathname: '/routine-builder',
                            params: { rutinaId: routine.id, name: routine.nombre },
                          })
                        }>
                        <Text style={styles.secondaryButtonText}>Editar</Text>
                      </Pressable>

                      <Pressable
                        style={styles.removeButton}
                        onPress={() => handleUnassign(routine.id)}
                        disabled={removingId === routine.id}>
                        {removingId === routine.id ? (
                          <ActivityIndicator color="#F87171" />
                        ) : (
                          <Ionicons name="close-circle-outline" size={22} color="#F87171" />
                        )}
                      </Pressable>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Días de la semana</Text>
                      <WeekdayPicker
                        selected={routine.diasSemana}
                        onToggle={(day) => handleToggleDia(routine.id, routine.diasSemana, day)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Pressable style={styles.button} onPress={() => setIsCreateVisible(true)}>
            <Text style={styles.buttonText}>+ Crear rutina nueva para este cliente</Text>
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agregar una rutina existente</Text>

            {routines.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no creaste ninguna rutina en tu gimnasio.</Text>
            ) : (
              <View style={styles.list}>
                {routines
                  .filter((routine) => !assignedIds.has(routine.id))
                  .map((routine) => (
                    <View key={routine.id} style={styles.routineCard}>
                      <View style={styles.assignedInfo}>
                        <Text style={styles.assignedName}>{routine.nombre}</Text>
                        <Text style={styles.assignedDetail}>
                          {routine.exerciseCount}{' '}
                          {routine.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => handleAssignExisting(routine.id)}
                        disabled={assigningId === routine.id}>
                        {assigningId === routine.id ? (
                          <ActivityIndicator color={Colors.text} />
                        ) : (
                          <Text style={styles.secondaryButtonText}>Agregar</Text>
                        )}
                      </Pressable>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={isCreateVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear rutina</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Rutina de Pecho"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              value={newRoutineName}
              onChangeText={setNewRoutineName}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Días de la semana (opcional)</Text>
              <WeekdayPicker selected={newRoutineDias} onToggle={toggleNewRoutineDia} />
            </View>

            {createError && <Text style={styles.error}>{createError}</Text>}

            <Pressable
              style={[styles.button, isCreating && styles.buttonDisabled]}
              onPress={handleCreateForClient}
              disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Crear y asignar</Text>
              )}
            </Pressable>

            <Pressable style={styles.closeButton} onPress={closeCreateModal}>
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  assignedCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  assignedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  assignedInfo: {
    flex: 1,
    gap: 2,
  },
  assignedName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  assignedDetail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdayChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekdayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekdayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  weekdayChipTextSelected: {
    color: '#FFFFFF',
  },
  list: {
    gap: 10,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
