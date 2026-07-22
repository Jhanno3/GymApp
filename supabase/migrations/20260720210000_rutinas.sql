-- Rutinas de entrenamiento, creadas por un gimnasio y asignadas a un cliente.
-- Por ahora la creación/asignación se hace a mano (SQL); solo se construye
-- la lectura del lado del cliente.
create table if not exists public."Rutina" (
  id uuid primary key default gen_random_uuid(),
  gimnasio_dni numeric references public."Gimnasio" ("DNI"),
  nombre text not null,
  video_url text,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists public."Cliente_rutina" (
  id uuid primary key default gen_random_uuid(),
  cliente_dni numeric not null references public."Cliente" ("DNI") on delete cascade,
  rutina_id uuid not null references public."Rutina" (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cliente_dni)
);

alter table public."Rutina" enable row level security;
alter table public."Cliente_rutina" enable row level security;

-- El cliente puede ver la rutina que tiene asignada.
create policy "Rutina is viewable by assigned client"
  on public."Rutina" for select
  to authenticated
  using (
    exists (
      select 1
      from public."Cliente_rutina" cr
      join public."Cliente" c on c."DNI" = cr.cliente_dni
      where cr.rutina_id = "Rutina".id
        and c.user_id = auth.uid()
    )
  );

-- El admin del gimnasio dueño de la rutina también puede verla.
create policy "Rutina is viewable by gym admin"
  on public."Rutina" for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.dni is not null
        and p.dni ~ '^[0-9]+$'
        and p.dni::numeric = "Rutina".gimnasio_dni
    )
  );

create policy "Cliente_rutina is viewable by owner"
  on public."Cliente_rutina" for select
  to authenticated
  using (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = "Cliente_rutina".cliente_dni
        and c.user_id = auth.uid()
    )
  );

create policy "Cliente_rutina is viewable by gym admin"
  on public."Cliente_rutina" for select
  to authenticated
  using (
    exists (
      select 1
      from public."Cliente" c
      join public.profiles p on p.dni is not null and p.dni ~ '^[0-9]+$' and p.dni::numeric = c."Gimnasio"
      where c."DNI" = "Cliente_rutina".cliente_dni
        and p.id = auth.uid()
        and p.role = 'admin'
    )
  );