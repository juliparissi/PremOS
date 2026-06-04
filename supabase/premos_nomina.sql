-- PremOS - modulo Nomina
-- Ejecutar en SQL Editor de Supabase si el sistema ya estaba instalado.

create table if not exists public.nomina_empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  dni text,
  cuil text,
  telefono text,
  mail text,
  puesto text,
  fecha_ingreso date,
  sueldo_base numeric not null default 0,
  estado text not null default 'Activo',
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nomina_movimientos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.nomina_empleados(id) on delete cascade,
  tipo text not null default 'Adelanto',
  periodo text,
  monto numeric not null default 0,
  metodo_pago text,
  observaciones text,
  fecha date,
  economia_movimiento_id uuid references public.movimientos_economia(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nomina_empleados_nombre_idx on public.nomina_empleados(nombre);
create index if not exists nomina_empleados_estado_idx on public.nomina_empleados(estado);
create index if not exists nomina_movimientos_empleado_idx on public.nomina_movimientos(empleado_id);
create index if not exists nomina_movimientos_fecha_idx on public.nomina_movimientos(fecha);
create index if not exists nomina_movimientos_tipo_idx on public.nomina_movimientos(tipo);

drop trigger if exists nomina_empleados_set_updated_at on public.nomina_empleados;
create trigger nomina_empleados_set_updated_at
before update on public.nomina_empleados
for each row execute function public.set_updated_at();

drop trigger if exists nomina_movimientos_set_updated_at on public.nomina_movimientos;
create trigger nomina_movimientos_set_updated_at
before update on public.nomina_movimientos
for each row execute function public.set_updated_at();

alter table public.nomina_empleados enable row level security;
alter table public.nomina_movimientos enable row level security;

drop policy if exists "premos_app_all" on public.nomina_empleados;
create policy "premos_app_all" on public.nomina_empleados
for all using (true) with check (true);

drop policy if exists "premos_app_all" on public.nomina_movimientos;
create policy "premos_app_all" on public.nomina_movimientos
for all using (true) with check (true);
