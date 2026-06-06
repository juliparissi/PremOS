"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../../lib/supabase";

const condicionesIva = [
  "Responsable Monotributo",
  "Responsable inscripto",
  "Consumidor final",
  "Exento",
  "No responsable",
  "Sujeto no categorizado",
];

const tiposComprobante = [
  "Factura A",
  "Factura B",
  "Factura C",
  "Factura M",
  "Nota de credito A",
  "Nota de credito B",
  "Nota de credito C",
  "Nota de debito A",
  "Nota de debito B",
  "Nota de debito C",
  "Recibo A",
  "Recibo B",
  "Recibo C",
];

const modalidades = [
  "Electronica ARCA",
  "Manual / talonario",
  "Controlador fiscal",
  "MiPyME / FCE",
  "Exportacion",
];

const configFiscalVacia = {
  razon_social: "",
  nombre_fantasia: "",
  cuit: "",
  condicion_iva: "Responsable Monotributo",
  ingresos_brutos: "",
  fecha_inicio_actividades: "",
  domicilio_fiscal: "",
  domicilio_comercial: "",
  punto_venta: "0001",
  tipo_comprobante_default: "Factura C",
  modalidad_comprobante: "Electronica ARCA",
  alicuota_iva: "21",
  ambiente_arca: "Homologacion",
  observaciones: "",
};

