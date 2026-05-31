
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { supabase } from "../../../lib/supabase";

export default function RegistroProduccionPage() {

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [producciones, setProducciones] = useState<any[]>([]);

  async function cargarProducciones(fecha: string) {

    const { data, error } = await supabase
      .from("produccion")
      .select(`
        *,
        produccion_items (*)
      `)
      .eq("fecha", fecha)
      .order("hora", { ascending: true });

    if (!error && data) {

      setProducciones(data);

    }

  }

  useEffect(() => {

    cargarProducciones(fechaSeleccionada);

  }, []);

  return (

    <>

      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Historial producción
            </h1>

            <p className="text-zinc-500 mt-1">
              Registro histórico de producción
            </p>

          </div>

          <Link
            href="/produccion"
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white flex items-center justify-center"
          >

            Volver a producción

          </Link>

        </div>

        
        {/* Jornada seleccionada */}
<div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6 mb-8">

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

    <div>

      <p className="text-zinc-500 text-sm">
        Jornada seleccionada
      </p>

      <h2 className="text-3xl font-bold text-white mt-2">

        {fechaSeleccionada
  ?.split("-")
  .reverse()
  .join("/")}

      </h2>

      <p className="text-zinc-500 text-sm mt-2">
        Producción registrada durante la jornada
      </p>

    </div>

    <div>

      <input
        type="date"
        value={fechaSeleccionada}
        onChange={(e) => {

          setFechaSeleccionada(e.target.value);

          cargarProducciones(e.target.value);

        }}
        className="w-full md:w-[260px] h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
      />

    </div>

  </div>

</div>

        {/* Sin producción */}
        {producciones.length === 0 && (

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-10 text-center">

            <h2 className="text-2xl font-semibold text-white">
              Sin producción registrada
            </h2>

            <p className="text-zinc-500 mt-3">
              No existen registros para esta fecha
            </p>

          </div>

        )}

        {/* Producciones */}
        <div className="space-y-6">

          {producciones.map((produccion: any, index: number) => (

            <div
              key={produccion.id}
              className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden"
            >

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b border-white/5">

                <div>

                  <h2 className="text-2xl font-semibold text-white">

                    Producción #{index + 1}

                  </h2>

                  <p className="text-zinc-500 text-sm mt-1">

                    {produccion.fecha} • {produccion.hora}

                  </p>

                </div>

                <div className="bg-[#07111f] border border-white/5 px-5 py-3 rounded-2xl">

                  <p className="text-zinc-500 text-sm">
                    Color
                  </p>

                  <p className="text-white font-semibold mt-1">
                    {produccion.color}
                  </p>

                </div>

              </div>

              {/* Desktop */}
              <div className="hidden md:block">

                <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

                  <div>Producto</div>
                  <div>Cantidad</div>
                  <div>Destino</div>
                  <div>Detalle</div>

                </div>

                {produccion.produccion_items.map((producto: any, index: number) => (

                  <div
                    key={index}
                    className="grid grid-cols-4 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
                  >

                    <div className="text-white">
                      {producto.producto}
                    </div>

                    <div className="text-white">
                      {producto.cantidad}
                    </div>

                    <div>

                      {producto.destino === "Stock" && (
                        <span className="text-emerald-400">
                          Stock
                        </span>
                      )}

                      {producto.destino === "Pedido" && (
                        <span className="text-yellow-400">
                          Pedido
                        </span>
                      )}

                    </div>

                    <div className="text-white">
                      {producto.detalle || "-"}
                    </div>

                  </div>

                ))}

              </div>

              {/* Mobile */}
              <div className="md:hidden p-4 space-y-4">

                {produccion.produccion_items.map((producto: any, index: number) => (

                  <div
                    key={index}
                    className="bg-[#07111f] border border-white/5 rounded-3xl p-5"
                  >

                    <div className="flex items-center justify-between mb-4">

                      <h3 className="text-lg font-semibold text-white">
                        {producto.producto}
                      </h3>

                      <div>

                        {producto.destino === "Stock" && (
                          <span className="text-emerald-400">
                            Stock
                          </span>
                        )}

                        {producto.destino === "Pedido" && (
                          <span className="text-yellow-400">
                            Pedido
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="space-y-2 text-sm text-white">

                      <div className="flex justify-between">

                        <span>Cantidad</span>

                        <span>
                          {producto.cantidad}
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span>Detalle</span>

                        <span className="text-right">
                          {producto.detalle || "-"}
                        </span>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

      </div>

    </>

  );

}