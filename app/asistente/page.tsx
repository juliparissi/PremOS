"use client";

import { useState } from "react";

type Mensaje = {
  tipo: "usuario" | "ia";
  contenido: string;
};

export default function HomePage() {

  const [mensaje, setMensaje] = useState("");

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      tipo: "ia",
      contenido:
        "Hola 👋 Soy el Asistente PremOS. Preguntame sobre pedidos, producción, economía o clientes.",
    },
  ]);

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

      const res = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
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
            "No pude responder 😅",
        },
      ]);

    } catch (error) {

      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ia",
          contenido:
            "Error conectando IA 😅",
        },
      ]);

    }

  }

  return (
    <div>

      {/* Header */}
      <div className="mb-6">

        <h1 className="text-3xl font-bold mb-2">
          Asistente PremOS
        </h1>

        <p className="text-zinc-500 text-sm">
          Consultá información del sistema en tiempo real.
        </p>

      </div>

      {/* Chat */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-4">

        {/* Header */}
        <div className="mb-4">

          <h2 className="text-xl font-semibold">
            Chat PremOS IA
          </h2>

          <p className="text-zinc-500 text-xs mt-1">
            Consultá pedidos, economía, producción y reportes.
          </p>

        </div>

        {/* Mensajes */}
        <div className="space-y-3 mb-5 max-h-[350px] overflow-y-auto pr-2">

          {mensajes.map((msg, index) => (

            <div
              key={index}
              className={`max-w-3xl p-3 rounded-2xl ${
                msg.tipo === "ia"
                  ? "bg-[#07111f] border border-white/5"
                  : "bg-emerald-500 text-black ml-auto"
              }`}
            >

              {msg.tipo === "ia" && (
                <p className="text-emerald-400 text-xs mb-2">
                  PremOS IA
                </p>
              )}

              <p className="text-sm">
                {msg.contenido}
              </p>

            </div>

          ))}

        </div>

        {/* Input */}
        <div className="flex gap-3 mt-70">

          <input
            type="text"
            placeholder="Preguntale algo a PremOS..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {

              if (e.key === "Enter") {
                enviarMensaje();
              }

            }}
            className="flex-1 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-2 outline-none text-sm"
          />

          <button
            onClick={enviarMensaje}
            className="bg-emerald-500 hover:bg-emerald-400 transition px-5 rounded-2xl font-medium text-black text-sm"
          >
            Enviar
          </button>

        </div>

      </div>

    </div>
  );
}