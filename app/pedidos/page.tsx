"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaConfig } from "../../lib/empresa";
import {
  generarPDFPresupuesto,
  generarPDFRemitoEnvio,
} from "../../utils/generarPDF";
import BackButton from "@/components/BackButton";

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
  forma_entrega?: string;
  con_factura?: boolean;
  numero_factura?: string;
  tipo_comprobante?: string;
  modalidad_comprobante?: string;
  punto_venta?: string;
  cuit_facturacion?: string;
  condicion_iva?: string;
  fecha_factura?: string;
  observaciones_factura?: string;
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

type ConfiguracionFiscal = {
  tipo_comprobante_default?: string | null;
  modalidad_comprobante?: string | null;
  punto_venta?: string | null;
};

const tiposComprobanteArca = [
  "Factura A",
  "Factura B",
  "Factura C",
  "Factura M",
  "Nota de credito A",
  "Nota de credito B",
  "Nota de credito C",
  "Nota de credito M",
  "Nota de debito A",
  "Nota de debito B",
  "Nota de debito C",
  "Nota de debito M",
  "Recibo A",
  "Recibo B",
  "Recibo C",
  "Factura E",
  "Nota de credito E",
  "Nota de debito E",
  "Ticket factura A",
  "Ticket factura B",
  "Ticket factura C",
];

const modalidadesComprobante = [
  "Electronica ARCA",
  "Manual / talonario",
  "Controlador fiscal",
  "MiPyME / FCE",
  "Exportacion",
];

const condicionesIva = [
  "Consumidor final",
  "Responsable inscripto",
  "Monotributo",
  "Exento",
  "No responsable",
  "Sujeto no categorizado",
];

function marcaFiscalPedido(pedido?: Pedido | null) {
  return pedido?.con_factura ? "C/F" : "S/F";
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [configFiscal, setConfigFiscal] = useState<ConfiguracionFiscal | null>(
    null
  );

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
  const [modalFormaEntrega, setModalFormaEntrega] = useState(false);
  const [formaEntrega, setFormaEntrega] = useState("Retiro de fabrica");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [modalHistorialPagos, setModalHistorialPagos] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [modalFactura, setModalFactura] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("Factura C");
  const [modalidadComprobante, setModalidadComprobante] =
    useState("Electronica ARCA");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [cuitFacturacion, setCuitFacturacion] = useState("");
  const [condicionIva, setCondicionIva] = useState("Consumidor final");
  const [fechaFactura, setFechaFactura] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacionesFactura, setObservacionesFactura] = useState("");
  const [eliminandoPedido, setEliminandoPedido] = useState(false);

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

    const { data: configFiscalData } = await supabase
      .from("configuracion_fiscal")
      .select("tipo_comprobante_default,modalidad_comprobante,punto_venta")
      .limit(1)
      .maybeSingle();

    if (pedidosData) {
      setPedidos(pedidosData as Pedido[]);
    }

    if (clientesData) {
      setClientes(clientesData as Cliente[]);
    }

    if (configFiscalData) {
      setConfigFiscal(configFiscalData as ConfiguracionFiscal);
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

      detalle: `${marcaFiscalPedido(pedidoSeleccionado)} - ${metodoPago}`,

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

function obtenerSeniaInicial() {
  if (
    !pedidoSeleccionado ||
    pedidoSeleccionado.estado_pago === "Pagado"
  ) {
    return 0;
  }

  const pagoInicial =
    historialPagos.find(
      (pago) =>
        pago.observaciones === "Pago inicial de venta directa"
    ) || historialPagos[historialPagos.length - 1];

  return Number(
    pagoInicial?.monto ||
    pedidoSeleccionado.saldo_abonado ||
    0
  );
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

  setPresupuestoOriginal(data || null);

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

        detalle: `${marcaFiscalPedido(pedidoSeleccionado)} - ${tipoEntrega}`,

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
      forma_entrega: tipoEntrega,
    })
    .eq("id", pedidoSeleccionado.id);

  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    estado: "Entregado",
    saldo_abonado:
      pedidoSeleccionado.saldo_total,
    saldo_restante: 0,
    estado_pago: "Pagado",
    forma_entrega: tipoEntrega,
  });

  setModalEntregaFinal(false);

  cargarPedidos();

}

