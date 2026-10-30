import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanyProfile, Quotation } from '../types';

/**
 * Loads an image from URL into an HTMLImageElement and converts to base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Canvas export failed, using text fallback', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

export const MAX_LETTER_ITEMS = 30;

export async function generateQuotationPDF(
  quotation: Quotation,
  profile: CompanyProfile
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2; // ~191.9 mm

  // Try to load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(profile.logoUrl || 'https://appdesignproyectos.com/raguxdistribuciones.jpeg');
  } catch {
    logoBase64 = null;
  }

  // --- HEADER SECTION ---
  // Left: Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX, 10, 42, 18, undefined, 'FAST');
    } catch {
      drawTextLogo(doc, marginX, 18);
    }
  } else {
    drawTextLogo(doc, marginX, 18);
  }

  // Center: Company / Emisor information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(profile.nombreComercial.toUpperCase(), 110, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(profile.rfc.toUpperCase(), 110, 16, { align: 'center' });
  doc.text(profile.direccionCalle.toUpperCase(), 110, 20, { align: 'center' });
  doc.text(profile.coloniaCp.toUpperCase(), 110, 24, { align: 'center' });
  doc.text(profile.ciudadEstado.toUpperCase(), 110, 28, { align: 'center' });
  doc.text(profile.telefono.toUpperCase(), 110, 32, { align: 'center' });

  // Right: Folio & Date box (matching the exact sample style)
  const boxWidth = 36;
  const boxX = pageWidth - marginX - boxWidth;

  // COTIZACION header box
  doc.setFillColor(195, 202, 207); // Medium grey header
  doc.rect(boxX, 10, boxWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('COTIZACION', boxX + boxWidth / 2, 13.8, { align: 'center' });

  // Folio value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  // Little green indicator next to folio as in sample
  doc.setFillColor(102, 195, 78); // #66C34E
  doc.rect(boxX + 3, 19.5, 2.5, 2.5, 'F');
  doc.text(`# ${quotation.folio}`, boxX + boxWidth / 2 + 2, 21.5, { align: 'center' });

  // Fecha de expedición header box
  doc.setFillColor(195, 202, 207);
  doc.rect(boxX, 25, boxWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Fecha de expedición', boxX + boxWidth / 2, 28.6, { align: 'center' });

  // Fecha value
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const formattedDate = formatDateDisplay(quotation.fechaExpedicion);
  doc.text(formattedDate, boxX + boxWidth / 2, 34, { align: 'center' });

  // Lugar de expedición row
  const lugarBoxWidth = 92;
  const lugarBoxX = pageWidth - marginX - lugarBoxWidth;
  doc.setDrawColor(180, 185, 190);
  doc.setLineWidth(0.3);

  // Label
  doc.setFillColor(210, 215, 220);
  doc.rect(lugarBoxX, 40, 32, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Lugar de expedición:', lugarBoxX + 16, 43.6, { align: 'center' });

  // Value
  doc.setFillColor(255, 255, 255);
  doc.rect(lugarBoxX + 32, 40, 60, 5, 'D');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(quotation.lugarExpedicion.toUpperCase(), lugarBoxX + 34, 43.6);

  // --- CLIENT SECTION ("Cotizado a:") ---
  const clientStartY = 45;
  doc.setFillColor(210, 215, 220);
  doc.rect(marginX, clientStartY, 20, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Cotizado a:', marginX + 10, clientStartY + 3.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(quotation.clienteNombre.toUpperCase(), marginX, clientStartY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let cy = clientStartY + 13;
  if (quotation.clienteRfc) {
    doc.text(quotation.clienteRfc.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (quotation.clienteDireccion) {
    doc.text(quotation.clienteDireccion.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (quotation.clienteCiudad) {
    doc.text(quotation.clienteCiudad.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (quotation.clienteTelefono) {
    doc.text(`TEL: ${quotation.clienteTelefono}`.toUpperCase(), marginX, cy);
    cy += 3.8;
  }

  // --- ITEMS TABLE ---
  const tableStartY = Math.max(cy + 3, 67);

  const tableBody = quotation.items.map((item) => [
    item.cantidad.toFixed(2),
    item.unidadMedida || 'H87',
    item.descripcion.toUpperCase(),
    formatCurrency(item.precioUnitario),
    formatCurrency(item.importe),
  ]);

  // Validate single Letter page constraint
  if (quotation.items.length > MAX_LETTER_ITEMS) {
    throw new Error(
      `La cotización excede la capacidad de 1 página tamaño carta (${quotation.items.length}/${MAX_LETTER_ITEMS} partidas). Debe generar una nueva cotización para evitar que salga en 2 páginas.`
    );
  }

  // Optimize row heights and padding according to item count to ensure 100% 1-page fit
  const itemCount = quotation.items.length;
  const tableFontSize = itemCount > 22 ? 6.2 : 6.8;
  const tableCellPadding = itemCount > 22 ? 0.75 : 1.1;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginX, right: marginX },
    head: [['Cant.', 'Unid. de Medida', 'Descripción', 'Pcio. Unitario', 'Importe']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [195, 202, 207],
      textColor: [20, 20, 20],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'center',
      cellPadding: 1.2,
      lineWidth: 0.2,
      lineColor: [255, 255, 255],
    },
    styles: {
      fontSize: tableFontSize,
      cellPadding: tableCellPadding,
      textColor: [10, 10, 10],
      font: 'helvetica',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'right' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
    },
    didDrawCell: (data) => {
      // Add subtle horizontal line on row bottoms
      if (data.section === 'body') {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  // Calculate final Y after table
  const lastAutoTable = (doc as any).lastAutoTable;
  let finalY = lastAutoTable ? lastAutoTable.finalY + 3 : 190;

  // Never add a second page. Strict single-page letter guarantee:
  if (finalY > pageHeight - 50) {
    finalY = pageHeight - 50;
  }

  // --- TOTALS AND LETRA SECTION ---
  const totalsBoxWidth = 56;
  const totalsX = pageWidth - marginX - totalsBoxWidth;

  // "Total con letra" box on the left
  const letraWidth = contentWidth - totalsBoxWidth - 4;
  doc.setFillColor(210, 215, 220);
  doc.rect(marginX, finalY, 26, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Total con letra', marginX + 13, finalY + 3.2, { align: 'center' });

  // Full length grey bar under total con letra
  doc.setFillColor(235, 238, 240);
  doc.rect(marginX, finalY + 5.5, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 10, 10);
  doc.text(quotation.totalLetra.toUpperCase(), marginX + contentWidth / 2, finalY + 9.3, {
    align: 'center',
  });

  // Totals Breakdown (Subtotal, Descuento, Total)
  let totalsY = finalY + 12.5;

  // Subtotal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Subtotal', totalsX + 18, totalsY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(quotation.subtotal), pageWidth - marginX - 1, totalsY, {
    align: 'right',
  });

  totalsY += 4;
  // Descuento
  doc.setFont('helvetica', 'bold');
  doc.text('Descuento', totalsX + 18, totalsY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(quotation.descuento || 0), pageWidth - marginX - 1, totalsY, {
    align: 'right',
  });

  totalsY += 4.5;
  // Total in dark/bold box
  doc.setFillColor(195, 202, 207);
  doc.rect(totalsX + 4, totalsY - 3.5, totalsBoxWidth - 4, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Total', totalsX + 18, totalsY, { align: 'right' });
  doc.text(formatCurrency(quotation.total), pageWidth - marginX - 1, totalsY, {
    align: 'right',
  });

  // --- BOTTOM CONDITION BOXES (Válido hasta, Tiempo de entrega, Forma de pago) ---
  const condY = totalsY + 8;
  const colW = (contentWidth - 6) / 3;

  // Box 1: Válido hasta
  drawConditionBox(
    doc,
    marginX,
    condY,
    colW,
    'Válido hasta',
    quotation.validoHasta || '30 DÍAS'
  );

  // Box 2: Tiempo de entrega
  drawConditionBox(
    doc,
    marginX + colW + 3,
    condY,
    colW,
    'Tiempo de entrega',
    quotation.tiempoEntrega || 'INMEDIATA'
  );

  // Box 3: Forma de pago
  drawConditionBox(
    doc,
    marginX + (colW + 3) * 2,
    condY,
    colW,
    'Forma de pago',
    quotation.formaPago || 'PAGO EN PARCIALIDADES O DIFERIDO'
  );

  // Bottom caption
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Pago en parcialidades o diferido', pageWidth - marginX, condY + 12, {
    align: 'right',
  });

  return doc;
}

function drawConditionBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  header: string,
  value: string
) {
  // Grey header
  doc.setFillColor(195, 202, 207);
  doc.rect(x, y, width, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  doc.text(header, x + width / 2, y + 3.2, { align: 'center' });

  // Value box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(20, 20, 20);
  doc.text(value.toUpperCase(), x + width / 2, y + 8, { align: 'center' });
}

function drawTextLogo(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('RAGUX', x, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Distribuciones.', x, y + 5);
}

function formatCurrency(val: number): string {
  return val.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
