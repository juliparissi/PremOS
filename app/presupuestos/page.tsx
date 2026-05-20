"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { generarPDFPresupuesto } from "../../utils/generarPDF";

export default function PresupuestosPage() {

  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [presupuestoItems, setPresupuestoItems] = useState<any[]>([]);


  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const [mostrarClientes, setMostrarClientes] = useState(false);

  const clienteRef = useRef<HTMLDivElement>(null);

  const hoy = new Date().toISOString().split("T")[0];

  const [fecha, setFecha] = useState(hoy);

  const [items, setItems] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const [transporte, setTransporte] = useState("");
  const [descuento, setDescuento] = useState("");

  const [iva, setIva] = useState("");

  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<any>(null);

  const [estadoPresupuesto, setEstadoPresupuesto] = useState("Borrador");

  const [modoEdicion, setModoEdicion] = useState(false);

  async function cargarDatos() {

    const { data: clientesData } = await supabase
      .from("clientes")
      .select("*");

    const { data: productosData } = await supabase
      .from("productos")
      .select("*");

    const { data: presupuestosData } = await supabase
  .from("presupuestos")
  .select("*")
  .order("created_at", { ascending: false });

    if (clientesData) {
      setClientes(clientesData);
    }

    if (productosData) {
      setProductos(productosData);
    }

    if (presupuestosData) {
      setPresupuestos(presupuestosData);
    }

  }

  async function cargarItemsPresupuesto(id: string) {

    const { data } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", id);

    if (data) {
      setPresupuestoItems(data);
    }

  }

  async function eliminarPresupuesto(id: string) {

    await supabase
      .from("presupuesto_items")
      .delete()
      .eq("presupuesto_id", id);

    await supabase
      .from("presupuestos")
      .delete()
      .eq("id", id);

    cargarDatos();

  }

  function agregarProducto() {

    const producto = productos.find(
      (p) => p.id === productoSeleccionado
    );

    if (!producto) return;

    const nuevoItem = {
      id: crypto.randomUUID(),
      producto: producto.producto,
      modelo: producto.modelo,
      color: producto.color,
      unidad: producto.unidad,
      cantidad: 1,
      precio: Number(producto.precio_unitario),
      total: Number(producto.precio_unitario),
    };

    setItems([...items, nuevoItem]);

  }

  function actualizarCantidad(id: string, cantidad: number) {

    const nuevosItems = items.map((item) => {

      if (item.id === id) {

        return {
          ...item,
          cantidad,
          total: cantidad * item.precio,
        };

      }

      return item;

    });

    setItems(nuevosItems);

  }

  function actualizarUnidad(id: string, unidad: string) {

    const nuevosItems = items.map((item) => {

      if (item.id === id) {

        return {
          ...item,
          unidad,
        };

      }

      return item;

    });

    setItems(nuevosItems);

  }

  function quitarProducto(id: string) {

    const nuevosItems = items.filter(
      (item) => item.id !== id
    );

    setItems(nuevosItems);

  }

  function agregarTransporte() {

    if (!transporte) return;
    const nuevoItem = {
      id: crypto.randomUUID(),
      producto: "ENVIO",
      modelo: "-",
      color: "-",
      unidad: "-",
      cantidad: 1,
      precio: Number(transporte),
      total: Number(transporte),
    };

    setItems([...items, nuevoItem]);

    setTransporte("");

  }

  function aplicarDescuento() {

    if (!descuento) return;

    const nuevoItem = {
      id: crypto.randomUUID(),
      producto: "DESCUENTO",
      modelo: "-",
      color: "-",
      unidad: "-",
      cantidad: 1,
      precio: -Number(descuento),
      total: -Number(descuento),
    };

    setItems([...items, nuevoItem]);

    setDescuento("");

  }

  async function crearPresupuesto() {

    const totalPresupuestos = presupuestos.length + 1;

const letraIndex = Math.floor(
  (totalPresupuestos - 1) / 9999
);

const letra = String.fromCharCode(
  97 + letraIndex
);

const numeroInterno =
  ((totalPresupuestos - 1) % 9999) + 1;

const numero = `PRES-${letra}${String(
  numeroInterno
).padStart(4, "0")}`;

    const { data, error } = await supabase
      .from("presupuestos")
      .insert([
        {
          numero,
          cliente_id: clienteSeleccionado,
          total: totalFinalConIva,
          estado: estadoPresupuesto,
          fecha,
          observaciones,
          iva: Number(iva) || 0,
        },
      ])
      .select()
      .single();

    if (!error && data) {

      const itemsInsertar = items.map((item) => ({
        presupuesto_id: data.id,
        producto_id: null,

        producto: item.producto,
        modelo: item.modelo,
        color: item.color,

        cantidad: item.cantidad,
        unidad: item.unidad,

        precio: item.precio,
        total: item.total,
      }));

      await supabase
        .from("presupuesto_items")
        .insert(itemsInsertar);

      setModalAbierto(false);

      setItems([]);
      setObservaciones("");
      setEstadoPresupuesto("Borrador");

      cargarDatos();

    }

  }

  async function editarPresupuesto() {

    if (!presupuestoSeleccionado) return;

    setModoEdicion(true);

    setClienteSeleccionado(
      presupuestoSeleccionado.cliente_id
    );

    setFecha(presupuestoSeleccionado.fecha);

    setObservaciones(
      presupuestoSeleccionado.observaciones || ""
    );

    const transporteItem = presupuestoItems.find(
      (item) => item.producto === "ENVIO"
    );

    const descuentoItem = presupuestoItems.find(
      (item) => item.producto === "DESCUENTO"
    );

    if (transporteItem) {
      setTransporte(
        Math.abs(transporteItem.total).toString()
      );
    }

    if (descuentoItem) {
      setDescuento(
        Math.abs(descuentoItem.total).toString()
      );
    }

    const itemsNormales = presupuestoItems.filter(
      (item) =>
        item.producto !== "ENVIO" &&
        item.producto !== "DESCUENTO"
    );

    setItems(itemsNormales);

    setDetalleAbierto(false);

    setModalAbierto(true);

  }

  async function actualizarEstado(estado: string) {

    if (!presupuestoSeleccionado) return;

    const { error } = await supabase
      .from("presupuestos")
      .update({
        estado,
      })
      .eq("id", presupuestoSeleccionado.id);

    if (!error) {

      setEstadoPresupuesto(estado);

      cargarDatos();

    }

  }
  async function crearPedido() {

  if (!presupuestoSeleccionado) return;

  const totalPedidos =
    (await supabase
      .from("pedidos")
      .select("*")).data?.length || 0;

  const letraIndex = Math.floor(
    totalPedidos / 9999
  );

  const letra = String.fromCharCode(
    97 + letraIndex
  );

  const numeroInterno =
    (totalPedidos % 9999) + 1;

  const numeroPedido =
    `PED-${letra}${String(
      numeroInterno
    ).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("pedidos")
    .insert([
      {
        numero: numeroPedido,

        cliente_id:
          presupuestoSeleccionado.cliente_id,

        presupuesto_id:
          presupuestoSeleccionado.id,

        estado: "A producir",

        fecha_entrega:
          presupuestoSeleccionado.fecha,

        saldo_total:
          presupuestoSeleccionado.total,

        saldo_abonado: 0,

        saldo_restante:
          presupuestoSeleccionado.total,

        estado_pago: "Pendiente",

        observaciones:
          presupuestoSeleccionado.observaciones,
      },
    ])
    .select()
    .single();

  if (!error && data) {

    const itemsPedido = presupuestoItems.map(
      (item) => ({
        pedido_id: data.id,

        producto_id: null,

        producto: item.producto,
        modelo: item.modelo,
        color: item.color,

        cantidad: item.cantidad,
        unidad: item.unidad,

        precio: item.precio,
        total: item.total,
      })
    );

    await supabase
      .from("pedido_items")
      .insert(itemsPedido);

    alert("Pedido creado correctamente 😎");

  }

}
  const subtotal = items.reduce(
    (acc, item) => acc + item.total,
    0
  );

  const ivaCalculado =
    subtotal * (Number(iva) || 0) / 100;

  const totalFinalConIva =
    subtotal + ivaCalculado;

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre
      ?.toLowerCase()
      .includes(busquedaCliente.toLowerCase())
  );

const presupuestosFiltrados =
  presupuestos.filter((presupuesto) => {

    return (
      presupuesto.numero
        ?.toLowerCase()
        .includes(busqueda.toLowerCase())
    );

  });

const inicio =
  (paginaActual - 1) * ITEMS_POR_PAGINA;

const fin =
  inicio + ITEMS_POR_PAGINA;

const presupuestosPaginados =
  presupuestosFiltrados.slice(
    inicio,
    fin
  );

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

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Presupuestos
          </h1>

          <p className="text-zinc-500 mt-1">
            Últimos presupuestos generados
          </p>

        </div>

        <button
          onClick={() => {

  setModoEdicion(false);

  setClienteSeleccionado("");
  setBusquedaCliente("");

  setProductoSeleccionado("");

  setItems([]);

  setObservaciones("");

  setTransporte("");
  setDescuento("");
  setIva("");

  setEstadoPresupuesto("Borrador");

  setFecha(hoy);

  setModalAbierto(true);

}}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          + Nuevo presupuesto
        </button>

      </div>

      {/* Barra búsqueda */}
<div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">

  <input
  type="text"
  placeholder="Buscar presupuesto..."
  value={busqueda}
  onChange={(e) => setBusqueda(e.target.value)}
  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
/>

</div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
        {/* Header tabla */}
        <div className="px-6 py-5 border-b border-white/5">

          <h2 className="text-xl font-semibold">
            Últimos presupuestos
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Últimos presupuestos generados en el sistema
          </p>

        </div>

        {/* Head */}
        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Nº</div>
          <div>Cliente</div>
          <div>Estado</div>
          <div>Fecha</div>
          <div>PDF</div>

          <div className="text-right">
            Acciones
          </div>

        </div>

        {/* Presupuestos reales */}
        {presupuestosPaginados.map((presupuesto) => (

          <div
            key={presupuesto.id}
            className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div>
              {presupuesto.numero}
            </div>

            <div>
              {
  clientes.find(
    (c) => c.id === presupuesto.cliente_id
  )?.nombre
}
            </div>

            <div>

              {presupuesto.estado === "Borrador" && (
                <span className="text-yellow-400">
                  Borrador
                </span>
              )}

              {presupuesto.estado === "Enviado" && (
                <span className="text-cyan-400">
                  Enviado
                </span>
              )}

              {presupuesto.estado === "Aceptado" && (
                <span className="text-emerald-400">
                  Aceptado
                </span>
              )}

              {presupuesto.estado === "Rechazado" && (
                <span className="text-red-400">
                  Rechazado
                </span>
              )}

            </div>

            <div>
              {presupuesto.fecha
  .split("-")
  .reverse()
  .join("-")}
            </div>

            <div>

              <button
  onClick={async () => {

    const { data: itemsPDF } = await supabase
      .from("presupuesto_items")
      .select("*")
      .eq("presupuesto_id", presupuesto.id);

    generarPDFPresupuesto({

      numero: presupuesto.numero,

      fecha: presupuesto.fecha,

      cliente:
        clientes.find(
          (c) => c.id === presupuesto.cliente_id
        )?.nombre || "Cliente",

      telefono:
  clientes.find(
    (c) => c.id === presupuesto.cliente_id
  )?.telefono || "",

      direccion:
  clientes.find(
    (c) => c.id === presupuesto.cliente_id
  )?.direccion || "",

      items: itemsPDF || [],

      transporte:
        itemsPDF
          ?.filter((item) => item.producto === "ENVIO")
          .reduce((acc, item) => acc + item.total, 0) || 0,

      descuento:
        Math.abs(
          itemsPDF
            ?.filter((item) => item.producto === "DESCUENTO")
            .reduce((acc, item) => acc + item.total, 0) || 0
        ),

      iva: iva || 0,

      total: presupuesto.total,

      observaciones:
        presupuesto.observaciones || "",

    });

  }}
  className="text-emerald-400 hover:text-emerald-300 transition"
>
  Descargar
</button>

            </div>

            <div className="flex justify-end gap-4">

              <button
                onClick={async () => {

                  setPresupuestoSeleccionado(presupuesto);

                  setEstadoPresupuesto(presupuesto.estado);

                  await cargarItemsPresupuesto(
                    presupuesto.id
                  );

                  setDetalleAbierto(true);

                }}
                className="text-emerald-400 hover:text-emerald-300 transition"
              >
                Ver más
              </button>

              <button
                onClick={() => eliminarPresupuesto(presupuesto.id)}
                className="text-red-400 hover:text-red-300 transition"
              >
                Eliminar
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
      fin >=
      presupuestosFiltrados.length
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

      {/* Modal nuevo presupuesto */}
      {modalAbierto && (

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
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                {modoEdicion
                  ? "Editar presupuesto"
                  : "Nuevo presupuesto"}
              </h2>

              <p className="text-zinc-500 mt-1">
                Gestión del presupuesto
              </p>

            </div>

            {/* Datos generales */}
            <div className="grid grid-cols-3 gap-6 mb-8">

              <div>

                <label className="text-zinc-500 text-sm">
                  Número
                </label>

                <input
                  value={`PRES-${String(
                    presupuestos.length + 1
                  ).padStart(4, "0")}`}
                  readOnly
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

              </div>

              {/* Cliente */}
              <div ref={clienteRef} className="relative">

                <label className="text-zinc-500 text-sm">
                  Cliente
                </label>

                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);
                    setMostrarClientes(true);
                  }}
                  onFocus={() => setMostrarClientes(true)}
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

                {/* Dropdown */}
                {mostrarClientes && (

                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#07111f] border border-white/5 rounded-2xl overflow-hidden max-h-60 overflow-y-auto z-50">

                    {clientesFiltrados.map((cliente) => (

                      <button
                        key={cliente.id}
                        onClick={() => {
                          setClienteSeleccionado(cliente.id);
                          setBusquedaCliente(cliente.nombre);
                          setMostrarClientes(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 transition border-b border-white/5"
                      >
                        {cliente.nombre}
                      </button>

                    ))}

                  </div>

                )}

              </div>

              {/* Fecha */}
              <div>

                <label className="text-zinc-500 text-sm">
                  Fecha
                </label>

                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

              </div>

            </div>
            {/* Productos */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden mb-8">

              {/* Head */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

                <div>Producto</div>
                <div>Variante</div>
                <div>Color</div>
                <div>Cantidad</div>
                <div>Unidad</div>
                <div>Precio</div>
                <div>Total</div>

                <div className="text-right">
                  Acción
                </div>

              </div>

              {/* Items dinámicos */}
              {items.map((item) => (

                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-6 px-6 py-5 border-b border-white/5"
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

                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) =>
                        actualizarCantidad(
                          item.id,
                          Number(e.target.value)
                        )
                      }
                      className="w-24 bg-[#0b1727] border border-white/5 rounded-xl px-3 py-2 outline-none"
                    />

                  </div>

                  <div>

                    <select
                      value={item.unidad}
                      onChange={(e) =>
                        actualizarUnidad(
                          item.id,
                          e.target.value
                        )
                      }
                      className="bg-[#0b1727] border border-white/5 rounded-xl px-3 py-2 outline-none"
                    >

                      <option>
                        m²
                      </option>

                      <option>
                        und
                      </option>

                      <option>
                        litros
                      </option>

                      <option>
                        metro lineal
                      </option>

                    </select>

                  </div>

                  <div>
                    ${item.precio}
                  </div>

                  <div>
                    ${item.total}
                  </div>

                  <div className="text-right">

                    <button
                      onClick={() => quitarProducto(item.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Quitar
                    </button>

                  </div>

                </div>

              ))}

            </div>

            {/* Selector producto */}
            <div className="mb-8 flex gap-4">

              <select
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
                className="flex-1 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              >

                <option value="">
                  Seleccionar producto
                </option>

                {productos.map((item) => (

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.producto} - {item.modelo} - {item.color}
                  </option>

                ))}

              </select>

              <button
                onClick={agregarProducto}
                className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-sm"
              >
                + Agregar producto
              </button>

            </div>

            {/* Extras */}
            <div className="grid grid-cols-3 gap-4 mb-8">

              {/* Transporte */}
              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <label className="text-zinc-500 text-sm">
                  Transporte
                </label>

                <div className="flex gap-2 mt-3">

                  <input
                    type="number"
                    placeholder="$0"
                    value={transporte}
                    onChange={(e) =>
                      setTransporte(e.target.value)
                    }
                    className="w-[160px] bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-2 outline-none"
                  />

                  <button
                    onClick={agregarTransporte}
                    className="bg-white/5 hover:bg-white/10 transition px-2 py-2 rounded-xl border border-white/5 text-sm whitespace-nowrap"
                  >
                    Agregar
                  </button>

                </div>

              </div>

              {/* Descuento */}
              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <label className="text-zinc-500 text-sm">
                  Descuento
                </label>

                <div className="flex gap-2 mt-3">

                  <input
                    type="number"
                    placeholder="$0"
                    value={descuento}
                    onChange={(e) =>
                      setDescuento(e.target.value)
                    }
                    className="w-[160px] bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-2 outline-none"
                  />

                  <button
                    onClick={aplicarDescuento}
                    className="bg-white/5 hover:bg-white/10 transition px-2 py-2 rounded-xl border border-white/5 text-sm whitespace-nowrap"
                  >
                    Aplicar
                  </button>

                </div>

              </div>

              {/* IVA */}
              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <label className="text-zinc-500 text-sm">
                  IVA %
                </label>

                <div className="mt-3">

                  <input
                    type="number"
                    placeholder="0"
                    value={iva}
                    onChange={(e) => setIva(e.target.value)}
                    className="w-[160px] bg-[#0b1727] border border-white/5 rounded-2xl px-4 py-2 outline-none"
                  />

                </div>

              </div>

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
            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-500 text-sm">
                  Total presupuesto
                </p>

                <h3 className="text-4xl font-bold mt-2 text-emerald-400">

                  ${totalFinalConIva}

                </h3>

              </div>

              <div className="flex gap-4">

  {modoEdicion ? (

    <button
      onClick={async () => {

        if (presupuestoSeleccionado) {

  await supabase
    .from("presupuestos")
    .update({
      cliente_id: clienteSeleccionado,
      fecha,
      observaciones,
      estado: estadoPresupuesto,
      total: totalFinalConIva,
    })
    .eq("id", presupuestoSeleccionado.id);

  /* BORRAR ITEMS VIEJOS */
  await supabase
    .from("presupuesto_items")
    .delete()
    .eq("presupuesto_id", presupuestoSeleccionado.id);

  /* INSERTAR NUEVOS */
  const itemsInsertar = items.map((item) => ({
    presupuesto_id: presupuestoSeleccionado.id,
    producto_id: null,

    producto: item.producto,
    modelo: item.modelo,
    color: item.color,

    cantidad: item.cantidad,
    unidad: item.unidad,

    precio: item.precio,
    total: item.total,
  }));

  await supabase
    .from("presupuesto_items")
    .insert(itemsInsertar);

  setModalAbierto(false);

  cargarDatos();

}

      }}
      className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
    >
      Guardar cambios
    </button>

  ) : (

    <>

      <button
        onClick={async () => {

          setEstadoPresupuesto("Borrador");

          await crearPresupuesto();

        }}
        className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
      >
        Guardar borrador
      </button>

      <button
        onClick={async () => {

          setEstadoPresupuesto("Enviado");

          await crearPresupuesto();

        }}
        className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
      >
        Crear presupuesto
      </button>

    </>

  )}

</div>

            </div>

          </div>

        </div>

      )}

      {/* Modal detalle */}
      {detalleAbierto && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X cerrar */}
            <button
              onClick={() => setDetalleAbierto(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                {presupuestoSeleccionado?.numero}
              </h2>

              <p className="text-zinc-500 mt-1">
                Detalle del presupuesto
              </p>

              {/* Estados */}
              <div className="flex gap-2 mt-6">

                <button
                  onClick={() => actualizarEstado("Borrador")}
                  disabled={estadoPresupuesto === "Aceptado"}
                  className={`px-3 py-3 rounded-xl text-s ${
                    estadoPresupuesto === "Borrador"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Borrador
                </button>

                <button
                  onClick={() => actualizarEstado("Enviado")}
                  disabled={estadoPresupuesto === "Aceptado"}
                  className={`px-3 py-3 rounded-xl text-s ${
                    estadoPresupuesto === "Enviado"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Enviado
                </button>

                <button
                  onClick={() => actualizarEstado("Aceptado")}
                  className={`px-3 py-3 rounded-xl text-s ${
                    estadoPresupuesto === "Aceptado"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Aceptado
                </button>

                <button
                  onClick={() => actualizarEstado("Rechazado")}
                  disabled={estadoPresupuesto === "Aceptado"}
                  className={`px-3 py-3 rounded-xl text-s ${
                    estadoPresupuesto === "Rechazado"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  Rechazado
                </button>

              </div>

            </div>

            {/* Productos */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden mb-6">

              <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

                <div>Producto</div>
                <div>Variante</div>
                <div>Color</div>
                <div>Cantidad</div>
                <div>Total</div>

              </div>

              {presupuestoItems.map((item) => (

                <div
                  key={item.id}
                  className="grid grid-cols-5 px-6 py-5 border-b border-white/5"
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
                    {item.cantidad} {item.unidad}
                  </div>

                  <div>
                    ${item.total}
                  </div>

                </div>

              ))}

            </div>

            {/* Extras */}
            <div className="grid grid-cols-4 gap-4 mb-6">

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <p className="text-zinc-500 text-sm">
                  Transporte
                </p>

                <h3 className="text-xl font-bold mt-2">
                  ${
                    presupuestoItems
                      .filter((item) => item.producto === "ENVIO")
                      .reduce((acc, item) => acc + item.total, 0)
                  }
                </h3>

              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <p className="text-zinc-500 text-sm">
                  Descuento
                </p>

                <h3 className="text-xl font-bold mt-2">
                  ${
                    Math.abs(
                      presupuestoItems
                        .filter((item) => item.producto === "DESCUENTO")
                        .reduce((acc, item) => acc + item.total, 0)
                    )
                  }
                </h3>

              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <p className="text-zinc-500 text-sm">
                  IVA
                </p>

                <h3 className="text-xl font-bold mt-2">
                  {iva || 0}%
                </h3>

              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-3xl p-4">

                <p className="text-zinc-500 text-sm">
                  Total presupuesto
                </p>

                <h3 className="text-xl font-bold mt-2 text-emerald-400">
                  ${presupuestoSeleccionado?.total}
                </h3>

              </div>

            </div>

            {/* Observaciones */}
            <div className="bg-[#07111f] border border-white/5 rounded-3xl p-6">

              <h3 className="text-xl font-semibold mb-4">
                Observaciones
              </h3>

              <p className="text-zinc-300">
                {presupuestoSeleccionado?.observaciones || "Sin observaciones"}
              </p>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8">

              <button
                onClick={editarPresupuesto}
                className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-xl border border-white/5 text-s"
              >
                Editar presupuesto
              </button>

              <button
  onClick={() => {

    generarPDFPresupuesto({

      numero: presupuestoSeleccionado?.numero,

      fecha: presupuestoSeleccionado?.fecha,

      cliente: busquedaCliente || "Cliente",

      telefono:
  clientes.find(
    (c) => c.id === presupuestoSeleccionado?.cliente_id
  )?.telefono || "",

      direccion:
  clientes.find(
    (c) => c.id === presupuestoSeleccionado?.cliente_id
  )?.direccion || "",

      items: presupuestoItems,

      transporte:
        presupuestoItems
          .filter((item) => item.producto === "ENVIO")
          .reduce((acc, item) => acc + item.total, 0),

      descuento:
        Math.abs(
          presupuestoItems
            .filter((item) => item.producto === "DESCUENTO")
            .reduce((acc, item) => acc + item.total, 0)
        ),

      iva: iva || 0,

      total: presupuestoSeleccionado?.total,

      observaciones:
        presupuestoSeleccionado?.observaciones || "",

    });

  }}
  className="bg-white/5 hover:bg-white/10 transition px-4 py-2 rounded-xl border border-white/5 text-s"
>
  Descargar PDF
</button>

              {estadoPresupuesto === "Aceptado" && (

                <button
  onClick={crearPedido}
  className="bg-emerald-500 hover:bg-emerald-400 transition px-4 py-2 rounded-xl font-medium text-s"
>
  Crear pedido
</button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}