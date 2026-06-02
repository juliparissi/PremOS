# PremOS - Master plan de instalacion comercial

Este checklist sirve para montar PremOS rapido para un cliente nuevo, sin recrear tablas a mano y sin copiar datos de otro negocio.

## 1. Relevamiento inicial

- [ ] Nombre comercial del cliente.
- [ ] CUIT o identificacion fiscal.
- [ ] Direccion, localidad, telefono y email.
- [ ] Logo en PNG/JPG.
- [ ] Rubro y tipo de productos que fabrica/vende.
- [ ] Plan contratado: Lite o Full.
- [ ] Dominio o subdominio deseado, por ejemplo `app.empresa.com`.
- [ ] Usuario/email de acceso inicial.
- [ ] Fecha estimada de entrega: 24/48 hs habiles.

## 2. Crear proyecto en Supabase

- [ ] Crear proyecto nuevo en Supabase.
- [ ] Guardar `Project URL`.
- [ ] Guardar `anon public key`.
- [ ] Guardar `service_role key`.
- [ ] Ir a SQL Editor.
- [ ] Ejecutar el archivo `supabase/premos_schema_instalacion.sql`.
- [ ] Verificar que se hayan creado las tablas:
  - [ ] `clientes`
  - [ ] `productos`
  - [ ] `colores`
  - [ ] `presupuestos`
  - [ ] `presupuesto_items`
  - [ ] `pedidos`
  - [ ] `pedido_items`
  - [ ] `pagos_pedidos`
  - [ ] `movimientos_economia`
  - [ ] `movimientos_economia_abonos`
  - [ ] `stock`
  - [ ] `suministros`
  - [ ] `movimientos_suministro`
  - [ ] `produccion`
  - [ ] `produccion_items`
  - [ ] `notas_rapidas`
  - [ ] `recetas_produccion`
  - [ ] `configuracion_empresa`

## 3. Configurar autenticacion

- [ ] Crear usuario inicial del cliente en Supabase Auth.
- [ ] Confirmar email si Supabase lo requiere.
- [ ] Definir contrasena inicial.
- [ ] Probar login en PremOS.
- [ ] Cambiar contrasena desde Configuracion si corresponde.

## 4. Preparar entorno de la app

- [ ] Clonar PremOS desde GitHub en el VPS.
- [ ] Crear archivo `.env.local` o `.env`.
- [ ] Cargar variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

- [ ] Si el cliente no usa IA, dejar OpenAI configurado solo si el plan lo requiere.
- [ ] Ejecutar instalacion:

```bash
npm install
npm run build
```

## 5. Publicar en VPS

- [ ] Configurar proceso con PM2.
- [ ] Iniciar o reiniciar PremOS:

```bash
pm2 restart premos
```

- [ ] Si es primera instalacion:

```bash
pm2 start npm --name premos -- start
pm2 save
```

- [ ] Configurar Nginx o proxy hacia el puerto de Next.js.
- [ ] Configurar SSL con el dominio/subdominio.
- [ ] Probar acceso publico.

## 6. Configuracion inicial dentro de PremOS

- [ ] Iniciar sesion con usuario del cliente.
- [ ] Ir a Configuracion.
- [ ] Cargar datos de empresa.
- [ ] Cargar logo.
- [ ] Elegir plan Lite o Full.
- [ ] Elegir tema claro u oscuro.
- [ ] Cargar productos iniciales.
- [ ] Cargar colores.
- [ ] Cargar suministros principales.
- [ ] Configurar recetas de produccion por color.
- [ ] Configurar stock minimo/ideal/maximo si aplica.

## 7. Pruebas funcionales

- [ ] Crear cliente de prueba.
- [ ] Crear producto de prueba.
- [ ] Crear presupuesto.
- [ ] Generar PDF de presupuesto.
- [ ] Convertir presupuesto a pedido.
- [ ] Registrar pago.
- [ ] Confirmar que aparezca ingreso en Economia.
- [ ] Marcar pedido con factura y numero.
- [ ] Registrar suministro.
- [ ] Registrar produccion.
- [ ] Confirmar descuento de materias primas.
- [ ] Generar track de produccion.
- [ ] Revisar Reportes y descargar PDF.
- [ ] Probar Resumen y filtros de KPIs.

## 8. Entrega al cliente

- [ ] Confirmar URL final.
- [ ] Entregar usuario y contrasena temporal.
- [ ] Recomendar cambio de contrasena.
- [ ] Enviar mini guia de uso.
- [ ] Acordar canal de soporte.
- [ ] Registrar fecha de inicio de abono.
- [ ] Registrar fecha de vencimiento mensual.

## 9. Checklist comercial mensual

- [ ] Revisar estado de pago del cliente.
- [ ] Confirmar funcionamiento del VPS.
- [ ] Revisar uso de OpenAI si aplica.
- [ ] Revisar backups del VPS/Supabase si el plan lo incluye.
- [ ] Registrar cambios solicitados por el cliente.
- [ ] Evaluar si corresponde upgrade de Lite a Full.

## 10. Notas importantes

- El archivo `premos_schema_instalacion.sql` crea estructura, no datos.
- No copiar datos de un cliente a otro.
- No subir `.env.local` a GitHub.
- No subir carpetas `backups/`.
- Para instalaciones comerciales, usar un proyecto Supabase separado por cliente o una estrategia multi-tenant cuando se implemente el panel de licencias.
