alter table public.pedidos
  add column if not exists con_factura boolean not null default false,
  add column if not exists numero_factura text;

create index if not exists pedidos_con_factura_idx
  on public.pedidos (con_factura);
