"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../../lib/supabase";
import { getEmpresaConfig } from "../../../lib/empresa";
import {
  generarPDFFacturaInterna,
  generarPDFPresupuesto,
  generarPDFRemitoEnvio,
} from "../../../utils/generarPDF";

const condicionesIva = [
  "Consumidor final",
  "Responsable inscripto",
  "Responsable Monotributo",
  "Exento",
  "No responsable",
  "Sujeto no categorizado",
];

const formasPagoFactura = [
  "Efectivo",
  "Transferencia bancaria",
  "Tarjeta credito",
  "Tarjeta debito",
  "Cheque",
  "Mercado Pago",
  "Cuenta corriente",
  "Otro",
];

const tiposComprobante = [
  "Factura A",
  "Factura B",
  "Factura C",
  "Nota de credito A",
  "Nota de credito B",
  "Nota de credito C",
  "Nota de debito A",
  "Nota de debito B",
  "Nota de debito C",
];

const demoMode = process.env.NEXT_PUBLIC_PREMOS_DEMO_MODE === "true";


export default function HistorialPedidosPage() {

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [configFiscal, setConfigFiscal] = useState<any>(null);

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
  const [modalFactura, setModalFactura] = useState(false);
  const [tipoComprobante, setTipoComprobante] = useState("Factura C");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [razonSocialFacturacion, setRazonSocialFacturacion] = useState("");
  const [cuitFacturacion, setCuitFacturacion] = useState("");
  const [condicionIva, setCondicionIva] = useState("Consumidor final");
  const [formaPagoFactura, setFormaPagoFactura] = useState("Efectivo");
  const [fechaFactura, setFechaFactura] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacionesFactura, setObservacionesFactura] = useState("");
  const [emitiendoArca, setEmitiendoArca] = useState(false);
  const [consultandoPadron, setConsultandoPadron] = useState(false);
  const [mensajePadron, setMensajePadron] = useState("");

  async function cargarPedidos() {

    const { data: pedidosData } = await supabase
      .from("pedidos")
      .select("*")
      .eq("estado", "Entregado")
      .order("created_at", {
        ascending: false,
      });

    const { data: clientesData } = await supabase
      .from("clientes")
      .select("*");

    const { data: configFiscalData } = await supabase
      .from("configuracion_fiscal")
      .select(
        "tipo_comprobante_default,modalidad_comprobante,punto_venta,razon_social,cuit,condicion_iva,ingresos_brutos,fecha_inicio_actividades,domicilio_fiscal"
      )
      .limit(1)
      .maybeSingle();

    if (pedidosData) {
      setPedidos(pedidosData);
    }

    if (clientesData) {
      setClientes(clientesData);
    }

    if (configFiscalData) {
      setConfigFiscal(configFiscalData);
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

function abrirFacturaHistorial() {
  setTipoComprobante(
    pedidoSeleccionado?.tipo_comprobante ||
      configFiscal?.tipo_comprobante_default ||
      "Factura C"
  );
  setPuntoVenta(
    pedidoSeleccionado?.punto_venta || configFiscal?.punto_venta || "0001"
  );
  setRazonSocialFacturacion(
    pedidoSeleccionado?.razon_social_facturacion || ""
  );
  setCuitFacturacion(pedidoSeleccionado?.cuit_facturacion || "");
  setCondicionIva(pedidoSeleccionado?.condicion_iva || "Consumidor final");
  setFormaPagoFactura(pedidoSeleccionado?.forma_pago_factura || "Efectivo");
  setFechaFactura(
    pedidoSeleccionado?.fecha_factura ||
      new Date().toISOString().split("T")[0]
  );
  setObservacionesFactura(pedidoSeleccionado?.observaciones_factura || "");
  setMensajePadron("");
  setModalFactura(true);
}

async function consultarPadronFacturacion(cuitBase = cuitFacturacion) {
  const cuitLimpio = cuitBase.replace(/\D/g, "");

  if (cuitLimpio.length !== 11) {
    setMensajePadron("Ingresa un CUIT de 11 digitos para consultar ARCA.");
    return;
  }

  setConsultandoPadron(true);
  setMensajePadron("");

  try {
    const respuesta = await fetch("/api/arca/padron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuit: cuitLimpio }),
    });
    const data = await respuesta.json().catch(() => null);

    if (!respuesta.ok || !data?.persona?.razonSocial) {
      setMensajePadron(
        data?.error ||
          "No se pudo leer la razon social. Podes cargarla manualmente."
      );
      return;
    }

    setCuitFacturacion(data.persona.cuit || cuitLimpio);
    setRazonSocialFacturacion(data.persona.razonSocial);
    setMensajePadron("Razon social leida desde padron ARCA.");
  } catch {
    setMensajePadron(
      "No se pudo consultar ARCA en este momento. Podes cargar la razon social manualmente."
    );
  } finally {
    setConsultandoPadron(false);
  }
}

async function guardarFacturaHistorial() {
  if (!pedidoSeleccionado) return false;

  const { data, error } = await supabase
    .from("pedidos")
    .update({
      con_factura: true,
      tipo_comprobante: tipoComprobante || null,
      modalidad_comprobante: "Electronica ARCA",
      punto_venta: puntoVenta.trim() || null,
      cuit_facturacion: cuitFacturacion.trim() || null,
      razon_social_facturacion: razonSocialFacturacion.trim() || null,
      condicion_iva: condicionIva || null,
      forma_pago_factura: formaPagoFactura || null,
      fecha_factura: fechaFactura || null,
      observaciones_factura: observacionesFactura.trim() || null,
    })
    .eq("id", pedidoSeleccionado.id)
    .select()
    .single();

  if (error) {
    alert("No se pudieron guardar los datos de factura.");
    return false;
  }

  setPedidoSeleccionado(data);
  setPedidos((actual) =>
    actual.map((pedido) => (pedido.id === data.id ? data : pedido))
  );

  return true;
}

async function emitirFacturaArcaHistorial() {
  if (!pedidoSeleccionado || emitiendoArca) return;

  setEmitiendoArca(true);

  try {
    const guardado = await guardarFacturaHistorial();
    if (!guardado) return;

    const response = await fetch("/api/arca/emitir-factura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId: pedidoSeleccionado.id }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data?.pedido) {
        setPedidoSeleccionado(data.pedido);
        setPedidos((actual) =>
          actual.map((pedido) =>
            pedido.id === data.pedido.id ? data.pedido : pedido
          )
        );
      }

      const detalle = Array.isArray(data?.observaciones)
        ? data.observaciones.filter(Boolean).join(" | ")
        : data?.pedido?.arca_observaciones || "";

      alert(
        [data?.error || "No se pudo emitir la factura ARCA.", detalle]
          .filter(Boolean)
          .join("\n")
      );
      return;
    }

    setPedidoSeleccionado(data.pedido);
    setPedidos((actual) =>
      actual.map((pedido) =>
        pedido.id === data.pedido.id ? data.pedido : pedido
      )
    );
    setModalFactura(false);
    alert("Factura ARCA emitida correctamente.");
  } catch {
    alert("No se pudo emitir la factura ARCA.");
  } finally {
    setEmitiendoArca(false);
  }
}

