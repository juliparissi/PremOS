"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../lib/supabase";
import { RECETAS } from "@/lib/recetas";
import { generarPDFReporte } from "../../utils/generarPDF";

type ReporteTipo =
  | "completo"
  | "finanzas"
  | "ingresos-gastos"
  | "ventas"
  | "cobranzas"
  | "clientes"
  | "presupuestos"
  | "productos"
  | "stock"
  | "produccion"
  | "suministros"
  | "rentabilidad";

type Cliente = {
  id: string;
  nombre: string;
};

type Pedido = {
  id: string;
  numero: string;
  cliente_id: string | null;
  estado: string | null;
  estado_pago: string | null;
  saldo_total: number | null;
  saldo_abonado: number | null;
  saldo_restante: number | null;
  created_at: string | null;
  fecha_entrega: string | null;
};

type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  producto: string | null;
  modelo: string | null;
  color: string | null;
  cantidad: number | null;
  unidad: string | null;
  precio: number | null;
  total: number | null;
};

type Presupuesto = {
  id: string;
  numero: string;
  cliente_id: string | null;
  total: number | null;
  estado: string | null;
  fecha: string | null;
  created_at: string | null;
};

type Movimiento = {
  id: string;
  tipo: string | null;
  concepto: string | null;
  detalle: string | null;
  fecha: string | null;
  monto_total: number | null;
  monto_abonado: number | null;
  saldo_pendiente: number | null;
};

type StockItem = {
  id: string;
  producto: string;
  stock_actual: number | null;
  stock_minimo: number | null;
  stock_ideal: number | null;
  stock_maximo: number | null;
};

type Suministro = {
  id: string;
  nombre: string;
  unidad: string | null;
  stock_actual: number | null;
  stock_minimo: number | null;
  stock_ideal: number | null;
};

type MovimientoSuministro = {
  id: string;
  suministro_id: string | null;
  tipo: string | null;
  cantidad: number | null;
  proveedor: string | null;
  monto_total: number | null;
  monto_abonado: number | null;
  created_at: string | null;
};

type Produccion = {
  id: string;
  fecha: string | null;
  hora: string | null;
  color: string | null;
  created_at: string | null;
};

type ProduccionItem = {
  id: string;
  produccion_id: string;
  producto: string | null;
  cantidad: number | null;
  destino: string | null;
  detalle: string | null;
};

type ReportRow = {
  fecha: string;
  tipo: string;
  concepto: string;
  total: number;
  abonado: number;
  pendiente: number;
};

type RankingRow = {
  nombre: string;
  cantidad: number;
  total: number;
  detalle?: string;
};

type StockRow = {
  nombre: string;
  actual: number;
  minimo: number;
  ideal: number;
  estado: string;
  unidad?: string;
};

type RentabilidadRow = {
  producto: string;
  cantidad: number;
  ventas: number;
  costoEstimado: number;
  rentabilidad: number;
  margen: number;
};

type RecetaMaterial = {
  nombre: string;
  cantidad: number;
  unidad: string;
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function toNumber(value: number | null | undefined) {
  return Number(value || 0);
}

function formatMoney(value: number) {
  return money.format(value);
}

function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 3,
  });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstDayOfMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function formatDate(value: string) {
  if (!value) return "-";

  return value.split("T")[0].split("-").reverse().join("/");
}

function isInsideRange(value: string | null, desde: string, hasta: string) {
  if (!value) return false;

  const date = value.split("T")[0];

  return date >= desde && date <= hasta;
}

function productName(item: {
  producto?: string | null;
  modelo?: string | null;
  color?: string | null;
}) {
  return [item.producto, item.modelo, item.color].filter(Boolean).join(" - ");
}

function recetaDesdeArchivo() {
  return Object.entries(RECETAS).reduce<Record<string, RecetaMaterial[]>>(
    (acc, [color, receta]) => {
      const materiales: RecetaMaterial[] = [
        {
          nombre: "Cemento",
          cantidad: receta.cemento_bolsas,
          unidad: "bolsas",
        },
        {
          nombre: "Arena",
          cantidad: receta.arena_kg,
          unidad: "kg",
        },
        {
          nombre: "Piedra",
          cantidad: receta.piedra_kg,
          unidad: "kg",
        },
      ];

      if ("ferrite" in receta && receta.ferrite) {
        materiales.push({
          nombre: receta.ferrite.nombre,
          cantidad: receta.ferrite.gramos,
          unidad: "gramos",
        });
      }

      acc[color] = materiales;
      return acc;
    },
    {}
  );
}

