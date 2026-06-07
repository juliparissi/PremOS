import { consultarPersonaPadronArca } from "@/lib/arca/cliente";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (process.env.NEXT_PUBLIC_PREMOS_DEMO_MODE === "true") {
      return Response.json(
        {
          ok: false,
          error:
            "La consulta al padron ARCA esta deshabilitada en la demo. Podes completar la razon social manualmente.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const cuit = typeof body?.cuit === "string" ? body.cuit : "";

    const persona = await consultarPersonaPadronArca(cuit);

    return Response.json({ ok: true, persona });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo consultar el padron ARCA.";
    const friendlyMessage = /no existe persona/i.test(message)
      ? "ARCA no encontro ese CUIT en el padron del entorno actual. En homologacion puede pasar con CUIT reales; podes cargar la razon social manualmente."
      : message;

    return Response.json(
      {
        ok: false,
        error: friendlyMessage,
      },
      { status: 400 }
    );
  }
}
