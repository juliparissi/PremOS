"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { RECETAS } from "@/lib/recetas";

export default function ProduccionPage() {

  const [modalProduccion, setModalProduccion] = useState(false);

  const [productosProduccion, setProductosProduccion] = useState<any[]>([]);

  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [destino, setDestino] = useState("Stock");
  const [detallePedido, setDetallePedido] = useState("");
  const [color, setColor] = useState("");

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [productosDB, setProductosDB] = useState<any[]>([]);
  const [coloresDB, setColoresDB] = useState<any[]>([]);

  async function cargarProductos() {

  const { data, error } = await supabase
    .from("productos")
    .select("*");

  if (!error && data) {

    setProductosDB(data);

  }

}

async function cargarColores() {

  const { data, error } = await supabase
    .from("colores")
    .select("*");

  console.log(data);

  if (!error && data) {

    setColoresDB(data);

  }

}

async function cargarProducciones(fecha?: string) {

  const fechaFiltro =
    fecha || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("produccion")
    .select(`
      *,
      produccion_items (*)
    `)
    .eq("fecha", fechaFiltro)
    .order("hora", { ascending: true });

  if (!error && data) {

    setProducciones(data);

  }

}

async function guardarProduccion() {
  if (
    !fecha ||
    !hora ||
    !color ||
    productosProduccion.length === 0
  ) {

  alert("Completar todos los campos");

  return;

}

  // guardar producción
  const { data, error } = await supabase
    .from("produccion")
    .insert([
      {
        fecha,
        hora,
        color,
      },
    ])
    .select()
    .single();

  if (error || !data) {

    console.log(error);
    return;

  }

  // guardar productos
  const items = productosProduccion.map((item) => ({

    produccion_id: data.id,

    producto: item.producto,
    cantidad: item.cantidad,
    destino: item.destino,
    detalle: item.detalle,

  }));

  const { error: errorItems } = await supabase
    .from("produccion_items")
    .insert(items);

  if (errorItems) {

    console.log(errorItems);
    return;

  }

  // actualizar stock

for (const item of productosProduccion) {

  if (item.destino !== "Stock") {
    continue;
  }

  const nombreStock =
    `${item.producto} - ${color}`;

  const { data: stockItem } = await supabase
    .from("stock")
    .select("*")
    .eq("producto", nombreStock)
    .single();

  if (!stockItem) {
    continue;
  }

  await supabase
    .from("stock")
    .update({
      stock_actual:
        Number(stockItem.stock_actual) +
        Number(item.cantidad),

      updated_at: new Date(),
    })
    .eq("id", stockItem.id);

}

// descontar materias primas

const receta = RECETAS[
  color as keyof typeof RECETAS
];

if (receta) {

  const descontar = async (
    nombre: string,
    cantidad: number
  ) => {

    const { data: material } =
      await supabase
        .from("suministros")
        .select("*")
        .eq("nombre", nombre)
        .single();

    if (!material) return;

    await supabase
      .from("suministros")
      .update({
        stock_actual:
          Number(material.stock_actual) -
          Number(cantidad),

        updated_at: new Date(),
      })
      .eq("id", material.id);

  };

  await descontar(
    "Cemento",
    receta.cemento_bolsas
  );

  await descontar(
    "Arena",
    receta.arena_kg
  );

  await descontar(
    "Piedra",
    receta.piedra_kg
  );

  if ("ferrite" in receta && receta.ferrite) {

    await descontar(
      receta.ferrite.nombre,
      receta.ferrite.gramos
    );

  }

}

  // limpiar
  setProductosProduccion([]);

  setProducto("");
  setCantidad("");
  setDestino("Stock");
  setDetallePedido("");

  setFecha("");
  setHora("");
  setColor("");
  cargarProducciones();

  setModalProduccion(false);

  alert("Producción guardada");

}

  const [producciones, setProducciones] = useState<any[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  useEffect(() => {

    const hoy = new Date()
    .toISOString()
    .split("T")[0];

  setFechaSeleccionada(hoy);

  cargarProductos();
  cargarColores();
  cargarProducciones();

}, []);

  return (

    <>

      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Producción diaria
            </h1>

            <p className="text-zinc-500 mt-1">
              Registro operativo de producción
            </p>

          </div>

          <div className="flex flex-col md:flex-row gap-3">

            <button
              onClick={() => setModalProduccion(true)}
              className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
            >

              Registrar producción

            </button>

            <Link
  href="/produccion/registro"
  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white flex items-center justify-center"
>

  Historial producción

</Link>

          </div>

        </div>

        {/* Semana */}
<div className="flex gap-3 overflow-x-auto mb-8 pb-2">

  {Array.from({ length: 6 }).map((_, index) => {

    const fecha = new Date();

    fecha.setDate(fecha.getDate() - index);

    const fechaTexto = fecha
      .toISOString()
      .split("T")[0];

    const nombreDia = fecha
      .toLocaleDateString("es-AR", {
        weekday: "short",
      })
      .toUpperCase();

    return (

      <button
        key={fechaTexto}
        onClick={() => {

          setFechaSeleccionada(fechaTexto);

          cargarProducciones(fechaTexto);

        }}
        className={`min-w-[90px] px-5 py-4 rounded-2xl border transition ${
          fechaSeleccionada === fechaTexto
            ? "bg-cyan-500 text-black border-cyan-400"
            : "bg-[#0b1727] text-white border-white/5 hover:bg-white/5"
        }`}
      >

        <div className="font-semibold">
          {nombreDia}
        </div>

        <div className="text-xs mt-1">
          {fecha.getDate()}/
          {fecha.getMonth() + 1}
        </div>

      </button>

    );

  })}

</div>

        {/* Fecha */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6 mb-8">

          <p className="text-zinc-500 text-sm">
            Jornada de producción
          </p>

          <h2 className="text-3xl font-bold text-white mt-2">

  {fechaSeleccionada
  ?.split("-")
  .reverse()
  .join("/")}

</h2>

          <p className="text-zinc-500 text-sm mt-2">
            Producción registrada al finalizar la jornada
          </p>

        </div>

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

                    {produccion.fecha
  ?.split("-")
  .reverse()
  .join("/")} • {produccion.hora}

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

      {/* Modal producción */}
      {modalProduccion && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl relative overflow-hidden max-h-[95vh] overflow-y-auto">

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0b1727] z-10">

              <button
                onClick={() => setModalProduccion(false)}
                className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
              >
                ×
              </button>

              <h2 className="text-3xl font-bold text-white">
                Registrar producción
              </h2>

              <p className="text-zinc-500 mt-1">
                Registro operativo diario
              </p>

            </div>

            {/* Formulario */}
            <div className="p-6 space-y-8">

              {/* Datos producción */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-5">

  <div>

    <label className="text-sm text-zinc-400 block mb-2">
      Fecha
    </label>

    <input
  type="date"
  value={fecha}
  onChange={(e) => setFecha(e.target.value)}
  className="w-full h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
/>

  </div>

  <div>

    <label className="text-sm text-zinc-400 block mb-2">
      Hora
    </label>

    <input
  type="time"
  value={hora}
  onChange={(e) => setHora(e.target.value)}
  className="w-full h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
/>

  </div>

  <div>

    <label className="text-sm text-zinc-400 block mb-2">
      Color
    </label>

    <select
  value={color}
  onChange={(e) => setColor(e.target.value)}
  className="w-full h-[52px] bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
>

  <option value="">
    Seleccionar
  </option>

  {coloresDB.map((item) => (

    <option
      key={item.id}
      value={item.nombre}
    >

      {item.nombre}

    </option>

  ))}

</select>

  </div>

</div>

              {/* Producto */}
              <div className="space-y-6">

                <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5">

                  <div className="flex items-center justify-between mb-6">

                    <div>

                      <h3 className="text-xl font-semibold text-white">
                        Productos generados
                      </h3>

                      <p className="text-zinc-500 text-sm mt-1">
                        Productos obtenidos de esta producción
                      </p>

                    </div>

                    <button
                      onClick={() => {

                        if (!producto || !cantidad) return;

                        setProductosProduccion([
                          ...productosProduccion,
                          {
                            producto,
                            cantidad,
                            destino,
                            detalle: destino === "Pedido"
                              ? detallePedido
                              : "",
                          },
                        ]);

                        setProducto("");
                        setCantidad("");
                        setDestino("Stock");
                        setDetallePedido("");

                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
                    >

                      Agregar producto

                    </button>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

                    <div>

                      <label className="text-sm text-zinc-400 block mb-2">
                        Producto
                      </label>

                      <select
  value={producto}
  onChange={(e) => setProducto(e.target.value)}
  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
>

  <option value="">
    Seleccionar
  </option>

  {productosDB.map((item) => (

    <option
      key={item.id}
      value={`${item.producto} - ${item.modelo}`}
    >

      {item.producto} - {item.modelo}

    </option>

  ))}

</select>

                    </div>

                    <div>

                      <label className="text-sm text-zinc-400 block mb-2">
                        Cantidad
                      </label>

                      <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                      />

                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>

                      <label className="text-sm text-zinc-400 block mb-2">
                        Destino
                      </label>

                      <select
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                      >

                        <option>
                          Stock
                        </option>

                        <option>
                          Pedido
                        </option>

                      </select>

                    </div>

                    {destino === "Pedido" && (

                      <div>

                        <label className="text-sm text-zinc-400 block mb-2">
                          Detalle pedido
                        </label>

                        <input
                          type="text"
                          value={detallePedido}
                          onChange={(e) => setDetallePedido(e.target.value)}
                          placeholder="Ej: Pedido Juan Pérez"
                          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500"
                        />

                      </div>

                    )}

                  </div>

                </div>

              </div>

              {/* Productos agregados */}
              {productosProduccion.length > 0 && (

                <div className="bg-[#07111f] border border-white/5 rounded-3xl p-5">

                  <h3 className="text-xl font-semibold text-white mb-6">
                    Productos agregados
                  </h3>

                  <div className="space-y-4">

                    {productosProduccion.map((item, index) => (

                      <div
                        key={index}
                        className="bg-[#0b1727] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >

                        <div className="space-y-2">

                          <p className="text-white font-semibold">
                            {item.producto}
                          </p>

                          <p className="text-zinc-400 text-sm">
                            Cantidad: {item.cantidad}
                          </p>

                          <p
                            className={`text-sm ${
                              item.destino === "Stock"
                                ? "text-emerald-400"
                                : "text-yellow-400"
                            }`}
                          >

                            {item.destino}

                          </p>

                          {item.detalle && (

                            <p className="text-zinc-500 text-sm">
                              {item.detalle}
                            </p>

                          )}

                        </div>

                        <button
                          onClick={() => {

                            setProductosProduccion(
                              productosProduccion.filter(
                                (_, i) => i !== index
                              )
                            );

                          }}
                          className="bg-red-500/20 hover:bg-red-500 transition text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/20"
                        >

                          ✕

                        </button>

                      </div>

                    ))}

                  </div>

                </div>

              )}

              {/* Footer */}
              <div className="flex flex-col md:flex-row justify-end gap-4 pt-4">

                <button
                  onClick={() => setModalProduccion(false)}
                  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
                >

                  Cancelar

                </button>

                <button
  onClick={guardarProduccion}
  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
>

  Guardar producción

</button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>

  );

}
