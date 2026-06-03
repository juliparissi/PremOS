-- PremOS - instalador de estructura Supabase
-- Ejecutar en SQL Editor de Supabase para crear las tablas sin datos comerciales.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  mail text,
  cuit text,
  direccion text,
  localidad text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  producto text not null,
  modelo text,
  color text,
  unidad text,
  cantidad numeric not null default 0,
  precio_unitario numeric not null default 0,
  detalles text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.colores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  total numeric not null default 0,
  estado text not null default 'Borrador',
  fecha date,
  observaciones text,
  iva numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.presupuesto_items (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  producto text,
  modelo text,
  color text,
  cantidad numeric not null default 0,
  unidad text,
  precio numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  cliente_id uuid references public.clientes(id) on delete set null,
  presupuesto_id uuid references public.presupuestos(id) on delete set null,
  estado text not null default 'A producir',
  fecha_entrega date,
  saldo_total numeric not null default 0,
  saldo_abonado numeric not null default 0,
  saldo_restante numeric not null default 0,
  estado_pago text not null default 'Pendiente',
  observaciones text,
  fecha_inicio_produccion date,
  con_factura boolean not null default false,
  numero_factura text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  producto_id uuid references public.productos(id) on delete set null,
  producto text,
  modelo text,
  color text,
  cantidad numeric not null default 0,
  unidad text,
  precio numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pagos_pedidos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  monto numeric not null default 0,
  metodo_pago text,
  observaciones text,
  fecha date,
  created_at timestamptz not null default now()
);

