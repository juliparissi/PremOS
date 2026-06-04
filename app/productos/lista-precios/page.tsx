"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { generarPDFListaPrecios } from "../../../utils/generarPDF";

type Producto = {
  id: string;
  producto: string;
  modelo?: string | null;
  color?: string | null;
  unidad?: string | null;
  precio_unitario?: number | string | null;
};

type ListaPrecio = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ListaPrecioItem = {
  id: string;
  lista_id: string;
  producto_id?: string | null;
  producto: string;
  precio_unitario: number | string;
  precio_m2: number | string;
  observaciones?: string | null;
  orden: number;
};

function nombreProducto(item: Producto) {
  return [item.producto, item.modelo, item.color].filter(Boolean).join(" - ");
}

function numero(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatoMoneda(value: number | string) {
  return numero(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
}

function limpiarArchivo(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ListaPreciosPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<ListaPrecioItem[]>([]);
  const [listaActivaId, setListaActivaId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const listaActiva = useMemo(
    () => listas.find((lista) => lista.id === listaActivaId) || null,
    [listas, listaActivaId]
  );

  async function cargarDatos(preferidaId?: string) {
    setCargando(true);

    const [{ data: listasData }, { data: productosData }] = await Promise.all([
      supabase
        .from("listas_precios")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("productos")
        .select("id, producto, modelo, color, unidad, precio_unitario")
        .order("producto", { ascending: true }),
    ]);

    const listasDB = (listasData || []) as ListaPrecio[];
    setListas(listasDB);
    setProductos((productosData || []) as Producto[]);

    const siguienteId = preferidaId || listaActivaId || listasDB[0]?.id || "";
    setListaActivaId(siguienteId);

    if (siguienteId) {
      await cargarItems(siguienteId);
    } else {
      setItems([]);
    }

    setCargando(false);
  }

  async function cargarItems(listaId: string) {
    const { data } = await supabase
      .from("lista_precios_items")
      .select("*")
      .eq("lista_id", listaId)
      .order("orden", { ascending: true });

    setItems((data || []) as ListaPrecioItem[]);
  }

  async function crearLista(nombreInicial?: string) {
    const nombre =
      nombreInicial ||
      window.prompt("Nombre de la lista de precios", "Clientes comunes");

    if (!nombre?.trim()) return;

    const { data, error } = await supabase
      .from("listas_precios")
      .insert([{ nombre: nombre.trim() }])
      .select()
      .single();

    if (error || !data) {
      setMensaje("No se pudo crear la lista.");
      return;
    }

    setMensaje("Lista creada.");
    await cargarDatos(data.id);
  }

  async function crearListasBase() {
    const base = ["Clientes comunes", "Revendedores", "Grandes compras"];

    const existentes = new Set(
      listas.map((lista) => lista.nombre.trim().toLowerCase())
    );

    const nuevas = base
      .filter((nombre) => !existentes.has(nombre.toLowerCase()))
      .map((nombre) => ({ nombre }));

    if (nuevas.length === 0) return;

    const { data, error } = await supabase
      .from("listas_precios")
      .insert(nuevas)
      .select();

    if (error) {
      setMensaje("No se pudieron crear las listas base.");
      return;
    }

    setMensaje("Listas base creadas.");
    await cargarDatos(data?.[0]?.id);
  }

  async function renombrarLista() {
    if (!listaActiva) return;

    const nombre = window.prompt("Nuevo nombre de la lista", listaActiva.nombre);

    if (!nombre?.trim()) return;

    const { error } = await supabase
      .from("listas_precios")
      .update({ nombre: nombre.trim() })
      .eq("id", listaActiva.id);

    if (error) {
      setMensaje("No se pudo renombrar la lista.");
      return;
    }

    setMensaje("Lista actualizada.");
    await cargarDatos(listaActiva.id);
  }

  async function eliminarLista() {
    if (!listaActiva) return;

    const confirmar = window.confirm(
      `Eliminar la lista "${listaActiva.nombre}"? Esta accion no borra productos.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("listas_precios")
      .delete()
      .eq("id", listaActiva.id);

    if (error) {
      setMensaje("No se pudo eliminar la lista.");
      return;
    }

    setMensaje("Lista eliminada.");
    await cargarDatos("");
  }

  async function importarProductos() {
    if (!listaActiva) return;

    const productosCargados = new Set(
      items.map((item) => item.producto_id).filter(Boolean)
    );

    const nuevos = productos
      .filter((producto) => !productosCargados.has(producto.id))
      .map((producto, index) => ({
        lista_id: listaActiva.id,
        producto_id: producto.id,
        producto: nombreProducto(producto),
        precio_unitario: numero(producto.precio_unitario),
        precio_m2: 0,
        observaciones: "",
        orden: items.length + index + 1,
      }));

    if (nuevos.length === 0) {
      setMensaje("La lista ya tiene todos los productos cargados.");
      return;
    }

    const { error } = await supabase.from("lista_precios_items").insert(nuevos);

    if (error) {
      setMensaje("No se pudieron importar los productos.");
      return;
    }

    setMensaje("Productos importados.");
    await cargarItems(listaActiva.id);
  }

  async function agregarFila() {
    if (!listaActiva) return;

    const { error } = await supabase.from("lista_precios_items").insert([
      {
        lista_id: listaActiva.id,
        producto: "Nuevo producto",
        precio_unitario: 0,
        precio_m2: 0,
        observaciones: "",
        orden: items.length + 1,
      },
    ]);

    if (error) {
      setMensaje("No se pudo agregar la fila.");
      return;
    }

    await cargarItems(listaActiva.id);
  }

  function actualizarItem(
    id: string,
    field: keyof ListaPrecioItem,
    value: string
  ) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  async function guardarCambios() {
    if (!listaActiva) return;

    setGuardando(true);

    const payload = items.map((item, index) => ({
      id: item.id,
      lista_id: listaActiva.id,
      producto_id: item.producto_id || null,
      producto: String(item.producto || "").trim() || "Sin nombre",
      precio_unitario: numero(item.precio_unitario),
      precio_m2: numero(item.precio_m2),
      observaciones: item.observaciones || "",
      orden: index + 1,
    }));

    const { error } = await supabase.from("lista_precios_items").upsert(payload);

    setGuardando(false);

    if (error) {
      setMensaje("No se pudieron guardar los cambios.");
      return;
    }

    setMensaje("Cambios guardados.");
    await cargarItems(listaActiva.id);
  }

  async function eliminarFila(id: string) {
    const { error } = await supabase
      .from("lista_precios_items")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("No se pudo eliminar la fila.");
      return;
    }

    setItems((actuales) => actuales.filter((item) => item.id !== id));
  }

  function descargarExcel() {
    if (!listaActiva) return;

    const filas = items
      .map(
        (item) => `
          <tr>
            <td>${item.producto}</td>
            <td>${formatoMoneda(item.precio_unitario)}</td>
            <td>${formatoMoneda(item.precio_m2)}</td>
            <td>${item.observaciones || ""}</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <h2>Lista de precios - ${listaActiva.nombre}</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio unitario</th>
                <th>Precio por m2</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${limpiarArchivo(listaActiva.nombre || "lista-precios")}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function descargarPDF() {
    if (!listaActiva) return;

    generarPDFListaPrecios({
      nombre: listaActiva.nombre,
      items: items.map((item) => ({
        producto: item.producto,
        precioUnitario: numero(item.precio_unitario),
        precioM2: numero(item.precio_m2),
        observaciones: item.observaciones || "",
      })),
    });
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <Link href="/productos" className="text-sm text-cyan-300">
            Volver a productos
          </Link>

          <h1 className="text-3xl font-bold mt-3">Lista de precios</h1>

          <p className="text-zinc-500 mt-1">
            Armado de listas comerciales editables para clientes, revendedores
            y grandes compras.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => crearLista()}
            className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
          >
            + Nueva lista
          </button>

          <button
            onClick={crearListasBase}
            className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
          >
            Crear listas base
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-200">
          {mensaje}
        </div>
      )}

      <div className="space-y-6">
        <aside className="bg-[#0b1727] border border-white/5 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Listas</h2>
            <span className="text-xs text-zinc-500">{listas.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listas.map((lista) => (
              <button
                key={lista.id}
                onClick={async () => {
                  setListaActivaId(lista.id);
                  await cargarItems(lista.id);
                }}
                className={`w-full min-h-[92px] text-left px-4 py-3 rounded-2xl border transition ${
                  lista.id === listaActivaId
                    ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-100"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <span className="block font-medium">{lista.nombre}</span>
                <span className="block text-xs text-zinc-500 mt-1">
                  Lista editable
                </span>
              </button>
            ))}

            {!cargando && listas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                Todavia no hay listas. Crea una lista o usa las listas base.
              </div>
            )}
          </div>
        </aside>

        <section className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="text-2xl font-bold">
                {listaActiva?.nombre || "Sin lista seleccionada"}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {items.length} productos cargados
              </p>
            </div>

            {listaActiva && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={renombrarLista}
                  className="bg-white/5 hover:bg-white/10 transition px-4 py-3 rounded-2xl border border-white/5"
                >
                  Renombrar
                </button>

                <button
                  onClick={importarProductos}
                  className="bg-cyan-500 hover:bg-cyan-400 transition px-4 py-3 rounded-2xl font-medium text-black"
                >
                  Importar productos
                </button>

                <button
                  onClick={agregarFila}
                  className="bg-white/5 hover:bg-white/10 transition px-4 py-3 rounded-2xl border border-white/5"
                >
                  + Fila
                </button>

                <button
                  onClick={descargarExcel}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 transition px-4 py-3 rounded-2xl border border-emerald-500/20"
                >
                  Excel
                </button>

                <button
                  onClick={descargarPDF}
                  className="bg-white/5 hover:bg-white/10 transition px-4 py-3 rounded-2xl border border-white/5"
                >
                  PDF
                </button>
              </div>
            )}
          </div>

          {!listaActiva && (
            <div className="p-8 text-zinc-500">
              Crea una lista de precios para empezar a cargar productos.
            </div>
          )}

          {listaActiva && (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[2fr_160px_160px_2fr_100px] gap-3 px-6 py-4 border-b border-white/5 text-sm text-zinc-500">
                    <div>Producto</div>
                    <div>Precio unitario</div>
                    <div>Precio por m2</div>
                    <div>Observaciones</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[2fr_160px_160px_2fr_100px] gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <input
                        value={item.producto}
                        onChange={(event) =>
                          actualizarItem(item.id, "producto", event.target.value)
                        }
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                      />

                      <input
                        type="number"
                        value={item.precio_unitario}
                        onChange={(event) =>
                          actualizarItem(
                            item.id,
                            "precio_unitario",
                            event.target.value
                          )
                        }
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                      />

                      <input
                        type="number"
                        value={item.precio_m2}
                        onChange={(event) =>
                          actualizarItem(item.id, "precio_m2", event.target.value)
                        }
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                      />

                      <input
                        value={item.observaciones || ""}
                        onChange={(event) =>
                          actualizarItem(
                            item.id,
                            "observaciones",
                            event.target.value
                          )
                        }
                        className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                      />

                      <div className="flex justify-end">
                        <button
                          onClick={() => eliminarFila(item.id)}
                          className="text-red-300 hover:text-red-200 transition px-3"
                          title="Eliminar fila"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {!cargando && items.length === 0 && (
                    <div className="px-6 py-10 text-zinc-500">
                      La lista esta vacia. Importa productos o agrega una fila
                      manual.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5">
                <button
                  onClick={eliminarLista}
                  className="text-red-300 hover:text-red-200 transition w-fit"
                >
                  Eliminar lista
                </button>

                <button
                  onClick={guardarCambios}
                  disabled={guardando}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 transition px-5 py-3 rounded-2xl font-medium"
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