export default function DatosFiscalesPage() {
  const [idConfig, setIdConfig] = useState<string | null>(null);
  const [form, setForm] = useState(configFiscalVacia);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatosFiscales();
  }, []);

  async function cargarDatosFiscales() {
    const { data, error } = await supabase
      .from("configuracion_fiscal")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    setIdConfig(data.id);
    setForm({
      razon_social: data.razon_social || "",
      nombre_fantasia: data.nombre_fantasia || "",
      cuit: data.cuit || "",
      condicion_iva: data.condicion_iva || "Responsable Monotributo",
      ingresos_brutos: data.ingresos_brutos || "",
      fecha_inicio_actividades: data.fecha_inicio_actividades || "",
      domicilio_fiscal: data.domicilio_fiscal || "",
      domicilio_comercial: data.domicilio_comercial || "",
      punto_venta: data.punto_venta || "0001",
      tipo_comprobante_default:
        data.tipo_comprobante_default || "Factura C",
      modalidad_comprobante:
        data.modalidad_comprobante || "Electronica ARCA",
      alicuota_iva: String(data.alicuota_iva || "21"),
      ambiente_arca: data.ambiente_arca || "Homologacion",
      observaciones: data.observaciones || "",
    });
  }

  function actualizar(campo: keyof typeof configFiscalVacia, valor: string) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function guardarDatosFiscales() {
    setGuardando(true);
    setMensaje("");

    const payload = {
      razon_social: form.razon_social.trim(),
      nombre_fantasia: form.nombre_fantasia.trim(),
      cuit: form.cuit.trim(),
      condicion_iva: form.condicion_iva,
      ingresos_brutos: form.ingresos_brutos.trim(),
      fecha_inicio_actividades: form.fecha_inicio_actividades || null,
      domicilio_fiscal: form.domicilio_fiscal.trim(),
      domicilio_comercial: form.domicilio_comercial.trim(),
      punto_venta: form.punto_venta.trim(),
      tipo_comprobante_default: form.tipo_comprobante_default,
      modalidad_comprobante: form.modalidad_comprobante,
      alicuota_iva: Number(form.alicuota_iva || 0),
      ambiente_arca: form.ambiente_arca,
      observaciones: form.observaciones.trim(),
      updated_at: new Date(),
    };

    const { data, error } = idConfig
      ? await supabase
          .from("configuracion_fiscal")
          .update(payload)
          .eq("id", idConfig)
          .select()
          .single()
      : await supabase
          .from("configuracion_fiscal")
          .insert([payload])
          .select()
          .single();

    setGuardando(false);

    if (error) {
      setMensaje(
        "No se pudieron guardar los datos fiscales. Ejecuta la query de Supabase si aun no existe la tabla."
      );
      return;
    }

    setIdConfig(data?.id || idConfig);
    setMensaje("Datos fiscales guardados correctamente.");
  }

  return (
    <div className="pb-24">
      <BackButton
        href="/configuracion"
        label="Volver a configuracion"
        showDesktop
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Datos Fiscales
        </h1>
        <p className="text-zinc-500 mt-1">
          Datos del emisor para comprobantes internos y futura conexion ARCA.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <section className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Datos del emisor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field
              label="Razon social"
              value={form.razon_social}
              onChange={(value) => actualizar("razon_social", value)}
            />
            <Field
              label="Nombre de fantasia"
              value={form.nombre_fantasia}
              onChange={(value) => actualizar("nombre_fantasia", value)}
            />
            <Field
              label="CUIT"
              value={form.cuit}
              onChange={(value) => actualizar("cuit", value)}
            />
            <SelectField
              label="Condicion frente al IVA"
              value={form.condicion_iva}
              options={condicionesIva}
              onChange={(value) => actualizar("condicion_iva", value)}
            />
            <Field
              label="Ingresos brutos"
              value={form.ingresos_brutos}
              onChange={(value) => actualizar("ingresos_brutos", value)}
            />
            <Field
              label="Inicio de actividades"
              type="date"
              value={form.fecha_inicio_actividades}
              onChange={(value) =>
                actualizar("fecha_inicio_actividades", value)
              }
            />
            <Field
              label="Domicilio fiscal"
              value={form.domicilio_fiscal}
              onChange={(value) => actualizar("domicilio_fiscal", value)}
            />
            <Field
              label="Domicilio comercial"
              value={form.domicilio_comercial}
              onChange={(value) => actualizar("domicilio_comercial", value)}
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              Emision por defecto
            </h2>

            <div className="space-y-5">
              <Field
                label="Punto de venta"
                value={form.punto_venta}
                onChange={(value) => actualizar("punto_venta", value)}
              />
              <SelectField
                label="Tipo de comprobante por defecto"
                value={form.tipo_comprobante_default}
                options={tiposComprobante}
                onChange={(value) =>
                  actualizar("tipo_comprobante_default", value)
                }
              />
              <SelectField
                label="Modalidad"
                value={form.modalidad_comprobante}
                options={modalidades}
                onChange={(value) =>
                  actualizar("modalidad_comprobante", value)
                }
              />
              <SelectField
                label="Alicuota IVA"
                value={form.alicuota_iva}
                options={["21", "10.5", "27", "0"]}
                onChange={(value) => actualizar("alicuota_iva", value)}
              />
              <SelectField
                label="Ambiente ARCA"
                value={form.ambiente_arca}
                options={["Homologacion", "Produccion"]}
                onChange={(value) => actualizar("ambiente_arca", value)}
              />
            </div>
          </div>

          <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Conexion ARCA
            </h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Los certificados y claves privadas no se cargan desde esta pantalla.
              Cuando conectemos ARCA real, esos archivos se van a configurar en
              el servidor para mantenerlos protegidos.
            </p>

            <textarea
              value={form.observaciones}
              onChange={(event) =>
                actualizar("observaciones", event.target.value)
              }
              placeholder="Observaciones internas sobre facturacion"
              rows={4}
              className="w-full mt-5 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none resize-none"
            />
          </div>

          <button
            onClick={guardarDatosFiscales}
            disabled={guardando}
            className="w-full bg-emerald-500 hover:bg-emerald-400 transition px-5 py-4 rounded-2xl font-medium text-black disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar datos fiscales"}
          </button>

          {mensaje && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl p-4 text-sm">
              {mensaje}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-zinc-500 text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-zinc-500 text-sm">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
