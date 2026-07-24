import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useGymCheckins } from '@/hooks/use-gym-checkins';
import { useSession } from '@/hooks/use-session';

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function GymCheckinsScreen() {
  const { session } = useSession();
  const { checkins, isLoading, reload } = useGymCheckins(session?.user.id);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={Colors.primary} />
      }>
      <Text style={styles.title}>Check-in</Text>
      <Text style={styles.subtitle}>Ingresos de hoy ({checkins.length})</Text>

      {isLoading && checkins.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : checkins.length === 0 ? (
        <Text style={styles.emptyText}>Todavía no hubo check-ins hoy.</Text>
      ) : (
        <View style={styles.list}>
          {checkins.map((checkin) => (
            <View key={checkin.id} style={styles.row}>
              <Text style={styles.time}>{formatTime(checkin.checkedInAt)}</Text>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {checkin.cliente
                    ? [checkin.cliente.Nombre, checkin.cliente.Apellido].filter(Boolean).join(' ')
                    : '-'}
                </Text>
                {checkin.cliente && (
                  <Text style={styles.clientDetail}>DNI {checkin.cliente.DNI}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 52,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  clientDetail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
