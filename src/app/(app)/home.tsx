import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

type Gym = {
  DNI: number;
  Nombre: string;
  direccion: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useSession();

  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  );
}

const styles = StyleSheet.create({
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
