-- Gimnasio.DNI es el DNI del dueño (no un ID autogenerado), el mismo valor
-- que ya se guarda en profiles.dni. Por eso profiles.gimnasio_dni quedaba
-- redundante: se revierte y en su lugar se usa profiles.dni::numeric como
-- vínculo hacia Gimnasio.DNI.

drop policy if exists "Cliente is viewable by gym admin" on public."Cliente";

alter table public.profiles
  drop column if exists gimnasio_dni;

create policy "Cliente is viewable by gym admin"
  on public."Cliente" for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.dni is not null
        and p.dni ~ '^[0-9]+$'
        and p.dni::numeric = "Cliente"."Gimnasio"
    )
  );

-- Al registrarse como 'admin', crea el Gimnasio automáticamente usando el
-- DNI del dueño como PK, y el nombre/dirección que cargó en el formulario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text;
  owner_dni numeric;
begin
  signup_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');

  insert into public.profiles (id, dni, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'dni',
    new.raw_user_meta_data ->> 'full_name',
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
  end if;

  return new;
end;
$$;
