import { Client, CompanyProfile, Product, Quotation, RoleInfo, SaleNote, UserAccount } from '../types';
import { numeroALetras } from '../utils/numberToWords';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin',
    nombre: 'Administrador ROGUX',
    usuario: 'admin_123',
    clave: 'Chevropar#1970',
    rol: 'admin',
    telefono: '4443053182',
    whatsapp: '4443053182',
    email: 'admin@raguxdistribuciones.com',
    fotoUrl: '',
    activo: true,
    createdAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'usr-harold',
    nombre: 'Harold Anguiano Morales',
    usuario: 'haroldo90',
    clave: 'Chevropar#1970',
    rol: 'vendedor',
    telefono: '4443053182',
    whatsapp: '4443053182',
    email: 'haroldanguiano@gmail.com',
    fotoUrl: '',
    activo: true,
    createdAt: '2026-10-25T10:00:00Z',
  },
];

export const APP_ROLES: RoleInfo[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Acceso total: crear y gestionar cotizaciones, notas de venta, catálogo, clientes, empleados y configuración.',
    badgeColor: '#66C34E',
  },
  {
    id: 'logistica',
    name: 'Logística',
    description: 'Acceso a cotizaciones, notas de venta, modificación de cotizaciones y consulta del catálogo de productos.',
    badgeColor: '#3B82F6',
  },
  {
    id: 'vendedor',
    name: 'Ventas',
    description: 'Generación y consulta de notas de venta y comprobantes pagaré.',
    badgeColor: '#10B981',
  },
  {
    id: 'almacen',
    name: 'Almacén',
    description: 'Gestión y comprobantes de almacén.',
    badgeColor: '#F59E0B',
  },
];

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  nombreComercial: 'LAURA GUEL GUERRERO (RAGUXDISTRIBUCIONES)',
  razonSocial: 'LAURA GUEL GUERRERO',
  rfc: 'GUGL780927NRA',
  direccionCalle: 'VILLERIAS #273',
  coloniaCp: 'SAUCITO C.P. 78110',
  ciudadEstado: 'SAN LUIS POTOSI, San Luis Potosi',
  telefono: '(444)-3053182',
  email: 'raguxdistribuciones@gmail.com',
  lugarExpedicionDefecto: 'SAN LUIS POTOSI, San Luis Potosi',
  terminosPorDefecto: {
    validez: '30 DÍAS / VIGENCIA INMEDIATA',
    tiempoEntrega: 'INMEDIATA SALVO PREVIA VENTA',
    formaPago: 'PAGO EN PARCIALIDADES O DIFERIDO',
  },
  logoUrl: 'https://appdesignproyectos.com/raguxdistribuciones.jpeg',
  ultimoFolio: 1963,
  ultimoFolioNota: 3087,
};

// Zero sample clients and zero sample products so admin can import directly from their layout files
export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_PRODUCTS: Product[] = [];


