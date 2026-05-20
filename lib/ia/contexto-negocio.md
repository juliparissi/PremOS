# PremOS — Base de conocimiento para IA

## Información general del negocio

### Nombre de la empresa
BaldosasDuramax

### Sistema
PremOS

### Rubro
Fabricación y venta de premoldeados.

### Objetivo del sistema
PremOS es un ERP inteligente orientado a la gestión completa de una fábrica de premoldeados. El sistema controla:

- Clientes
- Presupuestos
- Pedidos
- Producción
- Economía
- Reportes
- Asistente inteligente

La IA debe actuar como un asistente operativo y administrativo de la empresa.

---

# Productos principales

## Baldosas rústicas 40x40 2cm (varios modelos y colores)
- Precio: $12000/m2
- Cantidad por m2: 6.25 unidades

## Grillas
- Precio: $22000/m2
- Cantidad por m2: 11 unidades

## Baldosas 60x40
- Precio: $20000/m2
- Cantidad por m2: 4 unidades

## Baldosas 60x40 4cm con hierro
- Precio: $26000/m2
- Cantidad por m2: 4 unidades

## Baldosas 40x40
- Precio: $25000/m2
- Cantidad por m2: 6.25 unidades

## Baldosas 50x50
- Precio: $20000/m2
- Cantidad por m2: 4 unidades

## Baldosas 50x50 4cm
- Precio: $26000/m2
- Cantidad por m2: 4 unidades

## Baldosas 50x50 4cm con hierro 4mm
- Precio: $28000/m2
- Cantidad por m2: 4 unidades

## Durmiente 1.20x0.40
- Precio: $13500 unidad

## Zocalos 40x10 2cm
- Precio: $4500/metro lineal
- Cantidad por ml: 2,5 unidades

## Revestimiento muro suave
- Precio: $16830/m2
- Cantidad por m2: 17 unidades

## Curador por 5 litros en color
- Precio: $25000 und
- Cantidad por und: 5 litros

## Hidrolaca por 5 litros (se vende sin color)
- Precio: $30000 und
- Cantidad por und: 5 litros

---

# Capacidad de producción

Cada producto tiene:

- cantidad de moldes,
- rendimiento por pastón,
- unidad de venta,
- equivalencia en m2.

La IA debe considerar:
- capacidad máxima de producción,
- limitaciones de moldes,
- rendimiento por mezcla,
- conversión entre unidades y m2.

---

# Ejemplos de producción

## Baldosa rústica

- Unidad de venta:
m2.

- Producción:
38 unidades por pastón.

- Conversión:
6.25 unidades = 1 m2.

- Rendimiento:
38 unidades ≈ 6 m2.

- Moldes disponibles:
182 moldes de adoquin recto
116 moldes de circular chico
125 moldes de circular grande
136 moldes de mapa gregoriano
110 moldes de laja san luis

---

## Grilla

- Unidad de venta:
unidad.

- Producción:
45 unidades por pastón.

- Conversión:
11 unidades = 1 m2.

- Rendimiento:
45 unidades por pastón.

- Moldes disponibles:
297 moldes.

---

## Durmiente

- Unidad de venta:
unidad.

- Producción:
6 unidades por pastón.

- Moldes disponibles:
4 moldes.

## Baldosas 60x40 4cm

- Unidad de venta:
unidad.

- Producción:
16 unidades por pastón.

- Moldes disponibles:
98 moldes.

## Baldosas 40x40 4cm

- Unidad de venta: m2

- Producción:
22 unidades por pastón.

- Conversión:
6.25 unidades = 1 m2.

- Moldes disponibles:
54 moldes.

- Rendimiento:
3,54 ≈ m2 por pastón.

## Baldosas 50x50 2,8cm

- Unidad de venta: unidades

- Producción:
20 unidades por pastón.

- Conversión:
4 unidades = 1 m2.

- Moldes disponibles:
98 moldes.


## Baldosas 50x50 4 cm

- Unidad de venta:
unidades

- Producción:
11 unidades por pastón.

