"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";
import { demoMode } from "../lib/demo";
import { checkPremosLicense, type LicenseCheckResult } from "../lib/licencia";
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
  { href: "/ventas", label: "Ventas", module: "ventas" },
  { href: "/pedidos", label: "Pedidos", module: "pedidos" },
  { href: "/produccion", label: "Producción", module: "produccion" },
  { href: "/economia", label: "Economía", module: "economia" },
  { href: "/suministro", label: "Suministro", module: "suministro" },
  { href: "/stock", label: "Stock", module: "stock" },
  { href: "/soporte", label: "Soporte", module: "soporte" },
  { href: "/configuracion", label: "Configuración", module: "configuracion" },
];

function formatSidebarDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatSidebarTime(date: Date) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLicenseDaysLeft(vencimiento?: string) {
  if (!vencimiento) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiresAt = new Date(`${vencimiento}T00:00:00`);
  const diff = expiresAt.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esLogin = pathname === "/";

  const [plan, setPlan] = useState<PremosPlan>("full");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [now, setNow] = useState<Date | null>(null);
  const [license, setLicense] = useState<LicenseCheckResult>({
    configured: false,
    allowed: true,
    valid: true,
    reason: "checking",
  });
  const [checkingLicense, setCheckingLicense] = useState(true);

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canUseModule(plan, item.module)),
    [plan]
  );
  const licenseDaysLeft = getLicenseDaysLeft(license.vencimiento);

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
    const savedPlan = normalizePlan(window.localStorage.getItem("premos_plan"));
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

  useEffect(() => {
    setNow(new Date());

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    async function verificarLicencia() {
      const result = await checkPremosLicense();

      if (!active) return;

      setLicense(result);

      if (result.configured && result.plan) {
        const licensePlan = normalizePlan(result.plan);
        setPlan(licensePlan);
        window.localStorage.setItem("premos_plan", licensePlan);
      }

      setCheckingLicense(false);
    }

    verificarLicencia();

    const interval = window.setInterval(verificarLicencia, 10 * 60 * 1000);

    function verificarAlVolver() {
      if (document.visibilityState === "visible") {
        verificarLicencia();
      }
    }

    document.addEventListener("visibilitychange", verificarAlVolver);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", verificarAlVolver);
    };
  }, []);

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

        <meta name="apple-mobile-web-app-capable" content="yes" />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta name="apple-mobile-web-app-title" content="PremOS" />

        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>

      <body className="bg-[#07111f] text-white" data-theme={theme}>
        {checkingLicense ? (
          <LicenseLoading />
        ) : !license.allowed ? (
          <LicenseBlocked license={license} />
        ) : (
          <main className="flex h-screen overflow-hidden">
          {!esLogin && (
            <aside className="hidden md:flex w-52 bg-[#081220] border-r border-white/5 p-6 flex-col overflow-y-auto sidebar-scroll">
              <div className="mb-4 rounded-2xl border border-white/5 bg-[#07111f] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Fecha local
                </p>

                <p className="text-sm font-semibold text-white mt-1">
                  {now ? formatSidebarDate(now) : "--/--/----"}
                </p>

                <p className="text-xs uppercase tracking-wide text-zinc-500 mt-3">
                  Hora
                </p>

                <p className="text-lg font-bold text-cyan-300 mt-1">
                  {now ? formatSidebarTime(now) : "--:--"}
                </p>
              </div>

              <div className="mb-5">
                <h1 className="text-3xl font-bold text-emerald-400">
                  PremOS
                </h1>

                <p className="text-xs text-zinc-500 mt-1">
                  {demoMode ? "Entorno demo" : planLabels[plan]}
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
              ${esLogin ? "p-0" : "px-4 py-4 md:px-8 md:py-6"}
            `}
          >
            {demoMode && !esLogin && (
              <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-100">
                <span className="font-bold">Modo demo:</span> estas viendo
                datos de muestra para conocer el entorno. La instalacion final
                se adapta al proceso real de cada empresa.
              </div>
            )}

            {license.configured &&
              license.reason === "license_server_unreachable" &&
              !esLogin && (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
                  No se pudo verificar la licencia en este momento. El sistema
                  sigue habilitado temporalmente.
                </div>
              )}

            {license.configured &&
              typeof licenseDaysLeft === "number" &&
              licenseDaysLeft >= 0 &&
              licenseDaysLeft <= 7 &&
              !esLogin && (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
                  <span className="font-bold">Aviso de suscripcion:</span>{" "}
                  tu suscripcion vence en {licenseDaysLeft}{" "}
                  {licenseDaysLeft === 1 ? "dia" : "dias"}. Por favor,
                  contacta con soporte para renovarla.
                </div>
              )}

            {children}
          </section>
        </main>
        )}
      </body>
    </html>
  );
}

function LicenseLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#07111f] px-5">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1727] p-6 text-center shadow-2xl shadow-black/30">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">
          PremOS
        </p>
        <h1 className="mt-3 text-2xl font-black text-white">
          Verificando licencia
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Estamos validando el estado del servicio.
        </p>
      </section>
    </main>
  );
}

function LicenseBlocked({ license }: { license: LicenseCheckResult }) {
  const reasonText: Record<string, string> = {
    expired: "La licencia se encuentra vencida.",
    suspendido: "El servicio fue suspendido.",
    vencido: "La suscripcion figura vencida.",
    license_not_found: "No se encontro una licencia valida para este sistema.",
    license_server_not_configured:
      "El servidor de licencias no esta configurado correctamente.",
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#07111f] px-5">
      <section className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-[#0b1727] p-7 text-center shadow-2xl shadow-black/30">
        <p className="text-sm font-bold uppercase tracking-wide text-red-300">
          Servicio no disponible
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">
          PremOS esta suspendido
        </h1>
        <p className="mt-3 text-zinc-300">
          {reasonText[license.reason] ||
            "La licencia no esta habilitada para usar el sistema."}
        </p>
        {license.empresa && (
          <p className="mt-4 rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-zinc-400">
            Cliente:{" "}
            <span className="font-bold text-white">{license.empresa}</span>
          </p>
        )}
        <p className="mt-5 text-sm text-zinc-500">
          Para reactivar el acceso, comunicate con el proveedor del sistema.
        </p>
      </section>
    </main>
  );
}