// Sample items matching the exact user sample quotation #001963
const sampleItems = [
  { id: 'item-1', productId: 'prod-01', codigo: 'M1251', cantidad: 24, unidadMedida: 'H87', descripcion: 'BICARBONATO DE SODIO C/12 100 GRS JALOMA-7501094911059 M1251', precioUnitario: 10.21, importe: 245.04 },
  { id: 'item-2', productId: 'prod-02', codigo: 'M1031', cantidad: 20, unidadMedida: 'H87', descripcion: 'COTONETE NUTRAN 410PZS -7506601400322 -M1031', precioUnitario: 30.51, importe: 610.20 },
  { id: 'item-3', productId: 'prod-03', codigo: 'M1256', cantidad: 25, unidadMedida: 'H87', descripcion: 'ACEITE DE ALMENDRAS JALOMA 60 ML-750604031285 M1256', precioUnitario: 19.04, importe: 476.00 },
  { id: 'item-4', productId: 'prod-04', codigo: 'M1028', cantidad: 20, unidadMedida: 'H87', descripcion: 'COTONETE NUTRAN 310PZS -7506601400308 - M1028', precioUnitario: 24.20, importe: 484.00 },
  { id: 'item-5', productId: 'prod-05', codigo: 'M1272', cantidad: 16, unidadMedida: 'H87', descripcion: 'JALOMA SILICA KERATINA 12 OLEOS 60ML-750604191244 M1272', precioUnitario: 22.19, importe: 355.04 },
  { id: 'item-6', productId: 'prod-06', codigo: 'M1032', cantidad: 30, unidadMedida: 'H87', descripcion: 'COTONETE NUTRAN 500 PZS -7506601400346 - M1032', precioUnitario: 37.47, importe: 1124.10 },
  { id: 'item-7', productId: 'prod-07', codigo: 'M1253', cantidad: 25, unidadMedida: 'H87', descripcion: 'ACEITE DE OLIVO JALOMA 120 ML-750604031128 M1253', precioUnitario: 20.00, importe: 500.00 },
  { id: 'item-8', productId: 'prod-08', codigo: 'M1259', cantidad: 25, unidadMedida: 'H87', descripcion: 'ACETONA JALOMA 140 ML-750604031531 M1259', precioUnitario: 22.54, importe: 563.50 },
  { id: 'item-9', productId: 'prod-09', codigo: 'M1277', cantidad: 3, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DE 25 CM JALOMA-750604471254 - M1277', precioUnitario: 33.01, importe: 99.03 },
  { id: 'item-10', productId: 'prod-10', codigo: 'M1276', cantidad: 10, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DEL 15 CM-JALOMA-750604471139 M1276', precioUnitario: 20.20, importe: 202.00 },
  { id: 'item-11', productId: 'prod-11', codigo: 'M1104', cantidad: 40, unidadMedida: 'H87', descripcion: 'GEL FIJADOR CAPILAR NUVEL 250ML NUEVO-7501082750232 M1104', precioUnitario: 13.87, importe: 554.80 },
  { id: 'item-12', productId: 'prod-12', codigo: 'M1275', cantidad: 10, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DEL 7 CM-JALOMA-750604471192 M1275', precioUnitario: 11.03, importe: 110.30 },
  { id: 'item-13', productId: 'prod-13', codigo: 'M1275B', cantidad: 10, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DEL 10 CM-JALOMA-750604471133 M1275', precioUnitario: 12.82, importe: 128.20 },
  { id: 'item-14', productId: 'prod-14', codigo: 'M1278', cantidad: 1, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DEL 30 CM-JALOMA-750604471936 M1278', precioUnitario: 38.16, importe: 38.16 },
  { id: 'item-15', productId: 'prod-15', codigo: 'M1273', cantidad: 10, unidadMedida: 'H87', descripcion: 'VENDA ELASTICA DEL 5 CM JALOMA-750604471273 M1273', precioUnitario: 7.99, importe: 79.90 },
  { id: 'item-16', productId: 'prod-16', codigo: 'M1372', cantidad: 24, unidadMedida: 'H87', descripcion: 'TOALLITA DESIN-NUVEL HIDRATANTES C/25PZS-7501082750481 M1372', precioUnitario: 28.79, importe: 690.96 },
  { id: 'item-17', productId: 'prod-17', codigo: 'M1155', cantidad: 6, unidadMedida: 'H87', descripcion: 'CREM NUVEL ACEITE COCO 750ML-7501082721713 M1155', precioUnitario: 33.78, importe: 202.68 },
  { id: 'item-18', productId: 'prod-18', codigo: 'M1271', cantidad: 24, unidadMedida: 'H87', descripcion: 'SILICA CON KERATINA Y 12 OLEOS 120ML JALOMA-750604191251 M1271', precioUnitario: 37.68, importe: 904.32 },
  { id: 'item-19', productId: 'prod-19', codigo: 'M1257', cantidad: 25, unidadMedida: 'H87', descripcion: 'ACEITE DE ALMENDRAS JALOMA 120ML-750604031311 - M1257', precioUnitario: 24.64, importe: 616.00 },
  { id: 'item-20', productId: 'prod-20', codigo: 'M1230', cantidad: 2, unidadMedida: 'H87', descripcion: 'VITROLERO P/LAPIZ C/60 PZA JALOMA-750604591230 M1230', precioUnitario: 216.00, importe: 432.00 },
  { id: 'item-21', productId: 'prod-21', codigo: 'M0409', cantidad: 6, unidadMedida: 'H87', descripcion: 'ESPONJABON EFECTO ANTIACNE -741021020188', precioUnitario: 26.90, importe: 161.40 },
  { id: 'item-22', productId: 'prod-22', codigo: 'M0410', cantidad: 6, unidadMedida: 'H87', descripcion: 'ESPONJABON T-TAKI ACIDO HIALURONICO HIDRATACION AVANZADA 7501103301819 - M0410', precioUnitario: 26.90, importe: 161.40 },
  { id: 'item-23', productId: 'prod-23', codigo: 'M1103', cantidad: 12, unidadMedida: 'H87', descripcion: 'ESPONJABON ACLARANTE CONCHA NACAR-7501103305854 M1103', precioUnitario: 26.90, importe: 322.80 },
  { id: 'item-24', productId: 'prod-24', codigo: 'M1154', cantidad: 12, unidadMedida: 'H87', descripcion: 'CREMA ARANDANOS EX-HUM 750ML -7501082721706 M1154', precioUnitario: 33.78, importe: 405.36 },
  { id: 'item-25', productId: 'prod-25', codigo: 'M1080', cantidad: 12, unidadMedida: 'H87', descripcion: 'CREMA P/RESECA MIEL/AVENA 750ML -7501082721570 M1080', precioUnitario: 33.78, importe: 405.36 },
  { id: 'item-26', productId: 'prod-26', codigo: 'M1405', cantidad: 36, unidadMedida: 'H87', descripcion: 'ALCOHOL SAN LUIS 250ML AZUL -3008101170 M1405', precioUnitario: 14.20, importe: 511.20 },
  { id: 'item-27', productId: 'prod-27', codigo: 'M1289', cantidad: 24, unidadMedida: 'H87', descripcion: 'GEL ANTIB MANZANA CITRUS 500ML -JES2220701062 M1289', precioUnitario: 34.54, importe: 828.96 },
  { id: 'item-28', productId: 'prod-28', codigo: 'M1009', cantidad: 12, unidadMedida: 'H87', descripcion: 'CREMA NUVEL 3 EN 1 H-SUPERIOR 750S 201A -7501082722421 M1009', precioUnitario: 27.65, importe: 331.80 },
  { id: 'item-29', productId: 'prod-29', codigo: 'M1044', cantidad: 12, unidadMedida: 'H87', descripcion: 'CREMA ROSA 680 S ACLARADO IDEAL -7501082721997 M1044', precioUnitario: 40.39, importe: 484.68 },
  { id: 'item-30', productId: 'prod-30', codigo: 'M1045', cantidad: 12, unidadMedida: 'H87', descripcion: 'CREMA AZUL 500G EXTRA CON KARITE -7501082721956 M1045', precioUnitario: 40.39, importe: 484.68 },
];

const subtotalCalculado = sampleItems.reduce((acc, curr) => acc + curr.importe, 0);
const totalRedondeado = Math.round(subtotalCalculado * 100) / 100;

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'cot-001963',
    folio: '001963',
    fechaExpedicion: '2025-10-20',
    lugarExpedicion: 'SAN LUIS POTOSI, SAN LUIS POTOSI',
    clienteId: 'cli-001',
    clienteNombre: 'FRANCISCO JAVIER MATA MOLINA',
    clienteRfc: 'MAMF5512033Y8',
    clienteDireccion: 'GUERRERO 100, MATEHUALA CENTRO C.P. 78700',
    clienteTelefono: '(488) 123-45-67',
    clienteCiudad: 'MATEHUALA, SAN LUIS POTOSI',
    items: sampleItems,
    subtotal: totalRedondeado,
    descuento: 0.0,
    total: totalRedondeado,
    totalLetra: numeroALetras(totalRedondeado),
    validoHasta: '30 DÍAS / 20/11/2025',
    tiempoEntrega: 'INMEDIATA SALVO PREVIA VENTA',
    formaPago: 'PAGO EN PARCIALIDADES O DIFERIDO',
    notas: 'Precios sujetos a cambio sin previo aviso. Mercancía puesta en almacén.',
    creadoPor: 'Admin',
    fechaCreacion: '2025-10-20T10:30:00Z',
    estado: 'vigente',
    sincronizado: true,
  },
];

// Sample items from the user's uploaded Nota de Venta #003087
const sampleSaleNoteItems = [
  {
    id: 'nota-item-1',
    productId: 'prod-31',
    codigo: 'M00054',
    cantidad: 24,
    unidad: 'PIEZAS',
    descripcion: 'SALSA VALENTINA PICANTE 24/370ML 097339000054 -M00054',
    precioUnitario: 15.95,
    importe: 382.80,
  },
  {
    id: 'nota-item-2',
    productId: 'prod-32',
    codigo: 'BULTO-01',
    cantidad: 1,
    unidad: 'PIEZAS',
    descripcion: 'BIG FACIAL QUALITY 600 HOJAS PAPEL HIGIENICO *********** BULTO C/8PAQUETES *********** -',
    precioUnitario: 515.87,
    importe: 515.87,
  },
  {
    id: 'nota-item-3',
    productId: 'prod-33',
    codigo: 'M1132',
    cantidad: 36,
    unidad: 'PIEZAS',
    descripcion: 'DODYS TOALLITA 80PZS AZUL- 7502221010729 M1132',
    precioUnitario: 27.46,
    importe: 988.56,
  },
  {
    id: 'nota-item-4',
    productId: 'prod-34',
    codigo: 'M4302',
    cantidad: 10,
    unidad: 'PIEZAS',
    descripcion: 'SERVILLETA PETALO C/100 7501007704302 M4302',
    precioUnitario: 19.85,
    importe: 198.50,
  },
];

const notaSubtotal = sampleSaleNoteItems.reduce((acc, curr) => acc + curr.importe, 0);
const notaTotalRedondeado = Math.round(notaSubtotal * 100) / 100;

export const INITIAL_SALE_NOTES: SaleNote[] = [
  {
    id: 'nota-003087',
    folio: '003087',
    fechaEmision: '2026-10-22',
    lugarExpedicion: 'SAN LUIS POTOSI, San Luis Potosi',
    emisorNombre: 'RAGUX DISTRIBUCIONES',
    emisorDireccion: 'VILLERIAS #273',
    emisorColoniaCp: 'SAUCITO C.P. 78110',
    emisorCiudadEstado: 'SAN LUIS POTOSI, San Luis Potosi',
    emisorTelefono: 'TEL. whatsapp (444)-3053182',
    emisorEmail: 'correo. raguxdistribuciones@gmail.com',
    clienteId: 'cli-004',
    clienteNombre: 'MAXSTORE SUCURSAL ARRIAGA',
    clienteRfc: 'SEFA900405BC9',
    clienteDireccion: 'VILLA DE ARRIAGA s/n',
    clienteColoniaCp: 'CENTRO C.P. 78490',
    clienteCiudad: 'VILLA DE ARRIAGA , SAN LUIS POTOSI',
    clienteTelefono: '( ) - - -',
    items: sampleSaleNoteItems,
    subtotal: notaTotalRedondeado,
    descuento: 0,
    total: notaTotalRedondeado,
    totalLetra: 'DOS MIL OCHENTA Y CINCO PESOS 73/100 M.N.',
    observaciones: 'ESTIMADO CLIENTE UNA VEZ CHECADA,ENTREGADA,ACEPTADA LA MERCANCÍA Y FIRMADA ESTE COMPROBANTE POR NIGUN MOTIVO SE ACEPTAN RECLAMACIONES Y/O DEVOLUCIONES POSTERIORES A LA FECHA DE ENTREGA FAVOR DE REVISAR BIEN SU MERCANCIA. GRACIAS.',
    fechaCreacion: '2026-10-22T14:30:00Z',
    estado: 'pagada',
    sincronizado: true,
  },
];

