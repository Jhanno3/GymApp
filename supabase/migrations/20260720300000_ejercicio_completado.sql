-- Marca qué ejercicios completó un cliente en una fecha puntual (no por
-- rutina en general, sino por día calendario), para poder mostrar el
-- tildado en la pestaña Clases y detectar cuándo un día quedó terminado.
create table if not exists public."Ejercicio_completado" (
  id uuid primary key default gen_random_uuid(),
  cliente_dni numeric not null references public."Cliente" ("DNI") on delete cascade,
  rutina_ejercicio_id uuid not null references public."Rutina_ejercicio" (id) on delete cascade,
  fecha date not null,
  completed_at timestamptz not null default now(),
  unique (cliente_dni, rutina_ejercicio_id, fecha)
);

alter table public."Ejercicio_completado" enable row level security;

drop policy if exists "Ejercicio_completado is viewable by owner" on public."Ejercicio_completado";
create policy "Ejercicio_completado is viewable by owner"
  on public."Ejercicio_completado" for select
  to authenticated
  using (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = cliente_dni and c.user_id = auth.uid()
    )
  );

drop policy if exists "Ejercicio_completado is insertable by owner" on public."Ejercicio_completado";
create policy "Ejercicio_completado is insertable by owner"
  on public."Ejercicio_completado" for insert
  to authenticated
  with check (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = cliente_dni and c.user_id = auth.uid()
    )
  );

drop policy if exists "Ejercicio_completado is deletable by owner" on public."Ejercicio_completado";
create policy "Ejercicio_completado is deletable by owner"
  on public."Ejercicio_completado" for delete
  to authenticated
  using (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = cliente_dni and c.user_id = auth.uid()
    )
  );
