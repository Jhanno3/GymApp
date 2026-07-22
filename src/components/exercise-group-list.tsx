import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export type RoutineExercise = {
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
}: {
  groups: MuscleGroup[];
  onPressVideo: (videoId: string) => void;
}) {
  if (groups.length === 0) {
    return <Text style={styles.emptyText}>Todavía no tiene ejercicios cargados.</Text>;
  }

  return (
    <>
      {groups.map((group) => (
        <View key={group.name} style={styles.group}>
          <Text style={styles.groupTitle}>{group.name}</Text>

          <View style={styles.card}>
            {group.exercises.map((exercise, index) => {
              const videoId = exercise.Ejercicio?.video_url
                ? getYouTubeId(exercise.Ejercicio.video_url)
                : null;
              const thumbnail = getYouTubeThumbnail(exercise.Ejercicio?.video_url ?? null);

              return (
                <View
                  key={`${group.name}-${index}`}
                  style={[styles.exerciseRow, index > 0 && styles.exerciseRowDivider]}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.Ejercicio?.nombre}</Text>
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
        </View>
      ))}
    </>
  );
}

const VIDEO_PREVIEW_SIZE = 64;

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  group: {
    gap: 10,
    marginBottom: 20,
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
    paddingVertical: 14,
  },
  exerciseRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    fontSize: 14,
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
