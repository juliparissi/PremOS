"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "../../lib/supabase";

type Empleado = {
  id: string;
  nombre: string;
  dni?: string;
  cuil?: string;
  telefono?: string;
  mail?: string;
  puesto?: string;
  fecha_ingreso?: string;
  sueldo_base?: number;
  estado?: string;
  observaciones?: string;
};

type MovimientoNomina = {
  id: string;
  empleado_id: string;
  tipo: string;
  periodo?: string;
  monto: number;
  metodo_pago?: string;
  observaciones?: string;
  fecha?: string;
  economia_movimiento_id?: string;
  nomina_empleados?: {
    nombre?: string;
    puesto?: string;
  };
};

const empleadoVacio = {
  nombre: "",
  dni: "",
  cuil: "",
  telefono: "",
  mail: "",
  puesto: "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
  sueldo_base: "",
  estado: "Activo",
  observaciones: "",
};

const movimientoVacio = {
  empleado_id: "",
  tipo: "Adelanto",
  periodo: "",
  monto: "",
  metodo_pago: "Efectivo",
  fecha: new Date().toISOString().split("T")[0],
  observaciones: "",
};

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("es-AR");
}

function formatDate(value?: string) {
  if (!value) return "-";
  return value.split("-").reverse().join("/");
}

export default function NominaPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoNomina[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalEmpleado, setModalEmpleado] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState<Empleado | null>(
    null
  );
  const [formEmpleado, setFormEmpleado] = useState(empleadoVacio);
  const [formMovimiento, setFormMovimiento] = useState(movimientoVacio);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [{ data: empleadosData }, { data: movimientosData }] =
      await Promise.all([
        supabase
          .from("nomina_empleados")
          .select("*")
          .order("nombre", { ascending: true }),
        supabase
          .from("nomina_movimientos")
          .select("*, nomina_empleados(nombre, puesto)")
          .order("created_at", { ascending: false }),
      ]);

    if (empleadosData) {
      setEmpleados(empleadosData as Empleado[]);
    }

    if (movimientosData) {
      setMovimientos(movimientosData as MovimientoNomina[]);
    }
  }

  function abrirEmpleadoNuevo() {
    setEmpleadoEditando(null);
    setFormEmpleado(empleadoVacio);
    setModalEmpleado(true);
  }

  function abrirEmpleadoEdicion(empleado: Empleado) {
    setEmpleadoEditando(empleado);
    setFormEmpleado({
      nombre: empleado.nombre || "",
      dni: empleado.dni || "",
      cuil: empleado.cuil || "",
      telefono: empleado.telefono || "",
      mail: empleado.mail || "",
      puesto: empleado.puesto || "",
      fecha_ingreso:
        empleado.fecha_ingreso || new Date().toISOString().split("T")[0],
      sueldo_base: String(empleado.sueldo_base || ""),
      estado: empleado.estado || "Activo",
      observaciones: empleado.observaciones || "",
    });
    setModalEmpleado(true);
  }

  function abrirMovimientoNuevo(empleado?: Empleado) {
    setFormMovimiento({
      ...movimientoVacio,
      empleado_id: empleado?.id || "",
      periodo: new Date().toLocaleDateString("es-AR", {
        month: "2-digit",
        year: "numeric",
      }),
    });
    setModalMovimiento(true);
  }

  async function guardarEmpleado() {
    if (!formEmpleado.nombre.trim()) {
      alert("Ingresa el nombre del empleado.");
      return;
    }

    setGuardando(true);

    const payload = {
      nombre: formEmpleado.nombre.trim(),
      dni: formEmpleado.dni.trim(),
      cuil: formEmpleado.cuil.trim(),
      telefono: formEmpleado.telefono.trim(),
      mail: formEmpleado.mail.trim(),
      puesto: formEmpleado.puesto.trim(),
      fecha_ingreso: formEmpleado.fecha_ingreso || null,
      sueldo_base: Number(formEmpleado.sueldo_base || 0),
      estado: formEmpleado.estado,
      observaciones: formEmpleado.observaciones.trim(),
    };

    const { error } = empleadoEditando
      ? await supabase
          .from("nomina_empleados")
          .update(payload)
          .eq("id", empleadoEditando.id)
      : await supabase.from("nomina_empleados").insert([payload]);

    setGuardando(false);

    if (error) {
      alert("No se pudo guardar el empleado.");
      return;
    }

    setModalEmpleado(false);
    setEmpleadoEditando(null);
    setFormEmpleado(empleadoVacio);
    cargarDatos();
  }

  async function guardarMovimiento() {
    const empleado = empleados.find(
      (item) => item.id === formMovimiento.empleado_id
    );
    const monto = Number(formMovimiento.monto || 0);

    if (!empleado) {
      alert("Selecciona un empleado.");
      return;
    }

    if (monto <= 0) {
      alert("Ingresa un monto valido.");
      return;
    }

    setGuardando(true);

    const concepto = `${formMovimiento.tipo} nomina - ${empleado.nombre}`;

    const { data: economiaData, error: economiaError } = await supabase
      .from("movimientos_economia")
      .insert([
        {
          tipo: "Gasto",
          concepto,
          detalle: "Nomina",
          monto_total: monto,
          monto_abonado: monto,
          saldo_pendiente: 0,
          fecha: formMovimiento.fecha,
        },
      ])
      .select("id")
      .single();

    if (economiaError) {
      setGuardando(false);
      alert("No se pudo registrar la salida en economia.");
      return;
    }

    const { error } = await supabase.from("nomina_movimientos").insert([
      {
        empleado_id: empleado.id,
        tipo: formMovimiento.tipo,
        periodo: formMovimiento.periodo.trim(),
        monto,
        metodo_pago: formMovimiento.metodo_pago,
        observaciones: formMovimiento.observaciones.trim(),
        fecha: formMovimiento.fecha,
        economia_movimiento_id: economiaData?.id,
      },
    ]);

    setGuardando(false);

    if (error) {
      if (economiaData?.id) {
        await supabase
          .from("movimientos_economia")
          .delete()
          .eq("id", economiaData.id);
      }

      alert("No se pudo guardar el movimiento de nomina.");
      return;
    }

    setModalMovimiento(false);
    setFormMovimiento(movimientoVacio);
    cargarDatos();
  }

  async function eliminarMovimiento(movimiento: MovimientoNomina) {
    const confirma = confirm(
      `Eliminar ${movimiento.tipo.toLowerCase()} por $${formatMoney(
        movimiento.monto
      )}? Tambien se quitara de Economia.`
    );

    if (!confirma) return;

    await supabase
      .from("nomina_movimientos")
      .delete()
      .eq("id", movimiento.id);

    if (movimiento.economia_movimiento_id) {
      await supabase
        .from("movimientos_economia")
        .delete()
        .eq("id", movimiento.economia_movimiento_id);
    }

    cargarDatos();
  }

  async function cambiarEstadoEmpleado(empleado: Empleado) {
    const nuevoEstado = empleado.estado === "Activo" ? "Inactivo" : "Activo";

    await supabase
      .from("nomina_empleados")
      .update({ estado: nuevoEstado })
      .eq("id", empleado.id);

    cargarDatos();
  }

  const empleadosFiltrados = empleados.filter((empleado) => {
    const texto = `${empleado.nombre || ""} ${empleado.puesto || ""} ${
      empleado.dni || ""
    } ${empleado.cuil || ""}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const empleadosActivos = empleados.filter(
    (empleado) => empleado.estado !== "Inactivo"
  );

  const totalSueldos = empleadosActivos.reduce(
    (total, empleado) => total + Number(empleado.sueldo_base || 0),
    0
  );

  const totalMes = useMemo(() => {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();

    return movimientos.reduce((total, movimiento) => {
      if (!movimiento.fecha) return total;

      const fecha = new Date(`${movimiento.fecha}T00:00:00`);
      if (fecha.getMonth() !== mes || fecha.getFullYear() !== anio) {
        return total;
      }

      return total + Number(movimiento.monto || 0);
    }, 0);
  }, [movimientos]);

  const adelantosMes = useMemo(() => {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();

    return movimientos.filter((movimiento) => {
      if (movimiento.tipo !== "Adelanto" || !movimiento.fecha) return false;

      const fecha = new Date(`${movimiento.fecha}T00:00:00`);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    }).length;
  }, [movimientos]);

  return (
    <div>
      <BackButton />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Nomina
          </h1>

          <p className="text-zinc-500 mt-1">
            Empleados, sueldos, adelantos y salidas automaticas de caja
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={() => abrirMovimientoNuevo()}
            className="bg-cyan-500 hover:bg-cyan-400 transition px-5 py-3 rounded-2xl font-medium text-black"
          >
            Registrar pago
          </button>

          <button
            onClick={abrirEmpleadoNuevo}
            className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium text-black"
          >
            Alta empleado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Empleados activos" value={empleadosActivos.length} />
        <Kpi label="Sueldos base" value={`$${formatMoney(totalSueldos)}`} />
        <Kpi label="Pagado este mes" value={`$${formatMoney(totalMes)}`} />
        <Kpi label="Adelantos" value={adelantosMes} />
      </div>

      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
        />
      </div>

      <div className="hidden md:block bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden mb-8">
        <div className="grid grid-cols-7 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
          <div>Empleado</div>
          <div>Puesto</div>
          <div>Ingreso</div>
          <div>Sueldo base</div>
          <div>Telefono</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        {empleadosFiltrados.map((empleado) => (
          <div
            key={empleado.id}
            className="grid grid-cols-7 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition text-white"
          >
            <div>
              <p className="font-semibold">{empleado.nombre}</p>
              <p className="text-xs text-zinc-500">{empleado.cuil || "-"}</p>
            </div>
            <div>{empleado.puesto || "-"}</div>
            <div>{formatDate(empleado.fecha_ingreso)}</div>
            <div>${formatMoney(empleado.sueldo_base)}</div>
            <div>{empleado.telefono || "-"}</div>
            <div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  empleado.estado === "Inactivo"
                    ? "bg-zinc-500/20 text-zinc-300"
                    : "bg-emerald-400/15 text-emerald-300"
                }`}
              >
                {empleado.estado || "Activo"}
              </span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => abrirMovimientoNuevo(empleado)}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Pago
              </button>
              <button
                onClick={() => abrirEmpleadoEdicion(empleado)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Editar
              </button>
              <button
                onClick={() => cambiarEstadoEmpleado(empleado)}
                className="text-zinc-400 hover:text-white"
              >
                {empleado.estado === "Inactivo" ? "Activar" : "Baja"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-4 mb-8">
        {empleadosFiltrados.map((empleado) => (
          <div
            key={empleado.id}
            className="bg-[#0b1727] border border-white/5 rounded-3xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {empleado.nombre}
                </h2>
                <p className="text-sm text-zinc-500">
                  {empleado.puesto || "Sin puesto"}
                </p>
              </div>

              <span className="text-sm text-emerald-300">
                {empleado.estado || "Activo"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Info label="Sueldo" value={`$${formatMoney(empleado.sueldo_base)}`} />
              <Info label="Ingreso" value={formatDate(empleado.fecha_ingreso)} />
              <Info label="Telefono" value={empleado.telefono || "-"} />
              <Info label="CUIL" value={empleado.cuil || "-"} />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => abrirMovimientoNuevo(empleado)}
                className="flex-1 bg-emerald-500 px-4 py-3 rounded-2xl text-black font-medium"
              >
                Pago
              </button>
              <button
                onClick={() => abrirEmpleadoEdicion(empleado)}
                className="flex-1 bg-white/5 px-4 py-3 rounded-2xl border border-white/5"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5">
          <h2 className="text-2xl font-semibold text-white">
            Movimientos de nomina
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Cada registro impacta automaticamente como salida en Economia
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 min-w-[850px] px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">
            <div>Fecha</div>
            <div>Empleado</div>
            <div>Tipo</div>
            <div>Periodo</div>
            <div>Monto</div>
            <div className="text-right">Acciones</div>
          </div>

          {movimientos.slice(0, 15).map((movimiento) => (
            <div
              key={movimiento.id}
              className="grid grid-cols-6 min-w-[850px] px-6 py-5 border-b border-white/5 hover:bg-white/5 transition text-white"
            >
              <div>{formatDate(movimiento.fecha)}</div>
              <div>
                <p className="font-semibold">
                  {movimiento.nomina_empleados?.nombre || "-"}
                </p>
                <p className="text-xs text-zinc-500">
                  {movimiento.nomina_empleados?.puesto || ""}
                </p>
              </div>
              <div>{movimiento.tipo}</div>
              <div>{movimiento.periodo || "-"}</div>
              <div className="text-red-400">
                -${formatMoney(movimiento.monto)}
              </div>
              <div className="text-right">
                <button
                  onClick={() => eliminarMovimiento(movimiento)}
                  className="text-red-400 hover:text-red-300"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalEmpleado && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-4xl p-5 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalEmpleado(false)}
              className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              x
            </button>

            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {empleadoEditando ? "Editar empleado" : "Alta empleado"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Nombre"
                value={formEmpleado.nombre}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, nombre: value }))
                }
              />
              <Field
                label="Puesto"
                value={formEmpleado.puesto}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, puesto: value }))
                }
              />
              <Field
                label="DNI"
                value={formEmpleado.dni}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, dni: value }))
                }
              />
              <Field
                label="CUIL"
                value={formEmpleado.cuil}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, cuil: value }))
                }
              />
              <Field
                label="Telefono"
                value={formEmpleado.telefono}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, telefono: value }))
                }
              />
              <Field
                label="Mail"
                value={formEmpleado.mail}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({ ...actual, mail: value }))
                }
              />
              <Field
                label="Fecha de ingreso"
                type="date"
                value={formEmpleado.fecha_ingreso}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({
                    ...actual,
                    fecha_ingreso: value,
                  }))
                }
              />
              <Field
                label="Sueldo base"
                type="number"
                value={formEmpleado.sueldo_base}
                onChange={(value) =>
                  setFormEmpleado((actual) => ({
                    ...actual,
                    sueldo_base: value,
                  }))
                }
              />

              <div>
                <label className="text-zinc-500 text-sm">Estado</label>
                <select
                  value={formEmpleado.estado}
                  onChange={(e) =>
                    setFormEmpleado((actual) => ({
                      ...actual,
                      estado: e.target.value,
                    }))
                  }
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-zinc-500 text-sm">Observaciones</label>
              <textarea
                value={formEmpleado.observaciones}
                onChange={(e) =>
                  setFormEmpleado((actual) => ({
                    ...actual,
                    observaciones: e.target.value,
                  }))
                }
                className="w-full min-h-28 mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
              />
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={guardarEmpleado}
                disabled={guardando}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium text-black disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar empleado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMovimiento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-5 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalMovimiento(false)}
              className="absolute top-5 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              x
            </button>

            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Registrar pago de nomina
              </h2>
              <p className="text-zinc-500 mt-1">
                Se guardara como salida de caja en Economia
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-zinc-500 text-sm">Empleado</label>
                <select
                  value={formMovimiento.empleado_id}
                  onChange={(e) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      empleado_id: e.target.value,
                    }))
                  }
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
                >
                  <option value="">Seleccionar empleado</option>
                  {empleadosActivos.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-zinc-500 text-sm">Tipo</label>
                  <select
                    value={formMovimiento.tipo}
                    onChange={(e) =>
                      setFormMovimiento((actual) => ({
                        ...actual,
                        tipo: e.target.value,
                      }))
                    }
                    className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
                  >
                    <option value="Adelanto">Adelanto</option>
                    <option value="Sueldo">Sueldo</option>
                    <option value="Bono">Bono</option>
                    <option value="Extra">Extra</option>
                  </select>
                </div>

                <Field
                  label="Periodo"
                  value={formMovimiento.periodo}
                  onChange={(value) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      periodo: value,
                    }))
                  }
                />
                <Field
                  label="Monto"
                  type="number"
                  value={formMovimiento.monto}
                  onChange={(value) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      monto: value,
                    }))
                  }
                />
                <Field
                  label="Fecha"
                  type="date"
                  value={formMovimiento.fecha}
                  onChange={(value) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      fecha: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-zinc-500 text-sm">Metodo de pago</label>
                <select
                  value={formMovimiento.metodo_pago}
                  onChange={(e) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      metodo_pago: e.target.value,
                    }))
                  }
                  className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-500 text-sm">Observaciones</label>
                <textarea
                  value={formMovimiento.observaciones}
                  onChange={(e) =>
                    setFormMovimiento((actual) => ({
                      ...actual,
                      observaciones: e.target.value,
                    }))
                  }
                  className="w-full min-h-24 mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={guardarMovimiento}
                disabled={guardando}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium text-black disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5">
      <p className="text-zinc-500 text-sm">{label}</p>
      <h3 className="text-2xl md:text-3xl font-black mt-3 text-white">
        {value}
      </h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#07111f] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm text-white mt-1">{value}</p>
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-2 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
      />
    </div>
  );
}
