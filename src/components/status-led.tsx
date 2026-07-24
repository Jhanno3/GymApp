import { StyleSheet, Text, View } from 'react-native';

import { SubscriptionStatusColors, SubscriptionStatusLabels } from '@/constants/theme';
import { SubscriptionStatus } from '@/lib/subscription-status';

export function StatusLed({ status }: { status: SubscriptionStatus }) {
  const color = SubscriptionStatusColors[status];

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{SubscriptionStatusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
