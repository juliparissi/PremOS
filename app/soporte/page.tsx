"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { normalizePlan, planLabels, type PremosPlan } from "../../lib/planes";
import {
  getSupportTickets,
  sendSupportReply,
  sendSupportTicket,
  supportConfigured,
  type SupportTicket,
} from "../../lib/soporte";

const categorias = [
  "Consulta general",
  "Error del sistema",
  "Usuarios y acceso",
  "Reportes",
  "Produccion",
  "Ventas o presupuestos",
  "Stock o suministros",
  "Mejora solicitada",
];

const estadoLabels: Record<SupportTicket["estado"], string> = {
  abierto: "Abierto",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const estadoStyles: Record<SupportTicket["estado"], string> = {
  abierto: "bg-cyan-500/10 text-cyan-200 border-cyan-400/20",
  en_proceso: "bg-amber-500/10 text-amber-200 border-amber-400/20",
  resuelto: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  cerrado: "bg-zinc-500/10 text-zinc-300 border-zinc-400/20",
};

export default function SoportePage() {
  const [plan, setPlan] = useState<PremosPlan>("full");
  const [categoria, setCategoria] = useState(categorias[0]);
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contacto, setContacto] = useState("");
  const [canal, setCanal] = useState("ticket");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [cargandoTickets, setCargandoTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [seenResponses, setSeenResponses] = useState<Record<string, string>>({});
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [respondiendoTicket, setRespondiendoTicket] = useState<string | null>(
    null
  );

  useEffect(() => {
    const currentPlan = normalizePlan(window.localStorage.getItem("premos_plan"));
    setPlan(currentPlan);
    setCanal("ticket");
    setSeenResponses(loadSeenResponses());
    cargarTickets();
  }, []);

  const canales = useMemo(() => {
    if (plan === "lite") {
      return [{ value: "ticket", label: "Ticket" }];
    }

    if (plan === "full") {
      return [
        { value: "ticket", label: "Ticket" },
        { value: "llamada", label: "Solicitar llamada" },
      ];
    }

    return [
      { value: "ticket", label: "Ticket prioritario" },
      { value: "llamada", label: "Solicitar llamada" },
      { value: "prioritario", label: "Atencion prioritaria" },
    ];
  }, [plan]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const unreadCount = useMemo(
    () =>
      tickets.filter((ticket) => hasUnreadResponse(ticket, seenResponses))
        .length,
    [tickets, seenResponses]
  );

  async function cargarTickets() {
    if (!supportConfigured) return;

    setCargandoTickets(true);

    try {
      const result = await getSupportTickets();

      if (result.ok) {
        setTickets(result.tickets);
        setSelectedTicketId((current) =>
          current && result.tickets.some((ticket) => ticket.id === current)
            ? current
            : null
        );
      }
    } finally {
      setCargandoTickets(false);
    }
  }

  function abrirTicket(ticket: SupportTicket) {
    setSelectedTicketId(ticket.id);

    if (!ticket.respuesta) return;

    const nextSeen = {
      ...seenResponses,
      [ticket.id]: ticket.last_support_reply_at || ticket.updated_at,
    };

    setSeenResponses(nextSeen);
    saveSeenResponses(nextSeen);
  }

  async function enviarTicket() {
    setMensaje("");

    if (!asunto.trim() || !descripcion.trim()) {
      setMensaje("Completa el asunto y la descripcion para enviar el ticket.");
      return;
    }

    setEnviando(true);

    try {
      const result = await sendSupportTicket({
        categoria,
        asunto,
        descripcion,
        contacto,
        canal_solicitado: canal,
      });

      if (!result.ok) {
        setMensaje(
          result.reason === "support_not_configured"
            ? "El soporte todavia no esta configurado para esta instalacion."
            : "No se pudo enviar el ticket. Intenta nuevamente."
        );
        setEnviando(false);
        return;
      }

      setMensaje(`Ticket enviado correctamente. Codigo: ${result.ticketId}`);
      setAsunto("");
      setDescripcion("");
      setContacto("");
      setCanal("ticket");
      await cargarTickets();
    } catch {
      setMensaje("No se pudo conectar con soporte. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function responderTicket(ticket: SupportTicket) {
    const respuesta = ticketReplies[ticket.id]?.trim();

    if (!respuesta) {
      setMensaje("Escribi una respuesta antes de enviarla.");
      return;
    }

    setRespondiendoTicket(ticket.id);

    try {
      const result = await sendSupportReply(ticket.id, respuesta);

      if (!result.ok) {
        setMensaje(
          result.reason === "ticket_closed"
            ? "Este ticket ya fue cerrado por soporte."
            : "No se pudo enviar la respuesta. Intenta nuevamente."
        );
        return;
      }

      setTicketReplies((actuales) => ({ ...actuales, [ticket.id]: "" }));
      await cargarTickets();
    } catch {
      setMensaje("No se pudo conectar con soporte. Intenta nuevamente.");
    } finally {
      setRespondiendoTicket(null);
    }
  }

  return (
    <>
      <BackButton />

      <div className="pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-zinc-500 mt-1">
            Envianos una consulta o incidencia para revisar tu instalacion.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <section className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Categoria">
                <select
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                  className="support-input"
                >
                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Canal">
                <select
                  value={canal}
                  onChange={(event) => setCanal(event.target.value)}
                  className="support-input"
                >
                  {canales.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Asunto">
                <input
                  value={asunto}
                  onChange={(event) => setAsunto(event.target.value)}
                  placeholder="Ej: No puedo generar un reporte"
                  className="support-input"
                />
              </Field>

              <Field label="Contacto">
                <input
                  value={contacto}
                  onChange={(event) => setContacto(event.target.value)}
                  placeholder="Email o WhatsApp para responderte"
                  className="support-input"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Descripcion">
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  placeholder="Contanos que paso, en que modulo estabas y que necesitabas hacer."
                  className="support-input min-h-44 resize-y"
                />
              </Field>
            </div>

            <button
              onClick={enviarTicket}
              disabled={enviando}
              className="mt-5 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition px-5 py-4 rounded-2xl font-medium text-black"
            >
              {enviando ? "Enviando..." : "Enviar ticket"}
            </button>

            {mensaje && (
              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
                {mensaje}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
              <p className="text-sm font-bold uppercase text-emerald-400">
                {planLabels[plan]}
              </p>
              <h2 className="mt-2 text-2xl font-bold">Soporte incluido</h2>
              <p className="mt-3 text-zinc-400 text-sm">
                {plan === "lite" &&
                  "Tu plan incluye soporte por ticket para consultas operativas y errores del sistema."}
                {plan === "full" &&
                  "Tu plan incluye soporte por ticket y posibilidad de coordinar una llamada cuando el caso lo requiera."}
                {plan === "pro" &&
                  "Tu plan incluye soporte prioritario, tickets y posibilidad de coordinar una llamada."}
              </p>
            </div>

            {!supportConfigured && (
              <div className="bg-amber-500/10 border border-amber-400/20 rounded-3xl p-6 text-sm text-amber-100">
                El soporte todavia no esta configurado en esta instalacion.
              </div>
            )}
          </aside>
        </div>

        <section className="mt-6 bg-[#0b1727] border border-white/5 rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mis tickets</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Seguimiento de consultas enviadas desde esta instalacion.
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-black">
                    {unreadCount} nuevo{unreadCount === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={cargarTickets}
              disabled={cargandoTickets || !supportConfigured}
              className="bg-white/5 hover:bg-white/10 disabled:opacity-60 transition px-4 py-2 rounded-2xl border border-white/5 text-sm"
            >
              {cargandoTickets ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-2 self-start rounded-2xl border border-white/5 bg-[#07111f] p-2">
              {tickets.map((ticket) => (
                <TicketListButton
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedTicketId === ticket.id}
                  unread={hasUnreadResponse(ticket, seenResponses)}
                  onClick={() => abrirTicket(ticket)}
                />
              ))}

              {tickets.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#07111f] p-8 text-center text-zinc-500">
                  Todavia no hay tickets enviados desde esta instalacion.
                </div>
              )}
            </div>

            <TicketDetail
              ticket={selectedTicket}
              replyValue={
                selectedTicket ? ticketReplies[selectedTicket.id] || "" : ""
              }
              sending={Boolean(
                selectedTicket && respondiendoTicket === selectedTicket.id
              )}
              onReplyChange={(value) => {
                if (!selectedTicket) return;

                setTicketReplies((actuales) => ({
                  ...actuales,
                  [selectedTicket.id]: value,
                }));
              }}
              onReply={() => {
                if (selectedTicket) {
                  responderTicket(selectedTicket);
                }
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function TicketListButton({
  ticket,
  selected,
  unread,
  onClick,
}: {
  ticket: SupportTicket;
  selected: boolean;
  unread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-emerald-400/40 bg-emerald-500/10"
          : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-white">{ticket.asunto}</h3>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {ticket.categoria} · #{ticket.id.slice(0, 8)}
          </p>
        </div>

        {unread && (
          <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black uppercase text-black">
            Nuevo
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
            estadoStyles[ticket.estado]
          }`}
        >
          {estadoLabels[ticket.estado]}
        </span>
        <span className="text-xs text-zinc-500">
          {new Date(ticket.created_at).toLocaleDateString("es-AR")}
        </span>
      </div>
    </button>
  );
}

function TicketDetail({
  ticket,
  replyValue,
  sending,
  onReplyChange,
  onReply,
}: {
  ticket: SupportTicket | null;
  replyValue: string;
  sending: boolean;
  onReplyChange: (value: string) => void;
  onReply: () => void;
}) {
  if (!ticket) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#07111f] p-8 text-center text-zinc-500">
        Selecciona un ticket para ver el detalle y la respuesta.
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-white/5 bg-[#07111f] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
              estadoStyles[ticket.estado]
            }`}
          >
            {estadoLabels[ticket.estado]}
          </span>

          <h3 className="mt-3 text-lg font-bold text-white">{ticket.asunto}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {ticket.categoria} ·{" "}
            {new Date(ticket.created_at).toLocaleString("es-AR")}
          </p>
        </div>

        <span className="text-xs text-zinc-500">#{ticket.id.slice(0, 8)}</span>
      </div>

      <div className="mt-4 grid gap-3">
        {(ticket.mensajes && ticket.mensajes.length > 0
          ? ticket.mensajes
          : [
              {
                id: `${ticket.id}-descripcion`,
                ticket_id: ticket.id,
                autor: "cliente" as const,
                mensaje: ticket.descripcion,
                created_at: ticket.created_at,
              },
            ]
        ).map((mensaje) => (
          <div
            key={mensaje.id}
            className={`rounded-2xl border px-4 py-3 ${
              mensaje.autor === "soporte"
                ? "border-emerald-400/20 bg-emerald-500/10"
                : "border-white/5 bg-white/[0.03]"
            }`}
          >
            <p
              className={`text-xs font-bold uppercase ${
                mensaje.autor === "soporte"
                  ? "text-emerald-300"
                  : "text-zinc-500"
              }`}
            >
              {mensaje.autor === "soporte" ? "Soporte" : "Tu mensaje"} ·{" "}
              {new Date(mensaje.created_at).toLocaleString("es-AR")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
              {mensaje.mensaje}
            </p>
          </div>
        ))}
      </div>

      {!ticket.respuesta && (
        <p className="mt-4 text-sm text-zinc-500">
          Todavia no hay respuesta. Cuando soporte actualice el ticket vas a
          verlo aca.
        </p>
      )}

      {ticket.estado !== "cerrado" ? (
        <div className="mt-4 grid gap-3">
          <textarea
            value={replyValue}
            onChange={(event) => onReplyChange(event.target.value)}
            placeholder="Responder en este ticket..."
            className="support-input min-h-28 resize-y"
          />
          <button
            onClick={onReply}
            disabled={sending}
            className="justify-self-end rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Enviando..." : "Responder ticket"}
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
          Este ticket fue cerrado. Si necesitas continuar, crea un nuevo ticket.
        </p>
      )}
    </article>
  );
}

function hasUnreadResponse(
  ticket: SupportTicket,
  seenResponses: Record<string, string>
) {
  return Boolean(
    ticket.respuesta &&
      ticket.last_support_reply_at &&
      seenResponses[ticket.id] !== ticket.last_support_reply_at
  );
}

function loadSeenResponses() {
  try {
    const raw = window.localStorage.getItem("premos_support_seen");
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveSeenResponses(seenResponses: Record<string, string>) {
  window.localStorage.setItem(
    "premos_support_seen",
    JSON.stringify(seenResponses)
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-500">
      {label}
      {children}
    </label>
  );
}
