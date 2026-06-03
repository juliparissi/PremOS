-- PremOS - modulo Lista de precios
-- Ejecutar en SQL Editor de Supabase si el sistema ya esta instalado.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.listas_precios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lista_precios_items (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas_precios(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  producto text not null,
  precio_unitario numeric not null default 0,
  precio_m2 numeric not null default 0,
  observaciones text,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listas_precios_nombre_idx on public.listas_precios(nombre);
create index if not exists lista_precios_items_lista_idx on public.lista_precios_items(lista_id);
create index if not exists lista_precios_items_producto_idx on public.lista_precios_items(producto_id);

drop trigger if exists listas_precios_set_updated_at on public.listas_precios;
create trigger listas_precios_set_updated_at
before update on public.listas_precios
for each row execute function public.set_updated_at();

drop trigger if exists lista_precios_items_set_updated_at on public.lista_precios_items;
create trigger lista_precios_items_set_updated_at
before update on public.lista_precios_items
for each row execute function public.set_updated_at();

alter table public.listas_precios enable row level security;
drop policy if exists "premos_app_all" on public.listas_precios;
create policy "premos_app_all" on public.listas_precios
for all using (true) with check (true);

alter table public.lista_precios_items enable row level security;
drop policy if exists "premos_app_all" on public.lista_precios_items;
create policy "premos_app_all" on public.lista_precios_items
for all using (true) with check (true);
