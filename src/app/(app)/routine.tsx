import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseGroupList } from '@/components/exercise-group-list';
import { YouTubePlayerModal } from '@/components/youtube-player-modal';
import { Colors } from '@/constants/theme';
import { useClientRoutines } from '@/hooks/use-client-routines';
import { useSession } from '@/hooks/use-session';

export default function RoutineScreen() {
  const { session } = useSession();
  const { routines, isLoading } = useClientRoutines(session?.user.id);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

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

      {routines.map((routine, index) => (
        <View key={`${routine.nombre}-${index}`} style={styles.routineSection}>
          <Text style={styles.title}>{routine.nombre}</Text>
          <ExerciseGroupList groups={routine.groups} onPressVideo={setActiveVideoId} />
        </View>
      ))}

      <YouTubePlayerModal videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
    </ScrollView>
  );
}

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
});
