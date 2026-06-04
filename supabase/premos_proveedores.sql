-- PremOS - proveedores
-- Ejecutar en SQL Editor de Supabase para habilitar alta y seleccion de proveedores.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  materia_prima text,
  telefono text,
  mail text,
  cuit text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proveedores_nombre_idx
on public.proveedores(nombre);

drop trigger if exists proveedores_set_updated_at on public.proveedores;
create trigger proveedores_set_updated_at
before update on public.proveedores
for each row execute function public.set_updated_at();

alter table public.proveedores enable row level security;

drop policy if exists "premos_app_all" on public.proveedores;
create policy "premos_app_all"
on public.proveedores
for all
using (true)
with check (true);
