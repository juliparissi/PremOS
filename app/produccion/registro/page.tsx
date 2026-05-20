"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function RegistroProduccionPage() {

  const [registros, setRegistros] = useState<any[]>([]);

  const [paginaActual, setPaginaActual] = useState(1);

  const ITEMS_POR_PAGINA = 10;

  async function cargarRegistros() {

    const { data } = await supabase
      .from("registro_produccion")
      .select("*")
      .order("fecha", { ascending: false });

    if (data) {
      setRegistros(data);
    }

  }

  useEffect(() => {
    cargarRegistros();
  }, []);

  const registrosAgrupados = registros.reduce(
    (acc: any, item: any) => {

      const fecha = item.fecha;

      if (!acc[fecha]) {
        acc[fecha] = [];
      }

      acc[fecha].push(item);

      return acc;

    },
    {}
  );

  const fechas = Object.keys(
    registrosAgrupados
  );

  const inicio =
    (paginaActual - 1) * ITEMS_POR_PAGINA;

  const fin =
    inicio + ITEMS_POR_PAGINA;

  const fechasPaginadas =
    fechas.slice(inicio, fin);

  return (
    <div>

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Historial producción
        </h1>

        <p className="text-zinc-500 mt-1">
          Registro histórico de producción
        </p>

      </div>

      {/* Registros */}
      <div className="space-y-8">

        {fechasPaginadas.map((fecha) => (

          <div
            key={fecha}
            className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden"
          >

            {/* Fecha */}
            <div className="px-6 py-5 border-b border-white/5">

              <h2 className="text-2xl font-semibold">

                {fecha
                  .split("-")
                  .reverse()
                  .join("/")}

              </h2>

            </div>

            {/* Head */}
            <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

              <div>
                Modelo
              </div>

              <div>
                Color
              </div>

              <div>
                Cantidad
              </div>

              <div>
                Observaciones
              </div>

            </div>

            {/* Items */}
            {registrosAgrupados[fecha].map(
              (item: any) => (

                <div
                  key={item.id}
                  className="grid grid-cols-4 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
                >

                  <div className="font-medium">
                    {item.modelo}
                  </div>

                  <div>
                    {item.color}
                  </div>

                  <div>
                    {item.cantidad} und
                  </div>

                  <div>
                    {item.observaciones || "-"}
                  </div>

                </div>

              )
            )}

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
          disabled={fin >= fechas.length}
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

    </div>
  );
}