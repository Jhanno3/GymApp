-- Permite que un usuario borre su propia cuenta. Al ser security definer con
-- acceso al schema auth, puede borrar de auth.users (algo que un usuario
-- autenticado normal no podría hacer directo).
--
-- Cliente: borra su historial propio (Check-In, Cliente_membresia,
-- Cliente_rutina) y su fila de Cliente.
--
-- Admin: borra todo lo que pertenece a su Gimnasio (Rutina_ejercicio,
-- Cliente_rutina de esas rutinas, Rutina, Membresia, Check-In del gimnasio),
-- desvincula (no borra) a sus clientes poniéndoles Gimnasio en null, y borra
-- el Gimnasio.
--
-- En ambos casos, al final borra profiles (via cascade) y el usuario de auth.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_uid uuid := auth.uid();
  current_role text;
  current_dni numeric;
begin
  if current_uid is null then
    raise exception 'No hay una sesión activa.';
  end if;

  select p.role, (case when p.dni ~ '^[0-9]+$' then p.dni::numeric else null end)
  into current_role, current_dni
  from public.profiles p
  where p.id = current_uid;

  if current_role = 'admin' and current_dni is not null then
    update public."Cliente" set "Gimnasio" = null where "Gimnasio" = current_dni;

    delete from public."Rutina_ejercicio"
    where rutina_id in (select id from public."Rutina" where gimnasio_dni = current_dni);

    delete from public."Cliente_rutina"
    where rutina_id in (select id from public."Rutina" where gimnasio_dni = current_dni);

    delete from public."Membresia" where gimnasio_dni = current_dni;
    delete from public."Check-In" where gimnasio_dni = current_dni;
    delete from public."Rutina" where gimnasio_dni = current_dni;
    delete from public."Gimnasio" where "DNI" = current_dni;
  elsif current_role = 'client' and current_dni is not null then
    delete from public."Check-In" where cliente_dni = current_dni;
    delete from public."Cliente_membresia" where cliente_dni = current_dni;
    delete from public."Cliente_rutina" where cliente_dni = current_dni;
    delete from public."Cliente" where "DNI" = current_dni;
  end if;

  delete from auth.users where id = current_uid;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