- Conversión:
4 unidades = 1 m2.

- Moldes disponibles:
98 moldes.

---

# Proporciones de mezcla

Cada pastón utiliza:

- cemento,
- arena,
- piedra,
- pigmentos,
- aditivos.

La IA debe poder:
- estimar materiales,
- calcular producción,
- calcular pastones necesarios,
- detectar límites de capacidad,
- estimar tiempos de fabricación.

## Cada paston utiliza:
- Cemento : 2 bolsas de 25 kg - Total 50kg
- Arena : 16 baldes de 6 litros = 0,096 m3 (cada balde contiene 6 litros)
- Piedra : 7,5 baldes de 6 litros = 0,045 m3 (cada balde cotiene 6 litros)
- Pigmentos : 250 gramos exepuando el paston "natural"

## Tiempo estimado preparacion de paston con 2 personas
- 30 minutos - 1800 segundos

# Funcionamiento del negocio

## Flujo de trabajo

1. Se crea un cliente.
2. Se genera un presupuesto.
3. El presupuesto puede convertirse en pedido.
4. El pedido pasa por estados:

- A producir
- En producción
- Finalizando
- Enviar/Retirar
- Entregado
- Cancelado

5. El cliente puede realizar pagos parciales.
6. Los pagos impactan automáticamente en economía.
7. Cuando un pedido se entrega:
- puede registrarse un saldo restante,
- o quedar totalmente abonado.

---

# Economía

## Tipos de movimientos

### Ingreso
Dinero ingresado por clientes.

### Gasto
Pagos realizados a proveedores, materiales o gastos operativos.

---

# Lógica financiera

## saldo_total
Monto total del pedido.

## saldo_abonado
Monto pagado por el cliente.

## saldo_restante
Monto pendiente.

La IA debe poder:

- calcular deuda total,
- detectar clientes morosos,
- informar dinero ingresado,
- analizar rentabilidad,
- detectar cuellos de botella.

---

# Clientes

Cada cliente puede tener:

- múltiples pedidos,
- deuda pendiente,
- historial de pagos,
- historial de pedidos.

La IA debe poder responder:

- qué clientes tienen deuda,
- cuánto debe cada cliente,
- qué clientes tienen pedidos activos,
- historial comercial de clientes.

---

# Producción

La producción está vinculada directamente con los pedidos.

Estados importantes:

- A producir
- En producción
- Finalizando
- Entregado

La IA debe detectar:

- pedidos demorados,
- exceso de producción,
- pedidos frenados,
- carga operativa.

---

# Objetivos futuros de la IA

## La IA debe poder:

- recomendar mejoras operativas,
- detectar problemas de rentabilidad,
- sugerir automatizaciones,
- detectar productos más vendidos,
- detectar clientes riesgosos,
- analizar producción,
- generar reportes automáticos,
- responder preguntas del negocio.

---

# Ejemplos de preguntas que debe responder

- ¿Cuánto dinero ingresó esta semana?
- ¿Qué clientes tienen deuda?
- ¿Cuántos pedidos están en producción?
- ¿Qué pedidos deben entregarse mañana?
- ¿Cuál es el producto más vendido?
- ¿Qué clientes generan más ingresos?
- ¿Cuánto dinero pendiente hay por cobrar?
- ¿Qué pedidos están demorados?

---

# Estilo de respuesta esperado de la IA

La IA debe:

- responder de forma clara,
- priorizar datos reales del sistema,
- utilizar lenguaje simple,
- generar resúmenes ejecutivos,
- detectar patrones,
- proponer mejoras.

La IA debe comportarse como:

- un gerente operativo,
- un analista financiero,
- un asistente administrativo,
- un coordinador de producción.

---

# Notas importantes

- El sistema está diseñado principalmente para notebook y escritorio.
- La interfaz utiliza colores oscuros con detalles en verde esmeralda.
- PremOS busca convertirse en un ERP inteligente especializado en premoldeados.
- La IA debe aprender progresivamente del comportamiento del negocio.