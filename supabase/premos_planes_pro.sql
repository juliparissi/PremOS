-- PremOS - habilita plan Pro en instalaciones existentes.

alter table public.configuracion_empresa
drop constraint if exists configuracion_empresa_plan_check;

alter table public.configuracion_empresa
add constraint configuracion_empresa_plan_check
check (plan in ('lite', 'full', 'pro'));
