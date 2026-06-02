"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";
import {
  canUseModule,
  moduleForPath,
  normalizePlan,
  planLabels,
  type PremosModule,
  type PremosPlan,
} from "../lib/planes";

type NavItem = {
  href: string;
  label: string;
  module: PremosModule;
};

const navItems: NavItem[] = [
  { href: "/asistente", label: "Asistente", module: "asistente" },
  { href: "/resumen", label: "Resumen", module: "resumen" },
  { href: "/reportes", label: "Reportes", module: "reportes" },
  { href: "/clientes", label: "Clientes", module: "clientes" },
  { href: "/productos", label: "Productos", module: "productos" },
  { href: "/presupuestos", label: "Presupuestos", module: "presupuestos" },
  { href: "/pedidos", label: "Pedidos", module: "pedidos" },
  { href: "/produccion", label: "Producción", module: "produccion" },
  { href: "/economia", label: "Economía", module: "economia" },
  { href: "/suministro", label: "Suministro", module: "suministro" },
  { href: "/stock", label: "Stock", module: "stock" },
  { href: "/configuracion", label: "Configuración", module: "configuracion" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esLogin = pathname === "/";

  const [plan, setPlan] = useState<PremosPlan>("full");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canUseModule(plan, item.module)),
    [plan]
  );

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

  useEffect(() => {
    const savedPlan = normalizePlan(
      window.localStorage.getItem("premos_plan")
    );
    const savedTheme =
      window.localStorage.getItem("premos_theme") === "light"
        ? "light"
        : "dark";

    setPlan(savedPlan);
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {
    const activeModule = moduleForPath(pathname);

    if (activeModule && !canUseModule(plan, activeModule)) {
      window.location.href = "/resumen";
    }
  }, [pathname, plan]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <html lang="es">
      <head>
        <title>PremOS</title>

        <meta
          name="description"
          content="Sistema operativo para premoldeados"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="PremOS"
        />

        <link
          rel="apple-touch-icon"
          href="/apple-icon.png"
        />
      </head>

      <body
        className="bg-[#07111f] text-white"
        data-theme={theme}
      >
        <main className="flex h-screen overflow-hidden">
          {!esLogin && (
            <aside className="hidden md:flex w-52 bg-[#081220] border-r border-white/5 p-6 flex-col overflow-y-auto sidebar-scroll">
              <div className="mb-5">
                <h1 className="text-3xl font-bold text-emerald-400">
                  PremOS
                </h1>

                <p className="text-xs text-zinc-500 mt-1">
                  {planLabels[plan]}
                </p>
              </div>

              <button
                onClick={cerrarSesion}
                className="mb-4 bg-red-500/10 hover:bg-red-500/30 text-red-400 transition px-4 py-2 rounded-xl border border-red-500/20 text-sm"
              >
                Cerrar sesión
              </button>

              <nav className="flex flex-col gap-3 text-zinc-300 mt-4">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:bg-white/5 px-4 py-3 rounded-xl transition block"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          )}

          <section
            className={`
              flex-1
              overflow-y-auto
              overflow-x-hidden
              ${
                esLogin
                  ? "p-0"
                  : "px-4 py-4 md:px-8 md:py-6"
              }
            `}
          >
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}