async function descargarFacturaHistorial() {
  if (!pedidoSeleccionado) return;

  const cliente = clientes.find(
    (item) => item.id === pedidoSeleccionado.cliente_id
  );

  generarPDFFacturaInterna({
    numeroPedido: pedidoSeleccionado.numero,
    numeroFactura: pedidoSeleccionado.numero_factura || "",
    tipoComprobante: pedidoSeleccionado.tipo_comprobante || tipoComprobante,
    puntoVenta: pedidoSeleccionado.punto_venta || puntoVenta,
    fecha:
      pedidoSeleccionado.fecha_factura ||
      new Date().toISOString().split("T")[0],
    cliente:
      pedidoSeleccionado.razon_social_facturacion ||
      cliente?.nombre ||
      "Cliente",
    telefono: cliente?.telefono || "",
    direccion: cliente?.direccion || "",
    cuitFacturacion: pedidoSeleccionado.cuit_facturacion || "",
    condicionIva: pedidoSeleccionado.condicion_iva || "",
    formaPago: pedidoSeleccionado.forma_pago_factura || "",
    empresa: await obtenerEmpresaDocumento(),
    empresaFiscal: configFiscal || undefined,
    items: pedidoItems,
    neto: pedidoSeleccionado.importe_neto,
    iva: pedidoSeleccionado.importe_iva,
    total: pedidoSeleccionado.saldo_total,
    cae: pedidoSeleccionado.arca_cae || "",
    caeVencimiento: pedidoSeleccionado.arca_cae_vencimiento || "",
    arcaEstado: pedidoSeleccionado.arca_estado || "",
    observaciones: pedidoSeleccionado.observaciones_factura || "",
  });
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
      <BackButton
        href="/pedidos"
        label="Volver a pedidos"
        showDesktop
      />

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Historial pedidos
        </h1>

        <p className="text-zinc-500 mt-1">
          Pedidos entregados
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

                  setPresupuestoOriginal(null);
                  
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

                {pedidoSeleccionado?.presupuesto_id && (

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

)}

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

      senia:
        obtenerSeniaInicial(),

      total: pedidoSeleccionado.saldo_total,

      observaciones:
        pedidoSeleccionado.observaciones || "",

    });

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Descargar nota venta
</button>

