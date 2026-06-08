import { supabase } from "./supabase";

type MovimientoEconomia = {
  concepto?: string | null;
  detalle?: string | null;
  monto_total?: number | string | null;
  monto_abonado?: number | string | null;
};

type CompraSuministro = {
  id: string;
  proveedor?: string | null;
  observacion?: string | null;
  monto_total?: number | string | null;
  monto_abonado?: number | string | null;
  suministros?: {
    nombre?: string | null;
  } | null;
};

type MovimientoEconomiaCompleto = MovimientoEconomia & {
  tipo?: string | null;
};

function normalizarTexto(valor?: string | null) {
  return (valor || "").trim().toLowerCase();
}

function numero(valor: number | string | null | undefined) {
  return Number(valor || 0);
}

export async function sincronizarCompraDesdeMovimiento(
  movimiento: MovimientoEconomia,
  nuevoMontoAbonado: number
) {
  const concepto = normalizarTexto(movimiento.concepto);

  if (!concepto.startsWith("compra de ")) {
    return;
  }

  const { data } = await supabase
    .from("movimientos_suministro")
    .select(
      `
      id,
      proveedor,
      observacion,
      monto_total,
      monto_abonado,
      created_at,
      suministros (
        nombre
      )
    `
    )
    .eq("monto_total", numero(movimiento.monto_total))
    .order("created_at", { ascending: false });

  const detalleMovimiento = normalizarTexto(movimiento.detalle);
  const abonadoAnterior = numero(movimiento.monto_abonado);

  const candidatas = (data as CompraSuministro[] | null)?.filter((item) => {
    const conceptoCompra = normalizarTexto(
      `Compra de ${item.suministros?.nombre || "Compra"}`
    );
    const detalleCompra = normalizarTexto(item.proveedor || item.observacion);

    return (
      conceptoCompra === concepto &&
      detalleCompra === detalleMovimiento
    );
  });

  const compra =
    candidatas?.find(
      (item) => numero(item.monto_abonado) === abonadoAnterior
    ) || candidatas?.[0];

  if (!compra) {
    return;
  }

  await supabase
    .from("movimientos_suministro")
    .update({
      monto_abonado: nuevoMontoAbonado,
    })
    .eq("id", compra.id);
}

export async function sincronizarComprasPendientesConEconomia() {
  const { data: compras } = await supabase
    .from("movimientos_suministro")
    .select(
      `
      id,
      proveedor,
      observacion,
      monto_total,
      monto_abonado,
      suministros (
        nombre
      )
    `
    );

  const { data: movimientos } = await supabase
    .from("movimientos_economia")
    .select("tipo, concepto, detalle, monto_total, monto_abonado")
    .eq("tipo", "Gasto");

  const comprasActualizadas = await Promise.all(
    ((compras || []) as CompraSuministro[]).map(async (compra) => {
      const conceptoCompra = normalizarTexto(
        `Compra de ${compra.suministros?.nombre || "Compra"}`
      );
      const detalleCompra = normalizarTexto(
        compra.proveedor || compra.observacion
      );

      const movimiento = (movimientos as MovimientoEconomiaCompleto[] | null)?.find(
        (item) =>
          normalizarTexto(item.concepto) === conceptoCompra &&
          normalizarTexto(item.detalle) === detalleCompra &&
          numero(item.monto_total) === numero(compra.monto_total)
      );

      if (!movimiento) {
        return compra;
      }

      const abonadoEconomia = numero(movimiento.monto_abonado);

      if (abonadoEconomia === numero(compra.monto_abonado)) {
        return compra;
      }

      await supabase
        .from("movimientos_suministro")
        .update({
          monto_abonado: abonadoEconomia,
        })
        .eq("id", compra.id);

      return {
        ...compra,
        monto_abonado: abonadoEconomia,
      };
    })
  );

  return comprasActualizadas;
}
