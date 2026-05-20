import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const logo = new Image();
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

logo.src = "/logo.png";

doc.addImage(
  logo,
  "PNG",
  10,
  30,
  35,
  20
);

// EMPRESA
doc.setFontSize(10);

doc.text("GENERAL GUIDO 551", 70, 32);
doc.text("C.P. 1629, PILAR - BUENOS AIRES", 60, 39);
doc.text("1133172541", 77, 46);
doc.text("ventas@baldosasduramax.com", 63, 53);

// TITULO
// doc.setFontSize(24);
// doc.text("PRESUPUESTO", 130, 22);

  // FECHA Y FOLIO
  doc.setFontSize(12);

  doc.roundedRect(125, 26, 70, 35, 3, 3);
  
  doc.text(
  tipoDocumento || "PRESUPUESTO",
  135,
  35
);
  doc.text(`FECHA: ${fecha}`, 135, 45);
  doc.text(`FOLIO: ${numero}`, 135, 55);

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