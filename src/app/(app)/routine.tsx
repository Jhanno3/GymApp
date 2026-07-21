import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type RoutineExercise = {
  grupo_muscular: string | null;
  descripcion: string | null;
  orden: number | null;
  Ejercicio: { nombre: string; video_url: string | null } | null;
};

type Routine = {
  nombre: string;
  Rutina_ejercicio: RoutineExercise[];
};

type MuscleGroup = {
  name: string;
  exercises: RoutineExercise[];
};

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

function buildYouTubeEmbedHtml(videoId: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <style>
      html, body { margin: 0; padding: 0; background: #000; height: 100%; }
      iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&origin=https://gymapp.app"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}

function groupExercises(exercises: RoutineExercise[]): MuscleGroup[] {
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

export default function RoutineScreen() {
  const { session } = useSession();
  const insets = useSafeAreaInsets();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.id) {
      loadRoutines(session.user.id);
    }
  }, [session?.user.id]);

  async function loadRoutines(userId: string) {
    setIsLoading(true);

    const { data } = await supabase
      .from('Cliente')
      .select(
        'Cliente_rutina(Rutina(nombre, Rutina_ejercicio(grupo_muscular, descripcion, orden, Ejercicio(nombre, video_url))))'
      )
      .eq('user_id', userId)
      .single();

    type Row = {
      Cliente_rutina: { Rutina: Routine | null }[];
    };

    const row = data as Row | null;
    setRoutines((row?.Cliente_rutina ?? []).flatMap((cr) => (cr.Rutina ? [cr.Rutina] : [])));
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (routines.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Rutina</Text>
        <Text style={styles.subtitle}>Todavía no tenés una rutina asignada.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Tu rutina</Text>

      {routines.map((routine, routineIndex) => {
        const groups = groupExercises(routine.Rutina_ejercicio);

        return (
          <View key={`${routine.nombre}-${routineIndex}`} style={styles.routineSection}>
            <Text style={styles.title}>{routine.nombre}</Text>

            {groups.length === 0 ? (
              <Text style={styles.subtitle}>Todavía no tiene ejercicios cargados.</Text>
            ) : (
              groups.map((group) => (
                <View key={group.name} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.name}</Text>

                  <View style={styles.card}>
                    {group.exercises.map((exercise, index) => {
                      const videoId = exercise.Ejercicio?.video_url
                        ? getYouTubeId(exercise.Ejercicio.video_url)
                        : null;
                      const thumbnail = videoId
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : null;

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
                            <Pressable
                              style={styles.videoPreview}
                              onPress={() => setActiveVideoId(videoId)}>
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
              ))
            )}
          </View>
        );
      })}

      <Modal
        visible={!!activeVideoId}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveVideoId(null)}>
        <View style={styles.fullscreenPlayer}>
          {activeVideoId && (
            <WebView
              source={{
                html: buildYouTubeEmbedHtml(activeVideoId),
                baseUrl: 'https://gymapp.app',
              }}
              style={styles.player}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          )}

          <Pressable
            style={[styles.closeFab, { top: insets.top + 12 }]}
            onPress={() => setActiveVideoId(null)}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const VIDEO_PREVIEW_SIZE = 64;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routineSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
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
  fullscreenPlayer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  player: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeFab: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});
