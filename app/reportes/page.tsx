"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../lib/supabase";
import { generarPDFReporte } from "../../utils/generarPDF";

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

type ReportRow = {
  fecha: string;
  tipo: string;
  concepto: string;
  total: number;
  abonado: number;
  pendiente: number;
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
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargarReportes() {
    setCargando(true);

    const [
      { data: clientesData },
      { data: pedidosData },
      { data: presupuestosData },
      { data: movimientosData },
    ] = await Promise.all([
      supabase.from("clientes").select("id,nombre"),
      supabase
        .from("pedidos")
        .select(
          "id,numero,cliente_id,estado,estado_pago,saldo_total,saldo_abonado,saldo_restante,created_at,fecha_entrega"
        ),
      supabase
        .from("presupuestos")
        .select("id,numero,cliente_id,total,estado,fecha,created_at"),
      supabase
        .from("movimientos_economia")
        .select(
          "id,tipo,concepto,detalle,fecha,monto_total,monto_abonado,saldo_pendiente"
        ),
    ]);

    setClientes((clientesData || []) as Cliente[]);
    setPedidos((pedidosData || []) as Pedido[]);
    setPresupuestos((presupuestosData || []) as Presupuesto[]);
    setMovimientos((movimientosData || []) as Movimiento[]);
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

  const ingresos = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo?.toLowerCase() === "ingreso")
    .reduce(
      (acc, movimiento) => acc + toNumber(movimiento.monto_abonado),
      0
    );

  const gastos = movimientosFiltrados
    .filter((movimiento) => movimiento.tipo?.toLowerCase() === "gasto")
    .reduce(
      (acc, movimiento) => acc + toNumber(movimiento.monto_abonado),
      0
    );

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
      };

      map.set(clienteId, {
        clienteId,
        pedidos: actual.pedidos + 1,
        total: actual.total + toNumber(pedido.saldo_total),
      });

      return map;
    }, new Map<string, { clienteId: string; pedidos: number; total: number }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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

  function descargarReporte(
    tipo: "completo" | "finanzas" | "clientes" | "presupuestos" | "ventas"
  ) {
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
      pedidos: pedidosFiltrados.length,
      clientesActivos: clientesConPedidos.size,
      presupuestosGenerados: presupuestosFiltrados.length,
      presupuestosAceptados: presupuestosAceptados.length,
      totalPresupuestos,
      tasaConversion,
      mejoresClientes: topClientes.map((cliente) => ({
        cliente:
          clientesPorId.get(cliente.clienteId) ||
          "Cliente sin identificar",
        pedidos: cliente.pedidos,
        total: cliente.total,
      })),
      movimientos: movimientosReporte,
    });

    setMenuDescarga(false);
  }

  return (
    <>
      <BackButton />

      <div className="pb-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Reportes
            </h1>

            <p className="text-zinc-500 mt-1">
              Indicadores comerciales, financieros y operativos
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div>
              <label className="text-zinc-500 text-xs">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className="block mt-2 bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
                className="block mt-2 bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />
            </div>

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
                  onClick={() =>
                    setMenuDescarga((abierto) => !abierto)
                  }
                  className="bg-emerald-500 hover:bg-emerald-400 transition px-4 py-3 rounded-2xl font-medium text-black"
                >
                  Descargar
                </button>

                {menuDescarga && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0b1727] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <DownloadOption
                      label="Reporte completo"
                      onClick={() => descargarReporte("completo")}
                    />
                    <DownloadOption
                      label="Ingresos y gastos"
                      onClick={() => descargarReporte("finanzas")}
                    />
                    <DownloadOption
                      label="Mejores clientes"
                      onClick={() => descargarReporte("clientes")}
                    />
                    <DownloadOption
                      label="Presupuestos"
                      onClick={() => descargarReporte("presupuestos")}
                    />
                    <DownloadOption
                      label="Ventas y cobranza"
                      onClick={() => descargarReporte("ventas")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-8 text-zinc-400">
            Generando reporte...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
              <KpiCard
                label="Ingresos cobrados"
                value={formatMoney(ingresos)}
                tone="emerald"
              />
              <KpiCard
                label="Gastos pagados"
                value={formatMoney(gastos)}
                tone="red"
              />
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <KpiCard
                label="Ventas generadas"
                value={formatMoney(ventasGeneradas)}
              />
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
                label="Pedidos"
                value={pedidosFiltrados.length.toLocaleString("es-AR")}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
              <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
                <SectionHeader
                  title="Ingresos vs gastos"
                  subtitle="Movimientos registrados dentro del periodo"
                />

                <div className="p-6">
                  <div className="h-5 bg-[#07111f] rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${
                          ingresos + gastos === 0
                            ? 0
                            : (ingresos / (ingresos + gastos)) * 100
                        }%`,
                      }}
                    />
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${
                          ingresos + gastos === 0
                            ? 0
                            : (gastos / (ingresos + gastos)) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <MiniMetric
                      label="Ingresos"
                      value={formatMoney(ingresos)}
                      className="text-emerald-400"
                    />
                    <MiniMetric
                      label="Gastos"
                      value={formatMoney(gastos)}
                      className="text-red-400"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
                <SectionHeader
                  title="Presupuestos"
                  subtitle="Volumen generado y conversion"
                />

                <div className="grid grid-cols-2 gap-4 p-6">
                  <MiniMetric
                    label="Generados"
                    value={presupuestosFiltrados.length.toLocaleString(
                      "es-AR"
                    )}
                  />
                  <MiniMetric
                    label="Aceptados"
                    value={presupuestosAceptados.length.toLocaleString(
                      "es-AR"
                    )}
                    className="text-emerald-400"
                  />
                  <MiniMetric
                    label="Total cotizado"
                    value={formatMoney(totalPresupuestos)}
                  />
                  <MiniMetric
                    label="Conversion"
                    value={`${tasaConversion.toFixed(0)}%`}
                    className="text-cyan-400"
                  />
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-6">
              <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
                <SectionHeader
                  title="Mejores clientes"
                  subtitle="Ranking por ventas generadas"
                />

                <div className="divide-y divide-white/5">
                  {topClientes.length === 0 && (
                    <EmptyState text="No hay ventas en el periodo." />
                  )}

                  {topClientes.map((cliente) => (
                    <div
                      key={cliente.clienteId}
                      className="grid grid-cols-[1fr_auto] gap-4 px-6 py-5"
                    >
                      <div>
                        <p className="font-medium">
                          {clientesPorId.get(cliente.clienteId) ||
                            "Cliente sin identificar"}
                        </p>
                        <p className="text-zinc-500 text-sm mt-1">
                          {cliente.pedidos} pedidos
                        </p>
                      </div>
                      <p className="text-emerald-400 font-semibold">
                        {formatMoney(cliente.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
                <SectionHeader
                  title="Detalle financiero"
                  subtitle="Ingresos, gastos y saldos pendientes"
                />

                <div className="hidden md:grid grid-cols-[0.8fr_0.8fr_1.4fr_1fr_1fr_1fr] px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
                  <div>Fecha</div>
                  <div>Tipo</div>
                  <div>Concepto</div>
                  <div>Total</div>
                  <div>Abonado</div>
                  <div>Pendiente</div>
                </div>

                <div className="divide-y divide-white/5">
                  {movimientosReporte.length === 0 && (
                    <EmptyState text="No hay movimientos en el periodo." />
                  )}

                  {movimientosReporte.slice(0, 12).map((row, index) => (
                    <div
                      key={`${row.fecha}-${row.concepto}-${index}`}
                      className="grid grid-cols-1 md:grid-cols-[0.8fr_0.8fr_1.4fr_1fr_1fr_1fr] gap-2 md:gap-0 px-6 py-5 text-sm"
                    >
                      <div>{formatDate(row.fecha)}</div>
                      <div
                        className={
                          row.tipo.toLowerCase() === "ingreso"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {row.tipo}
                      </div>
                      <div className="text-zinc-300">
                        {row.concepto}
                      </div>
                      <div>{formatMoney(row.total)}</div>
                      <div>{formatMoney(row.abonado)}</div>
                      <div className="text-yellow-400">
                        {formatMoney(row.pendiente)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
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
      <p className="text-zinc-500 text-sm">
        {label}
      </p>
      <h2 className={`text-2xl md:text-3xl font-bold mt-3 ${color}`}>
        {value}
      </h2>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-6 py-5 border-b border-white/5">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>
      <p className="text-zinc-500 text-sm mt-1">
        {subtitle}
      </p>
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
      <p className="text-zinc-500 text-sm">
        {label}
      </p>
      <p className={`text-xl font-bold mt-2 ${className}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-8 text-zinc-500">
      {text}
    </div>
  );
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
