import { ClientRoutine } from '@/hooks/use-client-routines';

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function countExercisesForWeekday(routines: ClientRoutine[], weekday: number) {
  return routines
    .filter((routine) => routine.diasSemana.includes(weekday))
    .reduce((total, routine) => total + routine.groups.flatMap((g) => g.exercises).length, 0);
}

/** Domingo a sábado de la semana actual (la barra se reinicia cada domingo). */
export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  sunday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return date;
  });
}
