import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type ChatBody = {
  mensaje?: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

function getServerClients() {
  if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
    throw new Error("Faltan variables de entorno del servidor.");
  }

  return {
    openai: new OpenAI({
      apiKey: openaiApiKey,
    }),
    supabase: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    }),
  };
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function extraerNombreCliente(mensaje: string) {
  return mensaje
    .replace(/crear cliente/gi, "")
    .replace(/crea cliente/gi, "")
    .replace(/nuevo cliente/gi, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return Response.json(
        { error: "Sesión requerida" },
        { status: 401 }
      );
    }

    const { openai, supabase } = getServerClients();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as ChatBody;

    if (typeof body.mensaje !== "string" || !body.mensaje.trim()) {
      return Response.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      );
    }

    const mensaje = body.mensaje.trim();
    const mensajeLower = mensaje.toLowerCase();

    if (
      mensajeLower.includes("borrar cliente") ||
      mensajeLower.includes("eliminar cliente") ||
      mensajeLower.includes("borra cliente") ||
      mensajeLower.includes("me borras el cliente")
    ) {
      return Response.json({
        respuesta:
          "Por seguridad no borro clientes desde el chat. Hacelo desde el módulo de clientes, donde se puede revisar antes de confirmar.",
      });
    }

    if (
      mensajeLower.includes("crear cliente") ||
      mensajeLower.includes("crea cliente") ||
      mensajeLower.includes("nuevo cliente")
    ) {
      const nombre = extraerNombreCliente(mensaje);

      if (!nombre) {
        return Response.json({
          respuesta: "Decime el nombre del cliente.",
        });
      }

      const { data: clienteExistente } = await supabase
        .from("clientes")
        .select("id")
        .ilike("nombre", nombre)
        .maybeSingle();

      if (clienteExistente) {
        return Response.json({
          respuesta: `El cliente ${nombre} ya existe.`,
        });
      }

      const { error } = await supabase.from("clientes").insert([
        {
          nombre,
        },
      ]);

      if (error) {
        console.error(error);

        return Response.json(
          { respuesta: "Error creando cliente." },
          { status: 500 }
        );
      }

      return Response.json({
        respuesta: `Cliente ${nombre} creado correctamente.`,
      });
    }

    const contextoPath = path.join(
      process.cwd(),
      "lib/ia/contexto-negocio.md"
    );

    const contexto = fs.readFileSync(contextoPath, "utf-8");

    const [
      { data: clientes },
      { data: pedidos },
      { data: economia },
      { data: productos },
      { data: stock },
      { data: suministros },
      { data: produccion },
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id,nombre,localidad,observaciones")
        .limit(200),
      supabase
        .from("pedidos")
        .select(
          "id,numero,cliente_id,estado,fecha_entrega,saldo_total,saldo_abonado,saldo_restante,estado_pago,fecha_inicio_produccion"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("movimientos_economia")
        .select(
          "id,tipo,concepto,monto,fecha,monto_total,monto_abonado,saldo_pendiente"
        )
        .order("fecha", { ascending: false })
        .limit(200),
      supabase
        .from("productos")
        .select("id,producto,modelo,color,unidad,cantidad,precio_unitario,activo")
        .limit(200),
      supabase
        .from("stock")
        .select("id,producto,stock_actual,stock_minimo,stock_ideal,stock_maximo")
        .limit(200),
      supabase
        .from("suministros")
        .select("id,nombre,unidad,stock_actual,stock_minimo,stock_ideal")
        .limit(200),
      supabase
        .from("produccion")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const respuesta = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
${contexto}

DATOS REALES DEL ERP:

CLIENTES:
${JSON.stringify(clientes)}

PEDIDOS:
${JSON.stringify(pedidos)}

ECONOMIA:
${JSON.stringify(economia)}

STOCK:
${JSON.stringify(stock)}

SUMINISTROS:
${JSON.stringify(suministros)}

PRODUCCION:
${JSON.stringify(produccion)}

PRODUCTOS:
${JSON.stringify(productos)}

Sos el asistente inteligente de PremOS.

Responde usando:
- datos reales,
- información del ERP,
- lógica de negocio.

No inventes datos.
`,
        },
        {
          role: "user",
          content: mensaje,
        },
      ],
    });

    return Response.json({
      respuesta: respuesta.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error IA" },
      { status: 500 }
    );
  }
}
