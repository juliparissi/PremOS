create table if not exists public.configuracion_fiscal (
  id uuid primary key default gen_random_uuid(),
  razon_social text,
  nombre_fantasia text,
  cuit text,
  condicion_iva text default 'Responsable Monotributo',
  ingresos_brutos text,
  fecha_inicio_actividades date,
  domicilio_fiscal text,
  domicilio_comercial text,
  punto_venta text default '0001',
  tipo_comprobante_default text default 'Factura C',
  modalidad_comprobante text default 'Electronica ARCA',
  alicuota_iva numeric default 21,
  ambiente_arca text default 'Homologacion',
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists configuracion_fiscal_set_updated_at on public.configuracion_fiscal;
create trigger configuracion_fiscal_set_updated_at
before update on public.configuracion_fiscal
for each row execute function public.set_updated_at();

alter table public.configuracion_fiscal enable row level security;

drop policy if exists "premos_app_all" on public.configuracion_fiscal;
create policy "premos_app_all"
on public.configuracion_fiscal
for all
using (true)
with check (true);
