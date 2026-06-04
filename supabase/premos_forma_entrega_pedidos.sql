-- PremOS - forma de entrega en pedidos
-- Ejecutar en SQL Editor de Supabase si el sistema ya estaba instalado.

alter table public.pedidos
add column if not exists forma_entrega text not null default 'Retiro de fabrica';

update public.pedidos
set forma_entrega = 'Retiro de fabrica'
where forma_entrega is null or trim(forma_entrega) = '';
