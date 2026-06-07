export const runtime = "nodejs";

export async function POST(request: Request) {
  const claveConfigurada = process.env.PREMOS_FISCAL_CONFIG_KEY;

  if (!claveConfigurada) {
    return Response.json(
      { ok: false, error: "Acceso fiscal no configurado" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const clave = typeof body?.clave === "string" ? body.clave.trim() : "";

  if (!clave || clave !== claveConfigurada) {
    return Response.json(
      { ok: false, error: "Clave incorrecta" },
      { status: 401 }
    );
  }

  return Response.json({ ok: true });
}
