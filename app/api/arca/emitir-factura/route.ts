import { createClient } from "@supabase/supabase-js";
import {
  emitirFacturaArca,
  obtenerAuthArca,
  obtenerUltimoComprobanteArca,
} from "../../../../lib/arca/cliente";

export const runtime = "nodejs";

type EmitirFacturaBody = {
  pedidoId?: unknown;
};

type PedidoArca = {
  id: string;
  numero: string;
  saldo_total: number;
  con_factura?: boolean | null;
  numero_factura?: string | null;
  tipo_comprobante?: string | null;
  punto_venta?: string | null;
  cuit_facturacion?: string | null;
  razon_social_facturacion?: string | null;
  condicion_iva?: string | null;
  fecha_factura?: string | null;
  arca_cae?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseServer() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan variables de Supabase del servidor.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

function comprobanteTipoArca(tipo?: string | null) {
  const normalizado = (tipo || "Factura C").toLowerCase();

  if (normalizado.includes("factura c")) return 11;
  if (normalizado.includes("nota de debito c")) return 12;
  if (normalizado.includes("nota de credito c")) return 13;

  return null;
}

function condicionIvaReceptorId(condicion?: string | null) {
  const normalizada = (condicion || "Consumidor final")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizada.includes("responsable inscripto")) return 1;
  if (normalizada.includes("monotributo")) return 6;
  if (normalizada.includes("exento")) return 4;
  if (normalizada.includes("no categorizado")) return 7;
  if (normalizada.includes("no alcanzado")) return 15;

  return 5;
}

function documentoReceptor(cuitODni?: string | null) {
  const digits = (cuitODni || "").replace(/\D/g, "");

  if (digits.length === 11) {
    return {
      docTipo: 80,
      docNro: Number(digits),
    };
  }

  if (digits.length >= 7 && digits.length <= 8) {
    return {
      docTipo: 96,
      docNro: Number(digits),
    };
  }

  return {
    docTipo: 99,
    docNro: 0,
  };
}

function arcaDateToSql(value: string) {
  if (!/^\d{8}$/.test(value)) return null;

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export async function POST(req: Request) {
  try {
    if (process.env.NEXT_PUBLIC_PREMOS_DEMO_MODE === "true") {
      return Response.json(
        {
          error:
            "La emision ARCA esta deshabilitada en la demo. El modal es solo visual.",
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as EmitirFacturaBody;

    if (typeof body.pedidoId !== "string" || !body.pedidoId) {
      return Response.json({ error: "Pedido requerido." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", body.pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return Response.json({ error: "Pedido no encontrado." }, { status: 404 });
    }

    const pedidoArca = pedido as PedidoArca;

    if (!pedidoArca.con_factura) {
      return Response.json(
        { error: "El pedido no esta marcado con factura." },
        { status: 400 }
      );
    }

    if (pedidoArca.arca_cae || pedidoArca.numero_factura) {
      return Response.json(
        { error: "Este pedido ya tiene una factura emitida." },
        { status: 409 }
      );
    }

    const cbteTipo = comprobanteTipoArca(pedidoArca.tipo_comprobante);

    if (!cbteTipo) {
      return Response.json(
        {
          error:
            "Por ahora la emision ARCA automatica esta habilitada para comprobantes C.",
        },
        { status: 400 }
      );
    }

    const ptoVta = Number(pedidoArca.punto_venta || 1);

    if (!Number.isFinite(ptoVta) || ptoVta <= 0) {
      return Response.json(
        { error: "Punto de venta invalido." },
        { status: 400 }
      );
    }

    const auth = await obtenerAuthArca();
    const ultimo = await obtenerUltimoComprobanteArca(auth, {
      ptoVta,
      cbteTipo,
    });
    const siguiente = ultimo + 1;
    const documento = documentoReceptor(pedidoArca.cuit_facturacion);
    const result = await emitirFacturaArca(auth, {
      ptoVta,
      cbteTipo,
      cbteNro: siguiente,
      fecha: pedidoArca.fecha_factura || new Date().toISOString().split("T")[0],
      importe: Number(pedidoArca.saldo_total || 0),
      docTipo: documento.docTipo,
      docNro: documento.docNro,
      condicionIvaReceptorId: condicionIvaReceptorId(
        pedidoArca.condicion_iva
      ),
    });

    const autorizado = result.resultado === "A" && result.cae;

    const updatePayload = autorizado
      ? {
          con_factura: true,
          numero_factura: String(result.comprobanteNumero).padStart(8, "0"),
          arca_estado: "Autorizada",
          arca_resultado: result.resultado,
          arca_cae: result.cae,
          arca_cae_vencimiento: arcaDateToSql(result.caeVencimiento),
          arca_observaciones: result.observaciones.join(" | ") || null,
          arca_fecha_emision: new Date().toISOString(),
        }
      : {
          arca_estado: "Rechazada",
          arca_resultado: result.resultado || null,
          arca_observaciones: result.observaciones.join(" | ") || null,
          arca_fecha_emision: new Date().toISOString(),
        };

    const { data: actualizado, error: updateError } = await supabase
      .from("pedidos")
      .update(updatePayload)
      .eq("id", pedidoArca.id)
      .select("*")
      .single();

    if (updateError) {
      return Response.json(
        { error: "ARCA respondio, pero no se pudo guardar en Supabase." },
        { status: 500 }
      );
    }

    if (!autorizado) {
      return Response.json(
        {
          error: "ARCA rechazo el comprobante.",
          observaciones: result.observaciones,
          pedido: actualizado,
        },
        { status: 400 }
      );
    }

    return Response.json({
      ok: true,
      pedido: actualizado,
      cae: result.cae,
      caeVencimiento: arcaDateToSql(result.caeVencimiento),
      numeroFactura: String(result.comprobanteNumero).padStart(8, "0"),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo emitir la factura ARCA.",
      },
      { status: 500 }
    );
  }
}
