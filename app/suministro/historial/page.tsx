"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ITEMS_POR_PAGINA = 20;

export default function HistorialComprasPage() {

  const [compras, setCompras] = useState<any[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalCompras, setTotalCompras] = useState(0);

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

  useEffect(() => {

    cargarCompras();

  }, [pagina]);

  const totalPaginas = Math.ceil(
    totalCompras / ITEMS_POR_PAGINA
  );

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-4xl font-bold text-white">

          Historial de compras

        </h1>

        <p className="text-zinc-500 mt-2">

          Registro completo de compras de materias primas

        </p>

      </div>

      <div className="bg-[#081528] border border-white/5 rounded-3xl overflow-hidden">

        <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Fecha</div>
          <div>Material</div>
          <div>Cantidad</div>
          <div>Proveedor</div>
          <div>Total</div>

        </div>

        {compras.map((item) => {

          const saldo =
            Number(item.monto_total || 0) -
            Number(item.monto_abonado || 0);

          return (

            <div
              key={item.id}
              className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
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

    </div>

  );

}