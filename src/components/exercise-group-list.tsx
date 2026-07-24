import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export type RoutineExercise = {
  id: string;
  grupo_muscular: string | null;
  descripcion: string | null;
  orden: number | null;
  Ejercicio: { nombre: string; video_url: string | null } | null;
};

export type MuscleGroup = {
  name: string;
  exercises: RoutineExercise[];
};

export function groupExercises(exercises: RoutineExercise[]): MuscleGroup[] {
  const sorted = [...exercises].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const groups: MuscleGroup[] = [];

  for (const exercise of sorted) {
    const name = exercise.grupo_muscular ?? 'Ejercicios';
    const group = groups.find((g) => g.name === name);
    if (group) {
      group.exercises.push(exercise);
    } else {
      groups.push({ name, exercises: [exercise] });
    }
  }

  return groups;
}

export function ExerciseGroupList({
  groups,
  onPressVideo,
  completedIds,
  onToggleExercise,
}: {
  groups: MuscleGroup[];
  onPressVideo: (videoId: string) => void;
  completedIds?: Set<string>;
  onToggleExercise?: (exerciseId: string) => void;
}) {
  const exercises = groups.flatMap((group) => group.exercises);

  if (exercises.length === 0) {
    return <Text style={styles.emptyText}>Todavía no tiene ejercicios cargados.</Text>;
  }

  return (
    <View style={styles.card}>
      {exercises.map((exercise, index) => {
        const videoId = exercise.Ejercicio?.video_url
          ? getYouTubeId(exercise.Ejercicio.video_url)
          : null;
        const thumbnail = getYouTubeThumbnail(exercise.Ejercicio?.video_url ?? null);
        const isDone = completedIds?.has(exercise.id) ?? false;

        return (
          <View
            key={exercise.id || index}
            style={[styles.exerciseRow, index > 0 && styles.exerciseRowDivider]}>
            {onToggleExercise && (
              <Pressable
                style={[styles.checkCircle, isDone && styles.checkCircleDone]}
                onPress={() => onToggleExercise(exercise.id)}>
                {isDone && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </Pressable>
            )}

            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, isDone && styles.exerciseNameDone]}>
                {exercise.Ejercicio?.nombre}
              </Text>
              {exercise.descripcion && (
                <Text style={styles.exerciseDescription}>{exercise.descripcion}</Text>
              )}
            </View>

            {videoId && (
              <Pressable style={styles.videoPreview} onPress={() => onPressVideo(videoId)}>
                {thumbnail ? (
                  <Image source={{ uri: thumbnail }} style={styles.videoThumbnail} />
                ) : (
                  <View style={styles.videoPlaceholder} />
                )}
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const VIDEO_PREVIEW_SIZE = 64;

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
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
    paddingVertical: 14,
  },
  exerciseRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
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
  exerciseNameDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  exerciseDescription: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  videoPreview: {
    width: VIDEO_PREVIEW_SIZE,
    height: VIDEO_PREVIEW_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
