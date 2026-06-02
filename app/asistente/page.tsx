"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";
import {
  canUseModule,
  normalizePlan,
  type PremosModule,
  type PremosPlan,
} from "../../lib/planes";

type Mensaje = {
  tipo: "usuario" | "ia";
  contenido: string;
};

const quickModules: Array<{
  href: string;
  label: string;
  module: PremosModule;
}> = [
  { href: "/pedidos", label: "Pedidos", module: "pedidos" },
  { href: "/economia", label: "Economía", module: "economia" },
  { href: "/produccion", label: "Producción", module: "produccion" },
  { href: "/resumen", label: "Resumen", module: "resumen" },
  { href: "/reportes", label: "Reportes", module: "reportes" },
  { href: "/clientes", label: "Clientes", module: "clientes" },
];

export default function HomePage() {
  const [mensaje, setMensaje] = useState("");
  const [plan, setPlan] = useState<PremosPlan>("full");

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      tipo: "ia",
      contenido:
        "Hola. Soy el Asistente PremOS. Preguntame sobre pedidos, producción, economía o clientes.",
    },
  ]);

  const mensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlan(normalizePlan(window.localStorage.getItem("premos_plan")));
  }, []);

  useEffect(() => {
    mensajesRef.current?.scrollTo({
      top: mensajesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [mensajes]);

  async function enviarMensaje() {
    if (!mensaje.trim()) return;

    const nuevoMensaje: Mensaje = {
      tipo: "usuario",
      contenido: mensaje,
    };

    setMensajes((prev) => [
      ...prev,
      nuevoMensaje,
    ]);

    const mensajeActual = mensaje;

    setMensaje("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMensajes((prev) => [
          ...prev,
          {
            tipo: "ia",
            contenido:
              "Necesitás iniciar sesión para usar el asistente.",
          },
        ]);

        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mensaje: mensajeActual,
        }),
      });

      const data = await res.json();

      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ia",
          contenido:
            data.respuesta ||
            "No pude responder.",
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ia",
          contenido:
            "Error conectando IA.",
        },
      ]);
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="mb-2 md:mb-6 shrink-0">
        <h1 className="hidden md:block text-3xl font-bold mb-1 text-white">
          Asistente PremOS
        </h1>
      </div>

      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-2 pb-8 md:p-4 flex flex-col flex-1 max-h-[72vh] md:max-h-full overflow-hidden min-h-0">
        <div className="mb-2 md:mb-6 shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-emerald-400">
            Chat PremOS IA
          </h2>

          <p className="text-zinc-500 text-xs mt-1">
            Consultá pedidos, economía, producción y reportes.
          </p>
        </div>

        <div
          ref={mensajesRef}
          className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1 md:pr-2 mb-3"
        >
          {mensajes.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[92%] md:max-w-3xl p-3 rounded-2xl text-sm break-words ${
                msg.tipo === "ia"
                  ? "bg-[#07111f] border border-white/5"
                  : "bg-emerald-500 text-[#07111f] ml-auto"
              }`}
            >
              {msg.tipo === "ia" && (
                <p className="text-emerald-400 text-xs mb-2 font-medium">
                  PremOS IA
                </p>
              )}

              <p
                className={
                  msg.tipo === "ia"
                    ? "text-white"
                    : "text-[#07111f]"
                }
              >
                {msg.contenido}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 md:gap-3 shrink-0">
          <textarea
            placeholder="Preguntale algo a PremOS..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
              }
            }}
            rows={1}
            className="flex-1 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-sm text-white placeholder:text-zinc-500 resize-none"
          />

          <button
            onClick={enviarMensaje}
            className="bg-emerald-500 hover:bg-emerald-400 transition px-4 md:px-5 rounded-2xl font-medium text-[#07111f] text-sm shrink-0"
          >
            Enviar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2 md:hidden">
        {quickModules
          .filter((item) =>
            canUseModule(plan, item.module)
          )
          .slice(0, 4)
          .map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-[#0b1727] border border-white/5 rounded-2xl p-4 active:scale-95 transition"
            >
              <p className="text-zinc-400 text-xs mb-2">
                Módulo
              </p>

              <h3 className="text-base font-bold text-white">
                {item.label}
              </h3>
            </a>
          ))}
      </div>
    </div>
  );
}
