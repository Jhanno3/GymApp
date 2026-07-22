-- El registro ahora pide Nombre/s, Apellido y Teléfono por separado (en vez
-- de un solo "Nombre completo"), para poder llenar Cliente.Nombre/Apellido/
-- Telefono correctamente. profiles.full_name se sigue completando como
-- concatenación de nombre + apellido para no romper pantallas existentes.
-- Además, un registro con rol 'client' ahora crea directamente su fila en
-- Cliente (sin Gimnasio asignado todavía), en vez de esperar a que un admin
-- lo agregue con add_cliente_to_gimnasio.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text;
  signup_nombre text;
  signup_apellido text;
  signup_telefono numeric;
  owner_dni numeric;
  client_dni numeric;
begin
  signup_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  signup_nombre := new.raw_user_meta_data ->> 'nombre';
  signup_apellido := new.raw_user_meta_data ->> 'apellido';
  signup_telefono := nullif(new.raw_user_meta_data ->> 'telefono', '')::numeric;

  insert into public.profiles (id, dni, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'dni',
    nullif(trim(concat_ws(' ', signup_nombre, signup_apellido)), ''),
    signup_role
  );

  if signup_role = 'admin' then
    owner_dni := (new.raw_user_meta_data ->> 'dni')::numeric;

    insert into public."Gimnasio" ("DNI", "Nombre", "direccion", "qr_code_value")
    values (
      owner_dni,
      new.raw_user_meta_data ->> 'gym_name',
      new.raw_user_meta_data ->> 'gym_address',
      'GYM-' || (new.raw_user_meta_data ->> 'dni')
    );
  elsif signup_role = 'client' then
    client_dni := (new.raw_user_meta_data ->> 'dni')::numeric;

    insert into public."Cliente" ("DNI", "Nombre", "Apellido", "Telefono", email, user_id)
    values (client_dni, signup_nombre, signup_apellido, signup_telefono, new.email, new.id)
    on conflict ("DNI") do update
    set "Nombre" = excluded."Nombre",
        "Apellido" = excluded."Apellido",
        "Telefono" = coalesce(excluded."Telefono", public."Cliente"."Telefono"),
        email = excluded.email,
        user_id = excluded.user_id;
  end if;

  return new;
end;
$$;
