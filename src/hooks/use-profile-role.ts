import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type ProfileRole = 'admin' | 'client';

export function useProfileRole(userId: string | undefined) {
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setRole((data?.role as ProfileRole | undefined) ?? null);
        setIsLoading(false);
      });
  }, [userId]);

  return { role, isLoading };
}
