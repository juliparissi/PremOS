"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProductosPage() {

  const [productos, setProductos] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [producto, setProducto] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [unidad, setUnidad] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [detalles, setDetalles] = useState("");

  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [modalEditar, setModalEditar] = useState(false);

  async function cargarProductos() {

    const { data, error } = await supabase
      .from("productos")
      .select("*");

    if (!error && data) {
      setProductos(data);
    }

  }

  async function crearProducto() {

    const { error } = await supabase
      .from("productos")
      .insert([
        {
          producto,
          modelo,
          color,
          unidad,
          cantidad,
          precio_unitario: precio,
          detalles,
        },
      ]);

    if (!error) {

      setModalAbierto(false);

      setProducto("");
      setModelo("");
      setColor("");
      setUnidad("");
      setCantidad("");
      setPrecio("");
      setDetalles("");

      cargarProductos();

    }

  }

  function abrirEditar(item: any) {

    setProductoEditando(item);

    setProducto(item.producto || "");
    setModelo(item.modelo || "");
    setColor(item.color || "");
    setUnidad(item.unidad || "");
    setCantidad(item.cantidad || "");
    setPrecio(item.precio_unitario || "");
    setDetalles(item.detalles || "");

    setModalEditar(true);

  }

  async function actualizarProducto() {

    const { error } = await supabase
      .from("productos")
      .update({
        producto,
        modelo,
        color,
        unidad,
        cantidad,
        precio_unitario: precio,
        detalles,
      })
      .eq("id", productoEditando.id);

    if (!error) {

      setModalEditar(false);

      cargarProductos();

    }

  }

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Productos
          </h1>

          <p className="text-zinc-500 mt-1">
            Gestión general de productos
          </p>

        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          + Nuevo producto
        </button>

      </div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

        {/* Head */}
        <div className="grid grid-cols-7 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Producto</div>
          <div>Modelo</div>
          <div>Color</div>
          <div>Unidad</div>
          <div>Precio</div>
          <div>Stock</div>

          <div className="text-right">
            Acciones
          </div>

        </div>

        {/* Productos */}
        {productos.map((item) => (

          <div
            key={item.id}
            className="grid grid-cols-7 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div className="font-medium">
              {item.producto}
            </div>

            <div>
              {item.modelo}
            </div>

            <div>
              {item.color}
            </div>

            <div>
              {item.unidad}
            </div>

            <div>
              ${item.precio_unitario}
            </div>

            <div>
              {item.cantidad}
            </div>

            <div className="flex justify-end">

              <button
                onClick={() => abrirEditar(item)}
                className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-2xl border border-white/5"
              >
                Editar
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Modal nuevo */}
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
                Nuevo producto
              </h2>

              <p className="text-zinc-500 mt-1">
                Registrar producto en el sistema
              </p>

            </div>

            {/* Inputs */}
            <div className="space-y-6">

              <input
                placeholder="Producto"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Stock"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Precio unitario"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <textarea
                placeholder="Detalles"
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
              />

            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">

              <button
                onClick={crearProducto}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
              >
                Guardar producto
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Modal editar */}
      {modalEditar && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X */}
            <button
              onClick={() => setModalEditar(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                Editar producto
              </h2>

              <p className="text-zinc-500 mt-1">
                Modificar producto del sistema
              </p>

            </div>

            {/* Inputs */}
            <div className="space-y-6">

              <input
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <textarea
                value={detalles}
                onChange={(e) => setDetalles(e.target.value)}
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
              />

            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">

              <button
                onClick={actualizarProducto}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
              >
                Guardar cambios
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}