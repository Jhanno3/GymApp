import { useCallback, useEffect, useState } from 'react';

import { getSubscriptionStatus, SubscriptionStatus } from '@/lib/subscription-status';
import { supabase } from '@/lib/supabase';

export type { SubscriptionStatus };

export type Gym = {
  DNI: number;
  Nombre: string;
  direccion: string | null;
  qr_code_value: string;
};

export type Client = {
  DNI: number;
  Nombre: string;
  Apellido: string;
  Telefono: number | null;
  email: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  status: SubscriptionStatus;
};

export function useGymClients(userId: string | undefined) {
  const [gym, setGym] = useState<Gym | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
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
      setGym(null);
      setClients([]);
      setIsLoading(false);
      return;
    }

    const [{ data: gymData }, { data: clientsData }] = await Promise.all([
      supabase
        .from('Gimnasio')
        .select('DNI, Nombre, direccion, qr_code_value')
        .eq('DNI', gimnasioDni)
        .single(),
      supabase
        .from('Cliente')
        .select('DNI, Nombre, Apellido, Telefono, email, Cliente_membresia(fecha_inicio, fecha_fin)')
        .eq('Gimnasio', gimnasioDni)
        .order('Apellido', { ascending: true }),
    ]);

    type ClientRow = Omit<Client, 'status' | 'fechaInicio' | 'fechaFin'> & {
      Cliente_membresia: { fecha_inicio: string; fecha_fin: string }[];
    };

    setGym((gymData as Gym) ?? null);
    setClients(
      ((clientsData as ClientRow[]) ?? []).map(({ Cliente_membresia, ...client }) => {
        const membresia = Cliente_membresia?.[0];
        return {
          ...client,
          fechaInicio: membresia?.fecha_inicio ?? null,
          fechaFin: membresia?.fecha_fin ?? null,
          status: getSubscriptionStatus(membresia?.fecha_fin),
        };
      })
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { gym, clients, isLoading, reload };
}