function abrirFactura() {
  setNumeroFactura(
    pedidoSeleccionado?.numero_factura || ""
  );
  setTipoComprobante(
    pedidoSeleccionado?.tipo_comprobante ||
      configFiscal?.tipo_comprobante_default ||
      "Factura C"
  );
  setModalidadComprobante(
    pedidoSeleccionado?.modalidad_comprobante ||
      configFiscal?.modalidad_comprobante ||
      "Electronica ARCA"
  );
  setPuntoVenta(
    pedidoSeleccionado?.punto_venta || configFiscal?.punto_venta || ""
  );
  setCuitFacturacion(
    pedidoSeleccionado?.cuit_facturacion || ""
  );
  setCondicionIva(
    pedidoSeleccionado?.condicion_iva || "Consumidor final"
  );
  setFechaFactura(
    pedidoSeleccionado?.fecha_factura ||
      new Date().toISOString().split("T")[0]
  );
  setObservacionesFactura(
    pedidoSeleccionado?.observaciones_factura || ""
  );

  setModalFactura(true);
}

async function guardarFactura() {
  if (!pedidoSeleccionado) return;

  const numero = numeroFactura.trim();
  const tieneComprobante = Boolean(tipoComprobante || numero);

  const { error } = await supabase
    .from("pedidos")
    .update({
      con_factura: tieneComprobante,
      numero_factura: numero || null,
      tipo_comprobante: tipoComprobante || null,
      modalidad_comprobante: modalidadComprobante || null,
      punto_venta: puntoVenta.trim() || null,
      cuit_facturacion: cuitFacturacion.trim() || null,
      condicion_iva: condicionIva || null,
      fecha_factura: fechaFactura || null,
      observaciones_factura: observacionesFactura.trim() || null,
    })
    .eq("id", pedidoSeleccionado.id);

  if (error) {
    alert(
      "No se pudo guardar la factura. Revisá que existan las columnas con_factura y numero_factura en Supabase."
    );

    return;
  }

  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    con_factura: tieneComprobante,
    numero_factura: numero || "",
    tipo_comprobante: tipoComprobante,
    modalidad_comprobante: modalidadComprobante,
    punto_venta: puntoVenta,
    cuit_facturacion: cuitFacturacion,
    condicion_iva: condicionIva,
    fecha_factura: fechaFactura,
    observaciones_factura: observacionesFactura,
  });

  setModalFactura(false);
  cargarPedidos();
}

async function quitarFactura() {
  if (!pedidoSeleccionado) return;

  const { error } = await supabase
    .from("pedidos")
    .update({
      con_factura: false,
      numero_factura: null,
      tipo_comprobante: null,
      modalidad_comprobante: null,
      punto_venta: null,
      cuit_facturacion: null,
      condicion_iva: null,
      fecha_factura: null,
      observaciones_factura: null,
    })
    .eq("id", pedidoSeleccionado.id);

  if (error) {
    alert(
      "No se pudo quitar la factura. Revisá que existan las columnas con_factura y numero_factura en Supabase."
    );

    return;
  }

  setNumeroFactura("");
  setTipoComprobante("Factura C");
  setModalidadComprobante("Electronica ARCA");
  setPuntoVenta("");
  setCuitFacturacion("");
  setCondicionIva("Consumidor final");
  setFechaFactura(new Date().toISOString().split("T")[0]);
  setObservacionesFactura("");
  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    con_factura: false,
    numero_factura: "",
    tipo_comprobante: "",
    modalidad_comprobante: "",
    punto_venta: "",
    cuit_facturacion: "",
    condicion_iva: "",
    fecha_factura: "",
    observaciones_factura: "",
  });

  setModalFactura(false);
  cargarPedidos();
}

