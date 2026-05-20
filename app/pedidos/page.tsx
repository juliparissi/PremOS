"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { generarPDFPresupuesto } from "../../utils/generarPDF";

type Pedido = {
  presupuesto_id?: string;
  id: string;
  numero: string;
  cliente_id: string;
  fecha_entrega: string;
  estado: string;
  estado_pago?: string;
  saldo_total: number;
  saldo_abonado: number;
  saldo_restante: number;
  observaciones?: string;
  fecha_inicio_produccion?: string;
};

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
};

type PedidoItem = {
  id: string;
  producto: string;
  modelo: string;
  color: string;
  cantidad: number;
  unidad: string;
  total: number;
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidoItems, setPedidoItems] = useState<PedidoItem[]>([]);
  const [historialPagos, setHistorialPagos] =
  useState<any[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
  const [presupuestoOriginal, setPresupuestoOriginal] = useState<any>(null);
  const [modalPago, setModalPago] = useState(false);
  const [observacionesPedido, setObservacionesPedido] = useState("");

  const [modalEntregaFinal, setModalEntregaFinal] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState("");
  const [modalEntrega, setModalEntrega] = useState(false);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [modalHistorialPagos, setModalHistorialPagos] = useState(false);

  const [montoPago, setMontoPago] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [observacionesPago, setObservacionesPago] = useState("");
  const [fechaPago, setFechaPago] = useState(
  new Date().toISOString().split("T")[0]
);

  async function cargarPedidos() {
    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("*")
      .not("estado", "in", "(Entregado,Cancelado)")
      .order("created_at", { ascending: false });

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

  async function cargarItemsPedido(id: string) {
    const { data } = await supabase
      .from("pedido_items")
      .select("*")
      .eq("pedido_id", id);

    if (data) {
      setPedidoItems(data as PedidoItem[]);
    }
  }
  async function registrarPago() {

  if (!pedidoSeleccionado) return;

  const monto = Number(montoPago);
  if (!metodoPago) {

  alert(
    "Seleccioná un método de pago"
  );

  return;

}
  if (
  monto >
  Number(pedidoSeleccionado.saldo_restante)
) {

  alert(
    "El pago supera el saldo restante"
  );

  return;

}

  const nuevoAbonado =
    Number(pedidoSeleccionado.saldo_abonado) +
    monto;

  const nuevoRestante =
    Number(pedidoSeleccionado.saldo_total) -
    nuevoAbonado;

  await supabase
    .from("pagos_pedidos")
    .insert([
      {
        pedido_id: pedidoSeleccionado.id,
        monto,
        metodo_pago: metodoPago,
        observaciones: observacionesPago,
        fecha: fechaPago,
      },
    ]);

    await supabase
  .from("movimientos_economia")
  .insert([
    {
      tipo: "Ingreso",

      concepto:
        `Pago pedido ${pedidoSeleccionado.numero}`,

      monto_total: Number(montoPago),

      monto_abonado: Number(montoPago),

      saldo_pendiente: 0,

      detalle: metodoPago,

      fecha: fechaPago,
    },
  ]);
let estadoPago = "Pendiente";

if (
  nuevoAbonado > 0 &&
  nuevoRestante > 0
) {
  estadoPago = "Parcial";
}

if (nuevoRestante <= 0) {
  estadoPago = "Pagado";
}

  await supabase
  .from("pedidos")
  .update({
    saldo_abonado: nuevoAbonado,
    saldo_restante: nuevoRestante,
    estado_pago: estadoPago,
  })
    .eq("id", pedidoSeleccionado.id);

setPedidoSeleccionado({
  ...pedidoSeleccionado,
  saldo_abonado: nuevoAbonado,
  saldo_restante: nuevoRestante,
  estado_pago: estadoPago,
});

setModalPago(false);

setMontoPago("");
setMetodoPago("");
setObservacionesPago("");

cargarPedidos();
await cargarHistorialPagos(
  pedidoSeleccionado.id
);

}

async function cargarHistorialPagos(id: string) {

  const { data } = await supabase
    .from("pagos_pedidos")
    .select("*")
    .eq("pedido_id", id)
    .order("created_at", { ascending: false });

  if (data) {
    setHistorialPagos(data);
  }

}

async function guardarEntrega() {

  if (!pedidoSeleccionado) return;

  const hoy = new Date()
    .toISOString()
    .split("T")[0];

  if (fechaEntrega < hoy) {

    alert(
      "La fecha debe ser posterior al día actual"
    );

    return;

  }

  await supabase
    .from("pedidos")
    .update({
      fecha_entrega: fechaEntrega,
    })
    .eq("id", pedidoSeleccionado.id);

  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    fecha_entrega: fechaEntrega,
  });

  setModalEntrega(false);

  cargarPedidos();

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

async function marcarEntregado() {

  if (!pedidoSeleccionado) return;

  if (!tipoEntrega) {

  alert(
    "Seleccioná un tipo de entrega"
  );

  return;

}

const saldoRestante =
  Number(pedidoSeleccionado.saldo_restante);

if (saldoRestante > 0) {

  await supabase
    .from("movimientos_economia")
    .insert([
      {
        tipo: "Ingreso",

        concepto:
          `Entrega pedido ${pedidoSeleccionado.numero}`,

        monto_total: saldoRestante,

        monto_abonado: saldoRestante,

        saldo_pendiente: 0,

        detalle: tipoEntrega,

        fecha: new Date()
          .toISOString()
          .split("T")[0],
      },
    ]);

}

  await supabase
    .from("pedidos")
    .update({
      estado: "Entregado",
      saldo_abonado:
        pedidoSeleccionado.saldo_total,

      saldo_restante: 0,

      estado_pago: "Pagado",
    })
    .eq("id", pedidoSeleccionado.id);

  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    estado: "Entregado",
    saldo_abonado:
      pedidoSeleccionado.saldo_total,
    saldo_restante: 0,
    estado_pago: "Pagado",
  });

  setModalEntrega(false);

  cargarPedidos();

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
      <div className="flex items-center justify-between mb-8">

  <div>

    <h1 className="text-3xl font-bold">
      Pedidos
    </h1>

    <p className="text-zinc-500 mt-1">
      Últimos pedidos generados
    </p>

  </div>

  <a
    href="/pedidos/historial"
    className="bg-emerald-500 hover:bg-emerald-400 transition flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-medium"
  >

    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 2v6h6"
      />

    </svg>

    Historial pedidos

  </a>

