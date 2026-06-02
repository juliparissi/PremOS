"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BackButton from "@/components/BackButton";

export default function ResumenPage() {

  const [modalNotas, setModalNotas] =
  useState(false);

  const [modalFiltroFinanciero, setModalFiltroFinanciero] =
    useState(false);

  const [nota, setNota] = useState("");

  const [notas, setNotas] =
  useState<any[]>([]);

  const [clientes, setClientes] = useState(0);

  const [pedidosActivos, setPedidosActivos] =
    useState(0);

  const [pedidosEntregados, setPedidosEntregados] =
    useState(0);

  const [produccionActiva, setProduccionActiva] =
    useState(0);

  const [dineroIngresado, setDineroIngresado] =
    useState(0);

  const [saldoPendiente, setSaldoPendiente] =
    useState(0);

  const [gastosTotales, setGastosTotales] =
    useState(0);

  const [clientesConDeuda, setClientesConDeuda] =
    useState(0);

  const [filtroActivo, setFiltroActivo] =
    useState<"ingresos" | "gastos">("ingresos");
  const [filtroIngresosDesde, setFiltroIngresosDesde] = useState("");
  const [filtroIngresosHasta, setFiltroIngresosHasta] = useState("");
  const [filtroGastosDesde, setFiltroGastosDesde] = useState("");
  const [filtroGastosHasta, setFiltroGastosHasta] = useState("");

  function estaEnRango(
    fecha: string | null | undefined,
    desde: string,
    hasta: string
  ) {
    if (!desde && !hasta) return true;
    if (!fecha) return false;

    const fechaBase = fecha.split("T")[0];

    if (desde && fechaBase < desde) return false;
    if (hasta && fechaBase > hasta) return false;

    return true;
  }

  function textoFiltroFinanciero(desdeFiltro: string, hastaFiltro: string) {
    if (!desdeFiltro && !hastaFiltro) return "Total general";

    const desde = desdeFiltro
      ? desdeFiltro.split("-").reverse().join("/")
      : "Inicio";
    const hasta = hastaFiltro
      ? hastaFiltro.split("-").reverse().join("/")
      : "Hoy";

    return `${desde} - ${hasta}`;
  }

  function movimientoPerteneceAPedidoVigente(
    concepto: string | null | undefined,
    pedidosExistentes: Set<string>
  ) {
    if (!concepto) return true;

    const prefijosPedido = [
      "Pago pedido ",
      "Entrega pedido ",
      "Pago venta directa ",
    ];

    const prefijo = prefijosPedido.find((item) =>
      concepto.startsWith(item)
    );

    if (!prefijo) return true;

    const numeroPedido = concepto.replace(prefijo, "").trim();

    return pedidosExistentes.has(numeroPedido);
  }

  async function cargarResumen() {

    /* Clientes */
    const { data: clientesData } =
      await supabase
        .from("clientes")
        .select("*");

    if (clientesData) {

      setClientes(clientesData.length);

    }

    /* Pedidos */
    const { data: pedidosData } =
      await supabase
        .from("pedidos")
        .select("*");

    const numerosPedidosExistentes =
      new Set(
        (pedidosData || []).map(
          (pedido) => pedido.numero
        )
      );

    if (pedidosData) {

      /* Activos */
      const activos =
        pedidosData.filter(
          (pedido) =>
            pedido.estado !==
              "Entregado" &&
            pedido.estado !==
              "Cancelado"
        );

      setPedidosActivos(
        activos.length
      );

      /* Entregados */
      const entregados =
        pedidosData.filter(
          (pedido) =>
            pedido.estado ===
            "Entregado"
        );

      setPedidosEntregados(
        entregados.length
      );

      /* Producción */
      const produccion =
        pedidosData.filter(
          (pedido) =>
            pedido.estado ===
              "En producción" ||
            pedido.estado ===
              "Finalizando"
        );

      setProduccionActiva(
        produccion.length
      );

      /* Saldo pendiente */
      const pendiente =
        pedidosData
          .filter(
            (pedido) =>
              pedido.estado !==
              "Cancelado"
          )
          .reduce(
          (acc, pedido) =>
            acc +
            Number(
              pedido.saldo_restante || 0
            ),
          0
        );

      setSaldoPendiente(
        pendiente
      );

      /* Clientes con deuda */
      const clientesDeuda =
        pedidosData.filter(
          (pedido) =>
            pedido.estado !==
              "Cancelado" &&
            Number(
              pedido.saldo_restante || 0
            ) > 0
        );

      const idsUnicos =
        new Set(
          clientesDeuda.map(
            (pedido) =>
              pedido.cliente_id
          )
        );

      setClientesConDeuda(
        idsUnicos.size
      );

    }

    /* Economía */
    const { data: economiaData } =
      await supabase
        .from("movimientos_economia")
        .select("*");

    if (economiaData) {

      const movimientosIngresosFiltrados =
        economiaData.filter((movimiento) => {
          if (
            !movimientoPerteneceAPedidoVigente(
              movimiento.concepto,
              numerosPedidosExistentes
            )
          ) {
            return false;
          }

          return estaEnRango(
            movimiento.fecha ||
              movimiento.created_at,
            filtroIngresosDesde,
            filtroIngresosHasta
          );
        });

      const movimientosGastosFiltrados =
        economiaData.filter((movimiento) =>
          estaEnRango(
            movimiento.fecha ||
              movimiento.created_at,
            filtroGastosDesde,
            filtroGastosHasta
          )
        );

      const ingresado =
        movimientosIngresosFiltrados
          .filter(
            (movimiento) =>
              movimiento.tipo?.toLowerCase() ===
              "ingreso"
          )
          .reduce(
            (acc, movimiento) =>
              acc +
              Number(
                movimiento.monto_abonado ||
                  movimiento.monto_total ||
                  0
              ),
            0
          );

      const gastos =
        movimientosGastosFiltrados
          .filter(
            (movimiento) =>
              movimiento.tipo?.toLowerCase() ===
              "gasto"
          )
          .reduce(
            (acc, movimiento) =>
              acc +
              Number(
                movimiento.monto_abonado || 0
              ),
            0
          );

      setDineroIngresado(
        ingresado
      );

      setGastosTotales(
        gastos
      );

    }

  }

async function cargarNotas() {

  const { data } = await supabase
    .from("notas_rapidas")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (data) {

    setNotas(data);

  }

}

async function guardarNota() {

  if (!nota) return;

  await supabase
    .from("notas_rapidas")
    .insert([
      {
        nota,
      },
    ]);

  setNota("");

  cargarNotas();

}

async function eliminarNota(id: string) {

  const confirmar = confirm(
    "¿Querés eliminar esta nota?"
  );

  if (!confirmar) return;

  await supabase
    .from("notas_rapidas")
    .delete()
    .eq("id", id);

  cargarNotas();

}

  useEffect(() => {

    cargarResumen();

    cargarNotas();

  }, [
    filtroIngresosDesde,
    filtroIngresosHasta,
    filtroGastosDesde,
    filtroGastosHasta,
  ]);

  return (

  <>

    <BackButton />
    <div className="min-h-screen overflow-y-auto pb-24">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Resumen general
        </h1>

        <p className="text-zinc-500 mt-1">
          Estado general del sistema PremOS
        </p>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

        {/* Clientes */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6 text-white">

          <p className="text-zinc-500">
            Clientes
          </p>

          <h2 className="text-4xl font-bold mt-4">

            {clientes}

          </h2>

        </div>

        {/* Pedidos activos */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Pedidos activos
          </p>

          <h2 className="text-4xl font-bold mt-4 text-yellow-400">

            {pedidosActivos}

          </h2>

        </div>

        {/* Producción */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Producción activa
          </p>

          <h2 className="text-4xl font-bold mt-4 text-cyan-400">

            {produccionActiva}

          </h2>

        </div>

        {/* Entregados */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Pedidos entregados
          </p>

          <h2 className="text-4xl font-bold mt-4 text-emerald-400">

            {pedidosEntregados}

          </h2>

        </div>

        {/* Dinero ingresado */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <div className="flex items-start justify-between gap-3">

            <div>

              <p className="text-zinc-500">
                Dinero ingresado
              </p>

              <p className="text-xs text-zinc-600 mt-1">
                {textoFiltroFinanciero(
                  filtroIngresosDesde,
                  filtroIngresosHasta
                )}
              </p>

            </div>

            <button
              onClick={() => {
                setFiltroActivo("ingresos");
                setModalFiltroFinanciero(true);
              }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-cyan-300 transition flex items-center justify-center"
              aria-label="Filtrar dinero ingresado por fecha"
              title="Filtrar por fecha"
            >
              <span className="w-4 h-4 rounded-[3px] border border-cyan-300 relative block">
                <span className="absolute left-0 right-0 top-[3px] border-t border-cyan-300" />
                <span className="absolute left-[3px] top-[-3px] w-[2px] h-[5px] bg-cyan-300 rounded-full" />
                <span className="absolute right-[3px] top-[-3px] w-[2px] h-[5px] bg-cyan-300 rounded-full" />
              </span>
            </button>

          </div>

          <h2 className="text-3xl font-bold mt-4 text-emerald-400">

            $
            {Number(
              dineroIngresado
            ).toLocaleString(
              "es-AR"
            )}

          </h2>

        </div>

        {/* Saldo pendiente */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Saldo pendiente
          </p>

          <h2 className="text-3xl font-bold mt-4 text-yellow-400">

            $
            {Number(
              saldoPendiente
            ).toLocaleString(
              "es-AR"
            )}

          </h2>

        </div>

        {/* Gastos */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <div className="flex items-start justify-between gap-3">

            <div>

              <p className="text-zinc-500">
                Gastos registrados
              </p>

              <p className="text-xs text-zinc-600 mt-1">
                {textoFiltroFinanciero(
                  filtroGastosDesde,
                  filtroGastosHasta
                )}
              </p>

            </div>

            <button
              onClick={() => {
                setFiltroActivo("gastos");
                setModalFiltroFinanciero(true);
              }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-cyan-300 transition flex items-center justify-center"
              aria-label="Filtrar gastos registrados por fecha"
              title="Filtrar por fecha"
            >
              <span className="w-4 h-4 rounded-[3px] border border-cyan-300 relative block">
                <span className="absolute left-0 right-0 top-[3px] border-t border-cyan-300" />
                <span className="absolute left-[3px] top-[-3px] w-[2px] h-[5px] bg-cyan-300 rounded-full" />
                <span className="absolute right-[3px] top-[-3px] w-[2px] h-[5px] bg-cyan-300 rounded-full" />
              </span>
            </button>

          </div>

          <h2 className="text-3xl font-bold mt-4 text-red-400">

            $
            {Number(
              gastosTotales
            ).toLocaleString(
              "es-AR"
            )}

          </h2>

        </div>

        {/* Clientes deuda */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Clientes con deuda
          </p>

          <h2 className="text-4xl font-bold mt-4 text-orange-400">

            {clientesConDeuda}

          </h2>

        </div>

      </div>

{/* Grid inferior */}
<div className="hidden md:grid grid grid-cols-2 gap-6 mt-8">

  {/* Calendario */}
  <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

    <div className="mb-6">

      <h2 className="text-2xl font-bold">
        Calendario
      </h2>

      <p className="text-zinc-500 text-sm mt-1">
        Agenda rápida del sistema
      </p>

    </div>

    <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

  <div className="grid grid-cols-7 gap-3 text-center">

    {[
      "L",
      "M",
      "X",
      "J",
      "V",
      "S",
      "D",
    ].map((dia) => (

      <div
        key={dia}
        className="text-zinc-500 text-sm"
      >
        {dia}
      </div>

    ))}

    {Array.from({ length: 31 }).map(
      (_, index) => {

        const dia =
          index + 1;

        const hoy =
          dia ===
          new Date().getDate();

        return (

          <div
            key={dia}
            className={`h-12 rounded-2xl flex items-center justify-center text-sm border border-white/5 ${
              hoy
                ? "bg-emerald-500 text-black font-bold"
                : "bg-[#0b1727]"
            }`}
          >

            {dia}

          </div>

        );

      }
    )}

  </div>

</div>

  </div>

  {/* Notas rápidas */}
  <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

    <div className="mb-6">

      <h2 className="text-2xl font-bold">
        Notas rápidas
      </h2>

      <p className="text-zinc-500 text-sm mt-1">
        Ayuda memoria del sistema
      </p>

    </div>

    <textarea
      value={nota}
      onChange={(e) =>
        setNota(e.target.value)
      }
      placeholder="Ej: enviar presupuesto a Carlos..."
      className="w-full h-40 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none resize-none"
    />

    <div className="flex gap-3 mt-4">

  <button
    onClick={guardarNota}
    className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl text-black font-medium"
  >
    Guardar nota
  </button>

  <button
    onClick={() =>
      setModalNotas(true)
    }
    className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
  >
    Ver notas
  </button>

</div>

    {/* Lista */}
    <div className="mt-6 space-y-3">

      {notas.map((nota) => (

        <div
          key={nota.id}
          className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 flex items-start justify-between gap-3"
        >

          <p className="text-sm">

            {nota.nota}

          </p>

          <button
            onClick={() =>
              eliminarNota(nota.id)
            }
            className="shrink-0 w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition flex items-center justify-center leading-none"
            aria-label="Eliminar nota"
          >
            ×
          </button>

        </div>

      ))}

    </div>

  </div>

</div>

{/* Modal filtro financiero */}
{modalFiltroFinanciero && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-xl p-8 relative">

      <button
        onClick={() =>
          setModalFiltroFinanciero(false)
        }
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Filtrar {filtroActivo === "ingresos"
            ? "dinero ingresado"
            : "gastos registrados"}
        </h2>

        <p className="text-zinc-500 mt-1">
          Rango independiente para este indicador
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Desde
          </label>

          <input
            type="date"
            value={
              filtroActivo === "ingresos"
                ? filtroIngresosDesde
                : filtroGastosDesde
            }
            onChange={(e) => {
              if (filtroActivo === "ingresos") {
                setFiltroIngresosDesde(e.target.value);
              } else {
                setFiltroGastosDesde(e.target.value);
              }
            }}
            className="w-full h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          />

        </div>

        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Hasta
          </label>

          <input
            type="date"
            value={
              filtroActivo === "ingresos"
                ? filtroIngresosHasta
                : filtroGastosHasta
            }
            onChange={(e) => {
              if (filtroActivo === "ingresos") {
                setFiltroIngresosHasta(e.target.value);
              } else {
                setFiltroGastosHasta(e.target.value);
              }
            }}
            className="w-full h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          />

        </div>

      </div>

      <div className="flex flex-col md:flex-row justify-end gap-4 mt-8">

        <button
          onClick={() => {
            if (filtroActivo === "ingresos") {
              setFiltroIngresosDesde("");
              setFiltroIngresosHasta("");
            } else {
              setFiltroGastosDesde("");
              setFiltroGastosHasta("");
            }
            setModalFiltroFinanciero(false);
          }}
          className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
        >
          Limpiar filtro
        </button>

        <button
          onClick={() =>
            setModalFiltroFinanciero(false)
          }
          className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
        >
          Aplicar filtro
        </button>

      </div>

    </div>

  </div>

)}

{/* Modal notas */}
{modalNotas && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative max-h-[80vh] overflow-y-auto">

      {/* X */}
      <button
        onClick={() =>
          setModalNotas(false)
        }
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Notas rápidas
        </h2>

        <p className="text-zinc-500 mt-1">
          Historial de notas guardadas
        </p>

      </div>

      {/* Lista */}
      <div className="space-y-4">

        {notas.map((nota) => (

          <div
            key={nota.id}
            className="bg-[#07111f] border border-white/5 rounded-2xl p-5 relative pr-14"
          >

            <button
              onClick={() =>
                eliminarNota(nota.id)
              }
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition flex items-center justify-center text-xl leading-none"
              aria-label="Eliminar nota"
            >
              ×
            </button>

            <p className="text-sm text-zinc-500 mb-2">

              {new Date(
                nota.created_at
              ).toLocaleDateString(
                "es-AR"
              )}

            </p>

            <p>

              {nota.nota}

            </p>

          </div>

        ))}

      </div>

    </div>

  </div>

)}

    
    </div>
</>
  );
}
