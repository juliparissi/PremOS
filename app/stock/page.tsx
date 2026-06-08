"use client";

import BackButton from "@/components/BackButton";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const unidadesStock = [
  "Und",
  "m2",
  "kg",
  "grs",
  "L",
  "ml",
  "m3",
  "metro lineal",
  "Bolsa",
  "Caja",
  "Paquete",
  "Pallet",
  "Bidon 5L",
  "Bidon 10L",
  "Bidon 20L",
];

export default function StockPage() {

  const [modalConfigurar, setModalConfigurar] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  const [stockActual, setStockActual] = useState("");
  const [unidadStock, setUnidadStock] = useState("Und");
  const [stockMinimo, setStockMinimo] = useState("");
  const [stockIdeal, setStockIdeal] = useState("");
  const [stockMaximo, setStockMaximo] = useState("");

  const [productos, setProductos] = useState<any[]>([]);

  async function sincronizarStock() {

  const { data: productosDB } = await supabase
    .from("productos")
    .select("*");

  const { data: stockDB } = await supabase
    .from("stock")
    .select("*");

  if (!productosDB) return;

  for (const item of productosDB) {

    const nombreProducto =
      `${item.producto} - ${item.modelo} - ${item.color}`;

    const existe = stockDB?.find(
      (s) => s.producto === nombreProducto
    );

    if (!existe) {

      await supabase
        .from("stock")
        .insert({
          producto: nombreProducto,
          stock_actual: Number(item.cantidad || 0),
          stock_minimo: 0,
          stock_ideal: 0,
          stock_maximo: 0,
        });

    }

  }

}

async function cargarStock() {

  const { data } = await supabase
    .from("stock")
    .select("*")
    .order("producto");

  if (!data) return;

  const { data: productosDB } = await supabase
    .from("productos")
    .select("producto,modelo,color,unidad");

  const unidadesPorProducto = new Map(
    (productosDB || []).map((item) => [
      `${item.producto} - ${item.modelo} - ${item.color}`,
      item.unidad || "Und",
    ])
  );

  const productosFormateados = data.map((item) => {

    let estado = "Óptimo";

  if (
  item.stock_minimo > 0 &&
  item.stock_actual <= item.stock_minimo
) {

  estado = "Crítico";

} else if (
  item.stock_ideal > 0 &&
  item.stock_actual < item.stock_ideal
) {

  estado = "Bajo";

} else if (
  item.stock_maximo > 0 &&
  item.stock_actual > item.stock_maximo
) {

  estado = "Sobrestock";

}

    return {

  id: item.id,
  producto: item.producto,

  actual: item.stock_actual,
  unidad: unidadesPorProducto.get(item.producto) || "Und",
  minimo: item.stock_minimo,
  ideal: item.stock_ideal,
  maximo: item.stock_maximo,

  estado,

};

  });

  setProductos(productosFormateados);

}

async function guardarConfiguracionStock() {

  if (!productoSeleccionado) return;

  await supabase
    .from("stock")
    .update({
      stock_actual: Number(stockActual || 0),
      stock_minimo: Number(stockMinimo),
      stock_ideal: Number(stockIdeal),
      stock_maximo: Number(stockMaximo),
      updated_at: new Date(),
    })
    .eq("id", productoSeleccionado.id);

  const [producto, modelo, color] = String(productoSeleccionado.producto || "")
    .split(" - ")
    .map((item) => item.trim());

  if (producto && modelo && color) {
    await supabase
      .from("productos")
      .update({
        cantidad: Number(stockActual || 0),
        unidad: unidadStock,
      })
      .eq("producto", producto)
      .eq("modelo", modelo)
      .eq("color", color);
  }

  await cargarStock();

  setModalConfigurar(false);

}

function seleccionarProducto(id: string) {

  const producto = productos.find(
    (p) => p.id === id
  );

  if (!producto) return;

  setProductoSeleccionado(producto);

  setStockActual(
    producto.actual?.toString() || ""
  );

  setUnidadStock(
    producto.unidad || "Und"
  );

  setStockMinimo(
    producto.minimo?.toString() || ""
  );

  setStockIdeal(
    producto.ideal?.toString() || ""
  );

  setStockMaximo(
    producto.maximo?.toString() || ""
  );

}

useEffect(() => {

  async function iniciar() {

    await sincronizarStock();

    await cargarStock();

  }

  iniciar();

}, []);

  return (

    <>

      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Stock
            </h1>

            <p className="text-zinc-500 mt-1">
              Control operativo de stock y producción
            </p>

          </div>

          <button
  onClick={() => {

    setProductoSeleccionado(null);

    setStockActual("");
    setUnidadStock("Und");
    setStockMinimo("");
    setStockIdeal("");
    setStockMaximo("");

    setModalConfigurar(true);

  }}
  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
>
  Configurar stock
</button>

        </div>

        {/* Tabla desktop */}
        <div className="hidden md:block bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

          <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr_1fr] px-6 py-5 border-b border-white/5 text-zinc-500 text-sm">

            <div>Producto</div>
            <div>Actual</div>
            <div>Mínimo</div>
            <div>Ideal</div>
            <div>Máximo</div>
            <div>Estado</div>
            <div>Sugerencia</div>

          </div>

          {productos.map((item, index) => (

            <div
              key={index}
              className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr_1fr] px-6 py-5 border-b border-white/5 hover:bg-white/5 transition items-center"
            >

              <div className="text-white font-medium">
                {item.producto}
              </div>

              <div className="text-white">
                {Number(item.actual || 0).toLocaleString("es-AR", {
                  maximumFractionDigits: 3,
                })}{" "}
                {item.unidad}
              </div>

              <div className="text-white">
                {item.minimo}
              </div>

              <div className="text-white">
                {item.ideal}
              </div>

              <div className="text-white">
                {item.maximo}
              </div>

              <div>

                {item.estado === "Óptimo" && (
                  <span className="text-emerald-400">
                    Óptimo
                  </span>
                )}

                {item.estado === "Bajo" && (
                  <span className="text-yellow-400">
                    Bajo
                  </span>
                )}

                {item.estado === "Crítico" && (
                  <span className="text-red-400">
                    Crítico
                  </span>
                )}

                {item.estado === "Sobrestock" && (
                  <span className="text-cyan-400">
                    Sobrestock
                  </span>
                )}

              </div>

              <div className="text-zinc-300">

                {item.actual < item.ideal
                  ? `Producir ${item.ideal - item.actual}`
                  : "-"}

              </div>

            </div>

          ))}

        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-5">

          {productos.map((item, index) => (

            <div
              key={index}
              className="bg-[#0b1727] border border-white/5 rounded-3xl p-5"
            >

              <div className="flex items-start justify-between gap-4 mb-5">

                <div>

                  <h2 className="text-xl font-semibold text-white">
                    {item.producto}
                  </h2>

                  <p className="text-zinc-500 text-sm mt-1">

                    Actual:{" "}
                    {Number(item.actual || 0).toLocaleString("es-AR", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    {item.unidad}

                  </p>

                </div>

                <div>

                  {item.estado === "Óptimo" && (
                    <span className="text-emerald-400">
                      Óptimo
                    </span>
                  )}

                  {item.estado === "Bajo" && (
                    <span className="text-yellow-400">
                      Bajo
                    </span>
                  )}

                  {item.estado === "Crítico" && (
                    <span className="text-red-400">
                      Crítico
                    </span>
                  )}

                  {item.estado === "Sobrestock" && (
                    <span className="text-cyan-400">
                      Sobrestock
                    </span>
                  )}

                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">

                <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500">
                    Mínimo
                  </p>

                  <p className="text-white text-xl font-semibold mt-2">
                    {item.minimo}
                  </p>

                </div>

                <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500">
                    Ideal
                  </p>

                  <p className="text-white text-xl font-semibold mt-2">
                    {item.ideal}
                  </p>

                </div>

                <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500">
                    Máximo
                  </p>

                  <p className="text-white text-xl font-semibold mt-2">
                    {item.maximo}
                  </p>

                </div>

                <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500">
                    Sugerencia
                  </p>

                  <p className="text-white text-lg font-semibold mt-2">

                    {item.actual < item.ideal
                      ? item.ideal - item.actual
                      : "-"}

                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

        {/* Modal Stock */}

      {modalConfigurar && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl">

      <div className="p-6 border-b border-white/5">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Configurar Stock
          </h2>

          <button
            onClick={() => setModalConfigurar(false)}
            className="text-zinc-400 hover:text-white text-3xl"
          >
            ×
          </button>

        </div>

      </div>

      <div className="p-6 space-y-5">

        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Producto
          </label>

          <select
            onChange={(e) =>
              seleccionarProducto(
                e.target.value
              )
            }
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          >

            <option value="">
              Seleccionar
            </option>

            {productos.map((item) => (

              <option
                key={item.id}
                value={item.id}
              >

                {item.producto}

              </option>

            ))}

          </select>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock actual
            </label>

            <input
              type="number"
              value={stockActual}
              onChange={(e) =>
                setStockActual(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Unidad
            </label>

            <input
              list="unidades-stock"
              value={unidadStock}
              onChange={(e) =>
                setUnidadStock(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />
            <datalist id="unidades-stock">

              {unidadesStock.map((unidad) => (

                <option
                  key={unidad}
                  value={unidad}
                >
                  {unidad}
                </option>

              ))}

            </datalist>

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock mínimo
            </label>

            <input
              type="number"
              value={stockMinimo}
              onChange={(e) =>
                setStockMinimo(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock ideal
            </label>

            <input
              type="number"
              value={stockIdeal}
              onChange={(e) =>
                setStockIdeal(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock máximo
            </label>

            <input
              type="number"
              value={stockMaximo}
              onChange={(e) =>
                setStockMaximo(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

        </div>

        <div className="flex justify-end gap-4 pt-4">

          <button
            onClick={() =>
              setModalConfigurar(false)
            }
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
          >

            Cancelar

          </button>

          <button
            onClick={guardarConfiguracionStock}
            className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
          >

            Guardar

          </button>

        </div>

      </div>

    </div>

  </div>

)}

    </>

  );

}
