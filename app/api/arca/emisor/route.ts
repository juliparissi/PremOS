import { consultarPersonaPadronArca } from "@/lib/arca/cliente";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cuit = process.env.ARCA_CUIT;

    if (!cuit) {
      return Response.json(
        { ok: false, error: "Falta configurar ARCA_CUIT." },
        { status: 500 }
      );
    }

    const persona = await consultarPersonaPadronArca(cuit);

    return Response.json({ ok: true, persona });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo consultar el emisor en ARCA.";

    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
