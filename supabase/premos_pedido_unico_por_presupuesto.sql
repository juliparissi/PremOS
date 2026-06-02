create unique index if not exists pedidos_presupuesto_unico_idx
on public.pedidos(presupuesto_id)
where presupuesto_id is not null;
