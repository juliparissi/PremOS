import OpenAI from "openai";

import fs from "fs";

import path from "path";

import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* Supabase */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const mensaje = body.mensaje;

    const mensajeLower =
      mensaje.toLowerCase();

    /* =========================
       IA REAL - CREAR CLIENTE
    ========================== */

    if (
      mensajeLower.includes("crear cliente") ||
      mensajeLower.includes("crea cliente") ||
      mensajeLower.includes("nuevo cliente")
    ) {

      const nombre = mensaje
        .replace(/crear cliente/gi, "")
        .replace(/crea cliente/gi, "")
        .replace(/nuevo cliente/gi, "")
        .trim();

      if (!nombre) {

        return Response.json({
          respuesta:
            "Decime el nombre del cliente 😎",
        });

      }

      /* Verificar si existe */
      const {
        data: clienteExistente,
      } = await supabase
        .from("clientes")
        .select("*")
        .ilike("nombre", nombre)
        .single();

      if (clienteExistente) {

        return Response.json({
          respuesta:
            `El cliente ${nombre} ya existe 😎`,
        });

      }

      /* Crear cliente */
      const { error } =
        await supabase
          .from("clientes")
          .insert([
            {
              nombre,
            },
          ]);

      if (error) {

        console.error(error);

        return Response.json({
          respuesta:
            "Error creando cliente 😅",
        });

      }

      return Response.json({
        respuesta:
          `Cliente ${nombre} creado correctamente 😎🔥`,
      });

    }

/* =========================
   IA REAL - BORRAR CLIENTE
========================== */

if (
  mensajeLower.includes("borrar cliente") ||
  mensajeLower.includes("eliminar cliente") ||
  mensajeLower.includes("borra cliente") ||
  mensajeLower.includes("me borras el cliente")
) {

  const nombre = mensaje
    .replace(/borrar cliente/gi, "")
    .replace(/eliminar cliente/gi, "")
    .replace(/borra cliente/gi, "")
    .replace(/me borras el cliente/gi, "")
    .trim();

  if (!nombre) {

    return Response.json({
      respuesta:
        "Decime qué cliente querés borrar 😎",
    });

  }

  /* Buscar cliente */
  const {
    data: clienteExistente,
  } = await supabase
    .from("clientes")
    .select("*")
    .ilike("nombre", nombre)
    .single();

  if (!clienteExistente) {

    return Response.json({
      respuesta:
        `No encontré el cliente ${nombre} 😅`,
    });

  }

  /* Borrar cliente */
  const { error } =
    await supabase
      .from("clientes")
      .delete()
      .ilike("nombre", nombre);

  if (error) {

    console.error(error);

    return Response.json({
      respuesta:
        "Error borrando cliente 😅",
    });

  }

  return Response.json({
    respuesta:
      `Cliente ${nombre} borrado correctamente 😎🔥`,
  });

}

    /* =========================
       CONTEXTO NEGOCIO
    ========================== */

    const contextoPath = path.join(
      process.cwd(),
      "lib/ia/contexto-negocio.md"
    );

    const contexto =
      fs.readFileSync(
        contextoPath,
        "utf-8"
      );

    /* =========================
       CLIENTES
    ========================== */

    const { data: clientes } =
      await supabase
        .from("clientes")
        .select("*");

    /* =========================
       PEDIDOS
    ========================== */

    const { data: pedidos } =
      await supabase
        .from("pedidos")
        .select("*");

    /* =========================
       ECONOMÍA
    ========================== */

    const { data: economia } =
      await supabase
        .from("movimientos_economia")
        .select("*");

    /* =========================
       OPENAI
    ========================== */

    const respuesta =
      await openai.chat.completions.create({

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

ECONOMÍA:
${JSON.stringify(economia)}

Sos el asistente inteligente de PremOS.

Respondé usando:
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

      respuesta:
        respuesta.choices[0]
          .message.content,

    });

  } catch (error) {

    console.error(error);

    return Response.json({
      error: "Error IA",
    });

  }

}