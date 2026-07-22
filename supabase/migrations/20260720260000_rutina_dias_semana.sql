-- Cada asignación de rutina a un cliente puede tener uno o varios días de la
-- semana (0=domingo ... 6=sábado, igual que Date.getDay() en JS), para que la
-- pestaña "Clases" del cliente muestre la rutina correspondiente al día
-- seleccionado.
alter table public."Cliente_rutina"
  add column if not exists dias_semana smallint[] not null default '{}';

-- Se agrega un parámetro nuevo a estas dos funciones: hay que borrar las
-- versiones de firma vieja para no dejar overloads ambiguos.
drop function if exists public.assign_rutina(text, text);
drop function if exists public.assign_existing_rutina(text, uuid);

create or replace function public.assign_rutina(
  p_client_dni text,
  p_nombre text,
  p_dias_semana smallint[] default '{}'
)
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

  insert into public."Cliente_rutina" (cliente_dni, rutina_id, dias_semana)
  values (target_dni, new_rutina_id, coalesce(p_dias_semana, '{}'));

  return new_rutina_id;
end;
$$;

create or replace function public.assign_existing_rutina(
  p_client_dni text,
  p_rutina_id uuid,
  p_dias_semana smallint[] default '{}'
)
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

  insert into public."Cliente_rutina" (cliente_dni, rutina_id, dias_semana)
  values (target_dni, p_rutina_id, coalesce(p_dias_semana, '{}'))
  on conflict (cliente_dni, rutina_id) do update set dias_semana = excluded.dias_semana;
end;
$$;

-- Cambia los días asignados a una rutina de un cliente ya vinculada.
create or replace function public.set_rutina_dias(
  p_client_dni text,
  p_rutina_id uuid,
  p_dias_semana smallint[]
)
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

  update public."Cliente_rutina"
  set dias_semana = coalesce(p_dias_semana, '{}')
  where cliente_dni = target_dni and rutina_id = p_rutina_id;

  if not found then
    raise exception 'Esa rutina no está asignada a este cliente.';
  end if;
end;
$$;

grant execute on function public.set_rutina_dias(text, uuid, smallint[]) to authenticated;