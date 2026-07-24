import { useCallback, useEffect, useState } from 'react';

import { getSubscriptionStatus, SubscriptionStatus } from '@/lib/subscription-status';
import { supabase } from '@/lib/supabase';

export type ClientMembership = {
  fechaInicio: string | null;
  fechaFin: string | null;
  status: SubscriptionStatus;
};

export function useClientMembership(userId: string | undefined) {
  const [membership, setMembership] = useState<ClientMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('Cliente')
      .select('Cliente_membresia(fecha_inicio, fecha_fin)')
      .eq('user_id', userId)
      .single();

    type Row = {
      Cliente_membresia: { fecha_inicio: string; fecha_fin: string }[];
    };

    const row = data as unknown as Row | null;
    const membresia = row?.Cliente_membresia?.[0];

    setMembership({
      fechaInicio: membresia?.fecha_inicio ?? null,
      fechaFin: membresia?.fecha_fin ?? null,
      status: getSubscriptionStatus(membresia?.fecha_fin),
    });
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { membership, isLoading, reload };
}