create table if not exists public.movimientos_economia (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  concepto text,
  detalle text,
  monto numeric not null default 0,
  monto_total numeric not null default 0,
  monto_abonado numeric not null default 0,
  saldo_pendiente numeric not null default 0,
  fecha date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movimientos_economia_abonos (
  id uuid primary key default gen_random_uuid(),
  movimiento_id uuid not null references public.movimientos_economia(id) on delete cascade,
  monto numeric not null default 0,
  fecha date,
  created_at timestamptz not null default now()
);

create table if not exists public.stock (
  id uuid primary key default gen_random_uuid(),
  producto text not null unique,
  stock_actual numeric not null default 0,
  stock_minimo numeric not null default 0,
  stock_ideal numeric not null default 0,
  stock_maximo numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suministros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  unidad text,
  stock_actual numeric not null default 0,
  stock_minimo numeric not null default 0,
  stock_ideal numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movimientos_suministro (
  id uuid primary key default gen_random_uuid(),
  suministro_id uuid references public.suministros(id) on delete set null,
  tipo text not null default 'Compra',
  cantidad numeric not null default 0,
  proveedor text,
  monto_total numeric not null default 0,
  monto_abonado numeric not null default 0,
  observacion text,
  created_at timestamptz not null default now()
);

create table if not exists public.produccion (
  id uuid primary key default gen_random_uuid(),
  fecha date,
  hora text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produccion_items (
  id uuid primary key default gen_random_uuid(),
  produccion_id uuid not null references public.produccion(id) on delete cascade,
  producto text,
  cantidad numeric not null default 0,
  destino text,
  detalle text,
  created_at timestamptz not null default now()
);

create table if not exists public.notas_rapidas (
  id uuid primary key default gen_random_uuid(),
  nota text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recetas_produccion (
  id uuid primary key default gen_random_uuid(),
  color text not null unique,
  materiales jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.configuracion_empresa (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  localidad text,
  telefono text,
  email text,
  logo text,
  cuit text,
  color_principal text default '#10b981',
  plan text not null default 'full' check (plan in ('lite', 'full')),
  tema text not null default 'dark' check (tema in ('dark', 'light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clientes_nombre_idx on public.clientes(nombre);
create index if not exists productos_nombre_idx on public.productos(producto, modelo, color);
create index if not exists listas_precios_nombre_idx on public.listas_precios(nombre);
create index if not exists lista_precios_items_lista_idx on public.lista_precios_items(lista_id);
create index if not exists lista_precios_items_producto_idx on public.lista_precios_items(producto_id);
create index if not exists presupuestos_cliente_idx on public.presupuestos(cliente_id);
create index if not exists presupuestos_fecha_idx on public.presupuestos(fecha);
create index if not exists pedidos_cliente_idx on public.pedidos(cliente_id);
create index if not exists pedidos_estado_idx on public.pedidos(estado);
create index if not exists pedidos_con_factura_idx on public.pedidos(con_factura);
create unique index if not exists pedidos_presupuesto_unico_idx
on public.pedidos(presupuesto_id)
where presupuesto_id is not null;
create index if not exists movimientos_economia_fecha_idx on public.movimientos_economia(fecha);
create index if not exists movimientos_economia_tipo_idx on public.movimientos_economia(tipo);
create index if not exists movimientos_suministro_suministro_idx on public.movimientos_suministro(suministro_id);
create index if not exists produccion_fecha_idx on public.produccion(fecha);

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists productos_set_updated_at on public.productos;
create trigger productos_set_updated_at
before update on public.productos
for each row execute function public.set_updated_at();

drop trigger if exists listas_precios_set_updated_at on public.listas_precios;
create trigger listas_precios_set_updated_at
before update on public.listas_precios
for each row execute function public.set_updated_at();

drop trigger if exists lista_precios_items_set_updated_at on public.lista_precios_items;
create trigger lista_precios_items_set_updated_at
before update on public.lista_precios_items
for each row execute function public.set_updated_at();

drop trigger if exists colores_set_updated_at on public.colores;
create trigger colores_set_updated_at
before update on public.colores
for each row execute function public.set_updated_at();

drop trigger if exists presupuestos_set_updated_at on public.presupuestos;
create trigger presupuestos_set_updated_at
before update on public.presupuestos
for each row execute function public.set_updated_at();

drop trigger if exists pedidos_set_updated_at on public.pedidos;
create trigger pedidos_set_updated_at
before update on public.pedidos
for each row execute function public.set_updated_at();

drop trigger if exists movimientos_economia_set_updated_at on public.movimientos_economia;
create trigger movimientos_economia_set_updated_at
before update on public.movimientos_economia
for each row execute function public.set_updated_at();

drop trigger if exists stock_set_updated_at on public.stock;
create trigger stock_set_updated_at
before update on public.stock
for each row execute function public.set_updated_at();

drop trigger if exists suministros_set_updated_at on public.suministros;
create trigger suministros_set_updated_at
before update on public.suministros
for each row execute function public.set_updated_at();

drop trigger if exists produccion_set_updated_at on public.produccion;
create trigger produccion_set_updated_at
before update on public.produccion
for each row execute function public.set_updated_at();

drop trigger if exists recetas_produccion_set_updated_at on public.recetas_produccion;
create trigger recetas_produccion_set_updated_at
before update on public.recetas_produccion
for each row execute function public.set_updated_at();

drop trigger if exists configuracion_empresa_set_updated_at on public.configuracion_empresa;
create trigger configuracion_empresa_set_updated_at
before update on public.configuracion_empresa
for each row execute function public.set_updated_at();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clientes',
    'productos',
    'listas_precios',
    'lista_precios_items',
    'colores',
    'presupuestos',
    'presupuesto_items',
    'pedidos',
    'pedido_items',
    'pagos_pedidos',
    'movimientos_economia',
    'movimientos_economia_abonos',
    'stock',
    'suministros',
    'movimientos_suministro',
    'produccion',
    'produccion_items',
    'notas_rapidas',
    'recetas_produccion',
    'configuracion_empresa'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "premos_app_all" on public.%I', table_name);
    execute format(
      'create policy "premos_app_all" on public.%I for all using (true) with check (true)',
      table_name
    );
  end loop;
end $$;
