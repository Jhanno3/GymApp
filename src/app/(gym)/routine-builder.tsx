import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import {
  getYouTubeThumbnail,
  groupExercises,
  RoutineExercise,
  useRutinaEjercicios,
} from '@/hooks/use-rutina-ejercicios';
import { supabase } from '@/lib/supabase';

type ExerciseCatalogItem = {
  id: string;
  nombre: string;
  video_url: string | null;
};

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { rutinaId, name } = useLocalSearchParams<{ rutinaId: string; name?: string }>();
  const { exercises, isLoading, reload } = useRutinaEjercicios(rutinaId);

  const [routineName, setRoutineName] = useState(name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [isAddExerciseVisible, setIsAddExerciseVisible] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseCatalogItem | null>(null);
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSavingExercise, setIsSavingExercise] = useState(false);
  const [addExerciseError, setAddExerciseError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    const { data } = await supabase.from('Ejercicio').select('id, nombre, video_url').order('nombre');
    setCatalog((data as ExerciseCatalogItem[]) ?? []);
  }

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((item) => item.nombre.toLowerCase().includes(query));
  }, [catalog, catalogQuery]);

  async function handleSaveName() {
    setNameError(null);

    if (!routineName.trim()) {
      setNameError('Ingresá un nombre para la rutina.');
      return;
    }

    setIsSavingName(true);
    const { error } = await supabase.rpc('rename_rutina', {
      p_rutina_id: rutinaId,
      p_nombre: routineName.trim(),
    });
    setIsSavingName(false);

    if (error) {
      setNameError(error.message);
    }
  }

  function openAddExercise() {
    setSelectedExercise(null);
    setGrupoMuscular('');
    setDescripcion('');
    setAddExerciseError(null);
    setIsAddExerciseVisible(true);
  }

  async function handleAddExercise() {
    setAddExerciseError(null);

    if (!selectedExercise) {
      setAddExerciseError('Elegí un ejercicio del catálogo.');
      return;
    }

    setIsSavingExercise(true);
    const { error } = await supabase.rpc('add_ejercicio_to_rutina', {
      p_rutina_id: rutinaId,
      p_ejercicio_id: selectedExercise.id,
      p_grupo_muscular: grupoMuscular.trim() || null,
      p_descripcion: descripcion.trim() || null,
      p_orden: exercises.length,
    });
    setIsSavingExercise(false);

    if (error) {
      setAddExerciseError(error.message);
      return;
    }

    await reload();
    setSelectedExercise(null);
    setDescripcion('');
  }

  function handleRemoveExercise(exercise: RoutineExercise) {
    Alert.alert(
      'Quitar ejercicio',
      `¿Seguro que querés quitar "${exercise.Ejercicio?.nombre}" de la rutina?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('remove_ejercicio_from_rutina', {
              p_rutina_ejercicio_id: exercise.id,
            });
            if (!error) {
              await reload();
            }
          },
        },
      ]
    );
  }

  const groups = groupExercises(exercises);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/routines'))}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {routineName || 'Rutina'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Rutina de Pecho"
              placeholderTextColor={Colors.textMuted}
              value={routineName}
              onChangeText={setRoutineName}
            />
          </View>

          {nameError && <Text style={styles.error}>{nameError}</Text>}

          <Pressable
            style={[styles.button, isSavingName && styles.buttonDisabled]}
            onPress={handleSaveName}
            disabled={isSavingName}>
            {isSavingName ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Guardar nombre</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={openAddExercise}>
            <Text style={styles.secondaryButtonText}>+ Agregar ejercicio</Text>
          </Pressable>

          {groups.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no tiene ejercicios cargados.</Text>
          ) : (
            groups.map((group) => (
              <View key={group.name} style={styles.group}>
                <Text style={styles.groupTitle}>{group.name}</Text>

                <View style={styles.card}>
                  {group.exercises.map((exercise, index) => {
                    const thumbnail = getYouTubeThumbnail(exercise.Ejercicio?.video_url ?? null);

                    return (
                      <View
                        key={exercise.id}
                        style={[styles.exerciseRow, index > 0 && styles.exerciseRowDivider]}>
                        {thumbnail ? (
                          <Image source={{ uri: thumbnail }} style={styles.exerciseThumbnail} />
                        ) : (
                          <View style={styles.exerciseThumbnailPlaceholder} />
                        )}

                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.Ejercicio?.nombre}</Text>
                          {exercise.descripcion && (
                            <Text style={styles.exerciseDescription}>{exercise.descripcion}</Text>
                          )}
                        </View>

                        <Pressable
                          style={styles.removeButton}
                          onPress={() => handleRemoveExercise(exercise)}>
                          <Ionicons name="trash-outline" size={18} color="#F87171" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={isAddExerciseVisible}
        animationType="slide"
        onRequestClose={() => setIsAddExerciseVisible(false)}>
        <View style={styles.flex}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => setIsAddExerciseVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Agregar ejercicio</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.field}>
              <Text style={styles.label}>Ejercicio</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar en el catálogo"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  value={catalogQuery}
                  onChangeText={setCatalogQuery}
                />
              </View>

              <View style={styles.catalogList}>
                {filteredCatalog.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.catalogItem,
                      selectedExercise?.id === item.id && styles.catalogItemSelected,
                    ]}
                    onPress={() => setSelectedExercise(item)}>
                    <Text style={styles.catalogItemText}>{item.nombre}</Text>
                    {selectedExercise?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Grupo muscular</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Pecho"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                value={grupoMuscular}
                onChangeText={setGrupoMuscular}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 4x10"
                placeholderTextColor={Colors.textMuted}
                value={descripcion}
                onChangeText={setDescripcion}
              />
            </View>

            {addExerciseError && <Text style={styles.error}>{addExerciseError}</Text>}

            <Pressable
              style={[styles.button, isSavingExercise && styles.buttonDisabled]}
              onPress={handleAddExercise}
              disabled={isSavingExercise}>
              {isSavingExercise ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Agregar a la rutina</Text>
              )}
            </Pressable>
          </ScrollView>
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
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surface,
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
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
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
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  exerciseRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exerciseThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  exerciseThumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  exerciseDescription: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  catalogList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catalogItemSelected: {
    backgroundColor: Colors.background,
  },
  catalogItemText: {
    fontSize: 14,
    color: Colors.text,
  },
});
