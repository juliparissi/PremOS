"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Pedido = {
  id: string;
  numero: string;
  cliente_id: string;
  estado: string;
  fecha_entrega: string;
  fecha_inicio_produccion?: string;
  observaciones?: string;
};

type Cliente = {
  id: string;
  nombre: string;
};

export default function ProduccionPage() {

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidoItems, setPedidoItems] = useState<any[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);

  const ITEMS_POR_PAGINA = 10;


const [modeloRegistro, setModeloRegistro] = useState("");
const [colorRegistro, setColorRegistro] = useState("");
const [cantidadRegistro, setCantidadRegistro] = useState("");
const [fechaRegistro, setFechaRegistro] = useState(
  new Date().toISOString().split("T")[0]
);
const [observacionesRegistro, setObservacionesRegistro] = useState("");

  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [registroAbierto, setRegistroAbierto] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState(false);

  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<Pedido | null>(null);

  const [observaciones, setObservaciones] = useState("");
  const [cantidadFabricada, setCantidadFabricada] = useState("");

  async function cargarProduccion() {

    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("*")
      .in("estado", [
        "En producción",
        "Finalizando",
        "Enviar/Retirar",
      ])
      .order("created_at", {
        ascending: false,
      });

    const { data: clientesData } = await supabase
      .from("clientes")
      .select("*");

    if (pedidosData) {
      setPedidos(pedidosData as Pedido[]);
    }

    if (clientesData) {
      setClientes(clientesData as Cliente[]);
    }

  }

  async function guardarHojaRuta(
    nuevoEstado: string
  ) {

    if (!pedidoSeleccionado) return;

    await supabase
      .from("pedidos")
      .update({
        estado: nuevoEstado,
        observaciones,
      })
      .eq("id", pedidoSeleccionado.id);

    setRutaAbierta(false);

    cargarProduccion();

  }

  async function cargarItemsPedido(id: string) {

  const { data } = await supabase
    .from("pedido_items")
    .select("*")
    .eq("pedido_id", id);

  if (data) {
    setPedidoItems(data);
  }

}

async function guardarProduccion() {

  await supabase
    .from("registro_produccion")
    .insert([
      {
        modelo: modeloRegistro,
        color: colorRegistro,
        cantidad: Number(cantidadRegistro),
        fecha: fechaRegistro,
        observaciones: observacionesRegistro,
      },
    ]);

  setRegistroAbierto(false);
  setModeloRegistro("");
  setColorRegistro("");
  setCantidadRegistro("");
  setObservacionesRegistro("");

}

const inicio =
  (paginaActual - 1) * ITEMS_POR_PAGINA;

const fin =
  inicio + ITEMS_POR_PAGINA;

const pedidosPaginados =
  pedidos.slice(inicio, fin);

  useEffect(() => {
    cargarProduccion();
  }, []);

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Producción
          </h1>

          <p className="text-zinc-500 mt-1">
            Flujo general de producción
          </p>

        </div>

        <div className="flex gap-4">

          <button
  onClick={() => setRegistroAbierto(true)}
  className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
>
  Registrar producción
