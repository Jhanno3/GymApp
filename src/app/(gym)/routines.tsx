import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function GymRoutinesScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { routines, isLoading } = useGymRoutines(session?.user.id);

  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function closeCreateModal() {
    setIsCreateVisible(false);
    setNewRoutineName('');
    setCreateError(null);
  }

  async function handleCreate() {
    setCreateError(null);

    if (!newRoutineName.trim()) {
      setCreateError('Ingresá un nombre para la rutina.');
      return;
    }

    setIsCreating(true);
    const { data, error } = await supabase.rpc('create_rutina', {
      p_nombre: newRoutineName.trim(),
    });
    setIsCreating(false);

    if (error) {
      setCreateError(error.message);
      return;
    }

    const rutinaId = data as string;
    closeCreateModal();
    router.push({
      pathname: '/routine-builder',
      params: { rutinaId, name: newRoutineName.trim() },
    });
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Rutinas</Text>
        <Text style={styles.subtitle}>Armá plantillas de rutinas para asignarles a tus clientes.</Text>

        <Pressable style={styles.button} onPress={() => setIsCreateVisible(true)}>
          <Text style={styles.buttonText}>+ Crear rutina</Text>
        </Pressable>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : routines.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no creaste ninguna rutina.</Text>
        ) : (
          <View style={styles.list}>
            {routines.map((routine) => (
              <Pressable
                key={routine.id}
                style={styles.routineCard}
                onPress={() =>
                  router.push({
                    pathname: '/routine-builder',
                    params: { rutinaId: routine.id, name: routine.nombre },
                  })
                }>
                <Text style={styles.routineName}>{routine.nombre}</Text>
                <Text style={styles.routineDetail}>
                  {routine.exerciseCount} {routine.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

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

            {createError && <Text style={styles.error}>{createError}</Text>}

            <Pressable
              style={[styles.button, isCreating && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Crear</Text>
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
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: -8,
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  list: {
    gap: 10,
  },
  routineCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  routineDetail: {
    fontSize: 13,
    color: Colors.textMuted,
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
  error: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
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
