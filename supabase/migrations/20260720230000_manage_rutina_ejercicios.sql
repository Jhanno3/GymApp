-- Funciones para que el admin de un gimnasio arme la rutina de sus clientes:
-- crear/renombrar y asignar una rutina, agregarle ejercicios del catálogo
-- global, y sacarle ejercicios. Mismo patrón de seguridad que las demás
-- funciones (security definer + validación manual de pertenencia al gimnasio).

create or replace function public.assign_rutina(p_client_dni text, p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_dni numeric;
  target_dni numeric;
  existing_rutina_id uuid;
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

  select rutina_id into existing_rutina_id
  from public."Cliente_rutina"
  where cliente_dni = target_dni;

  if existing_rutina_id is not null then
    update public."Rutina" set nombre = p_nombre where id = existing_rutina_id;
    return existing_rutina_id;
  end if;

  insert into public."Rutina" (gimnasio_dni, nombre)
  values (admin_dni, p_nombre)
  returning id into new_rutina_id;

  insert into public."Cliente_rutina" (cliente_dni, rutina_id)
  values (target_dni, new_rutina_id);

  return new_rutina_id;
end;
$$;

grant execute on function public.assign_rutina(text, text) to authenticated;

create or replace function public.add_ejercicio_to_rutina(
  p_rutina_id uuid,
  p_ejercicio_id uuid,
  p_grupo_muscular text,
  p_descripcion text,
  p_orden integer default 0
)
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
    raise exception 'No tenés permisos de gimnasio para editar rutinas.';
  end if;

  if not exists (
    select 1 from public."Rutina" r
    where r.id = p_rutina_id and r.gimnasio_dni = admin_dni
  ) then
    raise exception 'Esa rutina no pertenece a tu gimnasio.';
  end if;

  insert into public."Rutina_ejercicio" (rutina_id, ejercicio_id, grupo_muscular, descripcion, orden)
  values (p_rutina_id, p_ejercicio_id, p_grupo_muscular, p_descripcion, p_orden)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.add_ejercicio_to_rutina(uuid, uuid, text, text, integer) to authenticated;

create or replace function public.remove_ejercicio_from_rutina(p_rutina_ejercicio_id uuid)
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

  delete from public."Rutina_ejercicio" re
  using public."Rutina" r
  where re.id = p_rutina_ejercicio_id
    and re.rutina_id = r.id
    and r.gimnasio_dni = admin_dni;
end;
$$;

grant execute on function public.remove_ejercicio_from_rutina(uuid) to authenticated;
