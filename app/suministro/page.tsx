"use client";

import BackButton from "@/components/BackButton";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SuministroPage() {

const router = useRouter();

const [materiales, setMateriales] = useState<any[]>([]);

const [modalNuevo, setModalNuevo] = useState(false);

const [modalCompra, setModalCompra] = useState(false);
const [compraEditando, setCompraEditando] = useState<any>(null);

const [suministroCompra, setSuministroCompra] = useState("");

const [cantidadCompra, setCantidadCompra] = useState("");

const [proveedorCompra, setProveedorCompra] = useState("");

const [montoTotal, setMontoTotal] = useState("");

const [montoAbonado, setMontoAbonado] = useState("");

const [observacionCompra, setObservacionCompra] = useState("");

const [fechaCompra, setFechaCompra] = useState(
  new Date().toISOString().split("T")[0]
);

const [editandoId, setEditandoId] = useState<string | null>(null);

const [nombre, setNombre] = useState("");
const [unidad, setUnidad] = useState("");

const [stockActual, setStockActual] = useState("");
const [stockMinimo, setStockMinimo] = useState("");
const [stockIdeal, setStockIdeal] = useState("");

const [compras, setCompras] = useState<any[]>([]);
const [proveedores, setProveedores] = useState<any[]>([]);

function formatearCantidad(value: number | string) {
  return Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function limpiarFormularioCompra() {
  setCompraEditando(null);
  setSuministroCompra("");
  setCantidadCompra("");
  setProveedorCompra("");
  setMontoTotal("");
  setMontoAbonado("");
  setObservacionCompra("");
  setFechaCompra(new Date().toISOString().split("T")[0]);
}

function cerrarModalCompra() {
  setModalCompra(false);
  limpiarFormularioCompra();
}

function abrirNuevaCompra() {
  limpiarFormularioCompra();
  setModalCompra(true);
}

function abrirEditarCompra(compra: any) {
  setCompraEditando(compra);
  setSuministroCompra(compra.suministro_id || "");
  setCantidadCompra(String(compra.cantidad || ""));
  setProveedorCompra(compra.proveedor || "");
  setMontoTotal(String(compra.monto_total || ""));
  setMontoAbonado(String(compra.monto_abonado || ""));
  setObservacionCompra(compra.observacion || "");
  setFechaCompra(
    compra.created_at
      ? new Date(compra.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  setModalCompra(true);
}

async function cargarSuministros() {

  const { data, error } = await supabase
    .from("suministros")
    .select("*")
    .order("nombre");

  if (error || !data) return;

  const materialesFormateados = data.map((item) => {

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

    }

    return {

      id: item.id,

      nombre: item.nombre,
      unidad: item.unidad,

      stock: item.stock_actual,
      minimo: item.stock_minimo,
      objetivo: item.stock_ideal,

      estado,

    };

  });

  setMateriales(materialesFormateados);

}

async function cargarCompras() {

  const { data, error } = await supabase
    .from("movimientos_suministro")
    .select(`
      *,
      suministros (
        nombre,
        unidad
      )
    `)
    .order(
  "created_at",
  { ascending: false }
)
.limit(5);
  if (error || !data) return;

  setCompras(data);

}

async function cargarProveedores() {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id,nombre,materia_prima")
    .order("nombre", { ascending: true });

  if (error) {
    console.log(error);
    return;
  }

  setProveedores(data || []);
}

async function guardarSuministro() {

  if (editandoId) {

  const { error } = await supabase
    .from("suministros")
    .update({
      nombre,
      unidad,
      stock_actual: Number(stockActual || 0),
      stock_minimo: Number(stockMinimo || 0),
      stock_ideal: Number(stockIdeal || 0),
      updated_at: new Date(),
    })
    .eq("id", editandoId);

  if (error) {

    console.log(error);

    return;

  }

} else {

  const { error } = await supabase
    .from("suministros")
    .insert({
      nombre,
      unidad,
      stock_actual: Number(stockActual || 0),
      stock_minimo: Number(stockMinimo || 0),
      stock_ideal: Number(stockIdeal || 0),
      updated_at: new Date(),
    });

  if (error) {

    console.log(error);

    return;

  }

}

  setNombre("");
  setUnidad("");

  setStockActual("");
  setStockMinimo("");
  setStockIdeal("");
  setEditandoId(null);

  setModalNuevo(false);

  cargarSuministros();

}

async function guardarCompra() {

  if (
    !suministroCompra ||
    !cantidadCompra ||
    !montoTotal
  ) {

    alert("Completar campos obligatorios");

    return;

  }

  const material = materiales.find(
    (item) =>
      item.id === suministroCompra
  );

  if (!material) return;

  if (compraEditando) {
    const materialOriginal = materiales.find(
      (item) => item.id === compraEditando.suministro_id
    );
    const cantidadAnterior = Number(compraEditando.cantidad || 0);
    const cantidadNueva = Number(cantidadCompra || 0);

    if (materialOriginal && materialOriginal.id !== suministroCompra) {
      await supabase
        .from("suministros")
        .update({
          stock_actual: Number(materialOriginal.stock) - cantidadAnterior,
          updated_at: new Date(),
        })
        .eq("id", materialOriginal.id);

      await supabase
        .from("suministros")
        .update({
          stock_actual: Number(material.stock) + cantidadNueva,
          updated_at: new Date(),
        })
        .eq("id", suministroCompra);
    } else {
      const diferencia = cantidadNueva - cantidadAnterior;

      await supabase
        .from("suministros")
        .update({
          stock_actual: Number(material.stock) + diferencia,
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
        monto_total: Number(montoTotal),
        monto_abonado: Number(montoAbonado || 0),
        observacion: observacionCompra,
      })
      .eq("id", compraEditando.id);

    if (error) {
      alert("No se pudo editar la compra.");
      return;
    }

    await supabase
      .from("movimientos_economia")
      .update({
        concepto: `Compra de ${material.nombre}`,
        monto: Number(montoTotal),
        detalle: proveedorCompra || observacionCompra,
        fecha: fechaCompra,
        monto_total: Number(montoTotal),
        monto_abonado: Number(montoAbonado || 0),
        saldo_pendiente:
          Number(montoTotal) -
          Number(montoAbonado || 0),
      })
      .eq(
        "concepto",
        `Compra de ${
          compraEditando.suministros?.nombre || material.nombre
        }`
      )
      .eq("monto_total", Number(compraEditando.monto_total || 0))
      .eq(
        "monto_abonado",
        Number(compraEditando.monto_abonado || 0)
      );

    cerrarModalCompra();
    cargarSuministros();
    cargarCompras();
    return;
  }

  const nuevoStock =
    Number(material.stock) +
    Number(cantidadCompra);

  await supabase
    .from("suministros")
    .update({
      stock_actual: nuevoStock,
      updated_at: new Date(),
    })
    .eq("id", suministroCompra);

  await supabase
    .from("movimientos_suministro")
    .insert([
      {
        suministro_id:
          suministroCompra,

        tipo: "Compra",

        cantidad:
          Number(cantidadCompra),

        proveedor:
          proveedorCompra,

        monto_total:
          Number(montoTotal),

        monto_abonado:
          Number(montoAbonado || 0),

        observacion:
          observacionCompra,
      },
    ]);

    await supabase
  .from("movimientos_economia")
  .insert([
    {
      tipo: "Gasto",

      concepto:
        `Compra de ${material.nombre}`,

      monto:
        Number(montoTotal),

      detalle:
        proveedorCompra ||
        observacionCompra,

      fecha:
        fechaCompra,

      monto_total:
        Number(montoTotal),

      monto_abonado:
        Number(montoAbonado || 0),

      saldo_pendiente:
        Number(montoTotal) -
        Number(montoAbonado || 0),
    },
  ]);

  cerrarModalCompra();

  cargarSuministros();
  cargarCompras();

}
  useEffect(() => {

  cargarSuministros();

  cargarCompras();

  cargarProveedores();

}, []);

  return (

    <>

      <BackButton />

      <div className="min-h-screen overflow-y-auto pb-24">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-white">
              Suministro
            </h1>

            <p className="text-zinc-500 mt-1">
              Control de materias primas y compras
            </p>

          </div>

<div className="flex justify-end gap-4">
          <button
  onClick={() => setModalNuevo(true)}
  className="bg-blue-500 hover:bg-blue-400 transition px-2 py-3 rounded-2xl text-black font-semibold"
>
  Nuevo suministro
</button>

<button
  onClick={() =>
    router.push("/suministro/historial")
  }
  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
>
  Historial compras
</button>

<button
  onClick={abrirNuevaCompra}
  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
>
  Registrar compra
</button>

</div>

        </div>

        {/* Stock materiales */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mb-10">

          <div className="px-6 py-5 border-b border-white/5">

            <h2 className="text-2xl font-semibold text-white">
              Stock materias primas
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Control general de materiales
            </p>

          </div>

          {/* Desktop */}
          <div className="hidden md:block">

            <div className="grid grid-cols-7 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

              <div>Material</div>
              <div>Unidad</div>
              <div>Stock</div>
              <div>Mínimo</div>
              <div>Objetivo</div>
              <div>Estado</div>
              <div>Acciones</div>

            </div>

            {materiales.map((material) => (

              <div
                key={material.id}
                className="grid grid-cols-7 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
              >

                <div className="text-white">
                  {material.nombre}
                </div>

                <div className="text-white">
                  {material.unidad}
                </div>

                <div className="text-white">
                  {formatearCantidad(material.stock)}
                </div>

                <div className="text-white">
                  {formatearCantidad(material.minimo)}
                </div>

                <div className="text-white">
                  {formatearCantidad(material.objetivo)}
                </div>

                <div>

                  {material.estado === "Óptimo" && (
                    <span className="text-emerald-400">
                      Óptimo
                    </span>
                  )}

                  {material.estado === "Bajo" && (
                    <span className="text-yellow-400">
                      Bajo
                    </span>
                  )}

                  {material.estado === "Crítico" && (
                    <span className="text-red-400">
                      Crítico
                    </span>
                  )}

                </div>

<div>

  <button
    onClick={() => {

      setEditandoId(material.id);

      setNombre(material.nombre);

      setUnidad(material.unidad);

      setStockActual(
        String(material.stock)
      );

      setStockMinimo(
        String(material.minimo)
      );

      setStockIdeal(
        String(material.objetivo)
      );

      setModalNuevo(true);

    }}
    className="text-cyan-400 hover:text-cyan-300"
  >

    ✏️ Editar

  </button>

</div>

              </div>
              

            ))}

          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4 p-4">

            {materiales.map((material) => (

              <div
                key={material.id}
                className="bg-[#07111f] border border-white/5 rounded-3xl p-5"
              >

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-lg font-semibold text-white">
                    {material.nombre}
                  </h3>

                  <div>

                    {material.estado === "Óptimo" && (
                      <span className="text-emerald-400 text-sm">
                        Óptimo
                      </span>
                    )}

                    {material.estado === "Bajo" && (
                      <span className="text-yellow-400 text-sm">
                        Bajo
                      </span>
                    )}

                    {material.estado === "Crítico" && (
                      <span className="text-red-400 text-sm">
                        Crítico
                      </span>
                    )}

                  </div>

                  <div>

  <button
    onClick={() => {

      setEditandoId(material.id);

      setNombre(material.nombre);

      setUnidad(material.unidad);

      setStockActual(
        String(material.stock)
      );

      setStockMinimo(
        String(material.minimo)
      );

      setStockIdeal(
        String(material.objetivo)
      );

      setModalNuevo(true);

    }}
    className="text-cyan-400 hover:text-cyan-300"
  >

    ✏️ Editar

  </button>

</div>

                </div>

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between text-white">
                    <span>Unidad</span>
                    <span>{material.unidad}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Stock actual</span>
                    <span>{formatearCantidad(material.stock)}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Mínimo</span>
                    <span>{formatearCantidad(material.minimo)}</span>
                  </div>

                  <div className="flex justify-between text-white">
                    <span>Objetivo</span>
                    <span>{formatearCantidad(material.objetivo)}</span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* Movimientos */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mt-8">

  <div className="px-6 py-5 border-b border-white/5">

    <h2 className="text-2xl font-semibold text-white">
      Últimas compras
    </h2>

  </div>

  <div className="hidden md:block">

    <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

      <div>Fecha</div>
      <div>Material</div>
      <div>Cantidad</div>
      <div>Proveedor</div>
      <div>Total</div>
      <div className="text-right">Acciones</div>

    </div>

    {compras.map((item) => (

      <div
        key={item.id}
        className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
      >

        <div className="text-white">

          {new Date(
            item.created_at
          ).toLocaleDateString("es-AR")}

        </div>

        <div className="text-white">

          {item.suministros?.nombre}

        </div>

        <div className="text-white">

          {item.cantidad}

        </div>

        <div className="text-white">

          {item.proveedor || "-"}

        </div>

        <div className="text-white">

          $
          {Number(
            item.monto_total || 0
          ).toLocaleString("es-AR")}

        </div>

        <div className="text-right">

          <button
            onClick={() => abrirEditarCompra(item)}
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            Editar
          </button>

        </div>

      </div>

    ))}

  </div>

</div>

          {/* Mobile */}
          <div className="md:hidden space-y-4 p-4">

            {compras.map((item) => (

              <div
                key={item.id}
                className="bg-[#07111f] border border-white/5 rounded-3xl p-5"
              >

                <div className="flex items-center justify-between mb-3">

                  <span className="text-zinc-500 text-sm">
                    {new Date(
                      item.created_at
                    ).toLocaleDateString("es-AR")}
                  </span>

                  <div>

                    <span className="text-emerald-400 text-sm">
                      Compra
                    </span>

                  </div>

                </div>

                <h3 className="text-lg text-white mb-4">
                  {item.suministros?.nombre}
                </h3>

                <div className="space-y-2 text-sm text-white">

                  <div className="flex justify-between">
                    <span>Cantidad</span>
                    <span>{formatearCantidad(item.cantidad)}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Detalle</span>
                    <span className="text-right">
                      {item.proveedor || item.observacion || "-"}
                    </span>
                  </div>

                  <button
                    onClick={() => abrirEditarCompra(item)}
                    className="w-full mt-4 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black transition px-4 py-3 rounded-2xl border border-cyan-500/20 font-semibold"
                  >
                    Editar compra
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>


      {/* Modal nuevo suministro */}

      {modalNuevo && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl">

      <div className="p-6 border-b border-white/5">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Nuevo suministro
          </h2>

          <button
            onClick={() => setModalNuevo(false)}
            className="text-zinc-400 hover:text-white text-3xl"
          >
            ×
          </button>

        </div>

      </div>

      <div className="p-6 space-y-5">
        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Nombre
          </label>

          <input
            value={nombre}
            onChange={(e) =>
              setNombre(e.target.value)
            }
            placeholder="Ej: Piedra"
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          />

        </div>

        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Unidad
          </label>

          <input
            value={unidad}
            onChange={(e) =>
              setUnidad(e.target.value)
            }
            placeholder="Ej: kg, bolsas, m3"
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock actual
            </label>

            <input
              type="number"
              value={stockActual}
              onChange={(e) =>
                setStockActual(e.target.value)
              }
              placeholder="Ej: 21400"
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Stock minimo
            </label>

            <input
              type="number"
              value={stockMinimo}
              onChange={(e) =>
                setStockMinimo(e.target.value)
              }
              placeholder="Ej: 5000"
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
                setStockIdeal(e.target.value)
              }
              placeholder="Ej: 30000"
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

        </div>

        <div className="flex justify-end gap-4">

          <button
            onClick={() =>
              setModalNuevo(false)
            }
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
          >
            Cancelar
          </button>

          <button
            onClick={guardarSuministro}
            className="bg-blue-500 hover:bg-blue-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
          >
            Guardar
          </button>

        </div>

      </div>

    </div>

  </div>

)}

{/* Modal nueva compra */}

{modalCompra && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

      <div className="p-6 border-b border-white/5">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            {compraEditando ? "Editar compra" : "Registrar compra"}
          </h2>

          <button
            onClick={cerrarModalCompra}
            className="text-zinc-400 hover:text-white text-3xl"
          >
            ×
          </button>

        </div>

      </div>

      <div className="p-6 space-y-5 overflow-y-auto sidebar-scroll">

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Fecha
            </label>

            <input
              type="date"
              value={fechaCompra}
              onChange={(e) =>
                setFechaCompra(e.target.value)
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Materia prima
            </label>

            <select
              value={suministroCompra}
              onChange={(e) =>
                setSuministroCompra(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            >

              <option value="">
                Seleccionar
              </option>

              {materiales.map((item) => (

                <option
                  key={item.id}
                  value={item.id}
                >

                  {item.nombre}

                </option>

              ))}

            </select>

          </div>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Cantidad
            </label>

            <input
              type="number"
              value={cantidadCompra}
              onChange={(e) =>
                setCantidadCompra(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Proveedor
            </label>

            <select
              value={proveedorCompra}
              onChange={(e) =>
                setProveedorCompra(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            >
              <option value="">Seleccionar proveedor</option>
              {proveedorCompra &&
                !proveedores.some(
                  (proveedor) => proveedor.nombre === proveedorCompra
                ) && (
                  <option value={proveedorCompra}>{proveedorCompra}</option>
                )}
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

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Monto total
            </label>

            <input
              type="number"
              value={montoTotal}
              onChange={(e) =>
                setMontoTotal(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="text-sm text-zinc-400 block mb-2">
              Monto abonado
            </label>

            <input
              type="number"
              value={montoAbonado}
              onChange={(e) =>
                setMontoAbonado(
                  e.target.value
                )
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
            />

          </div>

        </div>

        <div>

          <label className="text-sm text-zinc-400 block mb-2">
            Observación
          </label>

          <textarea
            value={observacionCompra}
            onChange={(e) =>
              setObservacionCompra(
                e.target.value
              )
            }
            rows={3}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
          />

        </div>

        <div className="flex justify-end gap-4">

          <button
            onClick={cerrarModalCompra}
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
          >

            Cancelar

          </button>

          <button
            onClick={guardarCompra}
            className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
          >

            {compraEditando ? "Guardar cambios" : "Guardar compra"}

          </button>

        </div>

      </div>

    </div>

  </div>

)}

    </>

  );

}
