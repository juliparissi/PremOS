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

    /* Contexto */
    const contextoPath = path.join(
      process.cwd(),
      "lib/ia/contexto-negocio.md"
    );

    const contexto =
      fs.readFileSync(
        contextoPath,
        "utf-8"
      );

    /* Clientes */
    const { data: clientes } =
      await supabase
        .from("clientes")
        .select("*");

    /* Pedidos */
    const { data: pedidos } =
      await supabase
        .from("pedidos")
        .select("*");

    /* Economía */
    const { data: economia } =
      await supabase
        .from("movimientos_economia")
        .select("*");

    /* OpenAI */
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