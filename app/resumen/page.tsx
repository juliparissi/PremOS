"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResumenPage() {

  const [modalNotas, setModalNotas] =
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

    if (pedidosData) {

      /* Activos */
      const activos =
        pedidosData.filter(
          (pedido) =>
            pedido.estado !==
            "Entregado"
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

      /* Dinero ingresado */
      const ingresado =
        pedidosData.reduce(
          (acc, pedido) =>
            acc +
            Number(
              pedido.saldo_abonado || 0
            ),
          0
        );

      setDineroIngresado(
        ingresado
      );

      /* Saldo pendiente */
      const pendiente =
        pedidosData.reduce(
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

      const gastos =
        economiaData
          .filter(
            (movimiento) =>
              movimiento.tipo ===
              "Gasto"
          )
          .reduce(
            (acc, movimiento) =>
              acc +
              Number(
                movimiento.monto_abonado || 0
              ),
            0
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

  useEffect(() => {

    cargarResumen();

    cargarNotas();

  }, []);

  return (
    <div>

      {/* Header */}
      <div className="mb-10">

        <h1 className="text-3xl font-bold">
          Resumen general
        </h1>

        <p className="text-zinc-500 mt-1">
          Estado general del sistema PremOS
        </p>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6">

        {/* Clientes */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

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

          <p className="text-zinc-500">
            Dinero ingresado
          </p>

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

          <p className="text-zinc-500">
            Gastos registrados
          </p>

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
<div className="grid grid-cols-2 gap-6 mt-8">

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
          className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3"
        >

          <p className="text-sm">

            {nota.nota}

          </p>

        </div>

      ))}

    </div>

  </div>

</div>

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
            className="bg-[#07111f] border border-white/5 rounded-2xl p-5"
          >

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
  );
}