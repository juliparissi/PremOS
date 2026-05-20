"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();

  const esLogin = pathname === "/";

  useEffect(() => {

  async function verificarSesion() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session && pathname !== "/") {

      window.location.href = "/";

    }

  }

  verificarSesion();

}, [pathname]);

  async function cerrarSesion() {

  await supabase.auth.signOut();

  window.location.href = "/";

}

  return (
    <html lang="es">

      <body className="bg-[#07111f] text-white">

        <main className="flex h-screen overflow-hidden">

          {/* Sidebar */}
          {!esLogin && (

            <aside className="w-52 bg-[#081220] border-r border-white/5 p-6 flex flex-col">

              <div className="mb-10">

                <h1 className="text-3xl font-bold text-emerald-400">
                  PremOS
                </h1>

                <button
  onClick={cerrarSesion}
  className="mt-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 transition px-4 py-1 rounded-xl border border-red-500/20 text-sm"
>
  Cerrar sesión
</button>

              </div>

              <nav className="flex flex-col gap-3 text-zinc-300 -mt-4">

                <Link
                  href="/asistente"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Asistente
                </Link>

                <Link
                  href="/resumen"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Resumen
                </Link>

                <Link
                  href="/clientes"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Clientes
                </Link>

                <Link
                  href="/productos"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Productos
                </Link>

                <Link
                  href="/presupuestos"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Presupuestos
                </Link>

                <Link
                  href="/pedidos"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Pedidos
                </Link>

                <Link
                  href="/produccion"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Producción
                </Link>

                <Link
                  href="/economia"
                  className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                >
                  Economía
                </Link>

              </nav>


            </aside>

          )}

          {/* Contenido */}
          <section className="flex-1 overflow-y-auto px-8 py-6">

            {children}

          </section>

        </main>

      </body>

    </html>
  );
}