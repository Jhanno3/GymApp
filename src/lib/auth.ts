import { supabase } from '@/lib/supabase';

export async function signInWithIdentifier(identifier: string, password: string) {
  const { data: email, error: resolveError } = await supabase.rpc('resolve_login_email', {
    identifier: identifier.trim(),
  });

  if (resolveError) {
    throw new Error('No pudimos validar tus datos. Probá de nuevo.');
  }

  if (!email) {
    throw new Error('No encontramos una cuenta con ese DNI o mail.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error('DNI/mail o contraseña incorrectos.');
  }
}

type RegisterInput = {
  nombre: string;
  apellido: string;
  telefono?: string;
  dni: string;
  email: string;
  password: string;
  role: 'client' | 'admin';
  gymName?: string;
  gymAddress?: string;
};

export async function registerWithEmail({
  nombre,
  apellido,
  telefono,
  dni,
  email,
  password,
  role,
  gymName,
  gymAddress,
}: RegisterInput) {
  const { data: dniTaken, error: dniCheckError } = await supabase.rpc('dni_exists', {
    check_dni: dni.trim(),
  });

  if (dniCheckError) {
    throw new Error('No pudimos validar el DNI. Probá de nuevo.');
  }

  if (dniTaken) {
    throw new Error('Ya existe una cuenta con ese DNI.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono?.trim() || null,
        dni: dni.trim(),
        role,
        ...(role === 'admin' && {
          gym_name: gymName?.trim(),
          gym_address: gymAddress?.trim(),
        }),
      },
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('already registered') || message.includes('already exists')) {
      throw new Error('Ya existe una cuenta con ese mail.');
    }
    if (message.includes('dni')) {
      throw new Error('Ya existe una cuenta con ese DNI.');
    }
    if (message.includes('rate limit')) {
      throw new Error('Se alcanzó el límite de mails de confirmación. Esperá unos minutos e intentá de nuevo.');
    }
    throw new Error('No pudimos crear la cuenta. Probá de nuevo.');
  }

  return { needsEmailConfirmation: !data.session };
}