function downloadCsv(rows: ReportRow[]) {
  const header = [
    "Fecha",
    "Tipo",
    "Concepto",
    "Total",
    "Abonado",
    "Pendiente",
  ];

  const csvRows = rows.map((row) => [
    row.fecha,
    row.tipo,
    row.concepto,
    row.total,
    row.abonado,
    row.pendiente,
  ]);

  const csv = [header, ...csvRows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `reporte-premos-${today()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const [desde, setDesde] = useState(firstDayOfMonth());
  const [hasta, setHasta] = useState(today());
  const [menuDescarga, setMenuDescarga] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoItems, setPedidoItems] = useState<PedidoItem[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [suministros, setSuministros] = useState<Suministro[]>([]);
  const [movimientosSuministro, setMovimientosSuministro] = useState<
    MovimientoSuministro[]
  >([]);
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [produccionItems, setProduccionItems] = useState<ProduccionItem[]>([]);
  const [recetas, setRecetas] =
    useState<Record<string, RecetaMaterial[]>>(recetaDesdeArchivo());
  const [cargando, setCargando] = useState(true);

  async function cargarReportes() {
    setCargando(true);

    const [
      { data: clientesData },
      { data: pedidosData },
      { data: pedidoItemsData },
      { data: presupuestosData },
      { data: movimientosData },
      { data: stockData },
      { data: suministrosData },
      { data: movimientosSuministroData },
      { data: produccionesData },
      { data: produccionItemsData },
      { data: recetasData },
    ] = await Promise.all([
      supabase.from("clientes").select("id,nombre"),
      supabase
        .from("pedidos")
        .select(
          "id,numero,cliente_id,estado,estado_pago,saldo_total,saldo_abonado,saldo_restante,created_at,fecha_entrega"
        ),
      supabase
        .from("pedido_items")
        .select(
          "id,pedido_id,producto_id,producto,modelo,color,cantidad,unidad,precio,total"
        ),
      supabase
        .from("presupuestos")
        .select("id,numero,cliente_id,total,estado,fecha,created_at"),
      supabase
        .from("movimientos_economia")
        .select(
          "id,tipo,concepto,detalle,fecha,monto_total,monto_abonado,saldo_pendiente"
        ),
      supabase
        .from("stock")
        .select("id,producto,stock_actual,stock_minimo,stock_ideal,stock_maximo"),
      supabase
        .from("suministros")
        .select("id,nombre,unidad,stock_actual,stock_minimo,stock_ideal"),
      supabase
        .from("movimientos_suministro")
        .select(
          "id,suministro_id,tipo,cantidad,proveedor,monto_total,monto_abonado,created_at"
        ),
      supabase.from("produccion").select("id,fecha,hora,color,created_at"),
      supabase
        .from("produccion_items")
        .select("id,produccion_id,producto,cantidad,destino,detalle"),
      supabase.from("recetas_produccion").select("color,materiales"),
    ]);

    setClientes((clientesData || []) as Cliente[]);
    setPedidos((pedidosData || []) as Pedido[]);
    setPedidoItems((pedidoItemsData || []) as PedidoItem[]);
    setPresupuestos((presupuestosData || []) as Presupuesto[]);
    setMovimientos((movimientosData || []) as Movimiento[]);
    setStock((stockData || []) as StockItem[]);
    setSuministros((suministrosData || []) as Suministro[]);
    setMovimientosSuministro(
      (movimientosSuministroData || []) as MovimientoSuministro[]
    );
    setProducciones((produccionesData || []) as Produccion[]);
    setProduccionItems((produccionItemsData || []) as ProduccionItem[]);

    if (recetasData?.length) {
      setRecetas({
        ...recetaDesdeArchivo(),
        ...recetasData.reduce<Record<string, RecetaMaterial[]>>((acc, item) => {
          acc[item.color] = item.materiales || [];
          return acc;
        }, {}),
      });
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarReportes();
  }, []);

  const clientesPorId = useMemo(() => {
    return new Map(clientes.map((cliente) => [cliente.id, cliente.nombre]));
  }, [clientes]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) =>
      isInsideRange(pedido.created_at || pedido.fecha_entrega, desde, hasta)
    );
  }, [pedidos, desde, hasta]);

  const pedidoIdsFiltrados = useMemo(() => {
    return new Set(pedidosFiltrados.map((pedido) => pedido.id));
  }, [pedidosFiltrados]);

  const pedidoItemsFiltrados = useMemo(() => {
    return pedidoItems.filter((item) => pedidoIdsFiltrados.has(item.pedido_id));
  }, [pedidoItems, pedidoIdsFiltrados]);

  const presupuestosFiltrados = useMemo(() => {
    return presupuestos.filter((presupuesto) =>
      isInsideRange(presupuesto.fecha || presupuesto.created_at, desde, hasta)
    );
  }, [presupuestos, desde, hasta]);

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((movimiento) =>
      isInsideRange(movimiento.fecha, desde, hasta)
    );
  }, [movimientos, desde, hasta]);

  const produccionesFiltradas = useMemo(() => {
    return producciones.filter((produccion) =>
      isInsideRange(produccion.fecha || produccion.created_at, desde, hasta)
    );
  }, [producciones, desde, hasta]);

  const produccionIdsFiltrados = useMemo(() => {
    return new Set(produccionesFiltradas.map((produccion) => produccion.id));
  }, [produccionesFiltradas]);

  const produccionItemsFiltrados = useMemo(() => {
    return produccionItems.filter((item) =>
      produccionIdsFiltrados.has(item.produccion_id)
    );
  }, [produccionItems, produccionIdsFiltrados]);

  const ingresos = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo?.toLowerCase() === "ingreso")
    .reduce((acc, movimiento) => acc + toNumber(movimiento.monto_abonado), 0);

  const gastos = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo?.toLowerCase() === "gasto")
    .reduce((acc, movimiento) => acc + toNumber(movimiento.monto_abonado), 0);

  const utilidad = ingresos - gastos;

  const ventasGeneradas = pedidosFiltrados.reduce(
    (acc, pedido) => acc + toNumber(pedido.saldo_total),
    0
  );

  const ventasCobradas = pedidosFiltrados.reduce(
    (acc, pedido) => acc + toNumber(pedido.saldo_abonado),
    0
  );

  const ventasPendientes = pedidosFiltrados.reduce(
    (acc, pedido) => acc + toNumber(pedido.saldo_restante),
    0
  );

  const ticketPromedio =
    pedidosFiltrados.length === 0
      ? 0
      : ventasGeneradas / pedidosFiltrados.length;

  const totalPresupuestos = presupuestosFiltrados.reduce(
    (acc, presupuesto) => acc + toNumber(presupuesto.total),
    0
  );

  const presupuestosAceptados = presupuestosFiltrados.filter(
    (presupuesto) => presupuesto.estado === "Aceptado"
  );

  const tasaConversion =
    presupuestosFiltrados.length === 0
      ? 0
      : (presupuestosAceptados.length / presupuestosFiltrados.length) * 100;

  const clientesConPedidos = new Set(
    pedidosFiltrados
      .map((pedido) => pedido.cliente_id)
      .filter((clienteId): clienteId is string => Boolean(clienteId))
  );

  const topClientes = Array.from(
    pedidosFiltrados.reduce((map, pedido) => {
      const clienteId = pedido.cliente_id || "sin-cliente";
      const actual = map.get(clienteId) || {
        clienteId,
        pedidos: 0,
        total: 0,
        pendiente: 0,
      };

      map.set(clienteId, {
        clienteId,
        pedidos: actual.pedidos + 1,
        total: actual.total + toNumber(pedido.saldo_total),
        pendiente: actual.pendiente + toNumber(pedido.saldo_restante),
      });

      return map;
    }, new Map<string, { clienteId: string; pedidos: number; total: number; pendiente: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const productosMasVendidos: RankingRow[] = Array.from(
    pedidoItemsFiltrados.reduce((map, item) => {
      const nombre = productName(item) || "Producto sin identificar";
      const actual = map.get(nombre) || {
        nombre,
        cantidad: 0,
        total: 0,
      };

      map.set(nombre, {
        nombre,
        cantidad: actual.cantidad + toNumber(item.cantidad),
        total: actual.total + toNumber(item.total),
      });

      return map;
    }, new Map<string, RankingRow>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8);

  const produccionPorProducto: RankingRow[] = Array.from(
    produccionItemsFiltrados.reduce((map, item) => {
      const nombre = item.producto || "Producto sin identificar";
      const actual = map.get(nombre) || {
        nombre,
        cantidad: 0,
        total: 0,
        detalle: item.destino || "-",
      };

      map.set(nombre, {
        ...actual,
        cantidad: actual.cantidad + toNumber(item.cantidad),
      });

      return map;
    }, new Map<string, RankingRow>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 8);

  const produccionPorColor: RankingRow[] = Array.from(
    produccionesFiltradas.reduce((map, produccion) => {
      const color = produccion.color || "Sin color";
      const cantidad = produccionItems
        .filter((item) => item.produccion_id === produccion.id)
        .reduce((acc, item) => acc + toNumber(item.cantidad), 0);
      const actual = map.get(color) || {
        nombre: color,
        cantidad: 0,
        total: 0,
      };

      map.set(color, {
        ...actual,
        cantidad: actual.cantidad + cantidad,
      });

      return map;
    }, new Map<string, RankingRow>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.cantidad - a.cantidad);

  const stockDisponible: StockRow[] = stock
    .map((item) => {
      const actual = toNumber(item.stock_actual);
      const minimo = toNumber(item.stock_minimo);
      const ideal = toNumber(item.stock_ideal);
      const maximo = toNumber(item.stock_maximo);
      let estado = "Optimo";

      if (minimo > 0 && actual <= minimo) estado = "Critico";
      else if (ideal > 0 && actual < ideal) estado = "Bajo";
      else if (maximo > 0 && actual > maximo) estado = "Sobrestock";

      return {
        nombre: item.producto,
        actual,
        minimo,
        ideal,
        estado,
      };
    })
    .sort((a, b) => a.actual - b.actual);

  const suministrosCriticos: StockRow[] = suministros
    .map((item) => {
      const actual = toNumber(item.stock_actual);
      const minimo = toNumber(item.stock_minimo);
      const ideal = toNumber(item.stock_ideal);
      let estado = "Optimo";

      if (minimo > 0 && actual <= minimo) estado = "Critico";
      else if (ideal > 0 && actual < ideal) estado = "Bajo";

      return {
        nombre: item.nombre,
        unidad: item.unidad || "",
        actual,
        minimo,
        ideal,
        estado,
      };
    })
    .sort((a, b) => {
      const orden = { Critico: 0, Bajo: 1, Optimo: 2 };
      return orden[a.estado as keyof typeof orden] - orden[b.estado as keyof typeof orden];
    });

  const costoPromedioMaterial = useMemo(() => {
    return movimientosSuministro.reduce((map, movimiento) => {
      if (!movimiento.suministro_id) return map;

      const actual = map.get(movimiento.suministro_id) || {
        cantidad: 0,
        total: 0,
      };

      map.set(movimiento.suministro_id, {
        cantidad: actual.cantidad + toNumber(movimiento.cantidad),
        total: actual.total + toNumber(movimiento.monto_total),
      });

      return map;
    }, new Map<string, { cantidad: number; total: number }>());
  }, [movimientosSuministro]);

  const costoPromedioPorNombre = useMemo(() => {
    const map = new Map<string, number>();

    suministros.forEach((suministro) => {
      const compra = costoPromedioMaterial.get(suministro.id);

      if (!compra || compra.cantidad === 0) return;

      map.set(suministro.nombre.toLowerCase(), compra.total / compra.cantidad);
    });

    return map;
  }, [suministros, costoPromedioMaterial]);

  const rentabilidadProductos: RentabilidadRow[] = productosMasVendidos.map(
    (producto) => {
      const itemBase = pedidoItemsFiltrados.find(
        (item) => (productName(item) || "Producto sin identificar") === producto.nombre
      );
      const receta = itemBase?.color ? recetas[itemBase.color] || [] : [];
      const costoUnitario = receta.reduce((acc, material) => {
        const costo = costoPromedioPorNombre.get(material.nombre.toLowerCase()) || 0;
        return acc + costo * toNumber(material.cantidad);
      }, 0);
      const costoEstimado = costoUnitario * producto.cantidad;
      const rentabilidad = producto.total - costoEstimado;
      const margen = producto.total === 0 ? 0 : (rentabilidad / producto.total) * 100;

      return {
        producto: producto.nombre,
        cantidad: producto.cantidad,
        ventas: producto.total,
        costoEstimado,
        rentabilidad,
        margen,
      };
    }
  );

  const movimientosReporte: ReportRow[] = movimientosFiltrados
    .map((movimiento) => ({
      fecha: movimiento.fecha || "",
      tipo: movimiento.tipo || "-",
      concepto: movimiento.concepto || movimiento.detalle || "-",
      total: toNumber(movimiento.monto_total),
      abonado: toNumber(movimiento.monto_abonado),
      pendiente: toNumber(movimiento.saldo_pendiente),
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const ventasReporte: ReportRow[] = pedidosFiltrados
    .map((pedido) => ({
      fecha: pedido.created_at || pedido.fecha_entrega || "",
      tipo: pedido.estado || "-",
      concepto: `Pedido ${pedido.numero} - ${
        clientesPorId.get(pedido.cliente_id || "") || "Cliente sin identificar"
      }`,
      total: toNumber(pedido.saldo_total),
      abonado: toNumber(pedido.saldo_abonado),
      pendiente: toNumber(pedido.saldo_restante),
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const cobranzasReporte = movimientosReporte.filter(
    (movimiento) => movimiento.tipo.toLowerCase() === "ingreso"
  );

  function descargarReporte(tipo: ReporteTipo) {
    generarPDFReporte({
      tipo,
      desde,
      hasta,
      ingresos,
      gastos,
      utilidad,
      ventasGeneradas,
      ventasCobradas,
      ventasPendientes,
      ticketPromedio,
      pedidos: pedidosFiltrados.length,
      clientesActivos: clientesConPedidos.size,
      presupuestosGenerados: presupuestosFiltrados.length,
      presupuestosAceptados: presupuestosAceptados.length,
      totalPresupuestos,
      tasaConversion,
      mejoresClientes: topClientes.map((cliente) => ({
        cliente:
          clientesPorId.get(cliente.clienteId) || "Cliente sin identificar",
        pedidos: cliente.pedidos,
        total: cliente.total,
        pendiente: cliente.pendiente,
      })),
      productosMasVendidos,
      stockDisponible,
      suministrosCriticos,
      produccionPorProducto,
      produccionPorColor,
      rentabilidadProductos,
      movimientos: movimientosReporte,
      ventasDetalle: ventasReporte,
      cobranzasDetalle: cobranzasReporte,
    });

    setMenuDescarga(false);
  }

  const reportesDisponibles: Array<{ label: string; tipo: ReporteTipo }> = [
    { label: "Reporte completo", tipo: "completo" },
    { label: "Ingresos y gastos", tipo: "ingresos-gastos" },
    { label: "Ventas", tipo: "ventas" },
    { label: "Cobranzas", tipo: "cobranzas" },
    { label: "Rentabilidad estimada", tipo: "rentabilidad" },
    { label: "Productos mas vendidos", tipo: "productos" },
    { label: "Stock disponible", tipo: "stock" },
    { label: "Produccion", tipo: "produccion" },
    { label: "Suministros", tipo: "suministros" },
    { label: "Mejores clientes", tipo: "clientes" },
    { label: "Presupuestos", tipo: "presupuestos" },
  ];

  return (
    <>
      <BackButton />

      <div className="pb-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-zinc-500 mt-1">
              Indicadores comerciales, financieros, operativos y de rentabilidad
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <DateInput label="Desde" value={desde} onChange={setDesde} />
            <DateInput label="Hasta" value={hasta} onChange={setHasta} />

            <div className="flex items-end gap-3">
              <button
                onClick={cargarReportes}
                className="bg-white/5 hover:bg-white/10 transition px-4 py-3 rounded-2xl border border-white/5"
              >
                Actualizar
              </button>

              <button
                onClick={() => downloadCsv(movimientosReporte)}
                className="bg-white/5 hover:bg-white/10 transition px-4 py-3 rounded-2xl border border-white/5"
              >
                CSV
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuDescarga((abierto) => !abierto)}
                  className="bg-emerald-500 hover:bg-emerald-400 transition px-4 py-3 rounded-2xl font-medium text-black"
                >
                  Descargar
                </button>

                {menuDescarga && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#0b1727] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    {reportesDisponibles.map((reporte) => (
                      <DownloadOption
                        key={reporte.tipo}
                        label={reporte.label}
                        onClick={() => descargarReporte(reporte.tipo)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-8 text-zinc-400">
            Generando reportes...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
              <KpiCard label="Ventas generadas" value={formatMoney(ventasGeneradas)} />
              <KpiCard
                label="Ventas cobradas"
                value={formatMoney(ventasCobradas)}
                tone="emerald"
              />
              <KpiCard
                label="Saldo por cobrar"
                value={formatMoney(ventasPendientes)}
                tone="yellow"
              />
              <KpiCard
                label="Ticket promedio"
                value={formatMoney(ticketPromedio)}
                tone="cyan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <KpiCard
                label="Ingresos cobrados"
                value={formatMoney(ingresos)}
                tone="emerald"
              />
              <KpiCard label="Gastos pagados" value={formatMoney(gastos)} tone="red" />
              <KpiCard
                label="Resultado"
                value={formatMoney(utilidad)}
                tone={utilidad >= 0 ? "emerald" : "red"}
              />
              <KpiCard
                label="Clientes activos"
                value={clientesConPedidos.size.toLocaleString("es-AR")}
                tone="cyan"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
              <Panel
                title="Ingresos vs gastos"
                subtitle="Resultado financiero dentro del periodo"
              >
                <BarCompare
                  leftLabel="Ingresos"
                  leftValue={ingresos}
                  rightLabel="Gastos"
                  rightValue={gastos}
                />
              </Panel>

              <Panel title="Presupuestos" subtitle="Volumen generado y conversión">
                <div className="grid grid-cols-2 gap-4">
                  <MiniMetric
                    label="Generados"
                    value={presupuestosFiltrados.length.toLocaleString("es-AR")}
                  />
                  <MiniMetric
                    label="Aceptados"
                    value={presupuestosAceptados.length.toLocaleString("es-AR")}
                    className="text-emerald-400"
                  />
                  <MiniMetric label="Total cotizado" value={formatMoney(totalPresupuestos)} />
                  <MiniMetric
                    label="Conversión"
                    value={`${tasaConversion.toFixed(0)}%`}
                    className="text-cyan-400"
                  />
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <RankingPanel
                title="Productos más vendidos"
                subtitle="Ranking por cantidad vendida"
                rows={productosMasVendidos}
                valueMode="quantity"
                empty="No hay productos vendidos en el periodo."
              />

              <RankingPanel
                title="Producción por producto"
                subtitle="Unidades producidas en el periodo"
                rows={produccionPorProducto}
                valueMode="quantity"
                empty="No hay producción registrada en el periodo."
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 mb-8">
              <Panel title="Rentabilidad estimada" subtitle="Venta menos costo promedio de receta">
                <Table
                  columns={["Producto", "Ventas", "Costo est.", "Margen"]}
                  rows={rentabilidadProductos.slice(0, 6).map((item) => [
                    item.producto,
                    formatMoney(item.ventas),
                    formatMoney(item.costoEstimado),
                    `${item.margen.toFixed(0)}%`,
                  ])}
                  empty="No hay datos suficientes para estimar rentabilidad."
                />
              </Panel>

              <Panel title="Stock disponible" subtitle="Productos con menor disponibilidad">
                <Table
                  columns={["Producto", "Actual", "Ideal", "Estado"]}
                  rows={stockDisponible.slice(0, 8).map((item) => [
                    item.nombre,
                    formatQuantity(item.actual),
                    formatQuantity(item.ideal),
                    item.estado,
                  ])}
                  empty="No hay stock configurado."
                />
              </Panel>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6">
              <Panel title="Suministros críticos" subtitle="Materias primas a controlar">
                <Table
                  columns={["Material", "Stock", "Objetivo", "Estado"]}
                  rows={suministrosCriticos.slice(0, 8).map((item) => [
                    item.nombre,
                    `${formatQuantity(item.actual)} ${item.unidad || ""}`.trim(),
                    `${formatQuantity(item.ideal)} ${item.unidad || ""}`.trim(),
                    item.estado,
                  ])}
                  empty="No hay suministros cargados."
                />
              </Panel>

              <Panel title="Detalle financiero" subtitle="Ingresos, gastos y saldos pendientes">
                <Table
                  columns={["Fecha", "Tipo", "Concepto", "Total", "Abonado", "Pendiente"]}
                  rows={movimientosReporte.slice(0, 12).map((row) => [
                    formatDate(row.fecha),
                    row.tipo,
                    row.concepto,
                    formatMoney(row.total),
                    formatMoney(row.abonado),
                    formatMoney(row.pendiente),
                  ])}
                  empty="No hay movimientos en el periodo."
                />
              </Panel>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-zinc-500 text-xs">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block mt-2 bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 outline-none"
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: string;
  tone?: "white" | "emerald" | "red" | "yellow" | "cyan";
}) {
  const color = {
    white: "text-white",
    emerald: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    cyan: "text-cyan-400",
  }[tone];

  return (
    <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 md:p-6">
      <p className="text-zinc-500 text-sm">{label}</p>
      <h2 className={`text-2xl md:text-3xl font-bold mt-3 ${color}`}>
        {value}
      </h2>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="p-6">{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-6 py-5 border-b border-white/5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  className = "text-white",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className={`text-xl font-bold mt-2 ${className}`}>{value}</p>
    </div>
  );
}

function BarCompare({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
}) {
  const total = leftValue + rightValue;
  const leftWidth = total === 0 ? 0 : (leftValue / total) * 100;
  const rightWidth = total === 0 ? 0 : (rightValue / total) * 100;

  return (
    <div>
      <div className="h-5 bg-[#07111f] rounded-full overflow-hidden flex">
        <div className="bg-emerald-500" style={{ width: `${leftWidth}%` }} />
        <div className="bg-red-500" style={{ width: `${rightWidth}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <MiniMetric
          label={leftLabel}
          value={formatMoney(leftValue)}
          className="text-emerald-400"
        />
        <MiniMetric
          label={rightLabel}
          value={formatMoney(rightValue)}
          className="text-red-400"
        />
      </div>
    </div>
  );
}

