import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ExerciseGroupList } from '@/components/exercise-group-list';
import { YouTubePlayerModal } from '@/components/youtube-player-modal';
import { Colors } from '@/constants/theme';
import { useClientRoutines } from '@/hooks/use-client-routines';
import { useExerciseCompletions } from '@/hooks/use-exercise-completions';
import { useSession } from '@/hooks/use-session';
import { countExercisesForWeekday, getCurrentWeekDates, toDateKey } from '@/lib/weekly-progress';

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

export default function ClassesScreen() {
  const { session } = useSession();
  const { routines } = useClientRoutines(session?.user.id);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Semana calendario (domingo a sábado), igual que la barra de progreso de Inicio.
  const days = useMemo(() => getCurrentWeekDates(), []);

  const rangeStart = toDateKey(days[0]);
  const rangeEnd = toDateKey(days[days.length - 1]);
  const { completions, toggle } = useExerciseCompletions(session?.user.id, rangeStart, rangeEnd);

  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const selectedDate = days.find((date) => toDateKey(date) === selectedKey) ?? days[0];
  const selectedWeekday = selectedDate.getDay();

  const classesForSelectedDay = CLIENT_CLASSES.filter((item) => item.date === selectedKey);
  const routinesForSelectedDay = routines.filter((routine) =>
    routine.diasSemana.includes(selectedWeekday)
  );

  const completedIdsForSelectedDay = useMemo(
    () =>
      new Set(
        completions.filter((c) => c.fecha === selectedKey).map((c) => c.rutinaEjercicioId)
      ),
    [completions, selectedKey]
  );

  const totalExercisesSelectedDay = countExercisesForWeekday(routines, selectedWeekday);
  const isSelectedDayDone =
    totalExercisesSelectedDay > 0 && completedIdsForSelectedDay.size >= totalExercisesSelectedDay;

  function isDayDone(date: Date) {
    const key = toDateKey(date);
    const weekday = date.getDay();
    const total = countExercisesForWeekday(routines, weekday);
    if (total === 0) return false;
    const done = completions.filter((c) => c.fecha === key).length;
    return done >= total;
  }

  function handleToggleExercise(exerciseId: string) {
    const isCompleted = completedIdsForSelectedDay.has(exerciseId);
    toggle(exerciseId, selectedKey, isCompleted);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clases</Text>

      <View style={styles.calendarStrip}>
        {days.map((date) => {
          const key = toDateKey(date);
          const isSelected = key === selectedKey;
          const done = isDayDone(date);
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
              {done && (
                <View style={styles.dayDoneBadge}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={classesForSelectedDay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          routinesForSelectedDay.length > 0 ? (
            <View style={styles.routinesForDay}>
              {isSelectedDayDone && (
                <View style={styles.dayDoneBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                  <Text style={styles.dayDoneBannerText}>¡Día completado!</Text>
                </View>
              )}

              {routinesForSelectedDay.map((routine, index) => (
                <View key={`${routine.nombre}-${index}`} style={styles.routineSection}>
                  <Text style={styles.routineTitle}>{routine.nombre}</Text>
                  <ExerciseGroupList
                    groups={routine.groups}
                    onPressVideo={setActiveVideoId}
                    completedIds={completedIdsForSelectedDay}
                    onToggleExercise={handleToggleExercise}
                  />
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          routinesForSelectedDay.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No tenés clases ni rutina programadas este día.
              </Text>
            </View>
          ) : null
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

      <YouTubePlayerModal videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
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
  dayDoneBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
  },
  routinesForDay: {
    marginBottom: 8,
  },
  dayDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dayDoneBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  routineSection: {
    marginBottom: 20,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
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
