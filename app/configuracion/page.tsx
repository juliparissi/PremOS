"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import {
  empresaConfig,
  getEmpresaConfig,
  saveEmpresaConfig,
  type EmpresaConfig,
} from "../../lib/empresa";
import { checkPremosLicense, licenseConfigured } from "../../lib/licencia";
import { normalizePlan, planLabels, type PremosPlan } from "../../lib/planes";
import { supabase } from "../../lib/supabase";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<EmpresaConfig>(empresaConfig);
  const [plan, setPlan] = useState<PremosPlan>("full");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [guardado, setGuardado] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [passwordMensaje, setPasswordMensaje] = useState("");
  const [planAdministrado, setPlanAdministrado] =
    useState(licenseConfigured);

  useEffect(() => {
    setConfig(getEmpresaConfig());
    setPlan(normalizePlan(window.localStorage.getItem("premos_plan")));
    setTheme(
      window.localStorage.getItem("premos_theme") === "light"
        ? "light"
        : "dark"
    );

    async function cargarPlanLicencia() {
      if (!licenseConfigured) return;

      const result = await checkPremosLicense();

      if (result.plan) {
        const licensePlan = normalizePlan(result.plan);
        setPlan(licensePlan);
        window.localStorage.setItem("premos_plan", licensePlan);
      }

      setPlanAdministrado(true);
    }

    cargarPlanLicencia();
  }, []);

  function updateField(field: keyof EmpresaConfig, value: string) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function guardarConfiguracion() {
    saveEmpresaConfig(config);

    if (!planAdministrado) {
      window.localStorage.setItem("premos_plan", plan);
    }

    window.localStorage.setItem("premos_theme", theme);
    document.documentElement.dataset.theme = theme;

    setGuardado(true);

    setTimeout(() => {
      setGuardado(false);
    }, 2500);
  }

  function cargarLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateField("logo", String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  async function cambiarPassword() {
    setPasswordMensaje("");

    if (password.length < 8) {
      setPasswordMensaje("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== passwordConfirmacion) {
      setPasswordMensaje("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setPasswordMensaje("No se pudo actualizar la contraseña.");
      return;
    }

    setPassword("");
    setPasswordConfirmacion("");
    setPasswordMensaje("Contraseña actualizada correctamente.");
  }

  return (
    <>
      <BackButton />

      <div className="pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Configuración
          </h1>
          <p className="text-zinc-500 mt-1">
            Datos de empresa, plan activo y apariencia del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Datos para documentos
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Informacion comercial para PDFs, notas y presupuestos.
                </p>
              </div>

              <Link
                href="/configuracion/datos-fiscales"
                className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white transition px-4 py-3 rounded-2xl border border-cyan-500/20 text-sm text-center"
              >
                Datos fiscales
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigInput
                label="Nombre de empresa"
                value={config.nombre}
                onChange={(value) => updateField("nombre", value)}
              />
              <ConfigInput
                label="CUIT"
                value={config.cuit || ""}
                onChange={(value) => updateField("cuit", value)}
              />
              <ConfigInput
                label="Dirección"
                value={config.direccion}
                onChange={(value) => updateField("direccion", value)}
              />
              <ConfigInput
                label="Localidad"
                value={config.localidad}
                onChange={(value) => updateField("localidad", value)}
              />
              <ConfigInput
                label="Teléfono"
                value={config.telefono}
                onChange={(value) => updateField("telefono", value)}
              />
              <ConfigInput
                label="Email"
                value={config.email}
                onChange={(value) => updateField("email", value)}
              />
              <ConfigInput
                label="Logo por URL"
                value={config.logo}
                onChange={(value) => updateField("logo", value)}
              />

              <div>
                <label className="text-zinc-500 text-sm">
                  Cargar logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={cargarLogo}
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-5">
                Plan activo
              </h2>

              {planAdministrado ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                  <p className="text-sm text-zinc-400">
                    Plan asignado desde el panel administrador
                  </p>
                  <p className="text-2xl font-bold text-emerald-300 mt-2">
                    {planLabels[plan]}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["lite", "full", "pro"] as PremosPlan[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setPlan(item)}
                      className={`rounded-2xl border px-4 py-4 transition ${
                        plan === item
                          ? "bg-emerald-500 text-black border-emerald-500"
                          : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {planLabels[item]}
                    </button>
                  ))}
                </div>
              )}

            </div>

            <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-5">
                Apariencia
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    theme === "dark"
                      ? "bg-emerald-500 text-black border-emerald-500"
                      : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  Oscuro
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    theme === "light"
                      ? "bg-emerald-500 text-black border-emerald-500"
                      : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  Día
                </button>
              </div>
            </div>

            <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
              <h2 className="text-xl font-semibold mb-5">
                Acceso
              </h2>

              <div className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

                <input
                  type="password"
                  value={passwordConfirmacion}
                  onChange={(event) =>
                    setPasswordConfirmacion(event.target.value)
                  }
                  placeholder="Confirmar contraseña"
                  className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
                />

                <button
                  onClick={cambiarPassword}
                  className="w-full bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
                >
                  Cambiar contraseña
                </button>

                {passwordMensaje && (
                  <p className="text-sm text-zinc-400">
                    {passwordMensaje}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={guardarConfiguracion}
              className="w-full bg-emerald-500 hover:bg-emerald-400 transition px-5 py-4 rounded-2xl font-medium text-black"
            >
              Guardar configuración
            </button>

            {guardado && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-sm">
                Configuración guardada.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function ConfigInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-zinc-500 text-sm">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
      />
    </div>
  );
}