function RankingPanel({
  title,
  subtitle,
  rows,
  valueMode,
  empty,
}: {
  title: string;
  subtitle: string;
  rows: RankingRow[];
  valueMode: "money" | "quantity";
  empty: string;
}) {
  const max = Math.max(...rows.map((row) => row.total || row.cantidad), 0);

  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {rows.length === 0 && <EmptyState text={empty} />}

        {rows.map((row) => {
          const value = valueMode === "money" ? row.total : row.cantidad;
          const width = max === 0 ? 0 : (value / max) * 100;

          return (
            <div key={row.nombre} className="bg-[#07111f] border border-white/5 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{row.nombre}</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {valueMode === "money"
                      ? `${formatQuantity(row.cantidad)} unidades`
                      : formatMoney(row.total)}
                  </p>
                </div>
                <p className="text-emerald-400 font-semibold">
                  {valueMode === "money" ? formatMoney(value) : formatQuantity(value)}
                </p>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-cyan-400" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Table({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <EmptyState text={empty} />;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[720px] px-4 py-3 border-b border-white/5 text-zinc-500 text-sm"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>

      <div className="divide-y divide-white/5 min-w-[720px]">
        {rows.map((row, index) => (
          <div
            key={`${row.join("-")}-${index}`}
            className="grid gap-3 px-4 py-4 text-sm"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell, cellIndex) => (
              <div
                key={`${cell}-${cellIndex}`}
                className={cellIndex === 0 ? "text-white" : "text-zinc-300"}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-2 py-6 text-zinc-500">{text}</div>;
}

function DownloadOption({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-white/5 transition border-b border-white/5 last:border-b-0"
    >
      {label}
    </button>
  );
}
