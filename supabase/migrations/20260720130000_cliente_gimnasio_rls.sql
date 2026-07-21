-- Cliente y Gimnasio tienen RLS habilitado pero sin policies, por lo que la
-- Data API no devuelve nada. Agrega la lectura mínima que necesita la app:
-- cada cliente ve su propia fila, y cualquier autenticado puede ver los
-- gimnasios (son datos no sensibles: nombre, dirección, qr_code_value).

drop policy if exists "Cliente is viewable by owner" on public."Cliente";
create policy "Cliente is viewable by owner"
  on public."Cliente" for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Gimnasio is viewable by authenticated users" on public."Gimnasio";
create policy "Gimnasio is viewable by authenticated users"
  on public."Gimnasio" for select
  to authenticated
  using (true);
