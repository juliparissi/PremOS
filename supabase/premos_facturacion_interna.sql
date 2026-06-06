alter table public.pedidos
add column if not exists tipo_comprobante text,
add column if not exists modalidad_comprobante text,
add column if not exists punto_venta text,
add column if not exists cuit_facturacion text,
add column if not exists condicion_iva text,
add column if not exists forma_pago_factura text,
add column if not exists fecha_factura date,
add column if not exists observaciones_factura text,
add column if not exists iva_tratamiento text,
add column if not exists iva_alicuota numeric,
add column if not exists importe_neto numeric,
add column if not exists importe_iva numeric;
