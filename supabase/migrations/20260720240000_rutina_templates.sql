-- Las rutinas pasan a ser plantillas reutilizables del gimnasio: se pueden
-- crear sin un cliente puntual (biblioteca) y asignar/reasignar a cualquier
-- cliente del gimnasio. assign_rutina se mantiene para el caso "crear una
-- rutina específica para este cliente" desde su propia pantalla.

create or replace function public.create_rutina(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
  new_id uuid;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para crear rutinas.';
  end if;

  insert into public."Rutina" (gimnasio_dni, nombre)
  values (admin_dni, p_nombre)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_rutina(text) to authenticated;

create or replace function public.rename_rutina(p_rutina_id uuid, p_nombre text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para editar rutinas.';
  end if;

  update public."Rutina"
  set nombre = p_nombre
  where id = p_rutina_id and gimnasio_dni = admin_dni;

  if not found then
    raise exception 'Esa rutina no pertenece a tu gimnasio.';
  end if;
end;
$$;

grant execute on function public.rename_rutina(uuid, text) to authenticated;

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
  on conflict (cliente_dni) do update set rutina_id = excluded.rutina_id;
end;
$$;

grant execute on function public.assign_existing_rutina(text, uuid) to authenticated;
