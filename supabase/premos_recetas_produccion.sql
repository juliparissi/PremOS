create table if not exists public.recetas_produccion (
  id uuid primary key default gen_random_uuid(),
  color text not null unique,
  materiales jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recetas_produccion enable row level security;

drop policy if exists "Permitir lectura recetas produccion" on public.recetas_produccion;
create policy "Permitir lectura recetas produccion"
on public.recetas_produccion
for select
using (true);

drop policy if exists "Permitir alta recetas produccion" on public.recetas_produccion;
create policy "Permitir alta recetas produccion"
on public.recetas_produccion
for insert
with check (true);

drop policy if exists "Permitir edicion recetas produccion" on public.recetas_produccion;
create policy "Permitir edicion recetas produccion"
on public.recetas_produccion
for update
using (true)
with check (true);
