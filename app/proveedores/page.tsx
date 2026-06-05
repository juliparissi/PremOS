"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../lib/supabase";

type Proveedor = {
  id: string;
  nombre: string;
  materia_prima?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  observaciones?: string;
};

type CompraProveedor = {
  id: string;
  suministro_id?: string | null;
  proveedor?: string | null;
  cantidad?: number | null;
  monto_total?: number | null;
  monto_abonado?: number | null;
  observacion?: string | null;
  created_at?: string | null;
  suministros?: {
    nombre?: string | null;
    unidad?: string | null;
  } | null;
};

const proveedorVacio = {
  nombre: "",
  materia_prima: "",
  telefono: "",
  mail: "",
  cuit: "",
  observaciones: "",
};

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<CompraProveedor[]>([]);
  const [suministros, setSuministros] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] =
    useState<Proveedor | null>(null);
  const [proveedorEditando, setProveedorEditando] =
    useState<Proveedor | null>(null);
  const [compraEditando, setCompraEditando] =
    useState<CompraProveedor | null>(null);
  const [suministroCompra, setSuministroCompra] = useState("");
  const [cantidadCompra, setCantidadCompra] = useState("");
  const [proveedorCompra, setProveedorCompra] = useState("");
  const [montoTotalCompra, setMontoTotalCompra] = useState("");
  const [montoAbonadoCompra, setMontoAbonadoCompra] = useState("");
  const [observacionCompra, setObservacionCompra] = useState("");
  const [form, setForm] = useState(proveedorVacio);
  const [guardando, setGuardando] = useState(false);
  const [guardandoCompra, setGuardandoCompra] = useState(false);

  useEffect(() => {
    cargarProveedores();
    cargarCompras();
    cargarSuministros();
  }, []);

  async function cargarProveedores() {
    const { data } = await supabase
      .from("proveedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (data) {
      setProveedores(data as Proveedor[]);
    }
  }

  async function cargarCompras() {
    const { data } = await supabase
      .from("movimientos_suministro")
      .select(
        `
        id,
        suministro_id,
        proveedor,
        cantidad,
        monto_total,
        monto_abonado,
        observacion,
        created_at,
        suministros (
          nombre,
          unidad
        )
      `
      )
      .order("created_at", { ascending: false });

    if (data) {
      setCompras(data as CompraProveedor[]);
    }
  }

  async function cargarSuministros() {
    const { data } = await supabase
      .from("suministros")
      .select("*")
      .order("nombre", { ascending: true });

    if (data) {
      setSuministros(data);
    }
  }

  function abrirNuevo() {
    setProveedorEditando(null);
    setForm(proveedorVacio);
    setModalAbierto(true);
  }

  function abrirEdicion(proveedor: Proveedor) {
    setProveedorEditando(proveedor);
    setForm({
      nombre: proveedor.nombre || "",
      materia_prima: proveedor.materia_prima || "",
      telefono: proveedor.telefono || "",
      mail: proveedor.mail || "",
      cuit: proveedor.cuit || "",
      observaciones: proveedor.observaciones || "",
    });
    setModalAbierto(true);
  }

  async function guardarProveedor() {
    if (!form.nombre.trim()) {
      alert("Ingresá el nombre del proveedor.");
      return;
    }

    setGuardando(true);

    const payload = {
      nombre: form.nombre.trim(),
      materia_prima: form.materia_prima.trim(),
      telefono: form.telefono.trim(),
      mail: form.mail.trim(),
      cuit: form.cuit.trim(),
      observaciones: form.observaciones.trim(),
    };

    const { error } = proveedorEditando
      ? await supabase
          .from("proveedores")
          .update(payload)
          .eq("id", proveedorEditando.id)
      : await supabase.from("proveedores").insert([payload]);

    setGuardando(false);

    if (error) {
      alert("No se pudo guardar el proveedor.");
      return;
    }

    setModalAbierto(false);
    setProveedorEditando(null);
    setForm(proveedorVacio);
    cargarProveedores();
  }

  async function eliminarProveedor(proveedor: Proveedor) {
    const confirma = confirm(
      `¿Eliminar proveedor ${proveedor.nombre}?`
    );

    if (!confirma) return;

    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", proveedor.id);

    if (error) {
      alert("No se pudo eliminar el proveedor.");
      return;
    }

    cargarProveedores();
  }

  function abrirEditarCompra(compra: CompraProveedor) {
    setCompraEditando(compra);
    setSuministroCompra(compra.suministro_id || "");
    setCantidadCompra(String(compra.cantidad || ""));
    setProveedorCompra(compra.proveedor || proveedorDetalle?.nombre || "");
    setMontoTotalCompra(String(compra.monto_total || ""));
    setMontoAbonadoCompra(String(compra.monto_abonado || ""));
    setObservacionCompra(compra.observacion || "");
  }

  function cerrarEditarCompra() {
    setCompraEditando(null);
    setSuministroCompra("");
    setCantidadCompra("");
    setProveedorCompra("");
    setMontoTotalCompra("");
    setMontoAbonadoCompra("");
    setObservacionCompra("");
    setGuardandoCompra(false);
  }

  async function obtenerMovimientoEconomiaCompra(compra: CompraProveedor) {
    const concepto = `Compra de ${compra.suministros?.nombre || "Compra"}`;
    const detalle = compra.proveedor || compra.observacion || "";

    let consulta = supabase
      .from("movimientos_economia")
      .select("id")
      .eq("tipo", "Gasto")
      .eq("concepto", concepto)
      .eq("monto_total", Number(compra.monto_total || 0))
      .eq("monto_abonado", Number(compra.monto_abonado || 0))
      .order("created_at", { ascending: false })
      .limit(1);

    if (detalle) {
      consulta = consulta.eq("detalle", detalle);
    }

    const { data } = await consulta;
    return data?.[0]?.id || null;
  }

  async function guardarCompraProveedor() {
    if (
      !compraEditando ||
      !suministroCompra ||
      !cantidadCompra ||
      !montoTotalCompra
    ) {
      alert("Completar material, cantidad y monto total.");
      return;
    }

    const materialNuevo = suministros.find(
      (item) => item.id === suministroCompra
    );
    const materialOriginal = suministros.find(
      (item) => item.id === compraEditando.suministro_id
    );

    if (!materialNuevo) {
      alert("No se encontro la materia prima seleccionada.");
      return;
    }

    setGuardandoCompra(true);

    const cantidadAnterior = Number(compraEditando.cantidad || 0);
    const cantidadNueva = Number(cantidadCompra || 0);
    const totalNuevo = Number(montoTotalCompra || 0);
    const abonadoNuevo = Number(montoAbonadoCompra || 0);
    const saldoNuevo = Math.max(totalNuevo - abonadoNuevo, 0);
    const movimientoEconomiaId = await obtenerMovimientoEconomiaCompra(
      compraEditando
    );

    if (materialOriginal && materialOriginal.id !== suministroCompra) {
      await supabase
        .from("suministros")
        .update({
          stock_actual:
            Number(materialOriginal.stock_actual || 0) - cantidadAnterior,
          updated_at: new Date(),
        })
        .eq("id", materialOriginal.id);

      await supabase
        .from("suministros")
        .update({
          stock_actual: Number(materialNuevo.stock_actual || 0) + cantidadNueva,
          updated_at: new Date(),
        })
        .eq("id", suministroCompra);
    } else {
      await supabase
        .from("suministros")
        .update({
          stock_actual:
            Number(materialNuevo.stock_actual || 0) +
            cantidadNueva -
            cantidadAnterior,
          updated_at: new Date(),
        })
        .eq("id", suministroCompra);
    }

    const { error } = await supabase
      .from("movimientos_suministro")
      .update({
        suministro_id: suministroCompra,
        cantidad: cantidadNueva,
        proveedor: proveedorCompra,
        monto_total: totalNuevo,
        monto_abonado: abonadoNuevo,
        observacion: observacionCompra,
      })
      .eq("id", compraEditando.id);

    if (error) {
      setGuardandoCompra(false);
      alert("No se pudo editar la compra.");
      return;
    }

    if (movimientoEconomiaId) {
      await supabase
        .from("movimientos_economia")
        .update({
          concepto: `Compra de ${materialNuevo.nombre}`,
          monto: totalNuevo,
          detalle: proveedorCompra || observacionCompra,
          monto_total: totalNuevo,
          monto_abonado: abonadoNuevo,
          saldo_pendiente: saldoNuevo,
        })
        .eq("id", movimientoEconomiaId);
    }

    await cargarSuministros();
    await cargarCompras();
    cerrarEditarCompra();
  }

  async function eliminarCompraProveedor(compra: CompraProveedor) {
    const confirma = confirm(
      "Eliminar esta compra? Tambien se quitara de Economia y se ajustara el stock."
    );

    if (!confirma) return;

    const material = suministros.find((item) => item.id === compra.suministro_id);
    const movimientoEconomiaId = await obtenerMovimientoEconomiaCompra(compra);

    if (material) {
      await supabase
        .from("suministros")
        .update({
          stock_actual:
            Number(material.stock_actual || 0) - Number(compra.cantidad || 0),
          updated_at: new Date(),
        })
        .eq("id", material.id);
    }

    const { error } = await supabase
      .from("movimientos_suministro")
      .delete()
      .eq("id", compra.id);

    if (error) {
      alert("No se pudo eliminar la compra.");
      return;
    }

    if (movimientoEconomiaId) {
      await supabase
        .from("movimientos_economia_abonos")
        .delete()
        .eq("movimiento_id", movimientoEconomiaId);

      await supabase
        .from("movimientos_economia")
        .delete()
        .eq("id", movimientoEconomiaId);
    }

    await cargarSuministros();
    await cargarCompras();
  }

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const texto = `${proveedor.nombre || ""} ${
      proveedor.materia_prima || ""
    } ${proveedor.telefono || ""} ${proveedor.mail || ""} ${
      proveedor.cuit || ""
    }`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  function resumenProveedor(nombre: string) {
    const comprasProveedor = comprasProveedorDe(nombre);

    const totalComprado = comprasProveedor.reduce(
      (total, compra) => total + Number(compra.monto_total || 0),
      0
    );
    const totalAbonado = comprasProveedor.reduce(
      (total, compra) => total + Number(compra.monto_abonado || 0),
      0
    );

    return {
      compras: comprasProveedor.length,
      totalComprado,
      saldoPendiente: Math.max(totalComprado - totalAbonado, 0),
    };
  }

  function comprasProveedorDe(nombre: string) {
    return compras.filter(
      (compra) => (compra.proveedor || "").trim() === nombre
    );
  }

  function formatearDinero(value: number) {
    return value.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  }

  return (
    <div>
      <BackButton
        href="/resumen"
        label="Volver"
        showDesktop
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Proveedores
          </h1>

          <p className="text-zinc-500 mt-1">
            Alta y gestión de proveedores
          </p>
        </div>

        <button
          onClick={abrirNuevo}
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium text-black"
        >
          Alta proveedor
        </button>
      </div>

      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
        />
      </div>

      <div className="hidden md:block bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
          <div>Proveedor</div>
          <div>Materia prima</div>
          <div>Teléfono</div>
          <div>Compras</div>
          <div className="text-right">Acciones</div>
        </div>

        {proveedoresFiltrados.map((proveedor) => (
          <div
            key={proveedor.id}
            className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition text-white"
          >
            <div className="font-medium">{proveedor.nombre}</div>
            <div>{proveedor.materia_prima || "-"}</div>
            <div>{proveedor.telefono || "-"}</div>
            <div>{resumenProveedor(proveedor.nombre).compras}</div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProveedorDetalle(proveedor)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Ver mas
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-4">
        {proveedoresFiltrados.map((proveedor) => (
          <div
            key={proveedor.id}
            className="bg-[#0b1727] border border-white/5 rounded-3xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {proveedor.nombre}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {proveedor.materia_prima || "Sin materia prima"}
                </p>
              </div>

              <button
                onClick={() => setProveedorDetalle(proveedor)}
                className="text-cyan-400"
              >
                Ver mas
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4 text-sm text-zinc-300">
              <p>{proveedor.telefono || "Sin teléfono"}</p>
              <p>Compras: {resumenProveedor(proveedor.nombre).compras}</p>
            </div>
          </div>
        ))}
      </div>

      {proveedorDetalle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-5 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setProveedorDetalle(null)}
              className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            <div className="mb-6 pr-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {proveedorDetalle.nombre}
              </h2>
              <p className="text-zinc-500 mt-1">
                Ficha del proveedor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <InfoCard label="Materia prima" value={proveedorDetalle.materia_prima || "-"} />
              <InfoCard label="Telefono" value={proveedorDetalle.telefono || "-"} />
              <InfoCard label="Mail" value={proveedorDetalle.mail || "-"} />
              <InfoCard label="CUIT" value={proveedorDetalle.cuit || "-"} />
              <InfoCard
                label="Compras"
                value={String(resumenProveedor(proveedorDetalle.nombre).compras)}
              />
              <InfoCard
                label="Total comprado"
                value={formatearDinero(
                  resumenProveedor(proveedorDetalle.nombre).totalComprado
                )}
              />
              <InfoCard
                label="Saldo pendiente"
                value={formatearDinero(
                  resumenProveedor(proveedorDetalle.nombre).saldoPendiente
                )}
                accent={
                  resumenProveedor(proveedorDetalle.nombre).saldoPendiente > 0
                    ? "amber"
                    : "emerald"
                }
              />
            </div>

            <div className="bg-[#07111f] border border-white/5 rounded-3xl p-5 mb-6">
              <p className="text-zinc-500 text-sm mb-2">Observaciones</p>
              <p className="text-white">
                {proveedorDetalle.observaciones || "Sin observaciones"}
              </p>
            </div>

            <div className="bg-[#07111f] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">
                  Historial de compras
                </h3>
              </div>

              {comprasProveedorDe(proveedorDetalle.nombre).length === 0 ? (
                <p className="p-5 text-zinc-500">
                  No hay compras registradas para este proveedor.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {comprasProveedorDe(proveedorDetalle.nombre)
                    .slice(0, 10)
                    .map((compra, index) => (
                      <div
                        key={`${compra.created_at || "compra"}-${index}`}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 px-5 py-4 text-sm text-white"
                      >
                        <div>
                          {compra.created_at
                            ? new Date(compra.created_at).toLocaleDateString(
                                "es-AR"
                              )
                            : "-"}
                        </div>
                        <div>
                          {compra.suministros?.nombre || "Compra"}
                        </div>
                        <div>
                          {Number(compra.cantidad || 0).toLocaleString(
                            "es-AR",
                            { maximumFractionDigits: 3 }
                          )}{" "}
                          {compra.suministros?.unidad || ""}
                        </div>
                        <div>{formatearDinero(Number(compra.monto_total || 0))}</div>
                        <div className="text-amber-300">
                          Saldo{" "}
                          {formatearDinero(
                            Math.max(
                              Number(compra.monto_total || 0) -
                                Number(compra.monto_abonado || 0),
                              0
                            )
                          )}
                        </div>
                        <div className="flex justify-start md:justify-end gap-3">
                          <button
                            onClick={() => abrirEditarCompra(compra)}
                            className="text-cyan-400 hover:text-cyan-300 transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarCompraProveedor(compra)}
                            className="text-red-300 hover:text-red-200 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  const proveedor = proveedorDetalle;
                  setProveedorDetalle(null);
                  abrirEdicion(proveedor);
                }}
                className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white transition px-5 py-3 rounded-2xl border border-cyan-500/20"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  const proveedor = proveedorDetalle;
                  setProveedorDetalle(null);
                  eliminarProveedor(proveedor);
                }}
                className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition px-5 py-3 rounded-2xl border border-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-5 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {proveedorEditando ? "Editar proveedor" : "Alta proveedor"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Nombre"
                value={form.nombre}
                onChange={(value) =>
                  setForm((actual) => ({ ...actual, nombre: value }))
                }
              />
              <Field
                label="Materia prima / categoría"
                value={form.materia_prima}
                onChange={(value) =>
                  setForm((actual) => ({
                    ...actual,
                    materia_prima: value,
                  }))
                }
              />
              <Field
                label="Teléfono"
                value={form.telefono}
                onChange={(value) =>
                  setForm((actual) => ({ ...actual, telefono: value }))
                }
              />
              <Field
                label="Mail"
                value={form.mail}
                onChange={(value) =>
                  setForm((actual) => ({ ...actual, mail: value }))
                }
              />
              <Field
                label="CUIT"
                value={form.cuit}
                onChange={(value) =>
                  setForm((actual) => ({ ...actual, cuit: value }))
                }
              />
            </div>

            <div className="mt-5">
              <label className="text-zinc-500 text-sm">
                Observaciones
              </label>
              <textarea
                value={form.observaciones}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    observaciones: e.target.value,
                  }))
                }
                className="w-full min-h-28 mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
              />
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={guardarProveedor}
                disabled={guardando}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium text-black disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {compraEditando && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Editar compra
                </h2>
                <p className="text-zinc-500 mt-1">
                  El cambio tambien actualiza Economia.
                </p>
              </div>

              <button
                onClick={cerrarEditarCompra}
                className="text-zinc-400 hover:text-white text-3xl"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto sidebar-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Materia prima
                  </label>
                  <select
                    value={suministroCompra}
                    onChange={(event) => setSuministroCompra(event.target.value)}
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  >
                    <option value="">Seleccionar</option>
                    {suministros.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
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
                    value={cantidadCompra}
                    onChange={(event) => setCantidadCompra(event.target.value)}
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Proveedor
                  </label>
                  <select
                    value={proveedorCompra}
                    onChange={(event) => setProveedorCompra(event.target.value)}
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedorCompra &&
                      !proveedores.some(
                        (proveedor) => proveedor.nombre === proveedorCompra
                      ) && <option value={proveedorCompra}>{proveedorCompra}</option>}
                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.nombre}>
                        {proveedor.nombre}
                        {proveedor.materia_prima
                          ? ` - ${proveedor.materia_prima}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Monto total
                  </label>
                  <input
                    type="number"
                    value={montoTotalCompra}
                    onChange={(event) => setMontoTotalCompra(event.target.value)}
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Monto abonado
                  </label>
                  <input
                    type="number"
                    value={montoAbonadoCompra}
                    onChange={(event) =>
                      setMontoAbonadoCompra(event.target.value)
                    }
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 block mb-2">
                    Observacion
                  </label>
                  <input
                    value={observacionCompra}
                    onChange={(event) => setObservacionCompra(event.target.value)}
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">Saldo pendiente</p>
                <p className="text-amber-300 text-2xl font-bold mt-2">
                  {formatearDinero(
                    Math.max(
                      Number(montoTotalCompra || 0) -
                        Number(montoAbonadoCompra || 0),
                      0
                    )
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={cerrarEditarCompra}
                  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCompraProveedor}
                  disabled={guardandoCompra}
                  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold disabled:opacity-60"
                >
                  {guardandoCompra ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const color =
    accent === "amber"
      ? "text-amber-300"
      : accent === "emerald"
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="bg-[#07111f] border border-white/5 rounded-2xl p-4">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className={`text-lg font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-zinc-500 text-sm">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
      />
    </div>
  );
}
