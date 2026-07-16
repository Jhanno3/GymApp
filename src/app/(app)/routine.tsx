import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RoutineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rutina</Text>
      <Text style={styles.subtitle}>Acá va a ir la rutina del socio.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
