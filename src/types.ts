export type RoleType = 'admin' | 'vendedor' | 'almacen' | 'empleado';
export type UserRole = 'admin' | 'vendedor' | 'almacen' | 'empleado';

export type NavTab =
  | 'nueva_cotizacion'
  | 'cotizaciones'
  | 'nueva_nota_venta'
  | 'notas_venta'
  | 'productos'
  | 'clientes'
  | 'empleados'
  | 'perfil';

export interface UserAccount {
  id: string;
  nombre: string;
  usuario: string;
  clave: string;
  rol: UserRole;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  fotoUrl?: string;
  activo: boolean;
  createdAt?: string;
}

export interface RoleInfo {
  id: RoleType;
  name: string;
  description: string;
  badgeColor: string;
}

export interface QuotationItem {
  id: string;
  productId?: string;
  codigo?: string;
  cantidad: number;
  unidadMedida: string; // e.g. H87, PZA, CAJA
  descripcion: string;
  precioUnitario: number;
  importe: number;
}

export interface Quotation {
  id: string;
  folio: string; // e.g. "001963"
  fechaExpedicion: string; // YYYY-MM-DD
  lugarExpedicion: string; // e.g. "SAN LUIS POTOSI, SAN LUIS POTOSI"
  
  // Client info
  clienteId?: string;
  clienteNombre: string;
  clienteRfc: string;
  clienteDireccion: string;
  clienteTelefono: string;
  clienteCiudad: string;
  
  // Items
  items: QuotationItem[];
  
  // Calculations
  subtotal: number;
  descuento: number;
  total: number;
  totalLetra: string;
  
  // Conditions
  validoHasta: string; // e.g. "30 DÍAS / 20/11/2025"
  tiempoEntrega: string; // e.g. "INMEDIATA"
  formaPago: string; // e.g. "PAGO EN PARCIALIDADES O DIFERIDO"
  notas?: string;
  
  creadoPor: string;
  fechaCreacion: string;
  estado: 'vigente' | 'aprobada' | 'vencida' | 'cancelada';
  sincronizado: boolean; // For offline / Supabase future sync
}

export interface Product {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precioUnitario: number;
  categoria?: string;
  stock?: number;
}

export interface Client {
  id: string;
  nombre: string;
  rfc: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email?: string;
  contacto?: string;
}

export interface SaleNoteItem {
  id: string;
  productId?: string;
  codigo?: string;
  cantidad: number;
  unidad: string; // e.g. PIEZAS, BULTO, H87, CAJA
  descripcion: string;
  precioUnitario: number;
  importe: number;
}

export interface SaleNote {
  id: string;
  folio: string; // e.g. "003087"
  fechaEmision: string; // YYYY-MM-DD
  lugarExpedicion: string; // e.g. "SAN LUIS POTOSI, San Luis Potosi"
  
  // Emisor info (for print/PDF)
  emisorNombre: string;
  emisorDireccion: string;
  emisorColoniaCp: string;
  emisorCiudadEstado: string;
  emisorTelefono: string;
  emisorEmail: string;

  // Client info ("Vendido a:")
  clienteId?: string;
  clienteNombre: string;
  clienteRfc: string;
  clienteDireccion: string;
  clienteColoniaCp?: string;
  clienteCiudad: string;
  clienteTelefono: string;

  // Items
  items: SaleNoteItem[];

  // Totales
  subtotal: number;
  descuento: number;
  total: number;
  totalLetra: string;

  // Footer fields
  observaciones: string;
  textoPagare?: string;

  fechaCreacion: string;
  estado: 'pagada' | 'pendiente' | 'cancelada';
  sincronizado: boolean;
}

export interface CompanyProfile {
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  direccionCalle: string;
  coloniaCp: string;
  ciudadEstado: string;
  telefono: string;
  email: string;
  lugarExpedicionDefecto: string;
  terminosPorDefecto: {
    validez: string;
    tiempoEntrega: string;
    formaPago: string;
  };
  logoUrl: string;
  ultimoFolio: number;
  ultimoFolioNota?: number;
}

