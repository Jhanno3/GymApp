import { useEffect, useState } from 'react';

export function useAppReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // TODO: cargar fuentes, assets y sesión de Supabase acá.
      setIsReady(true);
    }

    prepare();
  }, []);

  return isReady;
}
