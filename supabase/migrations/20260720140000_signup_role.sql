-- Permite elegir el rol (cliente o gimnasio/admin) al registrarse.
-- Si no viene un rol válido en el metadata, cae al default 'client' de la tabla.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, dni, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'dni',
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;