function abrirFormaEntrega() {
  setFormaEntrega(
    pedidoSeleccionado?.forma_entrega || "Retiro de fabrica"
  );
  setModalFormaEntrega(true);
}

async function guardarFormaEntrega() {
  if (!pedidoSeleccionado) return;

  const { error } = await supabase
    .from("pedidos")
    .update({
      forma_entrega: formaEntrega,
    })
    .eq("id", pedidoSeleccionado.id);

  if (error) {
    alert(
      "No se pudo guardar la forma de entrega. Revisá que exista la columna forma_entrega en Supabase."
    );
    return;
  }

  setPedidoSeleccionado({
    ...pedidoSeleccionado,
    forma_entrega: formaEntrega,
  });

  setModalFormaEntrega(false);
  cargarPedidos();
}

async function obtenerEmpresaDocumento() {
  const empresaLocal = getEmpresaConfig();

  if (
    empresaLocal.nombre ||
    empresaLocal.direccion ||
    empresaLocal.localidad ||
    empresaLocal.telefono ||
    empresaLocal.email ||
    empresaLocal.logo
  ) {
    return empresaLocal;
  }

  const { data } = await supabase
    .from("configuracion_empresa")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!data) {
    return empresaLocal;
  }

  return {
    nombre: data.nombre || "",
    direccion: data.direccion || "",
    localidad: data.localidad || "",
    telefono: data.telefono || "",
    email: data.email || "",
    logo: data.logo || "",
    cuit: data.cuit || "",
    colorPrincipal: data.color_principal || empresaLocal.colorPrincipal,
  };
}

async function descargarRemitoEnvio() {
  if (!pedidoSeleccionado) return;

  const cliente = clientes.find(
    (item) => item.id === pedidoSeleccionado.cliente_id
  );
  const empresa = await obtenerEmpresaDocumento();

  generarPDFRemitoEnvio({
    empresa,
    numero: pedidoSeleccionado.numero,
    fecha: new Date().toLocaleDateString("es-AR"),
    fechaEntrega: pedidoSeleccionado.fecha_entrega,
    cliente: cliente?.nombre || "Cliente",
    telefono: cliente?.telefono || "",
    direccion: cliente?.direccion || "",
    formaEntrega: pedidoSeleccionado.forma_entrega || "Envio",
    observaciones: pedidoSeleccionado.observaciones || "",
    items: pedidoItems,
  });
}

