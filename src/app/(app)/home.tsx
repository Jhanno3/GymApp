import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StatusLed } from '@/components/status-led';
import { Colors } from '@/constants/theme';
import { useClientMembership } from '@/hooks/use-client-membership';
import { useClientRoutines } from '@/hooks/use-client-routines';
import { useExerciseCompletions } from '@/hooks/use-exercise-completions';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';
import { countExercisesForWeekday, getCurrentWeekDates, toDateKey } from '@/lib/weekly-progress';

type Gym = {
  DNI: number;
  Nombre: string;
  direccion: string | null;
};

function formatDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function SuccessOverlay({ message, onHide }: { message: string; onHide: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onHide);
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.overlayCard, { transform: [{ scale }] }]}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.overlayText}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { session } = useSession();
  const { checkinGym } = useLocalSearchParams<{ checkinGym?: string }>();
  const { membership } = useClientMembership(session?.user.id);
  const { routines } = useClientRoutines(session?.user.id);

  const weekDates = getCurrentWeekDates();
  const weekStart = toDateKey(weekDates[0]);
  const weekEnd = toDateKey(weekDates[6]);
  const { completions } = useExerciseCompletions(session?.user.id, weekStart, weekEnd);

  let weeklyDone = 0;
  let weeklyMax = 0;
  for (const date of weekDates) {
    const total = countExercisesForWeekday(routines, date.getDay());
    if (total === 0) continue;
    weeklyMax += 1;
    const completedCount = completions.filter((c) => c.fecha === toDateKey(date)).length;
    if (completedCount >= total) weeklyDone += 1;
  }

  const [gym, setGym] = useState<Gym | null>(null);
  const [clientName, setClientName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(!!checkinGym);

  useEffect(() => {
    if (session?.user.id) {
      loadGym(session.user.id);
    }
  }, [session?.user.id]);

  async function loadGym(userId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('Cliente')
      .select('Nombre, Gimnasio(DNI, Nombre, direccion)')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setClientName(data.Nombre ?? '');
      if (data.Gimnasio) {
        setGym(data.Gimnasio as unknown as Gym);
      }
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/Cat02.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>
            {clientName ? `Hola, ${clientName}!` : '¡Bienvenido!'}
          </Text>
          <View style={styles.logo} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu gimnasio</Text>

          {gym ? (
            <View style={styles.gymCard}>
              <View style={styles.gymInfo}>
                <Text style={styles.gymName}>{gym.Nombre}</Text>
                {gym.direccion && <Text style={styles.gymAddress}>{gym.direccion}</Text>}

                <View style={styles.membershipRow}>
                  <StatusLed status={membership?.status ?? 'none'} />
                  {formatDate(membership?.fechaFin ?? null) && (
                    <Text style={styles.membershipDetail}>
                      Vence {formatDate(membership?.fechaFin ?? null)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Todavía no estás inscripto en ningún gimnasio.</Text>
          )}
        </View>

        {weeklyMax > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu semana</Text>

            <View style={styles.progressCard}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(weeklyDone / weeklyMax) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {weeklyDone}/{weeklyMax} días completados
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {showSuccess && (
        <SuccessOverlay
          message={`Check-in exitoso en ${checkinGym}`}
          onHide={() => setShowSuccess(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  section: {
    gap: 12,
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
  gymCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  gymInfo: {
    gap: 2,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  gymAddress: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  membershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  membershipDetail: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
