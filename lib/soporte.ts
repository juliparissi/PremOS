const supportApiUrl = process.env.NEXT_PUBLIC_PREMOS_SUPPORT_API_URL || "";
const licenseApiUrl = process.env.NEXT_PUBLIC_PREMOS_LICENSE_API_URL || "";
const licenseKey = process.env.NEXT_PUBLIC_PREMOS_LICENSE_KEY || "";

export const supportConfigured = Boolean(
  licenseKey && (supportApiUrl || licenseApiUrl)
);

function getSupportUrl() {
  if (supportApiUrl) return supportApiUrl.replace(/\/$/, "");

  return licenseApiUrl.replace(/\/api\/licencias\/?$/, "/api/soporte/tickets");
}

export type SupportTicketPayload = {
  categoria: string;
  asunto: string;
  descripcion: string;
  contacto: string;
  canal_solicitado: string;
};

export type SupportTicket = {
  id: string;
  estado: "abierto" | "en_proceso" | "resuelto" | "cerrado";
  categoria: string;
  asunto: string;
  descripcion: string;
  canal_solicitado: string;
  respuesta: string | null;
  last_support_reply_at: string | null;
  last_client_reply_at: string | null;
  mensajes?: SupportTicketMessage[];
  created_at: string;
  updated_at: string;
};

export type SupportTicketMessage = {
  id: string;
  ticket_id: string;
  autor: "cliente" | "soporte";
  mensaje: string;
  created_at: string;
};

export async function sendSupportTicket(payload: SupportTicketPayload) {
  if (!supportConfigured) {
    return {
      ok: false,
      reason: "support_not_configured",
    };
  }

  const response = await fetch(getSupportUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      license_key: licenseKey,
    }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    ticket_id?: string;
    reason?: string;
  };

  return {
    ok: Boolean(data.ok),
    ticketId: data.ticket_id,
    reason: data.reason || "unknown",
  };
}

export async function sendSupportReply(ticketId: string, mensaje: string) {
  if (!supportConfigured) {
    return {
      ok: false,
      reason: "support_not_configured",
    };
  }

  const response = await fetch(getSupportUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticket_id: ticketId,
      mensaje,
      license_key: licenseKey,
    }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    ticket_id?: string;
    reason?: string;
  };

  return {
    ok: Boolean(data.ok),
    ticketId: data.ticket_id,
    reason: data.reason || "unknown",
  };
}

export async function getSupportTickets() {
  if (!supportConfigured) {
    return {
      ok: false,
      reason: "support_not_configured",
      tickets: [] as SupportTicket[],
    };
  }

  const url = new URL(getSupportUrl());
  url.searchParams.set("license_key", licenseKey);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = (await response.json()) as {
    ok?: boolean;
    reason?: string;
    tickets?: SupportTicket[];
  };

  return {
    ok: Boolean(data.ok),
    reason: data.reason || "unknown",
    tickets: data.tickets || [],
  };
}
