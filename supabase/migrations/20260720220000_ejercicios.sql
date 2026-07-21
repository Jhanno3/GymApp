-- Catálogo global de ejercicios (nombre + video), compartido entre todos los
-- gimnasios. Una Rutina ahora es un contenedor (nombre) que agrupa varios
-- ejercicios asignados vía Rutina_ejercicio, cada uno con su propia
-- descripción (ej. "4x10") y grupo muscular (ej. "Pecho").
-- Se sacan Rutina.video_url y Rutina.descripcion: ese contenido ahora vive
-- por ejercicio, no por rutina entera.

create table if not exists public."Ejercicio" (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  video_url text,
  created_at timestamptz not null default now()
);

alter table public."Rutina"
  drop column if exists video_url,
  drop column if exists descripcion;

create table if not exists public."Rutina_ejercicio" (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public."Rutina" (id) on delete cascade,
  ejercicio_id uuid not null references public."Ejercicio" (id) on delete restrict,
  grupo_muscular text,
  descripcion text,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public."Ejercicio" enable row level security;
alter table public."Rutina_ejercicio" enable row level security;

-- Catálogo global: cualquier autenticado puede leerlo (no es información sensible).
create policy "Ejercicio is viewable by authenticated users"
  on public."Ejercicio" for select
  to authenticated
  using (true);

create policy "Rutina_ejercicio is viewable by assigned client"
  on public."Rutina_ejercicio" for select
  to authenticated
  using (
    exists (
      select 1
      from public."Cliente_rutina" cr
      join public."Cliente" c on c."DNI" = cr.cliente_dni
      where cr.rutina_id = "Rutina_ejercicio".rutina_id
        and c.user_id = auth.uid()
    )
  );

create policy "Rutina_ejercicio is viewable by gym admin"
  on public."Rutina_ejercicio" for select
  to authenticated
  using (
    exists (
      select 1
      from public."Rutina" r
      join public.profiles p on p.dni is not null and p.dni ~ '^[0-9]+$' and p.dni::numeric = r.gimnasio_dni
      where r.id = "Rutina_ejercicio".rutina_id
        and p.id = auth.uid()
        and p.role = 'admin'
    )
  );
