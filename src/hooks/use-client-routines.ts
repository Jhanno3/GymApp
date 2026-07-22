import { useCallback, useEffect, useState } from 'react';

import { groupExercises, MuscleGroup, RoutineExercise } from '@/components/exercise-group-list';
import { supabase } from '@/lib/supabase';

export type ClientRoutine = {
  nombre: string;
  diasSemana: number[];
  groups: MuscleGroup[];
};

export function useClientRoutines(userId: string | undefined) {
  const [routines, setRoutines] = useState<ClientRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('Cliente')
      .select(
        'Cliente_rutina(dias_semana, Rutina(nombre, Rutina_ejercicio(grupo_muscular, descripcion, orden, Ejercicio(nombre, video_url))))'
      )
      .eq('user_id', userId)
      .single();

    type Row = {
      Cliente_rutina: {
        dias_semana: number[] | null;
        Rutina: { nombre: string; Rutina_ejercicio: RoutineExercise[] } | null;
      }[];
    };

    const row = data as unknown as Row | null;
    setRoutines(
      (row?.Cliente_rutina ?? [])
        .filter((cr) => cr.Rutina)
        .map((cr) => ({
          nombre: cr.Rutina!.nombre,
          diasSemana: cr.dias_semana ?? [],
          groups: groupExercises(cr.Rutina!.Rutina_ejercicio),
        }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { routines, isLoading, reload };
}
