-- Perfiles de usuario, uno por cada auth.users, con DNI para permitir login por DNI o mail.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  dni text unique,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Crea el profile automáticamente cuando se registra un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, dni, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'dni',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Resuelve el mail real a partir de un DNI o mail para poder loguear con signInWithPassword.
create or replace function public.resolve_login_email(identifier text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select coalesce(
    (select email from auth.users where email = identifier),
    (
      select u.email
      from auth.users u
      join public.profiles p on p.id = u.id
      where p.dni = identifier
    )
  );
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
