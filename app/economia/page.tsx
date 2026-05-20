
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function EconomiaPage() {

  const [movimientos, setMovimientos] = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("Ingreso");

  const movimientosRecientes = movimientos.slice(0, 10);

  const [montoTotal, setMontoTotal] = useState("");
  const [montoAbonado, setMontoAbonado] = useState("");

  const [concepto, setConcepto] = useState("");
  const [proveedor, setProveedor] = useState("");

  const [fechaMovimiento, setFechaMovimiento] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [modalAbono, setModalAbono] = useState(false);


  const [modalHistorialAbonos, setModalHistorialAbonos] =
  useState(false);

  const [historialAbonos, setHistorialAbonos] =
  useState<any[]>([]);

  const [movimientoSeleccionado, setMovimientoSeleccionado] =
    useState<any>(null);

  const [montoAbono, setMontoAbono] = useState("");

  const [fechaAbono, setFechaAbono] = useState(
  new Date().toISOString().split("T")[0]
  );

  async function cargarMovimientos() {

    const { data } = await supabase
      .from("movimientos_economia")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setMovimientos(data);
    }

  }

  async function guardarMovimiento() {

    await supabase
      .from("movimientos_economia")
      .insert([
        {
          tipo: tipoMovimiento,

          concepto,

          monto_total:
            Number(montoTotal) || 0,

          monto_abonado:
            Number(montoAbonado) || 0,

          saldo_pendiente:
            Math.max(
              Number(montoTotal || 0) -
              Number(montoAbonado || 0),
              0
            ),

          detalle:
            tipoMovimiento === "Gasto"
              ? proveedor
              : "",

          fecha: fechaMovimiento,
        },
      ]);

    setModalAbierto(false);

    setConcepto("");
    setProveedor("");
    setMontoTotal("");
    setMontoAbonado("");

    cargarMovimientos();

  }

  async function registrarAbono() {

    if (!movimientoSeleccionado) return;

    const nuevoAbonado =
      Number(movimientoSeleccionado.monto_abonado) +
      Number(montoAbono);

    const nuevoPendiente =
      Number(movimientoSeleccionado.monto_total) -
      nuevoAbonado;

    await supabase
      .from("movimientos_economia")
      .update({
        monto_abonado: nuevoAbonado,
        saldo_pendiente: nuevoPendiente,
      })
      .eq("id", movimientoSeleccionado.id);

      await supabase
  .from("movimientos_economia_abonos")
  .insert([
    {
      movimiento_id: movimientoSeleccionado.id,

      monto: Number(montoAbono),

      fecha: fechaAbono,
    },
  ]);

    setModalAbono(false);

    setMontoAbono("");

    setFechaAbono(
  new Date().toISOString().split("T")[0]
);

    cargarMovimientos();

  }

