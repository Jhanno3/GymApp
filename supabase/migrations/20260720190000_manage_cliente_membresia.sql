-- Permite que el admin de un gimnasio renueve la membresía de un cliente
-- (+1 mes) y desvincule a un cliente de su gimnasio, ambas restringidas a
-- clientes que pertenezcan a su propio gimnasio.

create or replace function public.renew_cliente_membresia(client_dni text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  admin_dni numeric;
  target_dni numeric;
  current_row public."Cliente_membresia"%rowtype;
  fallback_membresia_id uuid;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para actualizar membresías.';
  end if;

  target_dni := client_dni::numeric;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = target_dni and c."Gimnasio" = admin_dni
  ) then
    raise exception 'Ese cliente no pertenece a tu gimnasio.';
  end if;

  select * into current_row
  from public."Cliente_membresia"
  where cliente_dni = target_dni
  limit 1;

  if found then
    update public."Cliente_membresia"
    set fecha_fin = (greatest(current_row.fecha_fin, current_date) + interval '1 month')::date,
        estado = 'activa'
    where id = current_row.id;
  else
    select id into fallback_membresia_id
    from public."Membresia"
    where gimnasio_dni = admin_dni
    limit 1;

    insert into public."Cliente_membresia" (cliente_dni, membresia_id, fecha_inicio, fecha_fin, estado)
    values (target_dni, fallback_membresia_id, current_date, (current_date + interval '1 month')::date, 'activa');
  end if;
end;
$$;

grant execute on function public.renew_cliente_membresia(text) to authenticated;

create or replace function public.remove_cliente_from_gimnasio(client_dni text)
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
    raise exception 'No tenés permisos de gimnasio para quitar clientes.';
  end if;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = client_dni::numeric and c."Gimnasio" = admin_dni
  ) then
    raise exception 'Ese cliente no pertenece a tu gimnasio.';
  end if;

  update public."Cliente"
  set "Gimnasio" = null
  where "DNI" = client_dni::numeric;
end;
$$;

grant execute on function public.remove_cliente_from_gimnasio(text) to authenticated;
