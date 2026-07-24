import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type ExerciseCompletion = {
  rutinaEjercicioId: string;
  fecha: string;
};

export function useExerciseCompletions(
  userId: string | undefined,
  startDate: string,
  endDate: string
) {
  const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
  const [clienteDni, setClienteDni] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data: cliente } = await supabase
      .from('Cliente')
      .select('DNI')
      .eq('user_id', userId)
      .single();

    const dni = cliente?.DNI ?? null;
    setClienteDni(dni);

    if (!dni) {
      setCompletions([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('Ejercicio_completado')
      .select('rutina_ejercicio_id, fecha')
      .eq('cliente_dni', dni)
      .gte('fecha', startDate)
      .lte('fecha', endDate);

    type Row = { rutina_ejercicio_id: string; fecha: string };
    setCompletions(
      ((data as Row[]) ?? []).map((row) => ({
        rutinaEjercicioId: row.rutina_ejercicio_id,
        fecha: row.fecha,
      }))
    );
    setIsLoading(false);
  }, [userId, startDate, endDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function toggle(rutinaEjercicioId: string, fecha: string, isCompleted: boolean) {
    if (!clienteDni) return;

    if (isCompleted) {
      setCompletions((prev) =>
        prev.filter((c) => !(c.rutinaEjercicioId === rutinaEjercicioId && c.fecha === fecha))
      );
      await supabase
        .from('Ejercicio_completado')
        .delete()
        .eq('cliente_dni', clienteDni)
        .eq('rutina_ejercicio_id', rutinaEjercicioId)
        .eq('fecha', fecha);
    } else {
      setCompletions((prev) => [...prev, { rutinaEjercicioId, fecha }]);
      await supabase
        .from('Ejercicio_completado')
        .insert({ cliente_dni: clienteDni, rutina_ejercicio_id: rutinaEjercicioId, fecha });
    }
  }

  return { completions, isLoading, toggle };
}