async function eliminarPedidoCompleto() {
  if (!pedidoSeleccionado || eliminandoPedido) return;

  const confirmar = confirm(
    "Estas seguro de cancelar este pedido? Se eliminara por completo junto con sus items, pagos y movimientos economicos asociados."
  );

  if (!confirmar) return;

  setEliminandoPedido(true);

  const conceptosAsociados = [
    `Pago pedido ${pedidoSeleccionado.numero}`,
    `Entrega pedido ${pedidoSeleccionado.numero}`,
    `Pago venta directa ${pedidoSeleccionado.numero}`,
  ];

  const { error: itemsError } = await supabase
    .from("pedido_items")
    .delete()
    .eq("pedido_id", pedidoSeleccionado.id);

  const { error: pagosError } = await supabase
    .from("pagos_pedidos")
    .delete()
    .eq("pedido_id", pedidoSeleccionado.id);

  const { error: movimientosError } = await supabase
    .from("movimientos_economia")
    .delete()
    .in("concepto", conceptosAsociados);

  const { error: pedidoError } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", pedidoSeleccionado.id);

  setEliminandoPedido(false);

  if (itemsError || pagosError || movimientosError || pedidoError) {
    alert("No se pudo cancelar y eliminar el pedido.");
    return;
  }

  setPedidos((actual) =>
    actual.filter((pedido) => pedido.id !== pedidoSeleccionado.id)
  );
  setPedidoSeleccionado(null);
  setPedidoItems([]);
  setHistorialPagos([]);
  setModalAbierto(false);
  setModalEntregaFinal(false);
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

  <>

    <BackButton />

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

        <div>

          <label className="text-zinc-500 text-sm">
            CUIT / DNI cliente
          </label>

          <input
            value={cuitFacturacion}
            onChange={(event) =>
              setCuitFacturacion(event.target.value)
            }
            placeholder="Ej: 20-12345678-9"
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Condicion IVA
          </label>

          <select
            value={condicionIva}
            onChange={(event) =>
              setCondicionIva(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          >
            {condicionesIva.map((condicion) => (
              <option key={condicion} value={condicion}>
                {condicion}
              </option>
            ))}
          </select>

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Fecha del comprobante
          </label>

          <input
            type="date"
            value={fechaFactura}
            onChange={(event) =>
              setFechaFactura(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div className="md:col-span-2">

          <label className="text-zinc-500 text-sm">
            Observaciones fiscales
          </label>

          <textarea
            value={observacionesFactura}
            onChange={(event) =>
              setObservacionesFactura(event.target.value)
            }
            rows={3}
            placeholder="Datos adicionales, comprobante asociado o motivo de nota de credito/debito"
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition resize-none"
          />

        </div>

      </div>

{/* Mobile pedidos */}
<div className="md:hidden space-y-4 mb-8">

  {pedidosPaginados.map((pedido) => (

    <div
      key={pedido.id}
      className="bg-[#0b1727] border border-white/5 rounded-3xl p-5"
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <div>

          <p className="text-zinc-500 text-sm">
            Pedido
          </p>

          <h3 className="text-xl font-bold text-white">

            #{pedido.numero}

          </h3>

        </div>

        <div>

          {pedido.estado === "A producir" && (
            <span className="text-yellow-400 text-sm">
              A producir
            </span>
          )}

          {pedido.estado === "En producción" && (
            <span className="text-cyan-400 text-sm">
              Producción
            </span>
          )}

          {pedido.estado === "Demorado" && (
  <span className="text-red-400 text-sm">
    Demorado
  </span>
)}

          {pedido.estado === "Finalizando" && (
            <span className="text-blue-400 text-sm">
              Finalizando
            </span>
          )}

          {pedido.estado === "Enviar/Retirar" && (
            <span className="text-emerald-400 text-sm">
              Listo
            </span>
          )}

          {pedido.estado === "Entregado" && (
            <span className="text-emerald-400 text-sm">
              Entregado
            </span>
          )}

        </div>

      </div>

      {/* Datos */}
      <div className="space-y-3 text-sm">

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Cliente
          </span>

          <span className="text-white">

            {
              clientes.find(
                (c) => c.id === pedido.cliente_id
              )?.nombre || "Cliente"
            }

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Entrega
          </span>

          <span className="text-white">

            {pedido.fecha_entrega}

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Estado pago
          </span>

          <span>

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

          </span>

        </div>

      </div>

      {/* Botón */}
      <button
        onClick={async () => {

          setPedidoSeleccionado(pedido);

          await cargarItemsPedido(
            pedido.id
          );

          setModalAbierto(true);

        }}
        className="mt-5 w-full bg-white/5 hover:bg-white/10 transition border border-white/5 rounded-2xl py-3 text-white"
      >

        Ver información

      </button>

    </div>

  ))}

</div>

      {/* Tabla */}
      <div className="hidden md:block bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
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

              {pedido.estado === "Demorado" && (
  <span className="text-red-400 text-s">
    Demorado
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
                  setPresupuestoOriginal(null);

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
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-5xl mx-4 md:mx-0 p-5 md:p-8 relative max-h-[90vh] overflow-y-auto text-white">
            {/* X cerrar */}
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-2 -right-1 text-zinc-400 hover:text-white transition text-3xl z-50"
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

  <div className="flex flex-wrap justify-end gap-3 mr-16">

    {pedidoSeleccionado?.presupuesto_id && (

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

)}

    {pedidoSeleccionado?.saldo_abonado > 0 ? (

  <button
    onClick={() => {

      generarPDFPresupuesto({

        tipoDocumento: "NOTA DE VENTA",

        estadoPago:
          pedidoSeleccionado.estado_pago,

        numero: pedidoSeleccionado.numero,

        fecha: new Date().toLocaleDateString("es-AR"),

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

        senia:
          obtenerSeniaInicial(),

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

    {pedidoSeleccionado?.forma_entrega === "Envio" && (
      <button
        onClick={descargarRemitoEnvio}
        className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white transition px-4 py-2 rounded-xl border border-cyan-500/20 text-sm"
      >
        Descargar remito envio
      </button>
    )}

  </div>

</div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
    : pedidoSeleccionado.estado === "Demorado"
    ? "text-red-400"
    : pedidoSeleccionado.estado === "Finalizando"
    ? "text-blue-400"
    : pedidoSeleccionado.estado === "Enviar/Retirar"
    ? "text-emerald-400"
    : pedidoSeleccionado.estado === "Entregado"
    ? "text-emerald-400"
    : "text-white"
}`}>
  {pedidoSeleccionado.estado}
</h3>
              </div>
            </div>

{/* Fecha entrega */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

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

<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

  <p className="text-zinc-500 text-sm">
    Forma de entrega
  </p>

  <h3 className="text-2xl font-bold mt-3 text-cyan-300">
    {pedidoSeleccionado?.forma_entrega || "Retiro de fabrica"}
  </h3>

  <p className="text-zinc-500 text-sm mt-2">
    {pedidoSeleccionado?.forma_entrega === "Envio"
      ? "Habilita remito de envio"
      : "Entrega sin remito de envio"}
  </p>

</div>

<div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

  <div className="flex items-start justify-between gap-4">

    <div>

      <p className="text-zinc-500 text-sm">
        Factura
      </p>

      <h3
        className={`text-2xl font-bold mt-3 ${
          pedidoSeleccionado?.con_factura
            ? "text-emerald-400"
            : "text-zinc-300"
        }`}
      >
        {pedidoSeleccionado?.con_factura
          ? "Con factura"
          : "Sin factura"}
      </h3>

      <p className="text-zinc-500 text-sm mt-2">
        {pedidoSeleccionado?.numero_factura
          ? `N° ${pedidoSeleccionado.numero_factura}`
          : "No hay numero cargado"}
      </p>

    </div>

    <input
      type="checkbox"
      checked={Boolean(pedidoSeleccionado?.con_factura)}
      onChange={abrirFactura}
      className="mt-1 h-5 w-5 accent-emerald-500"
    />

  </div>

</div>

</div>

            {/* Acciones */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

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
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm col-span-2 md:col-span-1"
>
  Programar entrega
</button>

  <button
    onClick={abrirFormaEntrega}
    className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
  >
    Forma de entrega
  </button>

  <button
  onClick={() => setModalEstado(true)}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Cambiar estado
</button>

  <button
  onClick={abrirFactura}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Factura
</button>

  <button
  onClick={() => {
    setTipoEntrega(
      pedidoSeleccionado?.forma_entrega || "Retiro de fabrica"
    );
    setModalEntregaFinal(true);
  }}
  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition px-4 py-2 rounded-xl border border-emerald-500/20 text-sm"
>
  Marcar entregado
</button>

<button
  onClick={eliminarPedidoCompleto}
  disabled={eliminandoPedido}
  className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition px-4 py-2 rounded-xl border border-red-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
>
  {eliminandoPedido ? "Eliminando..." : "Cancelar pedido"}
</button>

{/* Modal registrar pago */}
{modalPago && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative">

      {/* X */}
      <button
        onClick={() => setModalPago(false)}
        className="absolute top-6 right-6 text-white hover:text-white transition text-3xl"
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

          <option value="credito_1_pago">
            Crédito 1 pago
          </option>

          <option value="credito_3_cuotas">
            Crédito 3 cuotas
          </option>

          <option value="credito_6_cuotas">
            Crédito 6 cuotas
          </option>

          <option value="credito_12_cuotas">
            Crédito 12 cuotas
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

  {/* Desktop */}
  <div className="hidden md:block">

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

        <div>

          $
          {Number(item.total)
            .toLocaleString("es-AR")}

        </div>

      </div>

    ))}

  </div>

  {/* Mobile */}
  <div className="md:hidden p-4 space-y-4">

    {pedidoItems.map((item) => (

      <div
        key={item.id}
        className="bg-[#0b1727] border border-white/5 rounded-2xl p-4 space-y-3"
      >

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Producto
          </span>

          <span className="text-white">
            {item.producto}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Variante
          </span>

          <span className="text-white">
            {item.modelo}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Color
          </span>

          <span className="text-white">
            {item.color}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Cantidad
          </span>

          <span className="text-white">
            {item.cantidad}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Unidad
          </span>

          <span className="text-white">
            {item.unidad}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-zinc-500">
            Total
          </span>

          <span className="text-emerald-400 font-semibold">

            $
            {Number(item.total)
              .toLocaleString("es-AR")}

          </span>

        </div>

      </div>

    ))}

  </div>

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
        className="absolute top-6 right-6 text-white hover:text-white transition text-3xl"
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
        <div className="grid grid-cols-1 md:grid-cols-4 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Método</div>
          <div>Monto</div>
          <div>Observaciones</div>

        </div>

        {/* Pagos */}
        {historialPagos.map((pago) => (

          <div
            key={pago.id}
            className="grid grid-cols-1 md:grid-cols-4 px-6 py-5 border-b border-white/5"
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

{/* Modal factura */}
{modalFactura && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">

      <button
        onClick={() => setModalFactura(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition flex items-center justify-center text-2xl leading-none"
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className="mb-6 pr-10">

        <h2 className="text-3xl font-bold">
          Factura del pedido
        </h2>

        <p className="text-zinc-500 mt-1">
          Cargar o editar el número de factura
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>

          <label className="text-zinc-500 text-sm">
            Tipo de comprobante
          </label>

          <select
            value={tipoComprobante}
            onChange={(event) =>
              setTipoComprobante(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          >
            {tiposComprobanteArca.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Modalidad
          </label>

          <select
            value={modalidadComprobante}
            onChange={(event) =>
              setModalidadComprobante(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          >
            {modalidadesComprobante.map((modalidad) => (
              <option key={modalidad} value={modalidad}>
                {modalidad}
              </option>
            ))}
          </select>

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Punto de venta
          </label>

          <input
            value={puntoVenta}
            onChange={(event) =>
              setPuntoVenta(event.target.value)
            }
            placeholder="Ej: 0001"
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div>

        <label className="text-zinc-500 text-sm">
          Número de factura
        </label>

        <input
          value={numeroFactura}
          onChange={(event) =>
            setNumeroFactura(event.target.value)
          }
          placeholder="Ej: A-0001-00001234"
          className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
        />

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            CUIT / DNI cliente
          </label>

          <input
            value={cuitFacturacion}
            onChange={(event) =>
              setCuitFacturacion(event.target.value)
            }
            placeholder="Ej: 20-12345678-9"
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Condicion IVA
          </label>

          <select
            value={condicionIva}
            onChange={(event) =>
              setCondicionIva(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          >
            {condicionesIva.map((condicion) => (
              <option key={condicion} value={condicion}>
                {condicion}
              </option>
            ))}
          </select>

        </div>

        <div>

          <label className="text-zinc-500 text-sm">
            Fecha del comprobante
          </label>

          <input
            type="date"
            value={fechaFactura}
            onChange={(event) =>
              setFechaFactura(event.target.value)
            }
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div className="md:col-span-2">

          <label className="text-zinc-500 text-sm">
            Observaciones fiscales
          </label>

          <textarea
            value={observacionesFactura}
            onChange={(event) =>
              setObservacionesFactura(event.target.value)
            }
            rows={3}
            placeholder="Datos adicionales, comprobante asociado o motivo de nota de credito/debito"
            className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition resize-none"
          />

        </div>

      </div>

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={quitarFactura}
          className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
        >
          Sin factura
        </button>

        <button
          onClick={guardarFactura}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          Guardar factura
        </button>

      </div>

    </div>

  </div>

)}

{modalFormaEntrega && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-xl p-8 relative">
      <button
        onClick={() => setModalFormaEntrega(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">
          Forma de entrega
        </h2>
        <p className="text-zinc-500 mt-1">
          Defini si el pedido se retira o se envia.
        </p>
      </div>

      <select
        value={formaEntrega}
        onChange={(event) => setFormaEntrega(event.target.value)}
        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
      >
        <option value="Retiro de fabrica">Retiro de fabrica</option>
        <option value="Envio">Envio</option>
      </select>

      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={() => setModalFormaEntrega(false)}
          className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={guardarFormaEntrega}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal estado */}
{modalEstado && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-xl p-8 relative">

      {/* X */}
      <button
        onClick={() => setModalEstado(false)}
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Cambiar estado
        </h2>

        <p className="text-zinc-500 mt-1">
          Seleccionar estado operativo
        </p>

      </div>

      {/* Estados */}
      <div className="space-y-4">

        <button
          onClick={async () => {

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

            setModalEstado(false);

          }}
          className="w-full bg-cyan-500/20 hover:bg-cyan-500 transition text-cyan-400 hover:text-white px-4 py-4 rounded-2xl border border-cyan-500/20"
        >
          En producción
        </button>

        <button
          onClick={async () => {

            await supabase
              .from("pedidos")
              .update({
                estado: "Demorado",
              })
              .eq("id", pedidoSeleccionado.id);

            setPedidoSeleccionado({
              ...pedidoSeleccionado,
              estado: "Demorado",
            });

            cargarPedidos();

            setModalEstado(false);

          }}
          className="w-full bg-red-500/20 hover:bg-red-500 transition text-red-400 hover:text-white px-4 py-4 rounded-2xl border border-red-500/20"
        >
          Demorado
        </button>

        <button
          onClick={async () => {

            await supabase
              .from("pedidos")
              .update({
                estado: "Finalizando",
              })
              .eq("id", pedidoSeleccionado.id);

            setPedidoSeleccionado({
              ...pedidoSeleccionado,
              estado: "Finalizando",
            });

            cargarPedidos();

            setModalEstado(false);

          }}
          className="w-full bg-blue-500/20 hover:bg-blue-500 transition text-blue-400 hover:text-white px-4 py-4 rounded-2xl border border-blue-500/20"
        >
          Finalizando
        </button>

        <button
  onClick={async () => {

    await supabase
      .from("pedidos")
      .update({
        estado: "Enviar/Retirar",
      })
      .eq("id", pedidoSeleccionado.id);

    setPedidoSeleccionado({
      ...pedidoSeleccionado,
      estado: "Enviar/Retirar",
    });

    cargarPedidos();

    setModalEstado(false);

  }}
  className="w-full bg-emerald-500/20 hover:bg-emerald-500 transition text-emerald-400 hover:text-white px-4 py-4 rounded-2xl border border-emerald-500/20"
>
  Enviar/Retirar
</button>

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

        <h2 className="text-3xl font-bold text-white">
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

          <option value="Retiro de fabrica">
            Retiro de fabrica
          </option>

          <option value="Envio">
            Envio
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

</>
  );
}
