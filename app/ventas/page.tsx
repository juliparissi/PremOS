"use client";

import BackButton from "@/components/BackButton";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
};

type Producto = {
  id: string;
  producto: string;
  modelo?: string;
  color?: string;
  unidad?: string;
  precio_unitario?: number;
};

type VentaItem = {
  id: string;
  producto: string;
  modelo: string;
  color: string;
  unidad: string;
  cantidad: number;
  precio: number;
  total: number;
};

type PedidoDirecto = {
  id: string;
  numero: string;
  cliente_id: string | null;
  fecha_entrega: string | null;
  saldo_total: number;
  saldo_abonado: number;
  saldo_restante: number;
  estado_pago: string;
  con_factura?: boolean;
  numero_factura?: string | null;
  tipo_comprobante?: string | null;
  modalidad_comprobante?: string | null;
  punto_venta?: string | null;
  cuit_facturacion?: string | null;
  condicion_iva?: string | null;
  fecha_factura?: string | null;
  observaciones_factura?: string | null;
  created_at?: string | null;
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

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return money.format(Number(value || 0));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function paymentState(total: number, abonado: number) {
  if (abonado <= 0) return "Pendiente";
  if (abonado >= total) return "Pagado";
  return "Parcial";
}

export default function VentasPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventasDirectas, setVentasDirectas] = useState<PedidoDirecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoVentaId, setEliminandoVentaId] = useState<string | null>(
    null
  );
  const [modalVenta, setModalVenta] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const clienteRef = useRef<HTMLDivElement>(null);

  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [items, setItems] = useState<VentaItem[]>([]);
  const [fechaEntrega, setFechaEntrega] = useState(today());
  const [observaciones, setObservaciones] = useState("");
  const [transporte, setTransporte] = useState("");
  const [descuento, setDescuento] = useState("");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [conFactura, setConFactura] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("Factura C");
  const [modalidadComprobante, setModalidadComprobante] =
    useState("Electronica ARCA");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [cuitFacturacion, setCuitFacturacion] = useState("");
  const [condicionIva, setCondicionIva] = useState("Consumidor final");
  const [fechaFactura, setFechaFactura] = useState(today());
  const [observacionesFactura, setObservacionesFactura] = useState("");

  async function cargarDatos() {
    setCargando(true);

    const [
      { data: clientesData },
      { data: productosData },
      { data: ventasData },
    ] = await Promise.all([
      supabase.from("clientes").select("id,nombre,telefono,direccion"),
      supabase.from("productos").select("*").order("producto"),
      supabase
        .from("pedidos")
        .select(
          "id,numero,cliente_id,fecha_entrega,saldo_total,saldo_abonado,saldo_restante,estado_pago,con_factura,numero_factura,created_at"
        )
        .is("presupuesto_id", null)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    setClientes((clientesData || []) as Cliente[]);
    setProductos((productosData || []) as Producto[]);
    setVentasDirectas((ventasData || []) as PedidoDirecto[]);
    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        clienteRef.current &&
        !clienteRef.current.contains(event.target as Node)
      ) {
        setMostrarClientes(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const clienteActual = clientes.find(
    (cliente) => cliente.id === clienteSeleccionado
  );

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.total, 0);
  }, [items]);

  const total = subtotal + Number(transporte || 0) - Number(descuento || 0);
  const abonado = Number(montoAbonado || 0);
  const saldoRestante = Math.max(total - abonado, 0);
  const estadoPago = paymentState(total, abonado);

  function agregarProducto() {
    const producto = productos.find((item) => item.id === productoSeleccionado);

    if (!producto) return;

    const nuevoItem: VentaItem = {
      id: crypto.randomUUID(),
      producto: producto.producto,
      modelo: producto.modelo || "",
      color: producto.color || "",
      unidad: producto.unidad || "",
      cantidad: 1,
      precio: Number(producto.precio_unitario || 0),
      total: Number(producto.precio_unitario || 0),
    };

    setItems((actual) => [...actual, nuevoItem]);
    setProductoSeleccionado("");
  }

  function actualizarCantidad(id: string, cantidad: number) {
    setItems((actual) =>
      actual.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad,
              total: cantidad * item.precio,
            }
          : item
      )
    );
  }

  function actualizarPrecio(id: string, precio: number) {
    setItems((actual) =>
      actual.map((item) =>
        item.id === id
          ? {
              ...item,
              precio,
              total: item.cantidad * precio,
            }
          : item
      )
    );
  }

  function quitarProducto(id: string) {
    setItems((actual) => actual.filter((item) => item.id !== id));
  }

  function limpiarFormulario() {
    setClienteSeleccionado("");
    setBusquedaCliente("");
    setProductoSeleccionado("");
    setItems([]);
    setFechaEntrega(today());
    setObservaciones("");
    setTransporte("");
    setDescuento("");
    setMontoAbonado("");
    setMetodoPago("");
    setConFactura(false);
    setNumeroFactura("");
    setTipoComprobante("Factura C");
    setModalidadComprobante("Electronica ARCA");
    setPuntoVenta("");
    setCuitFacturacion("");
    setCondicionIva("Consumidor final");
    setFechaFactura(today());
    setObservacionesFactura("");
  }

  async function crearPedidoDirecto() {
    if (guardando) return;

    if (!clienteSeleccionado) {
      alert("Seleccioná un cliente para la venta.");
      return;
    }

    if (items.length === 0) {
      alert("Agregá al menos un producto.");
      return;
    }

    if (total <= 0) {
      alert("El total de la venta debe ser mayor a cero.");
      return;
    }

    if (abonado > total) {
      alert("El monto abonado no puede superar el total.");
      return;
    }

    if (abonado > 0 && !metodoPago) {
      alert("Seleccioná un método de pago para registrar el abono.");
      return;
    }

    setGuardando(true);

    const totalPedidos =
      (await supabase.from("pedidos").select("id")).data?.length || 0;
    const letraIndex = Math.floor(totalPedidos / 9999);
    const letra = String.fromCharCode(97 + letraIndex);
    const numeroInterno = (totalPedidos % 9999) + 1;
    const numeroPedido = `PED-${letra}${String(numeroInterno).padStart(
      4,
      "0"
    )}`;

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert([
        {
          numero: numeroPedido,
          cliente_id: clienteSeleccionado,
          presupuesto_id: null,
          estado: "A producir",
          fecha_entrega: fechaEntrega,
          saldo_total: total,
          saldo_abonado: abonado,
          saldo_restante: saldoRestante,
          estado_pago: estadoPago,
          observaciones,
          con_factura: conFactura,
          numero_factura: conFactura ? numeroFactura : null,
          tipo_comprobante: conFactura ? tipoComprobante : null,
          modalidad_comprobante: conFactura ? modalidadComprobante : null,
          punto_venta: conFactura ? puntoVenta || null : null,
          cuit_facturacion: conFactura ? cuitFacturacion || null : null,
          condicion_iva: conFactura ? condicionIva || null : null,
          fecha_factura: conFactura ? fechaFactura || null : null,
          observaciones_factura: conFactura
            ? observacionesFactura || null
            : null,
        },
      ])
      .select()
      .single();

    if (error || !pedido) {
      alert("No se pudo crear la venta directa.");
      setGuardando(false);
      return;
    }

    await supabase.from("pedido_items").insert(
      items.map((item) => ({
        pedido_id: pedido.id,
        producto_id: null,
        producto: item.producto,
        modelo: item.modelo,
        color: item.color,
        cantidad: item.cantidad,
        unidad: item.unidad,
        precio: item.precio,
        total: item.total,
      }))
    );

    if (transporte) {
      await supabase.from("pedido_items").insert({
        pedido_id: pedido.id,
        producto_id: null,
        producto: "ENVIO",
        modelo: "-",
        color: "-",
        cantidad: 1,
        unidad: "-",
        precio: Number(transporte),
        total: Number(transporte),
      });
    }

    if (descuento) {
      await supabase.from("pedido_items").insert({
        pedido_id: pedido.id,
        producto_id: null,
        producto: "DESCUENTO",
        modelo: "-",
        color: "-",
        cantidad: 1,
        unidad: "-",
        precio: -Number(descuento),
        total: -Number(descuento),
      });
    }

    if (abonado > 0) {
      await supabase.from("pagos_pedidos").insert({
        pedido_id: pedido.id,
        monto: abonado,
        metodo_pago: metodoPago,
        observaciones: "Pago inicial de venta directa",
        fecha: today(),
      });

      await supabase.from("movimientos_economia").insert({
        tipo: "Ingreso",
        concepto: `Pago venta directa ${numeroPedido}`,
        monto: abonado,
        detalle: `${conFactura ? "C/F" : "S/F"} - ${metodoPago}`,
        fecha: today(),
        monto_total: total,
        monto_abonado: abonado,
        saldo_pendiente: saldoRestante,
      });
    }

    alert(`Venta directa creada. Pedido generado: ${numeroPedido}`);
    limpiarFormulario();
    setModalVenta(false);
    await cargarDatos();
    setGuardando(false);
  }

  async function eliminarVentaDirecta(venta: PedidoDirecto) {
    if (eliminandoVentaId) return;

    const confirmar = window.confirm(
      `Estas seguro de eliminar la venta ${venta.numero}? Esta accion borra el pedido, items, pagos y movimiento economico asociado.`
    );

    if (!confirmar) return;

    setEliminandoVentaId(venta.id);

    const { error: itemsError } = await supabase
      .from("pedido_items")
      .delete()
      .eq("pedido_id", venta.id);

    const { error: pagosError } = await supabase
      .from("pagos_pedidos")
      .delete()
      .eq("pedido_id", venta.id);

    const { error: movimientoError } = await supabase
      .from("movimientos_economia")
      .delete()
      .eq("concepto", `Pago venta directa ${venta.numero}`);

    const { error: pedidoError } = await supabase
      .from("pedidos")
      .delete()
      .eq("id", venta.id)
      .is("presupuesto_id", null);

    setEliminandoVentaId(null);

    if (itemsError || pagosError || movimientoError || pedidoError) {
      alert("No se pudo eliminar la venta directa.");
      return;
    }

    setVentasDirectas((actual) =>
      actual.filter((item) => item.id !== venta.id)
    );
    alert("Venta directa eliminada correctamente.");
  }

  return (
    <>
      <BackButton />

      <div className="pb-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ventas</h1>
            <p className="text-zinc-500 mt-1">
              Venta directa y generacion rapida de pedidos
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <Link
              href="/pedidos"
              className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-center"
            >
              Ver pedidos
            </Link>

            <button
              onClick={() => setModalVenta(true)}
              className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
            >
              + Nueva venta
            </button>
          </div>
        </div>

        <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5">
            <h2 className="text-2xl font-semibold">Ultimas ventas directas</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Pedidos creados desde el modulo de ventas sin presupuesto previo
            </p>
          </div>

          <div className="hidden md:grid grid-cols-[150px_minmax(220px,1fr)_150px_130px_160px_240px] items-center px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
            <div className="text-center">Pedido</div>
            <div>Cliente</div>
            <div className="text-center">Entrega</div>
            <div className="text-center">Pago</div>
            <div className="text-center">Total</div>
            <div className="text-center">Acciones</div>
          </div>

          {cargando ? (
            <div className="p-6 text-zinc-500">Cargando ventas...</div>
          ) : ventasDirectas.length === 0 ? (
            <div className="p-6 text-zinc-500">No hay ventas directas.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {ventasDirectas.map((venta) => (
                <div
                  key={venta.id}
                  className="grid grid-cols-1 md:grid-cols-[150px_minmax(220px,1fr)_150px_130px_160px_240px] items-center gap-3 md:gap-0 px-6 py-5 hover:bg-white/5 transition"
                >
                  <Link
                    href="/pedidos"
                    className="font-medium text-white hover:text-cyan-300 transition md:text-center"
                  >
                    {venta.numero}
                  </Link>
                  <div className="text-zinc-300 md:pr-4 truncate">
                    {clientes.find((cliente) => cliente.id === venta.cliente_id)
                      ?.nombre || "Cliente sin identificar"}
                  </div>
                  <div className="text-zinc-400 md:text-center tabular-nums">
                    {venta.fecha_entrega
                      ? venta.fecha_entrega.split("-").reverse().join("/")
                      : "-"}
                  </div>
                  <div className="md:text-center">
                    <span
                      className={
                        venta.estado_pago === "Pagado"
                          ? "text-emerald-400"
                          : venta.estado_pago === "Parcial"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {venta.estado_pago}
                    </span>
                  </div>
                  <div className="text-emerald-400 font-semibold md:text-center tabular-nums">
                    {formatMoney(venta.saldo_total)}
                  </div>
                  <div className="flex flex-wrap justify-start md:justify-center gap-2">
                    <Link
                      href="/pedidos"
                      className="min-w-14 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-center transition"
                    >
                      Ver
                    </Link>
                    <button
                      type="button"
                      onClick={() => eliminarVentaDirecta(venta)}
                      disabled={eliminandoVentaId === venta.id}
                      className="min-w-36 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-sm text-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {eliminandoVentaId === venta.id
                        ? "Eliminando..."
                        : "Eliminar venta"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalVenta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/5 sticky top-0 bg-[#0b1727] z-10">
              <div>
                <h2 className="text-2xl font-bold">Nueva venta directa</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Carga cliente, productos, pago inicial y crea el pedido
                </p>
              </div>

              <button
                onClick={() => {
                  setModalVenta(false);
                  setMostrarClientes(false);
                }}
                className="text-zinc-400 hover:text-white transition text-3xl leading-none"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 p-6">
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div ref={clienteRef} className="relative">
                    <label className="text-sm text-zinc-400 block mb-2">
                      Cliente
                    </label>
                    <input
                      value={busquedaCliente}
                      onChange={(event) => {
                        setBusquedaCliente(event.target.value);
                        setMostrarClientes(true);
                      }}
                      onFocus={() => setMostrarClientes(true)}
                      placeholder="Buscar cliente"
                      className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                    />

                    {mostrarClientes && (
                      <div className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto bg-[#07111f] border border-white/10 rounded-2xl shadow-2xl">
                        {clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => {
                              setClienteSeleccionado(cliente.id);
                              setBusquedaCliente(cliente.nombre);
                              setMostrarClientes(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                          >
                            {cliente.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">
                      Fecha estimada de entrega
                    </label>
                    <input
                      type="date"
                      value={fechaEntrega}
                      onChange={(event) => setFechaEntrega(event.target.value)}
                      className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                    />
                  </div>
                </div>

                {clienteActual && (
                  <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4 text-sm text-zinc-300">
                    <p className="font-medium text-white">{clienteActual.nombre}</p>
                    <p className="text-zinc-500 mt-1">
                      {clienteActual.telefono || "Sin telefono"} - {" "}
                      {clienteActual.direccion || "Sin direccion"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <select
                    value={productoSeleccionado}
                    onChange={(event) => setProductoSeleccionado(event.target.value)}
                    className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {[producto.producto, producto.modelo, producto.color]
                          .filter(Boolean)
                          .join(" - ")} - {formatMoney(Number(producto.precio_unitario || 0))}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={agregarProducto}
                    className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
                  >
                    Agregar
                  </button>
                </div>

                <div className="bg-[#07111f] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_auto] gap-4 px-4 py-3 border-b border-white/5 text-zinc-500 text-sm">
                    <div>Producto</div>
                    <div>Cantidad</div>
                    <div>Precio</div>
                    <div>Total</div>
                    <div></div>
                  </div>

                  {items.length === 0 && (
                    <div className="px-4 py-8 text-zinc-500">
                      Todavia no agregaste productos.
                    </div>
                  )}

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-b-0 items-center"
                    >
                      <div>
                        <p className="font-medium">{item.producto}</p>
                        <p className="text-zinc-500 text-sm">
                          {[item.modelo, item.color, item.unidad]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      </div>

                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(event) =>
                          actualizarCantidad(item.id, Number(event.target.value))
                        }
                        className="bg-[#0b1727] border border-white/5 rounded-xl px-3 py-2 text-white"
                      />

                      <input
                        type="number"
                        value={item.precio}
                        onChange={(event) =>
                          actualizarPrecio(item.id, Number(event.target.value))
                        }
                        className="bg-[#0b1727] border border-white/5 rounded-xl px-3 py-2 text-white"
                      />

                      <div className="font-semibold text-emerald-400">
                        {formatMoney(item.total)}
                      </div>

                      <button
                        onClick={() => quitarProducto(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={transporte}
                    onChange={(event) => setTransporte(event.target.value)}
                    placeholder="Transporte / envio"
                    className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                  <input
                    type="number"
                    value={descuento}
                    onChange={(event) => setDescuento(event.target.value)}
                    placeholder="Descuento"
                    className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={montoAbonado}
                    onChange={(event) => setMontoAbonado(event.target.value)}
                    placeholder="Monto abonado inicial"
                    className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                  />
                  <select
                    value={metodoPago}
                    onChange={(event) => setMetodoPago(event.target.value)}
                    className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                  >
                    <option value="">Metodo de pago</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4 space-y-4">
                  <label className="flex items-center gap-3 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={conFactura}
                      onChange={(event) => setConFactura(event.target.checked)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    Venta con factura
                  </label>

                  {conFactura && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={tipoComprobante}
                        onChange={(event) =>
                          setTipoComprobante(event.target.value)
                        }
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      >
                        {tiposComprobanteArca.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>

                      <select
                        value={modalidadComprobante}
                        onChange={(event) =>
                          setModalidadComprobante(event.target.value)
                        }
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      >
                        {modalidadesComprobante.map((modalidad) => (
                          <option key={modalidad} value={modalidad}>
                            {modalidad}
                          </option>
                        ))}
                      </select>

                      <input
                        value={puntoVenta}
                        onChange={(event) => setPuntoVenta(event.target.value)}
                        placeholder="Punto de venta"
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      />

                      <input
                        value={numeroFactura}
                        onChange={(event) =>
                          setNumeroFactura(event.target.value)
                        }
                        placeholder="Numero de comprobante"
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      />

                      <input
                        value={cuitFacturacion}
                        onChange={(event) =>
                          setCuitFacturacion(event.target.value)
                        }
                        placeholder="CUIT / DNI cliente"
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      />

                      <select
                        value={condicionIva}
                        onChange={(event) => setCondicionIva(event.target.value)}
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      >
                        {condicionesIva.map((condicion) => (
                          <option key={condicion} value={condicion}>
                            {condicion}
                          </option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={fechaFactura}
                        onChange={(event) => setFechaFactura(event.target.value)}
                        className="bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                      />

                      <textarea
                        value={observacionesFactura}
                        onChange={(event) =>
                          setObservacionesFactura(event.target.value)
                        }
                        placeholder="Observaciones fiscales"
                        rows={3}
                        className="md:col-span-2 bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none resize-none"
                      />
                    </div>
                  )}
                </div>

                <textarea
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Observaciones de la venta"
                  rows={4}
                  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white outline-none"
                />
              </section>

              <aside className="bg-[#07111f] border border-white/5 rounded-3xl p-6 h-fit sticky top-24">
                <h2 className="text-xl font-semibold">Resumen</h2>

                <div className="space-y-4 mt-6 text-sm">
                  <Row label="Subtotal" value={formatMoney(subtotal)} />
                  <Row label="Transporte" value={formatMoney(Number(transporte || 0))} />
                  <Row label="Descuento" value={formatMoney(Number(descuento || 0))} />
                  <Row label="Total" value={formatMoney(total)} highlight />
                  <Row label="Abonado" value={formatMoney(abonado)} />
                  <Row label="Saldo" value={formatMoney(saldoRestante)} tone="yellow" />
                  <Row label="Estado pago" value={estadoPago} />
                </div>

                <button
                  onClick={crearPedidoDirecto}
                  disabled={guardando}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 transition px-5 py-3 rounded-2xl text-black font-semibold mt-6"
                >
                  {guardando ? "Creando pedido..." : "Crear pedido"}
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  label,
  value,
  highlight = false,
  tone = "white",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "white" | "yellow";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span
        className={`font-semibold ${
          highlight
            ? "text-2xl text-emerald-400"
            : tone === "yellow"
            ? "text-yellow-400"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
