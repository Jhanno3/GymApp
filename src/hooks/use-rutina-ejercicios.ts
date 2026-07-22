import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type RoutineExercise = {
  id: string;
  grupo_muscular: string | null;
  descripcion: string | null;
  orden: number | null;
  Ejercicio: { id: string; nombre: string; video_url: string | null } | null;
};

export type MuscleGroup = {
  name: string;
  exercises: RoutineExercise[];
};

export function groupExercises(exercises: RoutineExercise[]): MuscleGroup[] {
  const sorted = [...exercises].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const groups: MuscleGroup[] = [];

  for (const exercise of sorted) {
    const name = exercise.grupo_muscular ?? 'Ejercicios';
    const group = groups.find((g) => g.name === name);
    if (group) {
      group.exercises.push(exercise);
    } else {
      groups.push({ name, exercises: [exercise] });
    }
  }

  return groups;
}

export function getYouTubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function useRutinaEjercicios(rutinaId: string | undefined) {
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!rutinaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data } = await supabase
      .from('Rutina_ejercicio')
      .select('id, grupo_muscular, descripcion, orden, Ejercicio(id, nombre, video_url)')
      .eq('rutina_id', rutinaId)
      .order('orden');

    setExercises((data as unknown as RoutineExercise[]) ?? []);
    setIsLoading(false);
  }, [rutinaId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { exercises, isLoading, reload };
}
