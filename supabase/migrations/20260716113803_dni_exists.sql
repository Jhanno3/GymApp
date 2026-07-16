-- Permite chequear si un DNI ya está registrado antes de intentar el signUp,
-- para evitar depender del error 500 que devuelve GoTrue cuando el trigger
-- handle_new_user choca con la unique constraint de profiles.dni.
create or replace function public.dni_exists(check_dni text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where dni = check_dni
  );
$$;

grant execute on function public.dni_exists(text) to anon, authenticated;