</div>

      {/* Barra búsqueda */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">
        <div className="flex gap-4">
          <input
  type="text"
  placeholder="Buscar pedido..."
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  className="flex-1 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
/>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
        {/* Header tabla */}
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-xl font-semibold">
            Últimos pedidos
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Pedidos activos del sistema
          </p>
        </div>

        {/* Head */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.3fr_1fr_1fr] px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
          <div>Pedido</div>
          <div className="pl-1">Cliente</div>
          <div className="pl-14">Entrega</div>
          <div className="pl-12">Estado</div>
          <div className="pl-14">Pago</div>
          <div className="text-right">Información</div>
        </div>

        {/* Pedidos reales */}
        {pedidosPaginados.map((pedido) => (
          <div
            key={pedido.id}
            className="grid grid-cols-[1fr_1.8fr_1fr_1.8fr_1fr_1fr] px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >
            <div>{pedido.numero}</div>

            <div>
              {
                clientes.find(
                  (c) => c.id === pedido.cliente_id
                )?.nombre || "Cliente"
              }
            </div>

            <div>{pedido.fecha_entrega}</div>

            <div>
              {pedido.estado === "A producir" && (
                <span className="text-yellow-400">
                  A producir
                </span>
              )}

              {pedido.estado === "En producción" && (
                <span className="text-cyan-400">
                  En producción
                </span>
              )}

              {pedido.estado === "Finalizando" && (

  <div className="flex items-center gap-2">

    <span className="text-blue-400 font-semibold">
      Finalizando
    </span>

  </div>

)}

              {pedido.estado === "Enviar/Retirar" && (

  <div className="flex items-center gap-2">

  <span className="text-emerald-400 font-semibold">
    Enviar/Retirar
  </span>

  <span className="animate-pulse bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs">
    LISTO
  </span>

</div>

)}

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
              {pedido.estado_pago === "Pendiente" && (
  <span className="text-red-400">
    Pendiente
  </span>
)}

{pedido.estado_pago === "Parcial" && (
  <span className="text-yellow-400">
    Parcial
  </span>
)}

{pedido.estado_pago === "Pagado" && (
  <span className="text-emerald-400">
    Pagado
  </span>
)}
            </div>

            <div className="text-right">
              <button
                onClick={async () => {
                  setPedidoSeleccionado(pedido);
                  setObservacionesPedido(
                    pedido.observaciones || "");

                  await cargarItemsPedido(pedido.id);
                  if (pedido.presupuesto_id) {

                  await cargarPresupuestoOriginal(
                     pedido.presupuesto_id
                             );

                         }
                  await cargarHistorialPagos(pedido.id);

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
            {/* X cerrar */}
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
      {pedidoSeleccionado?.numero}
    </h2>

    <p className="text-zinc-500 mt-1">
      Información general del pedido
    </p>

  </div>

  <div className="flex gap-3 mr-16">

    <button
  onClick={() => {

    generarPDFPresupuesto({

      tipoDocumento: "PRESUPUESTO",

      numero: presupuestoOriginal?.numero,

      fecha: presupuestoOriginal?.fecha,

      cliente:
        clientes.find(
          (c) => c.id === presupuestoOriginal?.cliente_id
        )?.nombre || "Cliente",

      telefono:
        clientes.find(
          (c) => c.id === presupuestoOriginal?.cliente_id
        )?.telefono || "",

      direccion:
        clientes.find(
          (c) => c.id === presupuestoOriginal?.cliente_id
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

      total: presupuestoOriginal?.total,

      observaciones:
        presupuestoOriginal?.observaciones || "",

    });

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Descargar presupuesto
</button>

    {pedidoSeleccionado?.saldo_abonado > 0 ? (

  <button
    onClick={() => {

      generarPDFPresupuesto({

        tipoDocumento: "NOTA DE VENTA",

        estadoPago:
          pedidoSeleccionado.estado_pago,

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

        iva:
          presupuestoOriginal?.iva || 0,

        total:
          pedidoSeleccionado.saldo_total,

        observaciones:
          pedidoSeleccionado.observaciones || "",

      });

    }}
    className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
  >
    Descargar nota venta
  </button>

) : (

  <button
    disabled
    className="bg-white/5 text-zinc-500 px-4 py-2 rounded-xl border border-white/5 text-sm cursor-not-allowed"
  >
    Nota venta bloqueada
  </button>

)}

  </div>

</div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">
                <p className="text-zinc-500">Saldo total</p>
                <h3 className="text-2xl font-bold mt-3">
                  ${pedidoSeleccionado.saldo_total}
                </h3>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">
                <p className="text-zinc-500">Saldo abonado</p>
                <h3 className="text-2xl font-bold mt-3 text-yellow-400">
                  ${pedidoSeleccionado.saldo_abonado}
                </h3>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">
                <p className="text-zinc-500">Saldo restante</p>
                <h3 className="text-2xl font-bold mt-3">
                  ${pedidoSeleccionado.saldo_restante}
                </h3>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">
                <p className="text-zinc-500">Estado</p>
                <h3 className={`text-2xl font-bold mt-3 ${
  pedidoSeleccionado.estado === "A producir"
    ? "text-yellow-400"
    : pedidoSeleccionado.estado === "En producción"
    ? "text-cyan-400"
    : pedidoSeleccionado.estado === "Enviar/Retirar"
    ? "text-emerald-400"
    : pedidoSeleccionado.estado === "Entregado"
    ? "text-emerald-400"
    : "text-blue-400"
}`}>
  {pedidoSeleccionado.estado}
</h3>
              </div>
            </div>

{/* Fecha entrega */}
<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6 mb-8">

  <p className="text-zinc-500 text-sm">
    Fecha de entrega programada
  </p>

  <h3 className="text-2xl font-bold mt-3">

    {pedidoSeleccionado?.fecha_entrega
      ?.split("-")
      .reverse()
      .join("/")}

  </h3>

</div>

            {/* Acciones */}
<div className="flex gap-4 mb-8">

  <button
    onClick={() => setModalPago(true)}
    className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
  >
    Registrar pago
  </button>

  <button
  onClick={() => setModalHistorialPagos(true)}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Historial pagos
</button>

  <button
  onClick={() => setModalEntrega(true)}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Programar entrega
</button>

  <button
  onClick={async () => {

    console.log("guardar fecha");
    console.log(fechaEntrega);
    console.log(pedidoSeleccionado);

    const hoy = new Date()
      .toISOString()
      .split("T")[0];

    await supabase
      .from("pedidos")
      .update({
        estado: "En producción",
        fecha_inicio_produccion: hoy,
      })
      .eq("id", pedidoSeleccionado.id);

    setPedidoSeleccionado({
      ...pedidoSeleccionado,
      estado: "En producción",
      fecha_inicio_produccion: hoy,
    });

    cargarPedidos();

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Pasar a producción
</button>

  <button
  onClick={() => setModalEntregaFinal(true)}
  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition px-4 py-2 rounded-xl border border-emerald-500/20 text-sm"
>
  Marcar entregado
</button>

<button
  onClick={async () => {

    const confirmar = confirm(
      "¿Deseás cancelar el pedido?"
    );

    if (!confirmar) return;

    await supabase
      .from("pedidos")
      .update({
        estado: "Cancelado",
      })
      .eq("id", pedidoSeleccionado.id);

    setPedidoSeleccionado({
      ...pedidoSeleccionado,
      estado: "Cancelado",
    });

    cargarPedidos();

setModalAbierto(false);

setModalEntregaFinal(false);

  }}
  className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition px-4 py-2 rounded-xl border border-red-500/20 text-sm"
>
  Cancelar pedido
</button>

{/* Modal registrar pago */}
{modalPago && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

      {/* X */}
      <button
        onClick={() => setModalPago(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Registrar pago
        </h2>

        <p className="text-zinc-500 mt-1">
          Registrar pago del pedido
        </p>

      </div>

      

      {/* Inputs */}
      <div className="space-y-6">

        <input
  type="date"
  value={fechaPago}
  onChange={(e) =>
    setFechaPago(e.target.value)
  }
  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
/>

        <input
          type="number"
          placeholder="Monto"
          value={montoPago}
          onChange={(e) =>
            setMontoPago(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

        <select
          value={metodoPago}
          onChange={(e) =>
            setMetodoPago(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        >

          <option value="">
            Método de pago
          </option>

          <option>
            Transferencia
          </option>

          <option>
            Efectivo
          </option>

          <option>
            Mercado Pago
          </option>

        </select>

        <textarea
          placeholder="Observaciones"
          value={observacionesPago}
          onChange={(e) =>
            setObservacionesPago(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
        />

      </div>

      {/* Footer */}
      <div className="flex justify-end mt-8">

        <button
          onClick={registrarPago}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          Guardar pago
        </button>

      </div>

    </div>

  </div>

)}
</div>

            {/* Productos */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden mb-8">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
                <div>Producto</div>
                <div>Variante</div>
                <div>Color</div>
                <div>Cantidad</div>
                <div>Unidad</div>
                <div>Total</div>
              </div>

              {pedidoItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-6 px-6 py-5 border-b border-white/5"
                >
                  <div>{item.producto}</div>
                  <div>{item.modelo}</div>
                  <div>{item.color}</div>
                  <div>{item.cantidad}</div>
                  <div>{item.unidad}</div>
                  <div>${item.total}</div>
                </div>
              ))}
            </div>

{/* Observaciones */}
<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6 mb-8">

  <h3 className="text-xl font-semibold mb-4">
    Observaciones
  </h3>

  <textarea
  value={pedidoSeleccionado?.observaciones || ""}
  onChange={(e) =>
    setPedidoSeleccionado({
      ...pedidoSeleccionado,
      observaciones: e.target.value,
    })
  }
  placeholder="Agregar observaciones..."
  className="w-full bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
/>

  <div className="flex justify-end mt-4">

    <button
  onClick={async () => {

    if (!pedidoSeleccionado) return;

    await supabase
      .from("pedidos")
      .update({
        observaciones:
          pedidoSeleccionado.observaciones,
      })
      .eq("id", pedidoSeleccionado.id);

    cargarPedidos();

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Guardar observaciones
</button>

  </div>

</div>

          </div>
        </div>
      )}

{/* Modal historial pagos */}
{modalHistorialPagos && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto">

      {/* X */}
      <button
        onClick={() => setModalHistorialPagos(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Historial de pagos
        </h2>

        <p className="text-zinc-500 mt-1">
          Pagos registrados del pedido
        </p>

      </div>

      {/* Tabla */}
      <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden">

        {/* Head */}
        <div className="grid grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Método</div>
          <div>Monto</div>
          <div>Observaciones</div>

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

{/* Modal entrega */}
{modalEntrega && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

      {/* X */}
      <button
        onClick={() => setModalEntrega(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Programar entrega
        </h2>

        <p className="text-zinc-500 mt-1">
          Seleccionar fecha de entrega
        </p>

      </div>

      {/* Fecha */}
      <div className="mb-8">

        <input
          type="date"
          value={fechaEntrega}
          onChange={(e) =>
            setFechaEntrega(e.target.value)
          }
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        />

      </div>

      {/* Footer */}
      <div className="flex justify-end">

        <button
          onClick={async () => {

            if (!fechaEntrega) {

              alert(
                "Seleccioná una fecha"
              );

              return;

            }

            if (!pedidoSeleccionado) return;

            await supabase
              .from("pedidos")
              .update({
                fecha_entrega: fechaEntrega,
              })
              .eq("id", pedidoSeleccionado.id);

            setPedidoSeleccionado({
              ...pedidoSeleccionado,
              fecha_entrega: fechaEntrega,
            });

            setModalEntrega(false);

            cargarPedidos();

          }}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          Guardar fecha
        </button>

      </div>

    </div>

  </div>

)}

{/* Modal marcar entregado */}
{modalEntregaFinal && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

      {/* X */}
      <button
        onClick={() => setModalEntregaFinal(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Marcar entregado
        </h2>

        <p className="text-zinc-500 mt-1">
          Confirmar entrega del pedido
        </p>

      </div>

      {/* Tipo entrega */}
      <div className="mb-8">

        <select
          value={tipoEntrega}
          onChange={(e) =>
            setTipoEntrega(e.target.value)
          }
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
        >

          <option value="">
            Tipo entrega
          </option>

          <option>
            Retira cliente
          </option>

          <option>
            Enviado
          </option>

        </select>

      </div>

      {/* Footer */}
      <div className="flex justify-end">

        <button
          onClick={marcarEntregado}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          Confirmar entrega
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}
