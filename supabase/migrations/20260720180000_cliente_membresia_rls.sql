-- Cliente_membresia tiene RLS habilitado pero sin policies (no devuelve datos
-- por la Data API). Permite que el admin de un gimnasio lea las membresías
-- de sus propios clientes, para poder mostrar el estado (vigente/por vencer/sin membresía).
drop policy if exists "Cliente_membresia is viewable by gym admin" on public."Cliente_membresia";
create policy "Cliente_membresia is viewable by gym admin"
  on public."Cliente_membresia" for select
  to authenticated
  using (
    exists (
      select 1
      from public."Cliente" c
      join public.profiles p on p.dni is not null and p.dni ~ '^[0-9]+$' and p.dni::numeric = c."Gimnasio"
      where c."DNI" = "Cliente_membresia".cliente_dni
        and p.id = auth.uid()
        and p.role = 'admin'
    )
  );
