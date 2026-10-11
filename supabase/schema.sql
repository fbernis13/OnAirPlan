-- Carnet On Air : schéma Supabase.
-- À exécuter une fois dans Supabase > SQL Editor.
-- Chaque compte ne lit et n'écrit que sa propre progression et ses sauvegardes.
-- La bibliothèque et le carnet partagés se lisent par tout compte connecté
-- et ne se modifient que par un administrateur (table roles).

create table if not exists public.roles (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'membre'))
);

create table if not exists public.progression (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  kind text primary key check (kind in ('bibliotheque', 'carnet')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users on delete set null
);

create table if not exists public.sauvegardes (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  label text,
  data jsonb not null,
  primary key (user_id, id)
);

alter table public.roles enable row level security;
alter table public.progression enable row level security;
alter table public.documents enable row level security;
alter table public.sauvegardes enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.roles where user_id = auth.uid() and role = 'admin') $$;

drop policy if exists "roles: lire le sien" on public.roles;
create policy "roles: lire le sien" on public.roles for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "progression: la sienne" on public.progression;
create policy "progression: la sienne" on public.progression for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "sauvegardes: les siennes" on public.sauvegardes;
create policy "sauvegardes: les siennes" on public.sauvegardes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "documents: lecture" on public.documents;
create policy "documents: lecture" on public.documents for select to authenticated using (true);
drop policy if exists "documents: ajout admin" on public.documents;
create policy "documents: ajout admin" on public.documents for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "documents: modif admin" on public.documents;
create policy "documents: modif admin" on public.documents for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "documents: suppression admin" on public.documents;
create policy "documents: suppression admin" on public.documents for delete to authenticated using ((select public.is_admin()));

-- Après avoir créé l'utilisateur dans Authentication > Users, le rendre administrateur
-- (remplace l'adresse par celle du compte créé) :
-- insert into public.roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'ADRESSE@EXEMPLE.FR'
--   on conflict (user_id) do update set role = excluded.role;
