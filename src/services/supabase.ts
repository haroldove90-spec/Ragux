import { createClient } from '@supabase/supabase-js';
import { Client, Product, Quotation, SaleNote, UserAccount } from '../types';

export const SUPABASE_CONFIG = {
  projectId: 'unhnyzyejdpwxgvbgbda',
  projectName: "ragux@appdesign.appdesignproyectos.com's Project",
  url: 'https://unhnyzyejdpwxgvbgbda.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaG55enllamRwd3hndmJnYmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MjcyMzUsImV4cCI6MjEwOTAwMzIzNX0.NX0EzJl_MYJaHwK9-YbufeKBfpo3HsYqihbEsLzjD3E',
};

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

/**
 * Service to sync application records between LocalStorage and Supabase.
 * Designed with full resilience: if tables don't exist yet or connection fails,
 * operations gracefully fallback to local storage without interrupting user flow.
 */
export const SupabaseService = {
  // Connection tester
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          return { ok: false, message: 'Tablas aún no creadas en Supabase. Ejecuta el script SQL.' };
        }
        return { ok: false, message: error.message };
      }
      return { ok: true, message: 'Conectado a Supabase correctamente.' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Error de conexión a Supabase' };
    }
  },

  // USERS / EMPLOYEES
  async getUsers(): Promise<UserAccount[] | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;
      return data.map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        usuario: u.usuario,
        clave: u.clave,
        rol: u.rol,
        telefono: u.telefono || '',
        activo: u.activo ?? true,
        createdAt: u.created_at,
      }));
    } catch {
      return null;
    }
  },

  async upsertUser(user: UserAccount): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        clave: user.clave,
        rol: user.rol,
        telefono: user.telefono || '',
        activo: user.activo,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // PRODUCTS
  async getProducts(): Promise<Product[] | null> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('codigo', { ascending: true });
      if (error || !data) return null;
      return data.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        descripcion: p.descripcion,
        unidadMedida: p.unidad_medida || 'H87',
        precioUnitario: Number(p.precio_unitario) || 0,
        categoria: p.categoria || '',
        stock: p.stock !== undefined ? Number(p.stock) : undefined,
      }));
    } catch {
      return null;
    }
  },

  async upsertProduct(product: Product): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').upsert({
        id: product.id,
        codigo: product.codigo,
        descripcion: product.descripcion,
        unidad_medida: product.unidadMedida,
        precio_unitario: product.precioUnitario,
        categoria: product.categoria || '',
        stock: product.stock ?? 0,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // CLIENTS
  async getClients(): Promise<Client[] | null> {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('nombre', { ascending: true });
      if (error || !data) return null;
      return data.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        rfc: c.rfc,
        direccion: c.direccion,
        ciudad: c.ciudad,
        telefono: c.telefono,
        email: c.email || '',
        contacto: c.contacto || '',
      }));
    } catch {
      return null;
    }
  },

  async upsertClient(client: Client): Promise<boolean> {
    try {
      const { error } = await supabase.from('clients').upsert({
        id: client.id,
        nombre: client.nombre,
        rfc: client.rfc,
        direccion: client.direccion,
        ciudad: client.ciudad,
        telefono: client.telefono,
        email: client.email || '',
        contacto: client.contacto || '',
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // QUOTATIONS
  async getQuotations(): Promise<Quotation[] | null> {
    try {
      const { data, error } = await supabase.from('quotations').select('*').order('fecha_expedicion', { ascending: false });
      if (error || !data) return null;
      return data.map((q: any) => ({
        id: q.id,
        folio: q.folio,
        fechaExpedicion: q.fecha_expedicion,
        lugarExpedicion: q.lugar_expedicion,
        clienteId: q.cliente_id,
        clienteNombre: q.cliente_nombre,
        clienteRfc: q.cliente_rfc,
        clienteDireccion: q.cliente_direccion,
        clienteTelefono: q.cliente_telefono,
        clienteCiudad: q.cliente_ciudad,
        items: q.items || [],
        subtotal: Number(q.subtotal) || 0,
        descuento: Number(q.descuento) || 0,
        total: Number(q.total) || 0,
        totalLetra: q.total_letra || '',
        validoHasta: q.valido_hasta || '',
        tiempoEntrega: q.tiempo_entrega || '',
        formaPago: q.forma_pago || '',
        notas: q.notas || '',
        creadoPor: q.creado_por || 'Admin',
        fechaCreacion: q.fecha_creacion || q.created_at,
        estado: q.estado || 'vigente',
        sincronizado: true,
      }));
    } catch {
      return null;
    }
  },

  async upsertQuotation(quotation: Quotation): Promise<boolean> {
    try {
      const { error } = await supabase.from('quotations').upsert({
        id: quotation.id,
        folio: quotation.folio,
        fecha_expedicion: quotation.fechaExpedicion,
        lugar_expedicion: quotation.lugarExpedicion,
        cliente_id: quotation.clienteId,
        cliente_nombre: quotation.clienteNombre,
        cliente_rfc: quotation.clienteRfc,
        cliente_direccion: quotation.clienteDireccion,
        cliente_telefono: quotation.clienteTelefono,
        cliente_ciudad: quotation.clienteCiudad,
        items: quotation.items,
        subtotal: quotation.subtotal,
        descuento: quotation.descuento,
        total: quotation.total,
        total_letra: quotation.totalLetra,
        valido_hasta: quotation.validoHasta,
        tiempo_entrega: quotation.tiempoEntrega,
        forma_pago: quotation.formaPago,
        notas: quotation.notas || '',
        creado_por: quotation.creadoPor,
        fecha_creacion: quotation.fechaCreacion,
        estado: quotation.estado,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteQuotation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // SALE NOTES
  async getSaleNotes(): Promise<SaleNote[] | null> {
    try {
      const { data, error } = await supabase.from('sale_notes').select('*').order('fecha_emision', { ascending: false });
      if (error || !data) return null;
      return data.map((n: any) => ({
        id: n.id,
        folio: n.folio,
        fechaEmision: n.fecha_emision,
        lugarExpedicion: n.lugar_expedicion,
        emisorNombre: n.emisor_nombre,
        emisorDireccion: n.emisor_direccion,
        emisorColoniaCp: n.emisor_colonia_cp,
        emisorCiudadEstado: n.emisor_ciudad_estado,
        emisorTelefono: n.emisor_telefono,
        emisorEmail: n.emisor_email,
        clienteId: n.cliente_id,
        clienteNombre: n.cliente_nombre,
        clienteRfc: n.cliente_rfc,
        clienteDireccion: n.cliente_direccion,
        clienteColoniaCp: n.cliente_colonia_cp,
        clienteCiudad: n.cliente_ciudad,
        clienteTelefono: n.cliente_telefono,
        items: n.items || [],
        subtotal: Number(n.subtotal) || 0,
        descuento: Number(n.descuento) || 0,
        total: Number(n.total) || 0,
        totalLetra: n.total_letra || '',
        observaciones: n.observaciones || '',
        textoPagare: n.texto_pagare || '',
        fechaCreacion: n.fecha_creacion || n.created_at,
        estado: n.estado || 'pendiente',
        sincronizado: true,
      }));
    } catch {
      return null;
    }
  },

  async upsertSaleNote(saleNote: SaleNote): Promise<boolean> {
    try {
      const { error } = await supabase.from('sale_notes').upsert({
        id: saleNote.id,
        folio: saleNote.folio,
        fecha_emision: saleNote.fechaEmision,
        lugar_expedicion: saleNote.lugarExpedicion,
        emisor_nombre: saleNote.emisorNombre,
        emisor_direccion: saleNote.emisorDireccion,
        emisor_colonia_cp: saleNote.emisorColoniaCp,
        emisor_ciudad_estado: saleNote.emisorCiudadEstado,
        emisor_telefono: saleNote.emisorTelefono,
        emisor_email: saleNote.emisorEmail,
        cliente_id: saleNote.clienteId,
        cliente_nombre: saleNote.clienteNombre,
        cliente_rfc: saleNote.clienteRfc,
        cliente_direccion: saleNote.clienteDireccion,
        cliente_colonia_cp: saleNote.clienteColoniaCp || '',
        cliente_ciudad: saleNote.clienteCiudad,
        cliente_telefono: saleNote.clienteTelefono,
        items: saleNote.items,
        subtotal: saleNote.subtotal,
        descuento: saleNote.descuento,
        total: saleNote.total,
        total_letra: saleNote.totalLetra,
        observaciones: saleNote.observaciones,
        texto_pagare: saleNote.textoPagare || '',
        fecha_creacion: saleNote.fechaCreacion,
        estado: saleNote.estado,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  async deleteSaleNote(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('sale_notes').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },
};