</button>

          <Link
            href="/produccion/registro"
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
          >
            Historial producción
          </Link>

          

        </div>

      </div>

      {/* Tabla principal */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
              {/* Head */}
        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Pedido</div>
          <div>Cliente</div>
          <div>Estado actual</div>
          <div>Inicio producción</div>
          <div>Entrega</div>

          <div className="text-right">
            Hoja de ruta
          </div>

        </div>

        {/* Pedidos */}
        {pedidosPaginados.map((pedido) => (

          <div
            key={pedido.id}
            className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div className="flex items-center gap-3">

              <span className="font-medium">
                {pedido.numero}
              </span>

              <button
                onClick={async () => {

  setPedidoSeleccionado(pedido);

  await cargarItemsPedido(
    pedido.id
  );

  setDetalleAbierto(true);

}}
                className="text-emerald-400 hover:text-emerald-300 transition text-sm"
              >
                Ver
              </button>

            </div>

            <div>
              {
                clientes.find(
                  (c) => c.id === pedido.cliente_id
                )?.nombre
              }
            </div>

            <div>

              {pedido.estado === "En producción" && (
  <span className="text-yellow-400">
    En producción
  </span>
)}

              {pedido.estado === "Finalizando" && (
  <span className="text-cyan-400">
    Finalizando
  </span>
)}

              {pedido.estado === "Enviar/Retirar" && (
  <span className="text-emerald-400">
    Enviar/Retirar
  </span>
)}

            </div>

            <div>

              {pedido.fecha_inicio_produccion
                ?.split("-")
                .reverse()
                .join("/")}

            </div>

            <div>

              {pedido.fecha_entrega
                ?.split("-")
                .reverse()
                .join("/")}

            </div>

            <div className="flex justify-end">

              <button
                onClick={() => {

                  setPedidoSeleccionado(pedido);

                  setObservaciones(
                    pedido.observaciones || ""
                  );

                  setRutaAbierta(true);

                }}
                className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
              >
                Modificar
              </button>

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
    disabled={fin >= pedidos.length}
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

      {/* Modal detalle */}
      {detalleAbierto && pedidoSeleccionado && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl p-8 relative">

            {/* X */}
            <button
              onClick={() => setDetalleAbierto(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
<div className="mb-8">

  <h2 className="text-3xl font-bold">
    {pedidoSeleccionado.numero}
  </h2>

  <p className="text-zinc-500 mt-1">
    Detalle rápido del pedido
  </p>

</div>

{/* Datos */}
<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

  <div className="space-y-6">

    <div>

      <p className="text-zinc-500 text-sm mb-2">
        Cliente
      </p>

      <p className="text-xl">
        {
          clientes.find(
            (c) =>
              c.id === pedidoSeleccionado.cliente_id
          )?.nombre
        }
      </p>

    </div>

    <div>

      <p className="text-zinc-500 text-sm mb-2">
        Fecha de entrega
      </p>

      <p className="text-xl">
        {pedidoSeleccionado.fecha_entrega
          ?.split("-")
          .reverse()
          .join("/")}
      </p>

    </div>

  </div>

</div>

{/* Productos */}
<div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden mt-8">

  {/* Head */}
  <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

    <div>Modelo</div>
    <div>Color</div>
    <div>Cantidad</div>
    <div>Unidad</div>

  </div>

  {/* Items */}
  {pedidoItems.map((item) => (

    <div
      key={item.id}
      className="grid grid-cols-4 px-6 py-5 border-b border-white/5"
    >

      <div>
        {item.producto} - {item.modelo}
      </div>

      <div>
        {item.color}
      </div>

      <div>
        {item.cantidad}
      </div>

      <div>
        {item.unidad}
      </div>

    </div>

  ))}

</div>

          </div>

        </div>

      )}

      {/* Modal hoja de ruta */}
      {rutaAbierta && pedidoSeleccionado && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X */}
            <button
              onClick={() => setRutaAbierta(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                Hoja de ruta
              </h2>

              <p className="text-zinc-500 mt-1">
                Seguimiento del pedido
              </p>

            </div>


            {/* Observaciones */}
            <div className="mb-8">

              <label className="text-zinc-500 text-sm">
                Observaciones
              </label>

              <textarea
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(e.target.value)
                }
                placeholder="Agregar observaciones..."
                className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
              />

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-4">

              <button
                onClick={() =>
                  guardarHojaRuta("En producción")
                }
                className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white transition px-4 py-2 rounded-xl text-sm"
              >
                En producción
              </button>

              <button
                onClick={() =>
                  guardarHojaRuta("Finalizando")
                }
                className="bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-white transition px-4 py-2 rounded-xl text-sm"
              >
                Finalizando
              </button>

              <button
                onClick={() =>
                  guardarHojaRuta("Enviar/Retirar")
                }
                className="bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white transition px-4 py-2 rounded-xl text-sm"
              >
                Enviar/Retirar
              </button>

            </div>

          </div>

        </div>

      )}

{/* Modal registrar producción */}
{registroAbierto && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl p-8 relative max-h-[90vh] overflow-y-auto">

      {/* X */}
      <button
        onClick={() => setRegistroAbierto(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Registrar producción
        </h2>

        <p className="text-zinc-500 mt-1">
          Producción realizada en el día
        </p>

      </div>

      {/* Inputs */}
      <div className="space-y-6">

        <input
          placeholder="Modelo"
          value={modeloRegistro}
          onChange={(e) =>
            setModeloRegistro(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

        <input
          placeholder="Color"
          value={colorRegistro}
          onChange={(e) =>
            setColorRegistro(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

        <input
          type="text"
          placeholder="Cantidad"
          value={cantidadRegistro}
          onChange={(e) =>
            setCantidadRegistro(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

        <input
          type="date"
          value={fechaRegistro}
          onChange={(e) =>
            setFechaRegistro(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

        <textarea
          placeholder="Observaciones"
          value={observacionesRegistro}
          onChange={(e) =>
            setObservacionesRegistro(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
        />

      </div>

      {/* Footer */}
      <div className="flex justify-end mt-8">

        <button
          onClick={guardarProduccion}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          Guardar producción
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}