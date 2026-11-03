import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanyProfile, SaleNote } from '../types';

/**
 * Format date string to Día / Mes / Año (e.g., 31/10/2026)
 */
export function formatDateDMY(dateInput?: string): string {
  if (!dateInput) return '';
  const clean = dateInput.trim();
  // Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const matchYmd = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYmd) {
    const year = matchYmd[1];
    const month = matchYmd[2].padStart(2, '0');
    const day = matchYmd[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  // Format: DD/MM/YYYY
  const matchDmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDmy) {
    const day = matchDmy[1].padStart(2, '0');
    const month = matchDmy[2].padStart(2, '0');
    const year = matchDmy[3];
    return `${day}/${month}/${year}`;
  }
  return clean;
}

/**
 * Loads an image from URL into an HTMLImageElement and converts to base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  // 1. Try fetch with blob
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continue to Image fallback
  }

  // 2. Try Image canvas fallback
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
          return;
        }
      } catch (e) {
        console.warn('Canvas export failed, using badge fallback', e);
      }
      resolve(null);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

export const MAX_SALE_NOTE_ITEMS = 30;

export async function generateSaleNotePDF(
  saleNote: SaleNote,
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

  // Validate letter-size capacity
  if (saleNote.items.length > MAX_SALE_NOTE_ITEMS) {
    throw new Error(
      `La nota de venta excede la capacidad de 1 página tamaño carta (${saleNote.items.length}/${MAX_SALE_NOTE_ITEMS} partidas). Genere una nueva nota para evitar que salga en 2 páginas.`
    );
  }

  // Load logo: User explicitly requested https://appdesignproyectos.com/raguxdistribuciones.jpeg
  const targetLogoUrl =
    profile.logoUrl && !profile.logoUrl.includes('raguxlogo.png')
      ? profile.logoUrl
      : 'https://appdesignproyectos.com/raguxdistribuciones.jpeg';

  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(targetLogoUrl);
  } catch {
    logoBase64 = null;
  }

  // --- HEADER SECTION ---
  // Left: Circular Badge Logo (unboxed, rendered faithfully)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', marginX, 7, 30, 30, undefined, 'FAST');
    } catch {
      drawTextLogoBadge(doc, marginX, 18);
    }
  } else {
    drawTextLogoBadge(doc, marginX, 18);
  }

  // Center: Emisor Details (as in user sample image 0387269a.png)
  const centerEmisorName = saleNote.emisorNombre || profile.nombreComercial || 'RAGUX DISTRIBUCIONES';
  const centerDir = saleNote.emisorDireccion || profile.direccionCalle || 'VILLERIAS #273';
  const centerColCp = saleNote.emisorColoniaCp || profile.coloniaCp || 'SAUCITO C.P. 78110';
  const centerCity = saleNote.emisorCiudadEstado || profile.ciudadEstado || 'SAN LUIS POTOSI, San Luis Potosi';
  const centerTel = saleNote.emisorTelefono || profile.telefono || 'TEL. whatsapp (444)-3053182';
  const centerEmail = saleNote.emisorEmail || profile.email || 'correo. raguxdistribuciones@gmail.com';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(centerEmisorName.toUpperCase(), 110, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(centerDir.toUpperCase(), 110, 15, { align: 'center' });
  doc.text(centerColCp.toUpperCase(), 110, 19, { align: 'center' });
  doc.text(centerCity.toUpperCase(), 110, 23, { align: 'center' });
  doc.text(centerTel, 110, 27, { align: 'center' });
  doc.text(centerEmail, 110, 31, { align: 'center' });

  // Right: NOTA DE VENTA header and Red Folio
  const rightX = pageWidth - marginX;
  
  // Green triangle / indicator
  doc.setFillColor(102, 195, 78); // #66C34E
  doc.rect(rightX - 38, 10.5, 2.5, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NOTA DE VENTA', rightX, 13, { align: 'right' });

  // Red bold Folio (as in sample 003087)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(215, 25, 25); // Vibrant Red
  doc.text(saleNote.folio, rightX, 19, { align: 'right' });

  // Fecha de Emisión (Día / Mes / Año, ej: 31/10/2026)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('Fecha de Emisión', rightX, 23.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateDMY(saleNote.fechaEmision), rightX, 28, { align: 'right' });

  // --- CLIENT & LUGAR DE EXPEDICIÓN SECTION ---
  const clientStartY = 37;

  // Left: "Vendido a:"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Vendido a:', marginX, clientStartY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text((saleNote.clienteNombre || '').toUpperCase(), marginX, clientStartY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let cy = clientStartY + 8.5;

  if (saleNote.clienteRfc) {
    doc.text(saleNote.clienteRfc.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (saleNote.clienteDireccion) {
    doc.text(saleNote.clienteDireccion.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (saleNote.clienteColoniaCp) {
    doc.text(saleNote.clienteColoniaCp.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (saleNote.clienteCiudad) {
    doc.text(saleNote.clienteCiudad.toUpperCase(), marginX, cy);
    cy += 3.8;
  }
  if (saleNote.clienteTelefono) {
    doc.text(saleNote.clienteTelefono.toUpperCase(), marginX, cy);
    cy += 3.8;
  }

  // Right: "Lugar de Expedición:"
  const lugarText = saleNote.lugarExpedicion || 'SAN LUIS POTOSI, San Luis Potosi';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('Lugar de Expedición:', rightX - 65, clientStartY + 3, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(lugarText.toUpperCase(), rightX, clientStartY + 3, { align: 'right' });

  // --- ITEMS TABLE ---
  const tableStartY = Math.max(cy + 2, 60);

  const tableBody = saleNote.items.map((item) => [
    item.cantidad.toFixed(2),
    (item.unidad || 'PIEZAS').toUpperCase(),
    item.descripcion.toUpperCase(),
    formatCurrency(item.precioUnitario),
    formatCurrency(item.importe),
  ]);

  const itemCount = saleNote.items.length;
  const tableFontSize = itemCount > 22 ? 6.2 : 6.8;
  const tableCellPadding = itemCount > 22 ? 0.75 : 1.1;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginX, right: marginX },
    head: [['Cant.', 'UNIDAD', 'Descripción', 'Pcio. Unit.', 'Importe']],
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
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
    },
    didDrawCell: (data) => {
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
  let finalY = lastAutoTable ? lastAutoTable.finalY + 3 : 185;

  // Guarantee strict letter 1-page fit
  if (finalY > pageHeight - 65) {
    finalY = pageHeight - 65;
  }

  // --- TOTAL WITH LETTERS & TOTAL ROW ---
  // Grey bar for "Importe Total Con Letra:"
  doc.setFillColor(195, 202, 207);
  doc.rect(marginX, finalY, 34, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(20, 20, 20);
  doc.text('Importe Total Con Letra:', marginX + 17, finalY + 3.2, { align: 'center' });

  // Amount in words text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(saleNote.totalLetra.toUpperCase(), marginX, finalY + 9);

  // Right Total label and double underline
  const totalX = pageWidth - marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total:', totalX - 35, finalY + 9, { align: 'right' });
  
  const totalFormatted = formatCurrency(saleNote.total);
  doc.text(totalFormatted, totalX, finalY + 9, { align: 'right' });

  // Double underline below total amount (as in sample image 39bfaab5.png)
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.3);
  const lineStart = totalX - 32;
  doc.line(lineStart, finalY + 10.2, totalX, finalY + 10.2);
  doc.line(lineStart, finalY + 11.2, totalX, finalY + 11.2);

  // --- OBSERVACIONES BOX ---
  let obsY = finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Observaciones:', marginX, obsY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 30, 30);
  const rawObs =
    saleNote.observaciones ||
    'ESTIMADO CLIENTE UNA VEZ CHECADA,ENTREGADA,ACEPTADA LA MERCANCÍA Y FIRMADA ESTE COMPROBANTE POR NIGUN MOTIVO SE ACEPTAN RECLAMACIONES Y/O DEVOLUCIONES POSTERIORES A LA FECHA DE ENTREGA FAVOR DE REVISAR BIEN SU MERCANCIA. GRACIAS.';
  // Ensure LAMERCANCIA typo is strictly replaced with LA MERCANCÍA
  const cleanObs = rawObs.replace(/LAMERCANCIA/g, 'LA MERCANCÍA');
  
  const splitObs = doc.splitTextToSize(cleanObs, contentWidth);
  doc.text(splitObs, marginX, obsY + 4);

  // --- PAGARÉ AND SIGNATURE SECTION ---
  const obsHeight = splitObs.length * 3;
  let pagareY = obsY + 5 + obsHeight;

  // Solid black divider line above pagaré
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.4);
  doc.line(marginX, pagareY, pageWidth - marginX, pagareY);

  pagareY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 20, 20);

  const pagareText =
    saleNote.textoPagare ||
    `En SAN LUIS POTOSI, San Luis Potosi Debe(mos) y pagare(mos) incondicionalmente por este Pagaré a la orden de (RAGUXDISTRIBUCIONES) en el lugar que se requiera La cantidad de _$__${totalFormatted}___________________Valor recibido de mi (nuestra) entera satisfacción, sujetos a la condición de que, al no pagarse a su vencimiento, desde la fecha de vencimiento de este documento hasta el día de su liquidación, causará intereses moratorios del ______ mensual, pagadero en esta ciudad juntamente con el principal.`;

  const splitPagare = doc.splitTextToSize(pagareText, contentWidth - 45);
  doc.text(splitPagare, marginX, pagareY);

  // Signature line on the bottom right ("Recibí de conformidad")
  const sigX = pageWidth - marginX;
  const sigY = pagareY + 8;
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.4);
  doc.line(sigX - 42, sigY, sigX, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('Recibí de conformidad', sigX - 21, sigY + 4, { align: 'center' });

  return doc;
}

function drawTextLogoBadge(doc: jsPDF, x: number, y: number) {
  // Circular green badge replica
  doc.setFillColor(102, 195, 78); // #66C34E
  doc.circle(x + 10, y - 4, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('R', x + 10, y - 0.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('RAGUX', x + 24, y - 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 195, 78);
  doc.text('DISTRIBUCIONES', x + 24, y);
}

function formatCurrency(val: number): string {
  return (val || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
