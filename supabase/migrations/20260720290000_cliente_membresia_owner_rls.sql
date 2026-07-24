-- Cliente_membresia solo tenía policy para el admin del gimnasio; el cliente
-- no podía leer su propia membresía (necesario para mostrarle su estado en
-- el Inicio de la app).
drop policy if exists "Cliente_membresia is viewable by owner" on public."Cliente_membresia";
create policy "Cliente_membresia is viewable by owner"
  on public."Cliente_membresia" for select
  to authenticated
  using (
    exists (
      select 1 from public."Cliente" c
      where c."DNI" = "Cliente_membresia".cliente_dni
        and c.user_id = auth.uid()
    )
  );