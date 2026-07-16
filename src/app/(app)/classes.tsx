import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type ClassSession = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  name: string;
  instructor: string;
};

// TODO: reemplazar por las clases reales del socio (Supabase).
const CLIENT_CLASSES: ClassSession[] = [];

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAYS_TO_SHOW = 7;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function ClassesScreen() {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });
  }, []);

  const [selectedKey, setSelectedKey] = useState(() => toDateKey(days[0]));

  const classesForSelectedDay = CLIENT_CLASSES.filter((item) => item.date === selectedKey);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clases</Text>

      <View style={styles.calendarStrip}>
        {days.map((date) => {
          const key = toDateKey(date);
          const isSelected = key === selectedKey;
          return (
            <Pressable
              key={key}
              style={[styles.dayChip, isSelected && styles.dayChipSelected]}
              onPress={() => setSelectedKey(key)}>
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {WEEKDAY_LABELS[date.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={classesForSelectedDay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tenés clases programadas este día.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.classCard}>
            <Text style={styles.classTime}>{item.time}</Text>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{item.name}</Text>
              <Text style={styles.classInstructor}>{item.instructor}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 40,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  classTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  classInfo: {
    gap: 2,
  },
  className: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  classInstructor: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
