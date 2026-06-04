-- PremOS - limite mensual de consultas IA
-- Ejecutar en SQL Editor de Supabase si el sistema ya estaba instalado.

create table if not exists public.ia_consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  periodo text not null,
  mensaje text,
  created_at timestamptz not null default now()
);

create index if not exists ia_consultas_user_periodo_idx
on public.ia_consultas(user_id, periodo);

create index if not exists ia_consultas_periodo_idx
on public.ia_consultas(periodo);

alter table public.ia_consultas enable row level security;

drop policy if exists "premos_app_all" on public.ia_consultas;
create policy "premos_app_all" on public.ia_consultas
for all using (true) with check (true);
