-- Un cliente ahora puede tener varias rutinas asignadas a la vez (antes
-- unique(cliente_dni) forzaba una sola). Se cambia por unique(cliente_dni,
-- rutina_id) para solo evitar asignar la misma rutina dos veces al mismo
-- cliente.
alter table public."Cliente_rutina"
  drop constraint if exists "Cliente_rutina_cliente_dni_key";

alter table public."Cliente_rutina"
  add constraint "Cliente_rutina_cliente_dni_rutina_id_key" unique (cliente_dni, rutina_id);

-- "Crear rutina nueva para este cliente" ahora siempre crea una rutina
-- independiente (antes, si el cliente ya tenía una, la renombraba en vez de
-- crear otra).
create or replace function public.assign_rutina(p_client_dni text, p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
  target_dni numeric;
  new_rutina_id uuid;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para asignar rutinas.';
  end if;

  target_dni := p_client_dni::numeric;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = target_dni and c."Gimnasio" = admin_dni
  ) then
    raise exception 'Ese cliente no pertenece a tu gimnasio.';
  end if;

  insert into public."Rutina" (gimnasio_dni, nombre)
  values (admin_dni, p_nombre)
  returning id into new_rutina_id;

  insert into public."Cliente_rutina" (cliente_dni, rutina_id)
  values (target_dni, new_rutina_id);

  return new_rutina_id;
end;
$$;

-- assign_existing_rutina ahora agrega la rutina a la lista del cliente en
-- vez de reemplazar la única que tenía (no hace nada si ya la tenía asignada).
create or replace function public.assign_existing_rutina(p_client_dni text, p_rutina_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
  target_dni numeric;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para asignar rutinas.';
  end if;

  target_dni := p_client_dni::numeric;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = target_dni and c."Gimnasio" = admin_dni
  ) then
    raise exception 'Ese cliente no pertenece a tu gimnasio.';
  end if;

  if not exists (
    select 1 from public."Rutina" r
    where r.id = p_rutina_id and r.gimnasio_dni = admin_dni
  ) then
    raise exception 'Esa rutina no pertenece a tu gimnasio.';
  end if;

  insert into public."Cliente_rutina" (cliente_dni, rutina_id)
  values (target_dni, p_rutina_id)
  on conflict (cliente_dni, rutina_id) do nothing;
end;
$$;

-- Saca una rutina puntual de la lista de un cliente (sin tocar sus otras rutinas).
create or replace function public.unassign_rutina(p_client_dni text, p_rutina_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
  target_dni numeric;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para editar rutinas.';
  end if;

  target_dni := p_client_dni::numeric;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = target_dni and c."Gimnasio" = admin_dni
  ) then
    raise exception 'Ese cliente no pertenece a tu gimnasio.';
  end if;

  delete from public."Cliente_rutina"
  where cliente_dni = target_dni and rutina_id = p_rutina_id;
end;
$$;

grant execute on function public.unassign_rutina(text, uuid) to authenticated;
