import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type GymCheckIn = {
  id: string;
  checkedInAt: string;
  cliente: {
    DNI: number;
    Nombre: string;
    Apellido: string;
  } | null;
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useGymCheckins(userId: string | undefined) {
  const [checkins, setCheckins] = useState<GymCheckIn[]>([]);
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
      setCheckins([]);
      setIsLoading(false);
      return;
    }

    const { start, end } = todayRange();

    const { data } = await supabase
      .from('Check-In')
      .select('id, checked_in_at, Cliente(DNI, Nombre, Apellido)')
      .eq('gimnasio_dni', gimnasioDni)
      .gte('checked_in_at', start)
      .lt('checked_in_at', end)
      .order('checked_in_at', { ascending: false });

    type Row = {
      id: string;
      checked_in_at: string;
      Cliente: { DNI: number; Nombre: string; Apellido: string } | null;
    };

    setCheckins(
      ((data as unknown as Row[]) ?? []).map((row) => ({
        id: row.id,
        checkedInAt: row.checked_in_at,
        cliente: row.Cliente,
      }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { checkins, isLoading, reload };
}
