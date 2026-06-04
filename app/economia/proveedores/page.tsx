"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../../lib/supabase";

type Proveedor = {
  id: string;
  nombre: string;
  materia_prima?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  observaciones?: string;
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
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] =
    useState<Proveedor | null>(null);
  const [form, setForm] = useState(proveedorVacio);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarProveedores();
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

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const texto = `${proveedor.nombre || ""} ${
      proveedor.materia_prima || ""
    } ${proveedor.telefono || ""} ${proveedor.mail || ""} ${
      proveedor.cuit || ""
    }`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div>
      <BackButton
        href="/economia"
        label="Volver a economia"
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
        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
          <div>Proveedor</div>
          <div>Materia prima</div>
          <div>Teléfono</div>
          <div>Mail</div>
          <div>CUIT</div>
          <div className="text-right">Acciones</div>
        </div>

        {proveedoresFiltrados.map((proveedor) => (
          <div
            key={proveedor.id}
            className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition text-white"
          >
            <div className="font-medium">{proveedor.nombre}</div>
            <div>{proveedor.materia_prima || "-"}</div>
            <div>{proveedor.telefono || "-"}</div>
            <div>{proveedor.mail || "-"}</div>
            <div>{proveedor.cuit || "-"}</div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => abrirEdicion(proveedor)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Editar
              </button>
              <button
                onClick={() => eliminarProveedor(proveedor)}
                className="text-red-400 hover:text-red-300"
              >
                Eliminar
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
                onClick={() => abrirEdicion(proveedor)}
                className="text-cyan-400"
              >
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4 text-sm text-zinc-300">
              <p>{proveedor.telefono || "Sin teléfono"}</p>
              <p>{proveedor.mail || "Sin mail"}</p>
              <p>{proveedor.cuit || "Sin CUIT"}</p>
            </div>
          </div>
        ))}
      </div>

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
