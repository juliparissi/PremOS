"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ClienteDetallePage() {

  const params = useParams();

  const [cliente, setCliente] = useState<any>(null);

  const [modalEditar, setModalEditar] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [cuit, setCuit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [observaciones, setObservaciones] =
    useState("");

    const [
  clienteSeleccionado,
  setClienteSeleccionado,
] = useState<any>(null);

  /* KPIs */
  const [pedidosTotales, setPedidosTotales] =
    useState(0);

  const [dineroGenerado, setDineroGenerado] =
    useState(0);

  const [saldoPendiente, setSaldoPendiente] =
    useState(0);

  const [historialPedidos, setHistorialPedidos] =
    useState<any[]>([]);

    async function guardarClienteEditado() {

  if (!clienteSeleccionado)
    return;

  await supabase
    .from("clientes")
    .update({

      nombre:
        clienteSeleccionado.nombre,

      telefono:
        clienteSeleccionado.telefono,

      direccion:
        clienteSeleccionado.direccion,

      localidad:
        clienteSeleccionado.localidad,

    })
    .eq(
      "id",
      clienteSeleccionado.id
    );

  setModalEditar(false);

  cargarCliente();

}

  async function cargarCliente() {

    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", params.id)
      .single();

    if (data) {

      setCliente(data);

      setNombre(data.nombre || "");
      setTelefono(data.telefono || "");
      setMail(data.mail || "");
      setCuit(data.cuit || "");
      setDireccion(data.direccion || "");
      setLocalidad(data.localidad || "");
      setObservaciones(
        data.observaciones || ""
      );

    }

  }

  async function cargarKPIs() {

    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .eq("cliente_id", params.id);

    if (data) {

      setPedidosTotales(data.length);

      const totalAbonado = data.reduce(
        (acc, pedido) =>
          acc +
          Number(
            pedido.saldo_abonado || 0
          ),
        0
      );

      setDineroGenerado(totalAbonado);

      const pendiente = data.reduce(
        (acc, pedido) =>
          acc +
          Number(
            pedido.saldo_restante || 0
          ),
        0
      );

      setSaldoPendiente(pendiente);

      setHistorialPedidos(data);

    }

  }

  async function actualizarCliente() {

    const { error } = await supabase
      .from("clientes")
      .update({
        nombre,
        telefono,
        mail,
        cuit,
        direccion,
        localidad,
        observaciones,
      })
      .eq("id", params.id);

    if (!error) {

      setModalEditar(false);

      cargarCliente();

    }

  }

  useEffect(() => {

    if (params?.id) {

      cargarCliente();

      cargarKPIs();

    }

  }, [params]);

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">

            {cliente?.nombre || "Cargando..."}

          </h1>

          <p className="text-zinc-500 mt-1">
            Información completa del cliente
          </p>

        </div>

        <div className="flex gap-4">

          <button
  onClick={() => {

    setClienteSeleccionado(cliente);

    setModalEditar(true);

  }}
  className="bg-white/5 hover:bg-white/10 transition px-5 py-3 rounded-2xl border border-white/5"
>
  Editar cliente
</button>


          <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 transition px-5 py-3 rounded-2xl border border-red-500/20">
            Desactivar cliente
          </button>

        </div>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-8">

        {/* Pedidos */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Pedidos totales
          </p>

          <h3 className="text-3xl font-bold mt-3">

            {pedidosTotales}

          </h3>

        </div>

        {/* Dinero generado */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Dinero generado
          </p>

          <h3 className="text-3xl font-bold mt-3 text-emerald-400">

            $
            {Number(dineroGenerado)
              .toLocaleString("es-AR")}

          </h3>

        </div>

        {/* Saldo pendiente */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Saldo pendiente
          </p>

          <h3 className="text-3xl font-bold mt-3 text-yellow-400">

            $
            {Number(saldoPendiente)
              .toLocaleString("es-AR")}

          </h3>

        </div>

        {/* Estado */}
        <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-6">

          <p className="text-zinc-500">
            Estado cliente
          </p>

          <h3 className="text-3xl font-bold mt-3">

            {pedidosTotales === 0
              ? "Sin actividad"
              : saldoPendiente > 0
              ? "Con deuda"
              : "Activo"}

          </h3>

        </div>

      </div>

      {/* Información cliente */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-8 mb-8">

        <h2 className="text-2xl font-bold mb-8">
          Datos generales
        </h2>

        <div className="grid grid-cols-2 gap-8">

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              Nombre
            </p>

            <p className="text-lg font-medium">
              {cliente?.nombre || "-"}
            </p>

          </div>

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              Teléfono
            </p>

            <p className="text-lg font-medium">
              {cliente?.telefono || "-"}
            </p>

          </div>

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              Mail
            </p>

            <p className="text-lg font-medium">
              {cliente?.mail || "-"}
            </p>

          </div>

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              CUIT
            </p>

            <p className="text-lg font-medium">
              {cliente?.cuit || "-"}
            </p>

          </div>

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              Dirección
            </p>

            <p className="text-lg font-medium">
              {cliente?.direccion || "-"}
            </p>

          </div>

          <div>

            <p className="text-zinc-500 text-sm mb-2">
              Localidad
            </p>

            <p className="text-lg font-medium">
              {cliente?.localidad || "-"}
            </p>

          </div>

        </div>

      </div>

      {/* Historial pedidos */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">

          <h2 className="text-xl font-semibold">
            Historial de pedidos
          </h2>

          <p className="text-zinc-500 text-sm mt-1">
            Pedidos realizados por el cliente
          </p>

        </div>

        {/* Head */}
        <div className="grid grid-cols-6 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Pedido</div>

          <div>Estado</div>

          <div>Total</div>

          <div>Abonado</div>

          <div>Pendiente</div>

          <div>Entrega</div>

        </div>

        {/* Pedidos */}
        {historialPedidos.map((pedido) => (

          <div
            key={pedido.id}
            className="grid grid-cols-6 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
          >

            <div>
              {pedido.numero}
            </div>

            <div>
              {pedido.estado}
            </div>

            <div>

              $
              {Number(pedido.saldo_total)
                .toLocaleString("es-AR")}

            </div>

            <div className="text-emerald-400">

              $
              {Number(pedido.saldo_abonado)
                .toLocaleString("es-AR")}

            </div>

            <div className="text-yellow-400">

              $
              {Number(pedido.saldo_restante)
                .toLocaleString("es-AR")}

            </div>

            <div>

              {pedido.fecha_entrega
                ?.split("-")
                .reverse()
                .join("/")}

            </div>

          </div>

        ))}

      </div>

{/* Modal editar */}
{modalEditar && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

    <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">

      {/* X */}
      <button
        onClick={() =>
          setModalEditar(false)
        }
        className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
      >
        ×
      </button>

      {/* Header */}
      <div className="mb-8">

        <h2 className="text-3xl font-bold">
          Editar cliente
        </h2>

      </div>

      {/* Formulario */}
      <div className="space-y-5">

        {/* Nombre */}
        <div>

          <label className="text-zinc-400 text-sm mb-2 block">
            Nombre
          </label>

          <input
            type="text"
            value={
              clienteSeleccionado?.nombre || ""
            }
            onChange={(e) =>
              setClienteSeleccionado({
                ...clienteSeleccionado,
                nombre: e.target.value,
              })
            }
            className="w-full bg-[#07111f] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 transition"
          />

        </div>

        {/* Teléfono */}
        <div>

          <label className="text-zinc-400 text-sm mb-2 block">
            Teléfono
          </label>

          <input
            type="text"
            value={
              clienteSeleccionado?.telefono || ""
            }
            onChange={(e) =>
              setClienteSeleccionado({
                ...clienteSeleccionado,
                telefono: e.target.value,
              })
            }
            className="w-full bg-[#07111f] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 transition"
          />

        </div>

        {/* Mail */}
        <div>

          <label className="text-zinc-400 text-sm mb-2 block">
            Mail
          </label>

          <input
            type="text"
            value={
              clienteSeleccionado?.mail || ""
            }
            onChange={(e) =>
              setClienteSeleccionado({
                ...clienteSeleccionado,
                mail: e.target.value,
              })
            }
            className="w-full bg-[#07111f] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 transition"
          />

        </div>

        <div>

  <p className="text-sm text-zinc-400 mb-2">
    Dirección
  </p>

  <input
    type="text"
    value={
      clienteSeleccionado?.direccion || ""
    }
    onChange={(e) =>
      setClienteSeleccionado({
        ...clienteSeleccionado,
        direccion: e.target.value,
      })
    }
    className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none text-white"
  />

</div>

        {/* Localidad */}
        <div>

          <label className="text-zinc-400 text-sm mb-2 block">
            Localidad
          </label>

          <input
            type="text"
            value={
              clienteSeleccionado?.localidad || ""
            }
            onChange={(e) =>
              setClienteSeleccionado({
                ...clienteSeleccionado,
                localidad: e.target.value,
              })
            }
            className="w-full bg-[#07111f] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 transition"
          />

        </div>

        {/* Observaciones */}
        <div>

          <label className="text-zinc-400 text-sm mb-2 block">
            Observaciones
          </label>

          <textarea
            value={
              clienteSeleccionado?.observaciones || ""
            }
            onChange={(e) =>
              setClienteSeleccionado({
                ...clienteSeleccionado,
                observaciones: e.target.value,
              })
            }
            className="w-full h-32 resize-none bg-[#07111f] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-emerald-500 transition"
          />

        </div>

        {/* Botón */}
        <button
          onClick={guardarClienteEditado}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl transition mt-4"
        >
          Guardar cambios
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}