-- Check-In tenía RLS habilitado (implícito por el resto de las tablas del
-- proyecto) sin policies. Se agrega la lectura para el admin del gimnasio, y
-- una función para que el cliente registre su propio check-in escaneando el
-- QR del gimnasio (valida que el QR sea de SU gimnasio antes de insertar).
alter table public."Check-In" enable row level security;

drop policy if exists "Check-In is viewable by gym admin" on public."Check-In";
drop policy if exists "Check-In is viewable by owner" on public."Check-In";

create policy "Check-In is viewable by gym admin"
  on public."Check-In" for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.dni is not null
        and p.dni ~ '^[0-9]+$'
        and p.dni::numeric = "Check-In".gimnasio_dni
    )
  );

create policy "Check-In is viewable by owner"
  on public."Check-In" for select
  to authenticated
  using (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = "Check-In".cliente_dni
        and c.user_id = auth.uid()
    )
  );

create or replace function public.check_in(p_qr_code_value text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  client_dni numeric;
  gym_dni numeric;
  gym_name text;
begin
  select c."DNI" into client_dni
  from public."Cliente" c
  where c.user_id = auth.uid();

  if client_dni is null then
    raise exception 'Tu cuenta todavía no está vinculada a ningún gimnasio.';
  end if;

  select g."DNI", g."Nombre" into gym_dni, gym_name
  from public."Gimnasio" g
  where g.qr_code_value = p_qr_code_value;

  if gym_dni is null then
    raise exception 'Ese código QR no corresponde a ningún gimnasio.';
  end if;

  if not exists (
    select 1 from public."Cliente" c
    where c."DNI" = client_dni and c."Gimnasio" = gym_dni
  ) then
    raise exception 'Ese código QR no es de tu gimnasio.';
  end if;

  insert into public."Check-In" (cliente_dni, gimnasio_dni, checked_in_at)
  values (client_dni, gym_dni, now());

  return gym_name;
end;
$$;

grant execute on function public.check_in(text) to authenticated;
