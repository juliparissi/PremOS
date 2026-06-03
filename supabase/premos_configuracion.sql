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
  plan text not null default 'full' check (plan in ('lite', 'full', 'pro')),
  tema text not null default 'dark' check (tema in ('dark', 'light')),
  updated_at timestamptz not null default now()
);
