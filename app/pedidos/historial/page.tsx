"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { generarPDFPresupuesto } from "../../../utils/generarPDF";


export default function HistorialPedidosPage() {

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  const [pedidoItems, setPedidoItems] = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);

  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<any>(null);

    const [presupuestoOriginal, setPresupuestoOriginal] =
  useState<any>(null);

  const [historialPagos, setHistorialPagos] =
    useState<any[]>([]);

  async function cargarPedidos() {

    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("*")
      .in("estado", [
        "Entregado",
        "Cancelado",
      ])
      .order("created_at", {
        ascending: false,
      });

    const { data: clientesData } = await supabase
      .from("clientes")
      .select("*");

    if (pedidosData) {
      setPedidos(pedidosData);
    }

    if (clientesData) {
      setClientes(clientesData);
    }

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

  async function cargarHistorialPagos(id: string) {

    const { data } = await supabase
      .from("pagos_pedidos")
      .select("*")
      .eq("pedido_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setHistorialPagos(data);
    }

  }
async function cargarPresupuestoOriginal(
  presupuestoId: string
) {

  const { data } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", presupuestoId)
    .single();

  if (data) {
    setPresupuestoOriginal(data);
  }

}

const pedidosFiltrados =
  pedidos.filter((pedido) => {

    return (
      pedido.numero
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
    );

  });

const inicio =
  (paginaActual - 1) * ITEMS_POR_PAGINA;

const fin =
  inicio + ITEMS_POR_PAGINA;

const pedidosPaginados =
  pedidosFiltrados.slice(
    inicio,
    fin
  );

  useEffect(() => {
    cargarPedidos();
  }, []);

  return (
    <div>

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Historial pedidos
        </h1>

        <p className="text-zinc-500 mt-1">
          Pedidos entregados y cancelados
        </p>

      </div>

      {/* Barra búsqueda */}
<div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">

  <input
    type="text"
    placeholder="Buscar pedido..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
  />

</div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

        {/* Head */}
        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Pedido</div>
          <div>Cliente</div>
          <div>Estado</div>
          <div>Entrega</div>

          <div className="text-right">
            Pago
          </div>

          <div className="text-right">
            Información
          </div>

        </div>

        {/* Pedidos */}
        {pedidosPaginados.map((pedido) => (

          <div
            key={pedido.id}
            className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div>
              {pedido.numero}
            </div>

            <div>
              {
                clientes.find(
                  (c) => c.id === pedido.cliente_id
                )?.nombre || "Cliente"
              }
            </div>

            <div>

              {pedido.estado === "Entregado" && (
                <span className="text-emerald-400">
                  Entregado
                </span>
              )}

              {pedido.estado === "Cancelado" && (
                <span className="text-red-400">
                  Cancelado
                </span>
              )}

            </div>

            <div>
              {pedido.fecha_entrega}
            </div>

            <div className="text-right">

              {pedido.estado_pago === "Pagado" && (
                <span className="text-emerald-400">
                  Pagado
                </span>
              )}

              {pedido.estado_pago === "Parcial" && (
                <span className="text-yellow-400">
                  Parcial
                </span>
              )}

              {pedido.estado_pago === "Pendiente" && (
                <span className="text-red-400">
                  Pendiente
                </span>
              )}

            </div>

            <div className="text-right">

              <button
                onClick={async () => {

                  setPedidoSeleccionado(pedido);

                  await cargarItemsPedido(
                    pedido.id
                  );

                  await cargarHistorialPagos(
                    pedido.id
                  );
                  
                  if (pedido.presupuesto_id) {

                  await cargarPresupuestoOriginal(
                    pedido.presupuesto_id
                  );

}

                  setModalAbierto(true);

                }}
                className="text-emerald-400 hover:text-emerald-300 transition"
              >
                Ver más
              </button>

            </div>

          </div>

        ))}

      </div>

{/* Paginación */}
<div className="flex items-center justify-between mt-6">

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
      fin >= pedidosFiltrados.length
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

      {/* Modal */}
      {modalAbierto && pedidoSeleccionado && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-5xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X */}
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">

              <div>

                <h2 className="text-3xl font-bold">
                  {pedidoSeleccionado.numero}
                </h2>

                <p className="text-zinc-500 mt-1">
                  Historial del pedido
                </p>

              </div>

              <div className="flex gap-3 mr-16">

                <button
  onClick={() => {

    generarPDFPresupuesto({

      tipoDocumento: "PRESUPUESTO",

      numero:
        pedidoSeleccionado.numero
          .replace("PED-", "PRES-"),

      fecha: pedidoSeleccionado.fecha_entrega,

      cliente:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.nombre || "Cliente",

      telefono:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.telefono || "",

      direccion:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.direccion || "",

      items: pedidoItems,

      transporte:
        pedidoItems
          .filter((item) => item.producto === "ENVIO")
          .reduce((acc, item) => acc + item.total, 0),

      descuento:
        Math.abs(
          pedidoItems
            .filter((item) => item.producto === "DESCUENTO")
            .reduce((acc, item) => acc + item.total, 0)
        ),

      iva: presupuestoOriginal?.iva || 0,

      total: pedidoSeleccionado.saldo_total,

      observaciones:
        pedidoSeleccionado.observaciones || "",

    });

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Descargar presupuesto
</button>

                <button
  onClick={() => {

    generarPDFPresupuesto({

      tipoDocumento: "NOTA DE VENTA",
      
      estadoPago: pedidoSeleccionado.estado_pago,

      numero: pedidoSeleccionado.numero,

      fecha: pedidoSeleccionado.fecha_entrega,

      cliente:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.nombre || "Cliente",

      telefono:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.telefono || "",

      direccion:
        clientes.find(
          (c) => c.id === pedidoSeleccionado.cliente_id
        )?.direccion || "",

      items: pedidoItems,

      transporte:
        pedidoItems
          .filter((item) => item.producto === "ENVIO")
          .reduce((acc, item) => acc + item.total, 0),

      descuento:
        Math.abs(
          pedidoItems
            .filter((item) => item.producto === "DESCUENTO")
            .reduce((acc, item) => acc + item.total, 0)
        ),

      iva: presupuestoOriginal?.iva || 0,

      total: pedidoSeleccionado.saldo_total,

      observaciones:
        pedidoSeleccionado.observaciones || "",

    });

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Descargar nota venta
</button>

              </div>

            </div>

            {/* Estado */}
            <div className="mb-8">

              {pedidoSeleccionado.estado === "Entregado" && (
                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl text-sm">
                  Entregado
                </span>
              )}

              {pedidoSeleccionado.estado === "Cancelado" && (
                <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-2xl text-sm">
                  Cancelado
                </span>
              )}

            </div>

            {/* Productos */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden mb-8">

              {/* Head */}
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

                <div>Producto</div>
                <div>Variante</div>
                <div>Color</div>
                <div>Cantidad</div>
                <div>Unidad</div>
                <div>Total</div>

              </div>

              {/* Items */}
              {pedidoItems.map((item) => (

                <div
                  key={item.id}
                  className="grid grid-cols-6 px-6 py-5 border-b border-white/5"
                >

                  <div>
                    {item.producto}
                  </div>

                  <div>
                    {item.modelo}
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

                  <div>
                    ${item.total}
                  </div>

                </div>

              ))}

            </div>

            {/* Historial pagos */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden">

              {/* Head */}
              <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

                <div>Fecha</div>
                <div>Método</div>
                <div>Monto</div>
                <div>Detalle</div>

              </div>

              {/* Pagos */}
              {historialPagos.map((pago) => (

                <div
                  key={pago.id}
                  className="grid grid-cols-4 px-6 py-5 border-b border-white/5"
                >

                  <div>
                    {pago.fecha
                      .split("-")
                      .reverse()
                      .join("/")}
                  </div>

                  <div>
                    {pago.metodo_pago}
                  </div>

                  <div className="text-emerald-400">
                    ${pago.monto}
                  </div>

                  <div>
                    {pago.observaciones || "-"}
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