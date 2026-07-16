import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

export function useSession() {
  const [session, setSession] = useState<Session>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}