async function cargarHistorialAbonos(
  movimientoId: string
) {

  const { data } = await supabase
    .from("movimientos_economia_abonos")
    .select("*")
    .eq("movimiento_id", movimientoId)
    .order("created_at", {
      ascending: false,
    });

  if (data) {
    setHistorialAbonos(data);
  }

}

  useEffect(() => {
    cargarMovimientos();
  }, []);

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Economía
          </h1>

          <p className="text-zinc-500 mt-1">
            Control financiero general
          </p>

        </div>

        <div className="flex gap-4">

          <button
            onClick={() => setModalAbierto(true)}
            className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
          >
            Registrar movimiento
          </button>

          <Link
            href="/economia/historial"
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
          >
            Historial movimientos
          </Link>

        </div>

      </div>

      {/* Movimientos */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mb-10">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">

          <h2 className="text-2xl font-semibold">
            Movimientos recientes
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Últimos movimientos registrados
          </p>

        </div>

        {/* Head */}
        <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Tipo</div>
          <div>Concepto</div>
          <div>Abonado</div>
          <div>Saldo pendiente</div>

        </div>

        {/* Movimientos */}
        {movimientosRecientes.map((movimiento) => (

          <div
            key={movimiento.id}
            className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div>
              {movimiento.fecha
                ?.split("-")
                .reverse()
                .join("/")}
            </div>

            <div>

              {movimiento.tipo === "Ingreso" && (
                <span className="text-emerald-400">
                  Ingreso
                </span>
              )}

              {movimiento.tipo === "Gasto" && (
                <span className="text-red-400">
                  Gasto
                </span>
              )}

            </div>

            <div>
              {movimiento.concepto}
            </div>

            <div>

              {movimiento.tipo === "Ingreso" && (

  <button
    onClick={async () => {

      setMovimientoSeleccionado(movimiento);

      await cargarHistorialAbonos(
        movimiento.id
      );

      setModalHistorialAbonos(true);

    }}
    className="text-emerald-400 hover:text-emerald-300 transition"
  >
    +$
    {Number(movimiento.monto_abonado)
      .toLocaleString("es-AR")}
  </button>

)}

              {movimiento.tipo === "Gasto" && (
                <span className="text-red-400">
                  -$
                  {Number(movimiento.monto_abonado)
                    .toLocaleString("es-AR")}
                </span>
              )}

            </div>

{movimiento.tipo === "Gasto" ? (

  <div className="flex items-center gap-1 -mt-2">

    <span className="text-yellow-400 flex items-center">

      $
      {Number(movimiento.saldo_pendiente)
        .toLocaleString("es-AR")}

    </span>

    <button
      onClick={async () => {

        setMovimientoSeleccionado(movimiento);

        await cargarHistorialAbonos(
          movimiento.id
        );

        setModalHistorialAbonos(true);

      }}
      className="bg-white/5 hover:bg-white/10 transition px-3 py-2 rounded-xl border border-white/5 text-sm"
    >
      Ver
    </button>

    {movimiento.saldo_pendiente > 0 && (

      <button
        onClick={() => {

          setMovimientoSeleccionado(movimiento);

          setModalAbono(true);

        }}
        className="bg-white/5 hover:bg-white/10 transition px-3 py-2 rounded-xl border border-white/5 text-sm"
      >
        Abonar
      </button>

    )}

  </div>

) : (

  <span className="text-zinc-500">
    -
  </span>

)}

          </div>

        ))}

      </div>

      {/* Modal registrar movimiento */}
      {modalAbierto && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X */}
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                Registrar movimiento
              </h2>

              <p className="text-zinc-500 mt-1">
                Nuevo movimiento financiero
              </p>

            </div>

            {/* Fecha */}
            <div className="mb-6">

              <label className="text-zinc-500 text-sm">
                Fecha
              </label>

              <input
                type="date"
                value={fechaMovimiento}
                onChange={(e) =>
                  setFechaMovimiento(e.target.value)
                }
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* Tipo */}
            <div className="mb-6">

              <label className="text-zinc-500 text-sm">
                Tipo
              </label>

              <select
                value={tipoMovimiento}
                onChange={(e) => setTipoMovimiento(e.target.value)}
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              >

                <option>
                  Ingreso
                </option>

                <option>
                  Gasto
                </option>

              </select>

            </div>

            {/* Proveedor */}
            {tipoMovimiento === "Gasto" && (

              <div className="mb-6">

                <label className="text-zinc-500 text-sm">
                  Proveedor
                </label>

                <input
                  placeholder="Agregar proveedor..."
                  value={proveedor}
                  onChange={(e) =>
                    setProveedor(e.target.value)
                  }
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

              </div>

            )}

            {/* Concepto */}
            <div className="mb-6">

              <label className="text-zinc-500 text-sm">
                Concepto
              </label>

              <input
                placeholder="Agregar concepto..."
                value={concepto}
                onChange={(e) =>
                  setConcepto(e.target.value)
                }
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* Monto total */}
            <div className="mb-6">

              <label className="text-zinc-500 text-sm">
                Monto total
              </label>

              <input
                placeholder="$0"
                value={montoTotal}
                onChange={(e) =>
                  setMontoTotal(e.target.value)
                }
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* Monto abonado */}
            <div className="mb-8">

              <label className="text-zinc-500 text-sm">
                Monto abonado
              </label>

              <input
                placeholder="$0"
                value={montoAbonado}
                onChange={(e) =>
                  setMontoAbonado(e.target.value)
                }
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* Saldo pendiente */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6 mb-8">

              <p className="text-zinc-500 text-sm">
                Saldo pendiente
              </p>

              <h3 className="text-2xl font-bold mt-3 text-yellow-400">

                $
                {Math.max(
                  Number(montoTotal || 0) -
                  Number(montoAbonado || 0),
                  0
                ).toLocaleString("es-AR")}

              </h3>

            </div>

            {/* Footer */}
            <div className="flex justify-end">

              <button
                onClick={guardarMovimiento}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
              >
                Guardar movimiento
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Modal abono */}
      {modalAbono && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

            {/* X */}
            <button
              onClick={() => setModalAbono(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                Registrar abono
              </h2>

              <p className="text-zinc-500 mt-1">
                Registrar pago parcial del gasto
              </p>

            </div>

            {/* Datos */}
            <div className="space-y-6">

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

                <p className="text-zinc-500 text-sm">
                  Saldo pendiente
                </p>

                <h3 className="text-3xl font-bold mt-3 text-yellow-400">

                  $
                  {Number(
                    movimientoSeleccionado?.saldo_pendiente || 0
                  ).toLocaleString("es-AR")}

                </h3>

              </div>

              <input
                type="number"
                placeholder="Monto abonado"
                value={montoAbono}
                onChange={(e) =>
                  setMontoAbono(e.target.value)
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
  type="date"
  value={fechaAbono}
  onChange={(e) =>
    setFechaAbono(e.target.value)
  }
  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
/>

            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">

              <button
                onClick={registrarAbono}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
              >
                Guardar abono
              </button>

            </div>

          </div>

        </div>

      )}

{/* Modal historial abonos */}
{modalHistorialAbonos && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

      {/* X */}
      <button
        onClick={() =>
          setModalHistorialAbonos(false)
        }
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Historial de abonos
        </h2>

      </div>

      {/* Tabla */}
      <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden">

        {/* Head */}
        <div className="grid grid-cols-2 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Monto</div>

        </div>

        {/* Abonos */}
        {historialAbonos.map((abono) => (

          <div
            key={abono.id}
            className="grid grid-cols-2 px-6 py-5 border-b border-white/5"
          >

            <div>
              {abono.fecha
                ?.split("-")
                .reverse()
                .join("/")}
            </div>

            <div className="text-emerald-400">

              $
              {Number(abono.monto)
                .toLocaleString("es-AR")}

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

)}

{/* Deudas proveedores */}
<div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mt-10">

  {/* Header */}
  <div className="px-6 py-5 border-b border-white/5">

    <h2 className="text-2xl font-semibold">
      Deudas proveedores
    </h2>

    <p className="text-zinc-500 text-sm mt-1">
      Gastos con saldo pendiente
    </p>

  </div>

  {/* Head */}
  <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

    <div>Proveedor</div>
    <div>Concepto</div>
    <div>Abonado</div>
    <div>Pendiente</div>

  </div>

  {/* Items */}
  {movimientos
    .filter(
      (movimiento) =>
        movimiento.tipo === "Gasto" &&
        movimiento.saldo_pendiente > 0
    )
    .map((movimiento) => (

      <div
        key={movimiento.id}
        className="grid grid-cols-4 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
      >

        <div>
          {movimiento.detalle}
        </div>

        <div>
          {movimiento.concepto}
        </div>

        <div>

          $
          {Number(movimiento.monto_abonado)
            .toLocaleString("es-AR")}

        </div>

        <div className="text-yellow-400">

          $
          {Number(movimiento.saldo_pendiente)
            .toLocaleString("es-AR")}

        </div>

      </div>

    ))}

</div>

    </div>
  );
}
