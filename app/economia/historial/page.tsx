"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function HistorialMovimientosPage() {

  const [movimientos, setMovimientos] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);

  const ITEMS_POR_PAGINA = 10;

  const [modalAbono, setModalAbono] = useState(false);

  const [movimientoSeleccionado, setMovimientoSeleccionado] =
    useState<any>(null);

  const [montoAbono, setMontoAbono] = useState("");

  const [fechaAbono, setFechaAbono] = useState(
  new Date().toISOString().split("T")[0]
  );

  const [modalHistorialAbonos, setModalHistorialAbonos] =
    useState(false);

  const [historialAbonos, setHistorialAbonos] =
    useState<any[]>([]);

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

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const movimientosFiltrados =
    movimientos.filter((movimiento) => {

      return (
        movimiento.concepto
          ?.toLowerCase()
          .includes(busqueda.toLowerCase())
      );

    });

  const inicio =
    (paginaActual - 1) * ITEMS_POR_PAGINA;

  const fin =
    inicio + ITEMS_POR_PAGINA;

  const movimientosPaginados =
    movimientosFiltrados.slice(
      inicio,
      fin
    );

  return (
    <div>

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Historial movimientos
        </h1>

        <p className="text-zinc-500 mt-1">
          Historial financiero completo
        </p>

      </div>

      {/* Buscador */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">

        <input
          type="text"
          placeholder="Buscar movimiento..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

      </div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">

          <h2 className="text-2xl font-semibold">
            Historial movimientos
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Todos los movimientos registrados
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
        {movimientosPaginados.map((movimiento) => (

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

            <div className="flex items-center gap-1 -mt-2">

              <span className="text-yellow-400 flex items-center">

                $
                {Number(movimiento.saldo_pendiente)
                  .toLocaleString("es-AR")}

              </span>

              {movimiento.tipo === "Gasto" && (

  <button
    onClick={() => {

      setMovimientoSeleccionado(
        movimiento
      );

      cargarHistorialAbonos(
        movimiento.id
      );

      setModalHistorialAbonos(true);

    }}
    className="text-emerald-400 hover:text-emerald-300 transition"
  >
    Ver
  </button>

)}

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

          </div>

        ))}

      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-8">

        <button
          disabled={paginaActual === 1}
          onClick={() =>
            setPaginaActual(
              paginaActual - 1
            )
          }
          className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm disabled:opacity-30"
        >
          Anterior
        </button>

        <p className="text-zinc-500 text-sm">
          Página {paginaActual}
        </p>

        <button
          disabled={
            fin >=
            movimientosFiltrados.length
          }
          onClick={() =>
            setPaginaActual(
              paginaActual + 1
            )
          }
          className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm disabled:opacity-30"
        >
          Siguiente
        </button>

      </div>

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

    </div>
  );
}