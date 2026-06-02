"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { RECETAS } from "@/lib/recetas";
import { generarPDFTrackProduccion } from "@/utils/generarPDF";

type RecetaMaterial = {
  nombre: string;
  cantidad: number;
  unidad: string;
};

type RecetasProduccion = Record<string, RecetaMaterial[]>;

type ProductoProduccion = {
  producto: string;
  cantidad: string;
  destino: string;
  detalle: string;
};

function fechaArgentina(value?: string) {
  if (!value) return "-";

  return value.split("-").reverse().join("/");
}

function redondearStock(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function recetaDesdeArchivo(): RecetasProduccion {
  return Object.entries(RECETAS).reduce<RecetasProduccion>(
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

const recetasBase = recetaDesdeArchivo();

export default function ProduccionPage() {
  const [modalProduccion, setModalProduccion] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  const [productosProduccion, setProductosProduccion] = useState<
    ProductoProduccion[]
  >([]);

  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [destino, setDestino] = useState("Stock");
  const [detallePedido, setDetallePedido] = useState("");
  const [color, setColor] = useState("");

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [productosDB, setProductosDB] = useState<any[]>([]);
  const [coloresDB, setColoresDB] = useState<any[]>([]);
  const [materialesDB, setMaterialesDB] = useState<any[]>([]);
  const [producciones, setProducciones] = useState<any[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  const [recetasConfig, setRecetasConfig] =
    useState<RecetasProduccion>(recetasBase);
  const [colorConfig, setColorConfig] = useState("");
  const [materialesConfig, setMaterialesConfig] = useState<RecetaMaterial[]>([]);
  const [materialConfig, setMaterialConfig] = useState("");
  const [cantidadConfig, setCantidadConfig] = useState("");
  const [unidadConfig, setUnidadConfig] = useState("");

  const coloresConfigurables = useMemo(() => {
    const nombres = [
      ...coloresDB.map((item) => item.nombre),
      ...Object.keys(recetasConfig),
    ].filter(Boolean);

    return Array.from(new Set(nombres)).sort();
  }, [coloresDB, recetasConfig]);

  async function cargarProductos() {
    const { data, error } = await supabase.from("productos").select("*");

    if (!error && data) {
      setProductosDB(data);
    }
  }

  async function cargarColores() {
    const { data, error } = await supabase.from("colores").select("*");

    if (!error && data) {
      setColoresDB(data);
    }
  }

  async function cargarMateriales() {
    const { data, error } = await supabase
      .from("suministros")
      .select("id,nombre,unidad")
      .order("nombre");

    if (!error && data) {
      setMaterialesDB(data);
    }
  }

  async function cargarProducciones(fecha?: string) {
    const fechaFiltro =
      fecha || fechaSeleccionada || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("produccion")
      .select(
        `
        *,
        produccion_items (*)
      `
      )
      .eq("fecha", fechaFiltro)
      .order("hora", { ascending: true });

    if (!error && data) {
      setProducciones(data);
    }
  }

  async function cargarRecetas() {
    let recetas = recetasBase;

    try {
      const guardadas = localStorage.getItem("premos_recetas_produccion");

      if (guardadas) {
        recetas = {
          ...recetas,
          ...JSON.parse(guardadas),
        };
      }
    } catch {
      recetas = recetasBase;
    }

    const { data, error } = await supabase
      .from("recetas_produccion")
      .select("*");

    if (!error && data?.length) {
      const recetasDB = data.reduce<RecetasProduccion>((acc, item) => {
        acc[item.color] = item.materiales || [];
        return acc;
      }, {});

      recetas = {
        ...recetas,
        ...recetasDB,
      };
    }

    setRecetasConfig(recetas);
  }

  function abrirConfigProduccion() {
    const primerColor =
      color || coloresConfigurables[0] || Object.keys(recetasConfig)[0] || "";

    setColorConfig(primerColor);
    setMaterialesConfig(recetasConfig[primerColor] || []);
    setMaterialConfig("");
    setCantidadConfig("");
    setUnidadConfig("");
    setModalConfig(true);
  }

  function cambiarColorConfig(nuevoColor: string) {
    setColorConfig(nuevoColor);
    setMaterialesConfig(recetasConfig[nuevoColor] || []);
    setMaterialConfig("");
    setCantidadConfig("");
    setUnidadConfig("");
  }

  function agregarMaterialConfig() {
    if (!materialConfig || !cantidadConfig) return;

    const material = materialesDB.find((item) => item.nombre === materialConfig);

    setMaterialesConfig([
      ...materialesConfig,
      {
        nombre: materialConfig,
        cantidad: Number(cantidadConfig),
        unidad: unidadConfig || material?.unidad || "",
      },
    ]);

    setMaterialConfig("");
    setCantidadConfig("");
    setUnidadConfig("");
  }

  async function guardarConfigProduccion() {
    if (!colorConfig) {
      alert("Seleccioná un color para configurar la receta");
      return;
    }

    const nuevaConfig = {
      ...recetasConfig,
      [colorConfig]: materialesConfig,
    };

    setRecetasConfig(nuevaConfig);
    localStorage.setItem(
      "premos_recetas_produccion",
      JSON.stringify(nuevaConfig)
    );

    const { error } = await supabase.from("recetas_produccion").upsert(
      {
        color: colorConfig,
        materiales: materialesConfig,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "color",
      }
    );

    setModalConfig(false);

    if (error) {
      alert(
        "Receta guardada localmente. Para guardarla en Supabase ejecutá el SQL de recetas_produccion."
      );
      return;
    }

    alert("Configuración de producción guardada");
  }

  async function descontarMateriasPrimas(colorProduccion: string) {
    const receta = recetasConfig[colorProduccion] || recetasBase[colorProduccion];

    if (!receta?.length) return;

    for (const item of receta) {
      const { data: material } = await supabase
        .from("suministros")
        .select("*")
        .eq("nombre", item.nombre)
        .single();

      if (!material) continue;

      await supabase
        .from("suministros")
        .update({
          stock_actual: redondearStock(
            Number(material.stock_actual) - Number(item.cantidad)
          ),
          updated_at: new Date(),
        })
        .eq("id", material.id);
    }
  }

  async function devolverMateriasPrimas(colorProduccion: string) {
    const receta = recetasConfig[colorProduccion] || recetasBase[colorProduccion];

    if (!receta?.length) return;

    for (const item of receta) {
      const { data: material } = await supabase
        .from("suministros")
        .select("*")
        .eq("nombre", item.nombre)
        .single();

      if (!material) continue;

      await supabase
        .from("suministros")
        .update({
          stock_actual: redondearStock(
            Number(material.stock_actual) + Number(item.cantidad)
          ),
          updated_at: new Date(),
        })
        .eq("id", material.id);
    }
  }

  async function revertirStockProduccion(produccion: any) {
    for (const item of produccion.produccion_items || []) {
      if (item.destino !== "Stock") continue;

      const nombreStock = `${item.producto} - ${produccion.color}`;

      const { data: stockItem } = await supabase
        .from("stock")
        .select("*")
        .eq("producto", nombreStock)
        .single();

      if (!stockItem) continue;

      await supabase
        .from("stock")
        .update({
          stock_actual: redondearStock(
            Number(stockItem.stock_actual) - Number(item.cantidad)
          ),
          updated_at: new Date(),
        })
        .eq("id", stockItem.id);
    }
  }

  async function eliminarProduccion(produccion: any) {
    const confirmar = confirm(
      "¿Querés eliminar esta producción? Se devolverán las materias primas a Suministro y se revertirá el stock generado."
    );

    if (!confirmar) return;

    await devolverMateriasPrimas(produccion.color);
    await revertirStockProduccion(produccion);

    const { error: errorItems } = await supabase
      .from("produccion_items")
      .delete()
      .eq("produccion_id", produccion.id);

    if (errorItems) {
      alert("No se pudieron eliminar los items de la producción.");
      return;
    }

    const { error } = await supabase
      .from("produccion")
      .delete()
      .eq("id", produccion.id);

    if (error) {
      alert("No se pudo eliminar la producción.");
      return;
    }

    cargarProducciones(fechaSeleccionada);
    cargarMateriales();
  }

  async function guardarProduccion() {
    if (!fecha || !hora || !color || productosProduccion.length === 0) {
      alert("Completar todos los campos");
      return;
    }

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

    for (const item of productosProduccion) {
      if (item.destino !== "Stock") continue;

      const nombreStock = `${item.producto} - ${color}`;

      const { data: stockItem } = await supabase
        .from("stock")
        .select("*")
        .eq("producto", nombreStock)
        .single();

      if (!stockItem) continue;

      await supabase
        .from("stock")
        .update({
          stock_actual: Number(stockItem.stock_actual) + Number(item.cantidad),
          updated_at: new Date(),
        })
        .eq("id", stockItem.id);
    }

    await descontarMateriasPrimas(color);

    setProductosProduccion([]);
    setProducto("");
    setCantidad("");
    setDestino("Stock");
    setDetallePedido("");
    setFecha("");
    setHora("");
    setColor("");
    cargarProducciones(fechaSeleccionada);
    cargarMateriales();
    setModalProduccion(false);
    alert("Producción guardada");
  }

  function generarTrack(produccion: any, index: number) {
    const codigo = `PROD-${produccion.fecha?.replaceAll("-", "")}-${String(
      index + 1
    ).padStart(3, "0")}`;

    generarPDFTrackProduccion({
      codigo,
      fecha: produccion.fecha,
      hora: produccion.hora,
      color: produccion.color,
      items: produccion.produccion_items || [],
      materiales: recetasConfig[produccion.color] || recetasBase[produccion.color] || [],
    });
  }

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];

    setFechaSeleccionada(hoy);
    cargarProductos();
    cargarColores();
    cargarMateriales();
    cargarRecetas();
    cargarProducciones(hoy);
  }, []);

  return (
    <>
      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">
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
              onClick={abrirConfigProduccion}
              className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
            >
              Configurar producción
            </button>

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

        <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
          {Array.from({ length: 6 }).map((_, index) => {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - index);

            const fechaTexto = fecha.toISOString().split("T")[0];
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
                <div className="font-semibold">{nombreDia}</div>

                <div className="text-xs mt-1">
                  {fecha.getDate()}/{fecha.getMonth() + 1}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6 mb-8">
          <p className="text-zinc-500 text-sm">Jornada de producción</p>

          <h2 className="text-3xl font-bold text-white mt-2">
            {fechaArgentina(fechaSeleccionada)}
          </h2>

          <p className="text-zinc-500 text-sm mt-2">
            Producción registrada al finalizar la jornada
          </p>
        </div>

        <div className="space-y-6">
          {producciones.map((produccion: any, index: number) => (
            <div
              key={produccion.id}
              className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Producción #{index + 1}
                  </h2>

                  <p className="text-zinc-500 text-sm mt-1">
                    {fechaArgentina(produccion.fecha)} · {produccion.hora}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => generarTrack(produccion, index)}
                    className="bg-cyan-500/10 hover:bg-cyan-500 transition px-5 py-3 rounded-2xl border border-cyan-500/30 text-cyan-300 hover:text-black font-semibold"
                  >
                    Generar track
                  </button>

                  <button
                    onClick={() => eliminarProduccion(produccion)}
                    className="bg-red-500/10 hover:bg-red-500 transition px-5 py-3 rounded-2xl border border-red-500/30 text-red-300 hover:text-white font-semibold"
                  >
                    Eliminar
                  </button>

                  <div className="bg-[#07111f] border border-white/5 px-5 py-3 rounded-2xl">
                    <p className="text-zinc-500 text-sm">Color</p>

                    <p className="text-white font-semibold mt-1">
                      {produccion.color}
                    </p>
                  </div>
                </div>
              </div>

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
                    <div className="text-white">{producto.producto}</div>
                    <div className="text-white">{producto.cantidad}</div>
                    <div>
                      {producto.destino === "Stock" && (
                        <span className="text-emerald-400">Stock</span>
                      )}

                      {producto.destino === "Pedido" && (
                        <span className="text-yellow-400">Pedido</span>
                      )}
                    </div>
                    <div className="text-white">{producto.detalle || "-"}</div>
                  </div>
                ))}
              </div>

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
                          <span className="text-emerald-400">Stock</span>
                        )}

                        {producto.destino === "Pedido" && (
                          <span className="text-yellow-400">Pedido</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-white">
                      <div className="flex justify-between">
                        <span>Cantidad</span>
                        <span>{producto.cantidad}</span>
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

      {modalProduccion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0b1727] z-10">
              <button
                onClick={() => setModalProduccion(false)}
                className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
              >
                x
              </button>

              <h2 className="text-3xl font-bold text-white">
                Registrar producción
              </h2>

              <p className="text-zinc-500 mt-1">
                Registro operativo diario
              </p>
            </div>

            <div className="p-6 space-y-8">
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
                    <option value="">Seleccionar</option>

                    {coloresDB.map((item) => (
                      <option key={item.id} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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
                            detalle:
                              destino === "Pedido" ? detallePedido : "",
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
                        <option value="">Seleccionar</option>

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
                        <option>Stock</option>
                        <option>Pedido</option>
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
                              productosProduccion.filter((_, i) => i !== index)
                            );
                          }}
                          className="bg-red-500/20 hover:bg-red-500 transition text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/20"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {modalConfig && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0b1727] z-10">
              <button
                onClick={() => setModalConfig(false)}
                className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
              >
                x
              </button>

              <h2 className="text-3xl font-bold text-white">
                Configurar producción
              </h2>

              <p className="text-zinc-500 mt-1">
                Recetas y consumo de materias primas por pastón
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Color / receta
                </label>

                <select
                  value={colorConfig}
                  onChange={(e) => cambiarColorConfig(e.target.value)}
                  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                >
                  {coloresConfigurables.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-5">
                <h3 className="text-xl font-semibold text-white mb-5">
                  Materias primas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_auto] gap-4 mb-5">
                  <select
                    value={materialConfig}
                    onChange={(e) => {
                      const nombre = e.target.value;
                      const material = materialesDB.find(
                        (item) => item.nombre === nombre
                      );

                      setMaterialConfig(nombre);
                      setUnidadConfig(material?.unidad || "");
                    }}
                    className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  >
                    <option value="">Materia prima</option>

                    {materialesDB.map((item) => (
                      <option key={item.id} value={item.nombre}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={cantidadConfig}
                    onChange={(e) => setCantidadConfig(e.target.value)}
                    placeholder="Cantidad"
                    className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500"
                  />

                  <input
                    type="text"
                    value={unidadConfig}
                    onChange={(e) => setUnidadConfig(e.target.value)}
                    placeholder="Unidad"
                    className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500"
                  />

                  <button
                    onClick={agregarMaterialConfig}
                    className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-3">
                  {materialesConfig.map((item, index) => (
                    <div
                      key={`${item.nombre}-${index}`}
                      className="bg-[#0b1727] border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto] gap-3 md:items-center"
                    >
                      <p className="text-white font-semibold">{item.nombre}</p>

                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => {
                          const nuevos = [...materialesConfig];
                          nuevos[index] = {
                            ...nuevos[index],
                            cantidad: Number(e.target.value),
                          };
                          setMaterialesConfig(nuevos);
                        }}
                        className="bg-[#07111f] border border-white/5 rounded-xl px-3 py-2 text-white"
                      />

                      <input
                        type="text"
                        value={item.unidad}
                        onChange={(e) => {
                          const nuevos = [...materialesConfig];
                          nuevos[index] = {
                            ...nuevos[index],
                            unidad: e.target.value,
                          };
                          setMaterialesConfig(nuevos);
                        }}
                        className="bg-[#07111f] border border-white/5 rounded-xl px-3 py-2 text-white"
                      />

                      <button
                        onClick={() =>
                          setMaterialesConfig(
                            materialesConfig.filter((_, i) => i !== index)
                          )
                        }
                        className="bg-red-500/20 hover:bg-red-500 transition text-red-400 hover:text-white px-4 py-2 rounded-xl border border-red-500/20"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}

                  {materialesConfig.length === 0 && (
                    <p className="text-zinc-500 text-sm">
                      Esta receta todavía no tiene materias primas cargadas.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-4 pt-2">
                <button
                  onClick={() => setModalConfig(false)}
                  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
                >
                  Cancelar
                </button>

                <button
                  onClick={guardarConfigProduccion}
                  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
                >
                  Guardar configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
