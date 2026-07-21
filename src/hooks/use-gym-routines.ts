import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type GymRoutine = {
  id: string;
  nombre: string;
  exerciseCount: number;
};

export function useGymRoutines(userId: string | undefined) {
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('dni')
      .eq('id', userId)
      .single();

    const gimnasioDni = profile?.dni ? Number(profile.dni) : null;
    if (!gimnasioDni || Number.isNaN(gimnasioDni)) {
      setRoutines([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('Rutina')
      .select('id, nombre, Rutina_ejercicio(id)')
      .eq('gimnasio_dni', gimnasioDni)
      .order('nombre');

    type Row = { id: string; nombre: string; Rutina_ejercicio: { id: string }[] };
    setRoutines(
      ((data as Row[]) ?? []).map((row) => ({
        id: row.id,
        nombre: row.nombre,
        exerciseCount: row.Rutina_ejercicio?.length ?? 0,
      }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { routines, isLoading, reload };
}
