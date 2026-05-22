"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "../../../lib/supabase";

export default function NuevoMovimientoPage() {

  const router = useRouter();

  const [tipo, setTipo] = useState("gasto");

  const [concepto, setConcepto] = useState("");
  const [proveedor, setProveedor] = useState("");

  const [monto, setMonto] = useState("");

  const [montoAbonado, setMontoAbonado] = useState("");

  const [fecha, setFecha] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    setFecha(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  }, []);

  const saldoPendiente =
    Math.max(
      0,
      Number(monto || 0) -
      Number(montoAbonado || 0)
    );

  async function guardarMovimiento(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!concepto || !monto) {

      alert("Completá los campos obligatorios");

      return;

    }

    setLoading(true);

    const { error } = await supabase
      .from("movimientos_economia")
      .insert([
  {
    tipo,

    concepto: concepto,

    detalle:
  tipo === "gasto"
    ? proveedor
    : null,

    monto: Number(monto),

    monto_total: Number(monto),

    monto_abonado:
      tipo === "gasto"
        ? Number(montoAbonado || 0)
        : Number(monto),

    saldo_pendiente:
      tipo === "gasto"
        ? saldoPendiente
        : 0,

    fecha,

  },
])

    setLoading(false);

    if (error) {

      console.error(error);

      alert(
        "Error guardando movimiento"
      );

      return;

    }

    router.push("/economia");

  }

  return (

    <div className="max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Nuevo movimiento
        </h1>

        <p className="text-zinc-500 mt-2">
          Registrar ingreso o gasto
        </p>

      </div>

      {/* Formulario */}
      <form
        onSubmit={guardarMovimiento}
        className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 pb-10 md:pb-5 space-y-5"
      >

        {/* Fecha */}
        <div>

          <p className="text-sm text-zinc-400 mb-2">
            Fecha
          </p>

          <input
            type="date"
            value={fecha}
            onChange={(e) =>
              setFecha(e.target.value)
            }
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />

        </div>

        {/* Tipo */}
        <div>

          <p className="text-sm text-zinc-400 mb-2">
            Tipo
          </p>

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value)
            }
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          >

            <option value="gasto">
              Gasto
            </option>

            <option value="ingreso">
              Ingreso
            </option>

          </select>

        </div>

        {/* Concepto */}
        <div>

          <p className="text-sm text-zinc-400 mb-2">
            Concepto
          </p>

          <input
            type="text"
            placeholder="Descripción"
            value={concepto}
            onChange={(e) =>
              setConcepto(e.target.value)
            }
            className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
          />

        </div>

        {/* Campos gasto */}
        {tipo === "gasto" && (

          <>

{/* Proveedor */}
<div>

  <p className="text-sm text-zinc-400 mb-2">
    Proveedor
  </p>

  <input
    type="text"
    placeholder="Proveedor"
    value={proveedor}
    onChange={(e) =>
      setProveedor(e.target.value)
    }
    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
  />

</div>

            {/* Monto total */}
            <div>

              <p className="text-sm text-zinc-400 mb-2">
                Monto total
              </p>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Monto total"
                value={monto}
                onChange={(e) =>
                  setMonto(e.target.value)
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
              />

            </div>

            {/* Monto abonado */}
            <div>

              <p className="text-sm text-zinc-400 mb-2">
                Monto abonado
              </p>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Monto abonado"
                value={montoAbonado}
                onChange={(e) =>
                  setMontoAbonado(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
              />

            </div>

            {/* Saldo pendiente */}
            <div className="bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4">

              <p className="text-sm text-zinc-400 mb-2">
                Saldo pendiente
              </p>

              <h3 className="text-xl font-bold text-yellow-400">

                $
                {saldoPendiente.toLocaleString(
                  "es-AR"
                )}

              </h3>

            </div>

          </>

        )}

        {/* Ingreso */}
        {tipo === "ingreso" && (

          <div>

            <p className="text-sm text-zinc-400 mb-2">
              Monto
            </p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto"
              value={monto}
              onChange={(e) =>
                setMonto(e.target.value)
              }
              className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
            />

          </div>

        )}

        {/* Botón */}
<button
  type="submit"
  disabled={loading}
  className="w-full bg-emerald-500 hover:bg-emerald-400 transition py-3 rounded-2xl font-medium text-black"
>

  {loading
    ? "Guardando..."
    : "Guardar movimiento"}

</button>

      </form>

    </div>

  );

}