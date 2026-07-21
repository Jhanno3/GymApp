-- Permite que el admin de un gimnasio vincule (por DNI) a un cliente que ya
-- se registró en la app. Corre como security definer para no necesitar
-- policies de insert/update en Cliente desde el cliente de la app.
create or replace function public.add_cliente_to_gimnasio(client_dni text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  admin_dni numeric;
  client_profile record;
  client_email text;
begin
  select p.dni::numeric into admin_dni
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin';

  if admin_dni is null then
    raise exception 'No tenés permisos de gimnasio para agregar clientes.';
  end if;

  if not exists (select 1 from public."Gimnasio" g where g."DNI" = admin_dni) then
    raise exception 'Tu cuenta todavía no tiene un gimnasio asignado.';
  end if;

  select p.id, p.full_name into client_profile
  from public.profiles p
  where p.dni = client_dni and p.role = 'client';

  if client_profile.id is null then
    raise exception 'No encontramos un cliente registrado con ese DNI.';
  end if;

  if exists (
    select 1 from public."Cliente" c
    where c."DNI" = client_dni::numeric and c."Gimnasio" is not null and c."Gimnasio" <> admin_dni
  ) then
    raise exception 'Ese cliente ya está inscripto en otro gimnasio.';
  end if;

  if exists (select 1 from public."Cliente" c where c."DNI" = client_dni::numeric) then
    update public."Cliente"
    set "Gimnasio" = admin_dni
    where "DNI" = client_dni::numeric;
  else
    select email into client_email from auth.users where id = client_profile.id;

    insert into public."Cliente" ("DNI", "Nombre", "Gimnasio", email, user_id)
    values (client_dni::numeric, client_profile.full_name, admin_dni, client_email, client_profile.id);
  end if;
end;
$$;

grant execute on function public.add_cliente_to_gimnasio(text) to authenticated;
