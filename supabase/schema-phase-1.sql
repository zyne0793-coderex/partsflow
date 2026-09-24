-- PartsFlow Phase 1: each signed-in account owns its own catalog.
create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  part_number text not null check (length(trim(part_number)) between 1 and 80),
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '' check (length(description) <= 2000),
  category text not null default '' check (length(category) <= 80),
  manufacturer text not null default '' check (length(manufacturer) <= 120),
  storage_location text not null default '' check (length(storage_location) <= 120),
  unit text not null default 'pcs' check (unit in ('pcs', 'set', 'box', 'm', 'L', 'kg')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists parts_owner_number_unique
  on public.parts (owner_id, lower(part_number));
create index if not exists parts_owner_created_idx
  on public.parts (owner_id, created_at desc);

alter table public.parts enable row level security;
revoke all on public.parts from anon;
grant select, insert, update on public.parts to authenticated;

create policy "Read own parts" on public.parts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Add own parts" on public.parts for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Edit own parts" on public.parts for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
