"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function iniciarSesion() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {

      alert(
        "Usuario o contraseña incorrectos 😅"
      );

    } else {

      window.location.href = "/resumen";

    }

  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#050b14] relative flex items-center justify-center text-white">

      {/* Fondo */}
      <div className="fixed inset-0 overflow-hidden">

        {/* Glow verde */}
        <div className="absolute w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl top-[-200px] left-[-150px] animate-pulse" />

        {/* Glow cyan */}
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl bottom-[-180px] right-[-120px] animate-pulse" />

        {/* Grid */}
        <div className="absolute inset-0">

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:45px_45px]" />

          {/* Fade radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(5,11,20,0.2)_45%,rgba(5,11,20,0.7)_75%,#050b14_100%)]" />

        </div>

      </div>

      {/* Login */}
      <div className="relative z-10 w-full max-w-md px-4 flex items-center justify-center">

        <div className="bg-[#07111f]/80 border border-white/10 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl shadow-black/50 w-full">

          {/* Header */}
          <div className="text-center mb-8">

            <h1 className="text-4xl font-black mb-3 tracking-tight">

              <span className="text-white">
                Prem
              </span>

              <span className="text-emerald-400">
                OS
              </span>

            </h1>

            <p className="text-zinc-400 text-sm">
              Sistema operativo para premoldeados
            </p>

          </div>

          {/* Footer */}
<div className="absolute -bottom-8 left-[5px] text-center w-full text-zinc-500 text-xs">

  © Todos los derechos reservados de PremOS a BaldosasDuramax

</div>

          {/* Inputs */}
          <div className="space-y-5">

            {/* Mail */}
            <div>

              <label className="text-zinc-400 text-sm mb-2 block">
                Correo electrónico
              </label>

              <input
                type="email"
                placeholder="empresa@correo.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full bg-[#050b14] border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-emerald-500 transition"
              />

            </div>

            {/* Password */}
            <div>

              <label className="text-zinc-400 text-sm mb-2 block">
                Contraseña
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-[#050b14] border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-emerald-500 transition"
              />

            </div>

            {/* Opciones */}
            <div className="flex items-center justify-between text-sm pt-1">

              <label className="flex items-center gap-2 text-zinc-400">

                <input
                  type="checkbox"
                  className="accent-emerald-500"
                />

                Recordarme

              </label>

              <button className="text-emerald-400 hover:text-emerald-300 transition">
                Recuperar acceso
              </button>

            </div>

            {/* Botón */}
            <button
              onClick={iniciarSesion}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-2xl transition shadow-lg shadow-emerald-500/20 mt-4"
            >

              Ingresar a PremOS

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}