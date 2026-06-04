import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmpresaConfig } from "../lib/empresa";

type ReportePDF = {
  tipo?:
    | "completo"
    | "finanzas"
    | "ingresos-gastos"
    | "ventas"
    | "cobranzas"
    | "clientes"
    | "presupuestos"
    | "productos"
    | "stock"
    | "produccion"
    | "suministros"
    | "rentabilidad";
  desde: string;
  hasta: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
  ventasGeneradas: number;
  ventasCobradas: number;
  ventasPendientes: number;
  ticketPromedio?: number;
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
    pendiente?: number;
  }>;
  productosMasVendidos?: Array<{
    nombre: string;
    cantidad: number;
    total: number;
    detalle?: string;
  }>;
  stockDisponible?: Array<{
    nombre: string;
    actual: number;
    minimo: number;
    ideal: number;
    estado: string;
    unidad?: string;
  }>;
  suministrosCriticos?: Array<{
    nombre: string;
    actual: number;
    minimo: number;
    ideal: number;
    estado: string;
    unidad?: string;
  }>;
  produccionPorProducto?: Array<{
    nombre: string;
    cantidad: number;
    total: number;
    detalle?: string;
  }>;
  produccionPorColor?: Array<{
    nombre: string;
    cantidad: number;
    total: number;
    detalle?: string;
  }>;
  rentabilidadProductos?: Array<{
    producto: string;
    cantidad: number;
    ventas: number;
    costoEstimado: number;
    rentabilidad: number;
    margen: number;
  }>;
  movimientos: Array<{
    fecha: string;
    tipo: string;
    concepto: string;
    total: number;
    abonado: number;
    pendiente: number;
  }>;
  ventasDetalle?: Array<{
    fecha: string;
    tipo: string;
    concepto: string;
    total: number;
    abonado: number;
    pendiente: number;
  }>;
  cobranzasDetalle?: Array<{
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

type ListaPreciosPDF = {
  nombre: string;
  items: Array<{
    producto: string;
    precioUnitario: number;
    precioM2: number;
    observaciones?: string;
  }>;
};

const reporteTitulos = {
  completo: "REPORTE GENERAL",
  finanzas: "REPORTE INGRESOS Y GASTOS",
  "ingresos-gastos": "REPORTE INGRESOS Y GASTOS",
  clientes: "REPORTE MEJORES CLIENTES",
  presupuestos: "REPORTE PRESUPUESTOS",
  ventas: "REPORTE VENTAS",
  cobranzas: "REPORTE COBRANZAS",
  productos: "REPORTE PRODUCTOS VENDIDOS",
  stock: "REPORTE STOCK DISPONIBLE",
  produccion: "REPORTE PRODUCCION",
  suministros: "REPORTE SUMINISTROS",
  rentabilidad: "REPORTE RENTABILIDAD",
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
  const datosEmpresa = [
    empresaConfig.direccion,
    empresaConfig.localidad,
    empresaConfig.telefono,
    empresaConfig.email,
  ].filter(Boolean);

  if (empresaConfig.logo) {
    try {
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
    } catch {
      // Si el logo no esta cargado o no es compatible, el PDF sigue saliendo.
    }
  }

  if (empresaConfig.nombre) {
    doc.setFontSize(12);
    doc.text(empresaConfig.nombre, 10, 24);
  }

  doc.setFontSize(10);
  datosEmpresa.forEach((dato, index) => {
    doc.text(dato, 70, 32 + index * 7, {
      align: "center",
    });
  });

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
  senia,
  total,
  observaciones,
}: any) {

  const doc = new jsPDF();
  const seniaNota =
    tipoDocumento === "NOTA DE VENTA" &&
    estadoPago !== "Pagado" &&
    Number(senia || 0) > 0
      ? Number(senia)
      : 0;

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
  doc.roundedRect(
    130,
    finalY - 5,
    60,
    seniaNota > 0 ? 60 : 50,
    3,
    3
  );
  doc.text(`TRANSPORTE: $${transporte}`, 135, finalY + 2);

doc.text(`DESCUENTO: $${descuento}`, 135, finalY + 12);

doc.text(`IVA: ${iva}%`, 135, finalY + 22);

if (seniaNota > 0) {
  doc.text(
    `SEÑA: $${seniaNota.toLocaleString("es-AR")}`,
    135,
    finalY + 32
  );
}

  doc.setFontSize(16);

  doc.setFontSize(18);

doc.text(
  `TOTAL: $${total}`,
  135,
  seniaNota > 0 ? finalY + 48 : finalY + 38
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
    ["Ticket promedio", formatMoney(data.ticketPromedio || 0)],
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
    "ingresos-gastos": [
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
      ["Pedidos", data.pedidos.toLocaleString("es-AR")],
      ["Ticket promedio", formatMoney(data.ticketPromedio || 0)],
    ],
    cobranzas: [
      ["Ventas cobradas", formatMoney(data.ventasCobradas)],
      ["Saldo por cobrar", formatMoney(data.ventasPendientes)],
      ["Pedidos", data.pedidos.toLocaleString("es-AR")],
    ],
    productos: [
      ["Productos vendidos", (data.productosMasVendidos || []).length.toLocaleString("es-AR")],
      ["Ventas generadas", formatMoney(data.ventasGeneradas)],
      ["Pedidos", data.pedidos.toLocaleString("es-AR")],
    ],
    stock: [
      ["Productos en stock", (data.stockDisponible || []).length.toLocaleString("es-AR")],
      ["Stock critico/bajo", (data.stockDisponible || []).filter((item) => item.estado !== "Optimo").length.toLocaleString("es-AR")],
    ],
    produccion: [
      ["Producciones", (data.produccionPorProducto || []).length.toLocaleString("es-AR")],
      ["Pedidos del periodo", data.pedidos.toLocaleString("es-AR")],
    ],
    suministros: [
      ["Suministros", (data.suministrosCriticos || []).length.toLocaleString("es-AR")],
      ["Criticos/bajos", (data.suministrosCriticos || []).filter((item) => item.estado !== "Optimo").length.toLocaleString("es-AR")],
    ],
    rentabilidad: [
      ["Ventas generadas", formatMoney(data.ventasGeneradas)],
      [
        "Costo estimado",
        formatMoney(
          (data.rentabilidadProductos || []).reduce(
            (acc, item) => acc + item.costoEstimado,
            0
          )
        ),
      ],
      [
        "Rentabilidad estimada",
        formatMoney(
          (data.rentabilidadProductos || []).reduce(
            (acc, item) => acc + item.rentabilidad,
            0
          )
        ),
      ],
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

  if (tipo === "productos") {
    doc.setFontSize(14);
    doc.text("PRODUCTOS MAS VENDIDOS", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["PRODUCTO", "CANTIDAD", "TOTAL"]],
      body: (data.productosMasVendidos || []).map((item) => [
        item.nombre,
        item.cantidad.toLocaleString("es-AR"),
        formatMoney(item.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    doc.save(`${folio}-productos.pdf`);
    return;
  }

  if (tipo === "stock") {
    doc.setFontSize(14);
    doc.text("STOCK DISPONIBLE", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["PRODUCTO", "ACTUAL", "MINIMO", "IDEAL", "ESTADO"]],
      body: (data.stockDisponible || []).map((item) => [
        item.nombre,
        item.actual.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
        item.minimo.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
        item.ideal.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
        item.estado,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    doc.save(`${folio}-stock.pdf`);
    return;
  }

  if (tipo === "suministros") {
    doc.setFontSize(14);
    doc.text("SUMINISTROS", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["MATERIAL", "STOCK", "MINIMO", "OBJETIVO", "ESTADO"]],
      body: (data.suministrosCriticos || []).map((item) => [
        item.nombre,
        `${item.actual.toLocaleString("es-AR", { maximumFractionDigits: 3 })} ${item.unidad || ""}`,
        `${item.minimo.toLocaleString("es-AR", { maximumFractionDigits: 3 })} ${item.unidad || ""}`,
        `${item.ideal.toLocaleString("es-AR", { maximumFractionDigits: 3 })} ${item.unidad || ""}`,
        item.estado,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    doc.save(`${folio}-suministros.pdf`);
    return;
  }

  if (tipo === "produccion") {
    doc.setFontSize(14);
    doc.text("PRODUCCION POR PRODUCTO", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["PRODUCTO", "CANTIDAD", "DESTINO"]],
      body: (data.produccionPorProducto || []).map((item) => [
        item.nombre,
        item.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
        item.detalle || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    const colorY = (doc as any).lastAutoTable.finalY + 14;
    doc.text("PRODUCCION POR COLOR", 15, colorY);

    autoTable(doc, {
      startY: colorY + 8,
      head: [["COLOR", "CANTIDAD"]],
      body: (data.produccionPorColor || []).map((item) => [
        item.nombre,
        item.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    doc.save(`${folio}-produccion.pdf`);
    return;
  }

  if (tipo === "rentabilidad") {
    doc.setFontSize(14);
    doc.text("RENTABILIDAD ESTIMADA POR PRODUCTO", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["PRODUCTO", "CANT.", "VENTAS", "COSTO EST.", "RESULTADO", "MARGEN"]],
      body: (data.rentabilidadProductos || []).map((item) => [
        item.producto,
        item.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 3 }),
        formatMoney(item.ventas),
        formatMoney(item.costoEstimado),
        formatMoney(item.rentabilidad),
        `${item.margen.toFixed(0)}%`,
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [7, 17, 31] },
    });

    doc.setFontSize(9);
    doc.text(
      "La rentabilidad es estimada segun recetas y costo promedio de compras registradas.",
      15,
      (doc as any).lastAutoTable.finalY + 12
    );

    doc.save(`${folio}-rentabilidad.pdf`);
    return;
  }

  if (tipo === "clientes") {
    doc.setFontSize(14);
    doc.text("MEJORES CLIENTES", 15, detalleStartY);

    autoTable(doc, {
      startY: detalleStartY + 8,
      head: [["CLIENTE", "PEDIDOS", "TOTAL", "PENDIENTE"]],
      body: (data.mejoresClientes || []).map((cliente) => [
        cliente.cliente,
        cliente.pedidos.toLocaleString("es-AR"),
        formatMoney(cliente.total),
        formatMoney(cliente.pendiente || 0),
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
      ? "DETALLE DE VENTAS"
      : tipo === "cobranzas"
      ? "DETALLE DE COBRANZAS"
      : tipo === "presupuestos"
      ? "RESUMEN DE PRESUPUESTOS"
      : "DETALLE FINANCIERO",
    15,
    detalleStartY
  );

  autoTable(doc, {
    startY: detalleStartY + 8,
    head: [["FECHA", "TIPO", "CONCEPTO", "TOTAL", "ABONADO", "PENDIENTE"]],
    body: (tipo === "presupuestos"
      ? []
      : tipo === "ventas"
      ? data.ventasDetalle || []
      : tipo === "cobranzas"
      ? data.cobranzasDetalle || []
      : data.movimientos
    )
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

export function generarPDFListaPrecios(data: ListaPreciosPDF) {
  const doc = new jsPDF();
  const fecha = formatToday();
  const folio = `LP-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;

  agregarEncabezado(doc, "LISTA DE PRECIOS", folio, fecha);

  doc.setFontSize(15);
  doc.text(data.nombre.toUpperCase(), 14, 82);

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Valores sujetos a confirmacion comercial.", 14, 88);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 96,
    head: [["PRODUCTO", "PRECIO UNITARIO", "PRECIO POR M2", "OBSERVACIONES"]],
    body: data.items.map((item) => [
      item.producto,
      formatMoney(item.precioUnitario),
      formatMoney(item.precioM2),
      item.observaciones || "-",
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [8, 18, 32],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 35, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 50 },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${folio}-lista-precios.pdf`);
}
