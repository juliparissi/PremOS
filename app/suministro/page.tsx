"use client";

import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function SuministroPage() {

  const materiales = [
    {
      nombre: "Cemento",
      unidad: "bolsas",
      stock: 58,
      minimo: 40,
      objetivo: 100,
      estado: "Óptimo",
    },
    {
      nombre: "Arena",
      unidad: "m3",
      stock: 12,
      minimo: 10,
      objetivo: 20,
      estado: "Bajo",
    },
    {
      nombre: "Piedra",
      unidad: "m3",
      stock: 18,
      minimo: 15,
      objetivo: 25,
      estado: "Óptimo",
    },
    {
      nombre: "Color negro",
      unidad: "kg",
      stock: 3,
      minimo: 5,
      objetivo: 10,
      estado: "Crítico",
    },
  ];

  const movimientos = [
    {
      fecha: "22/05/2026",
      material: "Cemento",
      tipo: "Compra",
      cantidad: "+40",
      detalle: "Cementos Avellaneda",
    },
    {
      fecha: "22/05/2026",
      material: "Arena",
      tipo: "Compra",
      cantidad: "+10m3",
      detalle: "Cantera Pilar",
    },
    {
      fecha: "21/05/2026",
      material: "Producción",
      tipo: "Consumo",
      cantidad: "-8 bolsas",
      detalle: "4 pastones",
    },
    {
      fecha: "20/05/2026",
      material: "Producción",
      tipo: "Consumo",
      cantidad: "-2m3",
      detalle: "4 pastones",
    },
  ];

  return (

    <>

      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Suministro
            </h1>

            <p className="text-zinc-500 mt-1">
              Control de materias primas y compras
            </p>

          </div>

          <button className="bg-blue-500 hover:bg-blue-400 transition px-5 py-3 rounded-2xl text-black font-semibold">
            Registrar compra
          </button>

        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Compras del mes
            </p>

            <h2 className="text-3xl font-bold text-emerald-400 mt-3">
              $1.250.000
            </h2>

          </div>

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Materiales críticos
            </p>

            <h2 className="text-3xl font-bold text-red-400 mt-3">
              2
            </h2>

          </div>

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Cemento disponible
            </p>

            <h2 className="text-3xl font-bold text-white mt-3">
              58
            </h2>

          </div>

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Pastones posibles
            </p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-3">
              22
            </h2>

          </div>

        </div>

        {/* Alertas */}
        <div className="space-y-4 mb-8">

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">

            <p className="text-red-400 font-semibold">
              ⚠ Cemento bajo stock
            </p>

            <p className="text-zinc-400 text-sm mt-1">
              Stock estimado para 9 días
            </p>

          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">

            <p className="text-yellow-400 font-semibold">
              ⚠ Color negro crítico
            </p>

            <p className="text-zinc-400 text-sm mt-1">
              Quedan 3kg disponibles
            </p>

          </div>

        </div>

        {/* Stock materiales */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mb-10">

          <div className="px-6 py-5 border-b border-white/5">

            <h2 className="text-2xl font-semibold text-white">
              Stock materias primas
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Control general de materiales
            </p>

          </div>

          {/* Desktop */}
          <div className="hidden md:block">

            <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

              <div>Material</div>
              <div>Unidad</div>
              <div>Stock</div>
              <div>Mínimo</div>
              <div>Objetivo</div>
              <div>Estado</div>

            </div>

            {materiales.map((material, index) => (

              <div
                key={index}
                className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
              >

                <div className="text-white">
                  {material.nombre}
                </div>

                <div className="text-white">
                  {material.unidad}
                </div>

                <div className="text-white">
                  {material.stock}
                </div>

                <div className="text-white">
                  {material.minimo}
                </div>

                <div className="text-white">
                  {material.objetivo}
                </div>

                <div>

                  {material.estado === "Óptimo" && (
                    <span className="text-emerald-400">
                      Óptimo
                    </span>
                  )}

                  {material.estado === "Bajo" && (
                    <span className="text-yellow-400">
                      Bajo
                    </span>
                  )}

                  {material.estado === "Crítico" && (
                    <span className="text-red-400">
                      Crítico
                    </span>
                  )}

                </div>

              </div>

            ))}

          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4 p-4">

            {materiales.map((material, index) => (

              <div
                key={index}
                className="bg-[#07111f] border border-white/5 rounded-3xl p-5"
              >

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-lg font-semibold text-white">
                    {material.nombre}
                  </h3>

                  <div>

                    {material.estado === "Óptimo" && (
                      <span className="text-emerald-400 text-sm">
                        Óptimo
                      </span>
                    )}

                    {material.estado === "Bajo" && (
                      <span className="text-yellow-400 text-sm">
                        Bajo
                      </span>
                    )}

                    {material.estado === "Crítico" && (
                      <span className="text-red-400 text-sm">
                        Crítico
                      </span>
                    )}

                  </div>

                </div>

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between text-white">
                    <span>Unidad</span>
                    <span>{material.unidad}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Stock actual</span>
                    <span>{material.stock}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Mínimo</span>
                    <span>{material.minimo}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Objetivo</span>
                    <span>{material.objetivo}</span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* Movimientos */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

          <div className="px-6 py-5 border-b border-white/5">

            <h2 className="text-2xl font-semibold text-white">
              Movimientos recientes
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Compras y consumos registrados
            </p>

          </div>

          <div className="hidden md:block">

            <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

              <div>Fecha</div>
              <div>Material</div>
              <div>Tipo</div>
              <div>Cantidad</div>
              <div>Detalle</div>

            </div>

            {movimientos.map((movimiento, index) => (

              <div
                key={index}
                className="grid grid-cols-5 px-6 py-5 border-b border-white/5"
              >

                <div className="text-white">
                  {movimiento.fecha}
                </div>

                <div className="text-white">
                  {movimiento.material}
                </div>

                <div>

                  {movimiento.tipo === "Compra" && (
                    <span className="text-emerald-400">
                      Compra
                    </span>
                  )}

                  {movimiento.tipo === "Consumo" && (
                    <span className="text-red-400">
                      Consumo
                    </span>
                  )}

                </div>

                <div className="text-white">
                  {movimiento.cantidad}
                </div>

                <div className="text-white">
                  {movimiento.detalle}
                </div>

              </div>

            ))}

          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4 p-4">

            {movimientos.map((movimiento, index) => (

              <div
                key={index}
                className="bg-[#07111f] border border-white/5 rounded-3xl p-5"
              >

                <div className="flex items-center justify-between mb-3">

                  <span className="text-zinc-500 text-sm">
                    {movimiento.fecha}
                  </span>

                  <div>

                    {movimiento.tipo === "Compra" && (
                      <span className="text-emerald-400 text-sm">
                        Compra
                      </span>
                    )}

                    {movimiento.tipo === "Consumo" && (
                      <span className="text-red-400 text-sm">
                        Consumo
                      </span>
                    )}

                  </div>

                </div>

                <h3 className="text-lg text-white mb-4">
                  {movimiento.material}
                </h3>

                <div className="space-y-2 text-sm text-white">

                  <div className="flex justify-between">
                    <span>Cantidad</span>
                    <span>{movimiento.cantidad}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Detalle</span>
                    <span className="text-right">
                      {movimiento.detalle}
                    </span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </>

  );

}