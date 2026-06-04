"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { supabase } from "../../../lib/supabase";

type Proveedor = {
  id: string;
  nombre: string;
  materia_prima?: string;
};

export default function NuevoMovimientoPage() {
  const router = useRouter();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorId, setProveedorId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFecha(new Date().toISOString().split("T")[0]);
    cargarProveedores();
  }, []);

  const saldoPendiente = Math.max(
    0,
    Number(monto || 0) - Number(montoAbonado || 0)
  );

  async function cargarProveedores() {
    const { data } = await supabase
      .from("proveedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (data) {
      setProveedores(data as Proveedor[]);
    }
  }

  async function guardarMovimiento(e: React.FormEvent) {
    e.preventDefault();

    const montoTotal = Number(monto || 0);
    const abonado = Number(montoAbonado || 0);

    if (!concepto || montoTotal <= 0) {
      alert("Completá el concepto y el monto de la salida.");
      return;
    }

    if (abonado > montoTotal) {
      alert("El monto abonado no puede superar el monto total.");
      return;
    }

    setLoading(true);

    const proveedorSeleccionado = proveedores.find(
      (item) => item.id === proveedorId
    );

    const { error } = await supabase.from("movimientos_economia").insert([
      {
        tipo: "Gasto",
        concepto,
        detalle: proveedorSeleccionado?.nombre || null,
        monto: montoTotal,
        monto_total: montoTotal,
        monto_abonado: abonado,
        saldo_pendiente: saldoPendiente,
        fecha,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error guardando la salida de caja");
      return;
    }

    router.push("/economia");
  }

  return (
    <div className="max-w-xl mx-auto">
      <BackButton
        href="/economia"
        label="Volver a economia"
        showDesktop
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Salida de caja
        </h1>

        <p className="text-zinc-500 mt-2">
          Registrar egresos operativos y cuentas a pagar
        </p>
      </div>

      <form
        onSubmit={guardarMovimiento}
        className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 pb-10 md:pb-5 space-y-5"
      >
        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Fecha
          </p>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Proveedor / categoria
          </p>

          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          >
            <option value="">
              Sin proveedor asignado
            </option>

            {proveedores.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
                {item.materia_prima ? ` - ${item.materia_prima}` : ""}
              </option>
            ))}
          </select>

          <div className="flex justify-between gap-3 mt-2 text-xs">
            <span className="text-zinc-500">
              Para sueldos u otros egresos generales podés crear una categoria.
            </span>

            <Link
              href="/economia/proveedores"
              className="text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
            >
              Alta proveedor
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Concepto
          </p>

          <input
            type="text"
            placeholder="Descripción"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Monto total
          </p>

          <input
            type="text"
            inputMode="numeric"
            placeholder="Monto total"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />
        </div>

        <div>
          <p className="text-sm text-zinc-400 mb-2">
            Monto abonado
          </p>

          <input
            type="text"
            inputMode="numeric"
            placeholder="Monto abonado"
            value={montoAbonado}
            onChange={(e) => setMontoAbonado(e.target.value)}
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />
        </div>

        <div className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4">
          <p className="text-sm text-zinc-400 mb-2">
            Saldo pendiente
          </p>

          <h3 className="text-xl font-bold text-yellow-400">
            ${saldoPendiente.toLocaleString("es-AR")}
          </h3>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 transition py-3 rounded-2xl font-medium text-black disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar salida"}
        </button>
      </form>
    </div>
  );
}
