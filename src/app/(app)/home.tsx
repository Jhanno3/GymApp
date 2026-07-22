import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type Gym = {
  DNI: number;
  Nombre: string;
  direccion: string | null;
};

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
  const router = useRouter();
  const { session } = useSession();
  const { checkinGym } = useLocalSearchParams<{ checkinGym?: string }>();

  const [gym, setGym] = useState<Gym | null>(null);
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
      .select('Gimnasio(DNI, Nombre, direccion)')
      .eq('user_id', userId)
      .single();

    if (!error && data?.Gimnasio) {
      setGym(data.Gimnasio as unknown as Gym);
    }
    setIsLoading(false);
  }

  function handleAccessGym() {
    router.push('/routine');
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
        <Text style={styles.title}>¡Bienvenido!</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu gimnasio</Text>

          {gym ? (
            <View style={styles.gymCard}>
              <View style={styles.gymInfo}>
                <Text style={styles.gymName}>{gym.Nombre}</Text>
                {gym.direccion && <Text style={styles.gymAddress}>{gym.direccion}</Text>}
              </View>

              <Pressable style={styles.accessButton} onPress={handleAccessGym}>
                <Text style={styles.accessButtonText}>Acceder</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>Todavía no estás inscripto en ningún gimnasio.</Text>
          )}
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
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
    gap: 12,
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
  accessButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  accessButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
