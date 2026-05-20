"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ClientesPage() {

  const [clientes, setClientes] = useState<any[]>([]);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [modalTodos, setModalTodos] =
    useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [cuit, setCuit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] =
    useState("");

  const [observaciones, setObservaciones] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  async function cargarClientes() {

    const { data, error } = await supabase
  .from("clientes")
  .select("*");

    if (!error && data) {

  const clientesConPedidos =
    await Promise.all(

      data.map(async (cliente) => {

        const { data: pedidos } =
          await supabase
            .from("pedidos")
            .select("id, estado")
            .eq(
              "cliente_id",
              cliente.id
            );

        return {
          ...cliente,
          pedidos: pedidos || [],
        };

      })

    );

  setClientes(clientesConPedidos);

}

  }

  async function crearCliente() {

    const { error } = await supabase
      .from("clientes")
      .insert([
        {
          nombre,
          telefono,
          mail,
          cuit,
          direccion,
          localidad,
          observaciones,
        },
      ]);

    if (!error) {

      setModalAbierto(false);

      setNombre("");
      setTelefono("");
      setMail("");
      setCuit("");
      setDireccion("");
      setLocalidad("");
      setObservaciones("");

      cargarClientes();

    }

  }

  useEffect(() => {

    cargarClientes();

  }, []);

  const clientesFiltrados =
    clientes.filter((cliente) => {

      return (
        cliente.nombre
          ?.toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||

        cliente.telefono
          ?.toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||

        cliente.localidad
          ?.toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )
      );

    });

  return (
    <div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            Clientes
          </h1>

          <p className="text-zinc-500 mt-1">
            Gestión general de clientes
          </p>

        </div>

        <button
          onClick={() =>
            setModalAbierto(true)
          }
          className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
        >
          + Nuevo cliente
        </button>

      </div>

      {/* Barra búsqueda */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl p-5 mb-6">

        <div className="flex gap-4">

          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            className="flex-1 bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
          />

          <button
            onClick={() =>
              setModalTodos(true)
            }
            className="bg-white/5 hover:bg-white/10 transition px-5 rounded-2xl border border-white/5"
          >
            Ver todos
          </button>

        </div>

      </div>

      {/* Tabla */}
      <div className="bg-[#0b1727] border border-white/5 rounded-3xl overflow-hidden">

        {/* Head */}
        <div className="grid grid-cols-5 px-6 py-4 border-b border-white/5 text-zinc-500 text-sm">

          <div>Cliente</div>

          <div>Localidad</div>

          <div>Teléfono</div>

          <div>Pedido activo</div>

          <div className="text-right">
            Información
          </div>

        </div>

        {/* Clientes */}
        {clientesFiltrados.map(
          (cliente) => {

            const pedidoActivo =
              cliente.pedidos?.some(
                (pedido: any) =>
                  pedido.estado !==
                  "Entregado"
              );

            return (

              <div
                key={cliente.id}
                className="grid grid-cols-5 px-6 py-5 border-b border-white/5 hover:bg-white/5 transition"
              >

                <div className="font-medium">
                  {cliente.nombre}
                </div>

                <div>
                  {cliente.localidad}
                </div>

                <div>
                  {cliente.telefono}
                </div>

                <div>

                  <span
                    className={
                      pedidoActivo
                        ? "text-yellow-400"
                        : "text-emerald-400"
                    }
                  >

                    {pedidoActivo
                      ? "Sí"
                      : "No"}

                  </span>

                </div>

                <div className="text-right">

                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Ver información
                  </Link>

                </div>

              </div>

            );

          }
        )}

      </div>

      {/* Modal nuevo cliente */}
      {modalAbierto && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-y-auto">

          <div className="bg-[#0b1727] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">

            {/* X */}
            <button
              onClick={() =>
                setModalAbierto(false)
              }
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition text-3xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-8">

              <h2 className="text-3xl font-bold">
                Nuevo cliente
              </h2>

              <p className="text-zinc-500 mt-1">
                Registrar cliente en el sistema
              </p>

            </div>

            {/* Inputs */}
            <div className="space-y-6">

              <input
                placeholder="Nombre"
                value={nombre}
                onChange={(e) =>
                  setNombre(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) =>
                  setTelefono(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Mail"
                value={mail}
                onChange={(e) =>
                  setMail(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="CUIT"
                value={cuit}
                onChange={(e) =>
                  setCuit(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Dirección"
                value={direccion}
                onChange={(e) =>
                  setDireccion(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <input
                placeholder="Localidad"
                value={localidad}
                onChange={(e) =>
                  setLocalidad(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-3 outline-none"
              />

              <textarea
                placeholder="Observaciones"
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value
                  )
                }
                className="w-full bg-[#07111f] border border-white/5 rounded-2xl px-4 py-4 outline-none h-32 resize-none"
              />

            </div>

            {/* Footer */}
            <div className="flex justify-end mt-8">

              <button
                onClick={crearCliente}
                className="bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-2xl font-medium"
              >
                Guardar cliente
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}