<button
  onClick={abrirFacturaHistorial}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
>
  Factura
</button>

{pedidoSeleccionado?.con_factura && (
  <button
    onClick={descargarFacturaHistorial}
    className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition px-4 py-2 rounded-xl border border-emerald-500/20 text-sm"
  >
    Descargar factura
  </button>
)}

{pedidoSeleccionado?.forma_entrega === "Envio" && (
  <button
    onClick={async () => {
      const cliente = clientes.find(
        (c) => c.id === pedidoSeleccionado.cliente_id
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
    }}
    className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white transition px-4 py-2 rounded-xl border border-cyan-500/20 text-sm"
  >
    Descargar remito envio
  </button>
)}

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

      {modalFactura && pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-6 overflow-y-auto">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalFactura(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold">Factura del pedido</h2>
              <p className="text-zinc-500 mt-1">
                Emitir o descargar factura para un pedido entregado.
              </p>
              {demoMode && (
                <p className="mt-3 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 rounded-2xl px-4 py-3 text-sm">
                  Demo visual: la emision real de ARCA esta deshabilitada.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-zinc-500 text-sm">
                  Tipo de comprobante
                </label>
                <select
                  value={tipoComprobante}
                  onChange={(event) => setTipoComprobante(event.target.value)}
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                >
                  {tiposComprobante.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
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
                  onChange={(event) => setPuntoVenta(event.target.value)}
                  placeholder="Ej: 0001"
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-sm">
                  Razon social cliente
                </label>
                <input
                  value={razonSocialFacturacion}
                  onChange={(event) =>
                    setRazonSocialFacturacion(event.target.value)
                  }
                  placeholder="Ej: Cliente / empresa receptora"
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-sm">
                  CUIT cliente
                </label>
                <input
                  value={cuitFacturacion}
                  onChange={(event) => setCuitFacturacion(event.target.value)}
                  onBlur={(event) => {
                    const cuitLimpio = event.target.value.replace(/\D/g, "");
                    if (cuitLimpio.length === 11) {
                      consultarPadronFacturacion(event.target.value);
                    }
                  }}
                  placeholder="Ej: 20-12345678-9"
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => consultarPadronFacturacion()}
                    disabled={consultandoPadron}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 rounded-2xl px-4 py-3 text-sm transition disabled:opacity-60"
                  >
                    {consultandoPadron
                      ? "Consultando ARCA..."
                      : "Consultar padron"}
                  </button>
                  {mensajePadron && (
                    <span className="text-zinc-500 text-sm">
                      {mensajePadron}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-sm">
                  Condicion IVA
                </label>
                <select
                  value={condicionIva}
                  onChange={(event) => setCondicionIva(event.target.value)}
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
                  onChange={(event) => setFechaFactura(event.target.value)}
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-sm">
                  Forma de pago
                </label>
                <select
                  value={formaPagoFactura}
                  onChange={(event) =>
                    setFormaPagoFactura(event.target.value)
                  }
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                >
                  {formasPagoFactura.map((forma) => (
                    <option key={forma} value={forma}>
                      {forma}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Estado ARCA</p>
                <p className="text-white font-semibold mt-2">
                  {pedidoSeleccionado.arca_estado || "Pendiente de emision"}
                </p>
                {pedidoSeleccionado.arca_cae && (
                  <p className="text-zinc-500 text-sm mt-2">
                    CAE {pedidoSeleccionado.arca_cae} - Vto.{" "}
                    {pedidoSeleccionado.arca_cae_vencimiento || "-"}
                  </p>
                )}
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
                  rows={4}
                  placeholder="Datos adicionales o aclaraciones"
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <button
                onClick={guardarFacturaHistorial}
                className="bg-white/5 hover:bg-white/10 transition px-5 py-4 rounded-2xl border border-white/5"
              >
                Guardar datos
              </button>
              <button
                onClick={descargarFacturaHistorial}
                disabled={!pedidoSeleccionado.con_factura}
                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition px-5 py-4 rounded-2xl border border-emerald-500/20 disabled:opacity-40"
              >
                Descargar factura
              </button>
              <button
                onClick={emitirFacturaArcaHistorial}
                disabled={
                  demoMode ||
                  emitiendoArca ||
                  Boolean(pedidoSeleccionado.arca_cae)
                }
                className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-4 rounded-2xl font-medium text-black disabled:opacity-50"
              >
                {demoMode
                  ? "Demo visual"
                  : emitiendoArca
                    ? "Emitiendo..."
                    : "Emitir factura ARCA"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
