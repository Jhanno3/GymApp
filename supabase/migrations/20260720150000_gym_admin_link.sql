-- Vincula un admin/staff con el gimnasio que administra, para poder mostrarle
-- solo los clientes de ese gimnasio en el panel de staff. Se asigna a mano
-- (update manual) hasta que exista un flujo de onboarding para gimnasios.
alter table public.profiles
  add column if not exists gimnasio_dni numeric references public."Gimnasio" ("DNI");

-- Permite que el admin de un gimnasio vea a los clientes inscriptos en ese gimnasio.
drop policy if exists "Cliente is viewable by gym admin" on public."Cliente";
create policy "Cliente is viewable by gym admin"
  on public."Cliente" for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.gimnasio_dni = "Cliente"."Gimnasio"
    )
  );
