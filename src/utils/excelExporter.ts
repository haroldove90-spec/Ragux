import * as XLSX from 'xlsx';
import { Client, Product, Quotation, SaleNote } from '../types';
import { formatDateDMY } from './saleNotePdfGenerator';

/**
 * Utility to download generated XLSX workbook in the browser
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename, { compression: true });
}

/**
 * Export all Sale Notes to Excel (.xlsx) with 2 sheets:
 * Sheet 1: Resumen de Notas de Venta
 * Sheet 2: Detalle de Partidas
 */
export function exportSaleNotesToExcel(notes: SaleNote[], filename = 'Notas_de_Venta_ROGUX.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = notes.map((note) => ({
    'Folio': note.folio,
    'Fecha Emisión': formatDateDMY(note.fechaEmision),
    'Lugar Expedición': note.lugarExpedicion,
    'Cliente': note.clienteNombre,
    'RFC Cliente': note.clienteRfc || 'N/A',
    'Teléfono': note.clienteTelefono || 'N/A',
    'Ciudad / Estado': note.clienteCiudad || 'N/A',
    'Partidas': note.items.length,
    'Subtotal ($)': note.subtotal,
    'Descuento ($)': note.descuento || 0,
    'Total ($)': note.total,
    'Importe con Letra': note.totalLetra,
    'Estado': note.estado.toUpperCase(),
    'Observaciones': (note.observaciones || '').replace(/LAMERCANCIA/g, 'LA MERCANCÍA'),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  // Auto-fit column widths
  wsSummary['!cols'] = [
    { wch: 10 }, // Folio
    { wch: 14 }, // Fecha
    { wch: 25 }, // Lugar
    { wch: 32 }, // Cliente
    { wch: 16 }, // RFC
    { wch: 16 }, // Tel
    { wch: 26 }, // Ciudad
    { wch: 10 }, // Partidas
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Descuento
    { wch: 14 }, // Total
    { wch: 45 }, // Letra
    { wch: 12 }, // Estado
    { wch: 50 }, // Observaciones
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Notas de Venta');

  // Sheet 2: All items breakdown
  const itemsRows: any[] = [];
  notes.forEach((note) => {
    note.items.forEach((item, idx) => {
      itemsRows.push({
        'Folio Nota': note.folio,
        'Fecha': note.fechaEmision,
        'Cliente': note.clienteNombre,
        '# Partida': idx + 1,
        'Código / Clave': item.codigo || 'N/A',
        'Cantidad': item.cantidad,
        'Unidad': item.unidad || 'PIEZAS',
        'Descripción': item.descripcion,
        'Precio Unitario ($)': item.precioUnitario,
        'Importe ($)': item.importe,
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemsRows);
  wsItems['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 30 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 50 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Detalle de Partidas');

  downloadWorkbook(wb, filename);
}

/**
 * Export single Sale Note to formatted Excel receipt
 */
export function exportSingleSaleNoteToExcel(note: SaleNote) {
  const wb = XLSX.utils.book_new();

  // Header info rows
  const headerData = [
    ['RAGUX DISTRIBUCIONES - NOTA DE VENTA'],
    ['FOLIO:', note.folio, '', 'FECHA DE EMISIÓN:', formatDateDMY(note.fechaEmision)],
    ['LUGAR DE EXPEDICIÓN:', note.lugarExpedicion],
    ['EMISOR:', note.emisorNombre || 'RAGUX DISTRIBUCIONES', '', 'TEL:', note.emisorTelefono || ''],
    ['DIRECCIÓN EMISOR:', `${note.emisorDireccion || ''} ${note.emisorColoniaCp || ''}`],
    [],
    ['DATOS DEL CLIENTE ("Vendido a:")'],
    ['CLIENTE:', note.clienteNombre],
    ['RFC:', note.clienteRfc || 'N/A', '', 'TELÉFONO:', note.clienteTelefono || 'N/A'],
    ['DIRECCIÓN:', `${note.clienteDireccion || ''} ${note.clienteColoniaCp || ''}`],
    ['CIUDAD:', note.clienteCiudad || 'N/A'],
    [],
    ['Cant.', 'UNIDAD', 'Código', 'Descripción', 'Pcio. Unit.', 'Importe'],
  ];

  // Items rows
  const itemRows = note.items.map((i) => [
    i.cantidad,
    i.unidad || 'PIEZAS',
    i.codigo || '',
    i.descripcion,
    i.precioUnitario,
    i.importe,
  ]);

  // Totals & Footer rows
  const footerRows = [
    [],
    ['', '', '', 'SUBTOTAL:', '', note.subtotal],
    ['', '', '', 'DESCUENTO:', '', note.descuento || 0],
    ['', '', '', 'TOTAL:', '', note.total],
    ['IMPORTE CON LETRA:', note.totalLetra],
    [],
    ['OBSERVACIONES:', (note.observaciones || '').replace(/LAMERCANCIA/g, 'LA MERCANCÍA')],
    ['PAGARÉ:', `En ${note.lugarExpedicion} Debe(mos) y pagare(mos) incondicionalmente por este Pagaré a la orden de (RAGUXDISTRIBUCIONES) la cantidad de $${note.total.toFixed(2)} M.N.`],
    ['FIRMA:', '_______________________ Recibí de conformidad'],
  ];

  const fullData = [...headerData, ...itemRows, ...footerRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  ws['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 50 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Nota_${note.folio}`);
  downloadWorkbook(wb, `Nota_Venta_${note.folio}_ROGUX.xlsx`);
}

/**
 * Export all Quotations to Excel (.xlsx) with 2 sheets
 */
export function exportQuotationsToExcel(quotations: Quotation[], filename = 'Cotizaciones_ROGUX.xlsx') {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = quotations.map((q) => ({
    'Folio': q.folio,
    'Fecha Expedición': q.fechaExpedicion,
    'Lugar Expedición': q.lugarExpedicion,
    'Cliente': q.clienteNombre,
    'RFC Cliente': q.clienteRfc || 'N/A',
    'Teléfono': q.clienteTelefono || 'N/A',
    'Ciudad / Estado': q.clienteCiudad || 'N/A',
    'Partidas': q.items.length,
    'Subtotal ($)': q.subtotal,
    'Descuento ($)': q.descuento || 0,
    'Total ($)': q.total,
    'Importe con Letra': q.totalLetra,
    'Válido Hasta': q.validoHasta,
    'Tiempo Entrega': q.tiempoEntrega,
    'Forma de Pago': q.formaPago,
    'Estado': q.estado.toUpperCase(),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 10 },
    { wch: 14 },
    { wch: 25 },
    { wch: 32 },
    { wch: 16 },
    { wch: 16 },
    { wch: 26 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 45 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Cotizaciones');

  // Items sheet
  const itemsRows: any[] = [];
  quotations.forEach((q) => {
    q.items.forEach((item, idx) => {
      itemsRows.push({
        'Folio Cotización': q.folio,
        'Fecha': q.fechaExpedicion,
        'Cliente': q.clienteNombre,
        '# Partida': idx + 1,
        'Código / Clave': item.codigo || 'N/A',
        'Cantidad': item.cantidad,
        'Unidad de Medida': item.unidadMedida || 'H87',
        'Descripción': item.descripcion,
        'Precio Unitario ($)': item.precioUnitario,
        'Importe ($)': item.importe,
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemsRows);
  wsItems['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 30 },
    { wch: 10 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 50 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Detalle de Partidas');

  downloadWorkbook(wb, filename);
}

/**
 * Export single Quotation to Excel
 */
export function exportSingleQuotationToExcel(quotation: Quotation) {
  const wb = XLSX.utils.book_new();

  const headerData = [
    ['ROGUX DISTRIBUCIONES - COTIZACIÓN COMERCIAL'],
    ['FOLIO:', quotation.folio, '', 'FECHA:', quotation.fechaExpedicion],
    ['LUGAR:', quotation.lugarExpedicion],
    [],
    ['DATOS DEL CLIENTE ("Cotizado a:")'],
    ['CLIENTE:', quotation.clienteNombre],
    ['RFC:', quotation.clienteRfc || 'N/A', '', 'TELÉFONO:', quotation.clienteTelefono || 'N/A'],
    ['DIRECCIÓN:', quotation.clienteDireccion || 'N/A'],
    ['CIUDAD:', quotation.clienteCiudad || 'N/A'],
    [],
    ['Cant.', 'Unid. Medida', 'Código', 'Descripción', 'Pcio. Unitario', 'Importe'],
  ];

  const itemRows = quotation.items.map((i) => [
    i.cantidad,
    i.unidadMedida || 'H87',
    i.codigo || '',
    i.descripcion,
    i.precioUnitario,
    i.importe,
  ]);

  const footerRows = [
    [],
    ['', '', '', 'SUBTOTAL:', '', quotation.subtotal],
    ['', '', '', 'DESCUENTO:', '', quotation.descuento || 0],
    ['', '', '', 'TOTAL:', '', quotation.total],
    ['TOTAL CON LETRA:', quotation.totalLetra],
    [],
    ['CONDICIONES COMERCIALES'],
    ['Válido Hasta:', quotation.validoHasta],
    ['Tiempo de Entrega:', quotation.tiempoEntrega],
    ['Forma de Pago:', quotation.formaPago],
  ];

  const fullData = [...headerData, ...itemRows, ...footerRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  ws['!cols'] = [
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 50 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Cotizacion_${quotation.folio}`);
  downloadWorkbook(wb, `Cotizacion_${quotation.folio}_ROGUX.xlsx`);
}

/**
 * Export Products Catalog to Excel (.xlsx) matching Catalogo_Productos_ROGUX layout
 */
export function exportProductsToExcel(products: Product[], filename = 'Catalogo_Productos_ROGUX.xlsx') {
  const wb = XLSX.utils.book_new();

  const rows = products.map((p) => ({
    'Código / Clave': p.codigo,
    'Descripción del Producto': p.descripcion,
    'Unidad de Medida': p.unidadMedida || 'PIEZAS',
    'Precio Unitario ($)': p.precioUnitario,
    'Categoría': p.categoria || 'General',
    'Stock Disponible': p.stock !== undefined ? p.stock : 0,
    'Estatus': p.activo === false ? 'INACTIVO' : 'ACTIVO',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 55 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo Productos');
  downloadWorkbook(wb, filename);
}

/**
 * Download empty Product Layout Template
 */
export function downloadProductLayoutTemplate() {
  const wb = XLSX.utils.book_new();
  const sample = [
    {
      'Código / Clave': 'M1251',
      'Descripción del Producto': 'BICARBONATO DE SODIO C/12 100 GRS JALOMA',
      'Unidad de Medida': 'PIEZAS',
      'Precio Unitario ($)': 10.21,
      'Categoría': 'Higiene y Cuidado',
      'Stock Disponible': 250,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 55 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Productos');
  downloadWorkbook(wb, 'Plantilla_Catalogo_Productos_ROGUX.xlsx');
}

/**
 * Export Clients Directory to Excel (.xlsx) matching ley_yout_clientes layout
 */
export function exportClientsToExcel(clients: Client[], filename = 'Directorio_Clientes_ROGUX.xlsx') {
  const wb = XLSX.utils.book_new();

  const rows = clients.map((c, idx) => ({
    'No.': c.no || idx + 1,
    'NOMBRE': c.nombre,
    'RFC': c.rfc || '',
    'CALLE': c.calle || c.direccion || '',
    '# EXT.': c.numeroExt || '',
    'COLONIA': c.colonia || '',
    'C.P.': c.cp || '',
    'CIUDAD': c.ciudad || '',
    'ESTADO': c.estado || 'SAN LUIS POTOSI',
    'PAIS': c.pais || 'MEXICO',
    'TELEFONO1': c.telefono || '',
    'E-MAIL1': c.email || '',
    'ESTATUS': c.activo === false ? 'INACTIVO' : 'ACTIVO',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 38 },
    { wch: 18 },
    { wch: 30 },
    { wch: 10 },
    { wch: 22 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Directorio Clientes');
  downloadWorkbook(wb, filename);
}

/**
 * Download empty Client Layout Template matching ley_yout_clientes
 */
export function downloadClientLayoutTemplate() {
  const wb = XLSX.utils.book_new();
  const sample = [
    {
      'No.': 1,
      'NOMBRE': 'FRANCISCO JAVIER MATA MOLINA',
      'RFC': 'MAMF5512033Y8',
      'CALLE': 'GUERRERO',
      '# EXT.': '100',
      'COLONIA': 'CENTRO',
      'C.P.': '78700',
      'CIUDAD': 'MATEHUALA',
      'ESTADO': 'SAN LUIS POTOSI',
      'PAIS': 'MEXICO',
      'TELEFONO1': '(488) 123-45-67',
      'E-MAIL1': 'javier.mata@ejemplo.com',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 38 },
    { wch: 18 },
    { wch: 30 },
    { wch: 10 },
    { wch: 22 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Clientes');
  downloadWorkbook(wb, 'Plantilla_Leyout_Clientes_ROGUX.xlsx');
}
