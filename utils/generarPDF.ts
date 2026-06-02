import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmpresaConfig } from "../lib/empresa";

type ReportePDF = {
  tipo?: "completo" | "finanzas" | "clientes" | "presupuestos" | "ventas";
  desde: string;
  hasta: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
  ventasGeneradas: number;
  ventasCobradas: number;
  ventasPendientes: number;
  pedidos: number;
  clientesActivos: number;
  presupuestosGenerados: number;
  presupuestosAceptados: number;
  totalPresupuestos: number;
  tasaConversion: number;
  mejoresClientes?: Array<{
    cliente: string;
    pedidos: number;
    total: number;
  }>;
  movimientos: Array<{
    fecha: string;
    tipo: string;
    concepto: string;
    total: number;
    abonado: number;
    pendiente: number;
  }>;
};

type TrackProduccionPDF = {
  codigo: string;
  fecha: string;
  hora: string;
  color: string;
  items: Array<{
    producto: string;
    cantidad: number | string;
    destino: string;
    detalle?: string;
  }>;
  materiales: Array<{
    nombre: string;
    cantidad: number | string;
    unidad?: string;
  }>;
};

const reporteTitulos = {
  completo: "REPORTE GENERAL",
  finanzas: "REPORTE INGRESOS Y GASTOS",
  clientes: "REPORTE MEJORES CLIENTES",
  presupuestos: "REPORTE PRESUPUESTOS",
  ventas: "REPORTE VENTAS Y COBRANZA",
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`;
}

function formatDate(value: string) {
  if (!value) return "-";

  const rawDate = value.split("T")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [year, month, day] = rawDate.split("-");
    return `${day}/${month}/${year}`;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
    const [day, month, year] = rawDate.split("/");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return value;
}

function formatToday() {
  return new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function agregarEncabezado(
  doc: jsPDF,
  titulo: string,
  numero: string,
  fecha: string
) {
  const empresaConfig = getEmpresaConfig();
  const logo = new Image();
  logo.src = empresaConfig.logo;

  doc.addImage(
    logo,
    "PNG",
    10,
    28,
    35,
    20
  );

  doc.setFontSize(10);
  doc.text(empresaConfig.direccion, 70, 32);
  doc.text(empresaConfig.localidad, 60, 39);
  doc.text(empresaConfig.telefono, 77, 46);
  doc.text(empresaConfig.email, 63, 53);

  doc.roundedRect(125, 26, 70, 35, 3, 3);

  const titleMaxWidth = 54;
  let titleFontSize = 12;

  doc.setFontSize(titleFontSize);

  while (
    doc.getTextWidth(titulo) > titleMaxWidth &&
    titleFontSize > 8
  ) {
    titleFontSize -= 1;
    doc.setFontSize(titleFontSize);
  }

  doc.text(titulo, 135, 35);

  doc.setFontSize(12);
  doc.text(`FECHA: ${fecha}`, 135, 45);
  doc.text(`FOLIO: ${numero}`, 135, 55);
}

export function generarPDFPresupuesto({
  tipoDocumento,
  estadoPago,
  numero,
  fecha,
  cliente,
  telefono,
  direccion,
  items,
  transporte,
  descuento,
  iva,
  total,
  observaciones,
}: any) {

  const doc = new jsPDF();
  if (tipoDocumento === "NOTA DE VENTA") {

  doc.setTextColor(200);

  doc.setFontSize(120);

  if (
  estadoPago === "Parcial" ||
  estadoPago === "Pendiente"
) {

    doc.text(
      "SEÑADO",
      45,
      180,
      {
        angle: 45,
      }
    );

  }

  if (estadoPago === "Pagado") {

    doc.text(
      "PAGADO",
      55,
      180,
      {
        angle: 45,
      }
    );

  }

  doc.setTextColor(0);

}

agregarEncabezado(
  doc,
  tipoDocumento || "PRESUPUESTO",
  numero,
  formatDate(fecha)
);

  // CLIENTE
  doc.setFontSize(14);
  doc.text("DATOS DEL CLIENTE", 20, 80);
  doc.roundedRect(15, 72, 180, 50, 3, 3);

  doc.setFontSize(11);

  doc.text(`NOMBRE: ${cliente}`, 20, 92);
  doc.text(`TELEFONO: ${telefono}`, 20, 102);
  doc.text(`DOMICILIO: ${direccion}`, 20, 112);

  // TABLA
  autoTable(doc, {
    startY: 125,

    head: [[
      "CANTIDAD",
      "UNIDAD",
      "CONCEPTO",
      "P. UNITARIO",
      "IMPORTE",
    ]],

    body: items.map((item: any) => [
      item.cantidad,
      item.unidad,
      `${item.producto} ${item.modelo} ${item.color}`,
      `$${item.precio}`,
      `$${item.total}`,
    ]),

  });

  const finalY = (doc as any).lastAutoTable.finalY + 45;

  // OBSERVACIONES
  doc.text("OBSERVACIONES:", 20, finalY);

  doc.roundedRect(15, finalY - 5, 110, 50, 3, 3);

doc.text(
  observaciones || "Sin observaciones",
  20,
  finalY + 10
);

  // TOTALES
  doc.roundedRect(130, finalY - 5, 60, 50, 3, 3);
  doc.text(`TRANSPORTE: $${transporte}`, 135, finalY + 2);

doc.text(`DESCUENTO: $${descuento}`, 135, finalY + 12);

doc.text(`IVA: ${iva}%`, 135, finalY + 22);

  doc.setFontSize(16);

  doc.setFontSize(18);

doc.text(
  `TOTAL: $${total}`,
  135,
  finalY + 38
);

  doc.setFontSize(11);

doc.setFontSize(11);

  // DESCARGAR
  doc.save(`${numero}.pdf`);

}

export function generarPDFReporte(data: ReportePDF) {
  const doc = new jsPDF();
  const fecha = formatToday();
  const tipo = data.tipo || "completo";
  const folio = `REP-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}`;

  agregarEncabezado(doc, reporteTitulos[tipo], folio, fecha);

  doc.setFontSize(14);
  doc.text("PERIODO DEL REPORTE", 20, 78);
  doc.roundedRect(15, 72, 180, 24, 3, 3);

  doc.setFontSize(11);
  doc.text(`DESDE: ${formatDate(data.desde)}`, 20, 88);
  doc.text(`HASTA: ${formatDate(data.hasta)}`, 80, 88);

  const resumenGeneral = [
    ["Ingresos cobrados", formatMoney(data.ingresos)],
    ["Gastos pagados", formatMoney(data.gastos)],
    ["Resultado", formatMoney(data.utilidad)],
    ["Ventas generadas", formatMoney(data.ventasGeneradas)],
    ["Ventas cobradas", formatMoney(data.ventasCobradas)],
    ["Saldo por cobrar", formatMoney(data.ventasPendientes)],
    ["Pedidos", data.pedidos.toLocaleString("es-AR")],
    ["Clientes activos", data.clientesActivos.toLocaleString("es-AR")],
    ["Presupuestos generados", data.presupuestosGenerados.toLocaleString("es-AR")],
    ["Presupuestos aceptados", data.presupuestosAceptados.toLocaleString("es-AR")],
    ["Total cotizado", formatMoney(data.totalPresupuestos)],
    ["Conversion", `${data.tasaConversion.toFixed(0)}%`],
  ];

  const resumenPorTipo = {
    completo: resumenGeneral,
    finanzas: [
      ["Ingresos cobrados", formatMoney(data.ingresos)],
      ["Gastos pagados", formatMoney(data.gastos)],
      ["Resultado", formatMoney(data.utilidad)],
    ],
    clientes: [
      ["Clientes activos", data.clientesActivos.toLocaleString("es-AR")],
      ["Pedidos del periodo", data.pedidos.toLocaleString("es-AR")],
      ["Ventas generadas", formatMoney(data.ventasGeneradas)],
    ],
    presupuestos: [
      ["Presupuestos generados", data.presupuestosGenerados.toLocaleString("es-AR")],
      ["Presupuestos aceptados", data.presupuestosAceptados.toLocaleString("es-AR")],
      ["Total cotizado", formatMoney(data.totalPresupuestos)],
      ["Conversion", `${data.tasaConversion.toFixed(0)}%`],
    ],
    ventas: [
      ["Ventas generadas", formatMoney(data.ventasGeneradas)],
      ["Ventas cobradas", formatMoney(data.ventasCobradas)],
      ["Saldo por cobrar", formatMoney(data.ventasPendientes)],
      ["Pedidos", data.pedidos.toLocaleString("es-AR")],
    ],
  };

  autoTable(doc, {
    startY: 108,
    head: [["INDICADOR", "VALOR"]],
    body: resumenPorTipo[tipo],
    styles: {
      fontSize: 10,
    },
    headStyles: {
      fillColor: [7, 17, 31],
    },
  });

  const detalleStartY = (doc as any).lastAutoTable.finalY + 14;

  if (tipo === "clientes") {
    doc.setFontSize(14);
    doc.text("MEJORES CLIENTES", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["CLIENTE", "PEDIDOS", "TOTAL"]],
      body: (data.mejoresClientes || []).map((cliente) => [
        cliente.cliente,
        cliente.pedidos.toLocaleString("es-AR"),
        formatMoney(cliente.total),
      ]),
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [7, 17, 31],
      },
    });

    doc.save(`${folio}-clientes.pdf`);
    return;
  }

  doc.setFontSize(14);
  doc.text(
    tipo === "ventas"
      ? "DETALLE DE COBRANZA"
      : tipo === "presupuestos"
      ? "RESUMEN DE PRESUPUESTOS"
      : "DETALLE FINANCIERO",
    15,
    detalleStartY
  );

  autoTable(doc, {
    startY: detalleStartY + 8,
    head: [["FECHA", "TIPO", "CONCEPTO", "TOTAL", "ABONADO", "PENDIENTE"]],
    body: data.movimientos
      .filter((movimiento) => {
        if (tipo === "finanzas") return true;
        if (tipo === "ventas") {
          return movimiento.tipo.toLowerCase() === "ingreso";
        }
        if (tipo === "presupuestos") return false;
        return true;
      })
      .slice(0, 40)
      .map((movimiento) => [
      formatDate(movimiento.fecha),
      movimiento.tipo,
      movimiento.concepto,
      formatMoney(movimiento.total),
      formatMoney(movimiento.abonado),
      formatMoney(movimiento.pendiente),
    ]),
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [7, 17, 31],
    },
  });

  doc.save(`${folio}-${tipo}.pdf`);
}

export function generarPDFTrackProduccion(data: TrackProduccionPDF) {
  const doc = new jsPDF();
  const fecha = formatToday();

  agregarEncabezado(doc, "TRACK PRODUCCION", data.codigo, fecha);

  doc.setFontSize(14);
  doc.text("DATOS DE PRODUCCION", 20, 78);
  doc.roundedRect(15, 72, 180, 32, 3, 3);

  doc.setFontSize(11);
  doc.text(`FECHA: ${formatDate(data.fecha)}`, 20, 88);
  doc.text(`HORA: ${data.hora || "-"}`, 80, 88);
  doc.text(`COLOR: ${data.color || "-"}`, 130, 88);
  doc.text(`CODIGO: ${data.codigo}`, 20, 98);

  autoTable(doc, {
    startY: 116,
    head: [["PRODUCTO", "CANTIDAD", "DESTINO", "DETALLE"]],
    body: data.items.map((item) => [
      item.producto,
      String(item.cantidad),
      item.destino,
      item.detalle || "-",
    ]),
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [7, 17, 31],
    },
  });

  const materialesY = (doc as any).lastAutoTable.finalY + 14;

  doc.setFontSize(14);
  doc.text("MATERIAS PRIMAS DESCONTADAS", 15, materialesY);

  autoTable(doc, {
    startY: materialesY + 8,
    head: [["MATERIAL", "CANTIDAD", "UNIDAD"]],
    body: data.materiales.map((item) => [
      item.nombre,
      String(item.cantidad),
      item.unidad || "-",
    ]),
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [7, 17, 31],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 16;

  doc.setFontSize(10);
  doc.text(
    "Documento de trazabilidad interna generado por PremOS.",
    15,
    finalY
  );

  doc.save(`${data.codigo}.pdf`);
}
