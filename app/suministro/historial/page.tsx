"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

const ITEMS_POR_PAGINA = 20;

export default function HistorialComprasPage() {

  const [compras, setCompras] = useState<any[]>([]);
  const [suministros, setSuministros] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalCompras, setTotalCompras] = useState(0);
  const [modalEditar, setModalEditar] = useState(false);
  const [compraEditando, setCompraEditando] = useState<any>(null);
  const [suministroCompra, setSuministroCompra] = useState("");
  const [cantidadCompra, setCantidadCompra] = useState("");
  const [proveedorCompra, setProveedorCompra] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [observacionCompra, setObservacionCompra] = useState("");

  function formatearCantidad(value: number | string) {
    return Number(value || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  async function cargarSuministros() {
    const { data, error } = await supabase
      .from("suministros")
      .select("*")
      .order("nombre");

    if (error) {
      console.log(error);
      return;
    }

    setSuministros(data || []);
  }

  async function cargarCompras() {

    const desde =
      (pagina - 1) * ITEMS_POR_PAGINA;

    const hasta =
      desde + ITEMS_POR_PAGINA - 1;

    const { data, count, error } =
      await supabase
        .from("movimientos_suministro")
        .select(
          `
          *,
          suministros (
            nombre,
            unidad
          )
        `,
          { count: "exact" }
        )
        .order("created_at", {
          ascending: false,
        })
        .range(desde, hasta);

    if (error) {

      console.log(error);

      return;

    }

    setCompras(data || []);
    setTotalCompras(count || 0);

  }

  function cerrarModalEditar() {
    setModalEditar(false);
    setCompraEditando(null);
    setSuministroCompra("");
    setCantidadCompra("");
    setProveedorCompra("");
    setMontoTotal("");
    setMontoAbonado("");
    setObservacionCompra("");
  }

  function abrirEditarCompra(compra: any) {
    setCompraEditando(compra);
    setSuministroCompra(compra.suministro_id || "");
    setCantidadCompra(String(compra.cantidad || ""));
    setProveedorCompra(compra.proveedor || "");
    setMontoTotal(String(compra.monto_total || ""));
    setMontoAbonado(String(compra.monto_abonado || ""));
    setObservacionCompra(compra.observacion || "");
    setModalEditar(true);
  }

  async function guardarEdicionCompra() {
    if (!compraEditando || !suministroCompra || !cantidadCompra || !montoTotal) {
      alert("Completar campos obligatorios");
      return;
    }

    const materialNuevo = suministros.find(
      (item) => item.id === suministroCompra
    );
    const materialOriginal = suministros.find(
      (item) => item.id === compraEditando.suministro_id
    );

    if (!materialNuevo) return;

    const cantidadAnterior = Number(compraEditando.cantidad || 0);
    const cantidadNueva = Number(cantidadCompra || 0);

    if (materialOriginal && materialOriginal.id !== suministroCompra) {
      await supabase
        .from("suministros")
        .update({
          stock_actual:
            Number(materialOriginal.stock_actual || 0) -
            cantidadAnterior,
          updated_at: new Date(),
        })
        .eq("id", materialOriginal.id);

      await supabase
        .from("suministros")
        .update({
          stock_actual:
            Number(materialNuevo.stock_actual || 0) +
            cantidadNueva,
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
        concepto: `Compra de ${materialNuevo.nombre}`,
        monto: Number(montoTotal),
        detalle: proveedorCompra || observacionCompra,
        monto_total: Number(montoTotal),
        monto_abonado: Number(montoAbonado || 0),
        saldo_pendiente:
          Number(montoTotal) -
          Number(montoAbonado || 0),
      })
      .eq(
        "concepto",
        `Compra de ${
          compraEditando.suministros?.nombre || materialNuevo.nombre
        }`
      )
      .eq("monto_total", Number(compraEditando.monto_total || 0))
      .eq(
        "monto_abonado",
        Number(compraEditando.monto_abonado || 0)
      );

    cerrarModalEditar();
    await cargarSuministros();
    await cargarCompras();
  }

  useEffect(() => {

    cargarCompras();
    cargarSuministros();

  }, [pagina]);

  const totalPaginas = Math.ceil(
    totalCompras / ITEMS_POR_PAGINA
  );

  return (

    <div className="space-y-6">
      <BackButton
        href="/suministro"
        label="Volver a suministro"
        showDesktop
      />

      <div>

        <h1 className="text-4xl font-bold text-white">

          Historial de compras

        </h1>

        <p className="text-zinc-500 mt-2">

          Registro completo de compras de materias primas

        </p>

      </div>

      <div className="bg-[#081528] border border-white/5 rounded-3xl overflow-hidden">

        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Material</div>
          <div>Cantidad</div>
          <div>Proveedor</div>
          <div>Total</div>
          <div className="text-right">Acciones</div>

        </div>

        {compras.map((item) => {

          return (

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

                {formatearCantidad(item.cantidad)}

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

          );

        })}

      </div>

      <div className="flex items-center justify-between">

        <button
          disabled={pagina === 1}
          onClick={() =>
            setPagina((p) => p - 1)
          }
          className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-5 py-3 rounded-2xl text-white"
        >

          ← Anterior

        </button>

        <div className="text-white">

          Página {pagina} de{" "}
          {totalPaginas || 1}

        </div>

        <button
          disabled={
            pagina >= totalPaginas
          }
          onClick={() =>
            setPagina((p) => p + 1)
          }
          className="bg-white/5 hover:bg-white/10 disabled:opacity-30 px-5 py-3 rounded-2xl text-white"
        >

          Siguiente →

        </button>

      </div>

      {modalEditar && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-3xl">

            <div className="p-6 border-b border-white/5">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-bold text-white">
                  Editar compra
                </h2>

                <button
                  onClick={cerrarModalEditar}
                  className="text-zinc-400 hover:text-white text-3xl"
                >
                  X
                </button>

              </div>

            </div>

            <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm text-zinc-400 block mb-2">
                    Materia prima
                  </label>

                  <select
                    value={suministroCompra}
                    onChange={(event) =>
                      setSuministroCompra(event.target.value)
                    }
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  >

                    <option value="">
                      Seleccionar
                    </option>

                    {suministros.map((item) => (

                      <option
                        key={item.id}
                        value={item.id}
                      >
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
                    onChange={(event) =>
                      setCantidadCompra(event.target.value)
                    }
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm text-zinc-400 block mb-2">
                    Proveedor
                  </label>

                  <input
                    value={proveedorCompra}
                    onChange={(event) =>
                      setProveedorCompra(event.target.value)
                    }
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />

                </div>

                <div>

                  <label className="text-sm text-zinc-400 block mb-2">
                    Monto total
                  </label>

                  <input
                    type="number"
                    value={montoTotal}
                    onChange={(event) =>
                      setMontoTotal(event.target.value)
                    }
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
                    value={montoAbonado}
                    onChange={(event) =>
                      setMontoAbonado(event.target.value)
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
                    onChange={(event) =>
                      setObservacionCompra(event.target.value)
                    }
                    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 text-white"
                  />

                </div>

              </div>

              <div className="flex justify-end gap-4">

                <button
                  onClick={cerrarModalEditar}
                  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5 text-white"
                >
                  Cancelar
                </button>

                <button
                  onClick={guardarEdicionCompra}
                  className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl text-black font-semibold"
                >
                  Guardar cambios
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
