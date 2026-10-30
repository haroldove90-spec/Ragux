import {
  Client,
  CompanyProfile,
  Product,
  Quotation,
  RoleType,
  SaleNote,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_PRODUCTS,
  INITIAL_QUOTATIONS,
  INITIAL_SALE_NOTES,
} from '../data/initialData';

const STORAGE_KEYS = {
  QUOTATIONS: 'rogux_quotations',
  SALE_NOTES: 'rogux_sale_notes',
  PRODUCTS: 'rogux_products',
  CLIENTS: 'rogux_clients',
  PROFILE: 'rogux_company_profile',
  ACTIVE_ROLE: 'rogux_active_role',
  SYNC_QUEUE: 'rogux_sync_queue',
};

// Safe JSON parse helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export const StorageService = {
  // Role
  getActiveRole(): RoleType | null {
    try {
      const role = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      if (role === 'admin') return 'admin';
      return null;
    } catch {
      return null;
    }
  },

  setActiveRole(role: RoleType | null): void {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  },

  // Company Profile
  getProfile(): CompanyProfile {
    return safeGet<CompanyProfile>(STORAGE_KEYS.PROFILE, INITIAL_COMPANY_PROFILE);
  },

  updateProfile(profile: Partial<CompanyProfile>): CompanyProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    safeSet(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  getNextFolio(): string {
    const profile = this.getProfile();
    const nextNum = (profile.ultimoFolio || 1963) + 1;
    this.updateProfile({ ultimoFolio: nextNum });
    return nextNum.toString().padStart(6, '0');
  },

  getNextNotaFolio(): string {
    const profile = this.getProfile();
    const nextNum = (profile.ultimoFolioNota || 3087) + 1;
    this.updateProfile({ ultimoFolioNota: nextNum });
    return nextNum.toString().padStart(6, '0');
  },

  // Quotations
  getQuotations(): Quotation[] {
    return safeGet<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  },

  getQuotationById(id: string): Quotation | undefined {
    return this.getQuotations().find((q) => q.id === id);
  },

  saveQuotation(quotation: Quotation): void {
    const current = this.getQuotations();
    const existingIndex = current.findIndex((q) => q.id === quotation.id);
    let updated: Quotation[];
    
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = quotation;
    } else {
      updated = [quotation, ...current];
    }
    
    safeSet(STORAGE_KEYS.QUOTATIONS, updated);

    this.addToSyncQueue({
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      entity: 'quotations',
      data: quotation,
      timestamp: new Date().toISOString(),
    });
  },

  deleteQuotation(id: string): void {
    const current = this.getQuotations();
    const filtered = current.filter((q) => q.id !== id);
    safeSet(STORAGE_KEYS.QUOTATIONS, filtered);

    this.addToSyncQueue({
      action: 'DELETE',
      entity: 'quotations',
      data: { id },
      timestamp: new Date().toISOString(),
    });
  },

  // Sale Notes (Notas de Venta)
  getSaleNotes(): SaleNote[] {
    return safeGet<SaleNote[]>(STORAGE_KEYS.SALE_NOTES, INITIAL_SALE_NOTES);
  },

  getSaleNoteById(id: string): SaleNote | undefined {
    return this.getSaleNotes().find((n) => n.id === id);
  },

  saveSaleNote(note: SaleNote): void {
    const current = this.getSaleNotes();
    const existingIndex = current.findIndex((n) => n.id === note.id);
    let updated: SaleNote[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = note;
    } else {
      updated = [note, ...current];
    }

    safeSet(STORAGE_KEYS.SALE_NOTES, updated);
    this.addToSyncQueue({
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      entity: 'sale_notes',
      data: note,
      timestamp: new Date().toISOString(),
    });
  },

  deleteSaleNote(id: string): void {
    const current = this.getSaleNotes();
    const filtered = current.filter((n) => n.id !== id);
    safeSet(STORAGE_KEYS.SALE_NOTES, filtered);
    this.addToSyncQueue({
      action: 'DELETE',
      entity: 'sale_notes',
      data: { id },
      timestamp: new Date().toISOString(),
    });
  },

  // Products
  getProducts(): Product[] {
    return safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  saveProduct(product: Product): void {
    const current = this.getProducts();
    const existingIndex = current.findIndex((p) => p.id === product.id);
    let updated: Product[];
    
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...current];
    }
    
    safeSet(STORAGE_KEYS.PRODUCTS, updated);
    this.addToSyncQueue({
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      entity: 'products',
      data: product,
      timestamp: new Date().toISOString(),
    });
  },

  deleteProduct(id: string): void {
    const current = this.getProducts();
    const filtered = current.filter((p) => p.id !== id);
    safeSet(STORAGE_KEYS.PRODUCTS, filtered);
    this.addToSyncQueue({
      action: 'DELETE',
      entity: 'products',
      data: { id },
      timestamp: new Date().toISOString(),
    });
  },

  // Clients
  getClients(): Client[] {
    return safeGet<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },

  saveClient(client: Client): void {
    const current = this.getClients();
    const existingIndex = current.findIndex((c) => c.id === client.id);
    let updated: Client[];
    
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = client;
    } else {
      updated = [client, ...current];
    }
    
    safeSet(STORAGE_KEYS.CLIENTS, updated);
    this.addToSyncQueue({
      action: existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      entity: 'clients',
      data: client,
      timestamp: new Date().toISOString(),
    });
  },

  deleteClient(id: string): void {
    const current = this.getClients();
    const filtered = current.filter((c) => c.id !== id);
    safeSet(STORAGE_KEYS.CLIENTS, filtered);
    this.addToSyncQueue({
      action: 'DELETE',
      entity: 'clients',
      data: { id },
      timestamp: new Date().toISOString(),
    });
  },

  // Offline Sync Queue for Supabase future integration
  getSyncQueue(): Array<{ action: string; entity: string; data: any; timestamp: string }> {
    return safeGet(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  addToSyncQueue(item: { action: string; entity: string; data: any; timestamp: string }): void {
    const queue = this.getSyncQueue();
    queue.push(item);
    safeSet(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  clearSyncQueue(): void {
    safeSet(STORAGE_KEYS.SYNC_QUEUE, []);
    const quotations = this.getQuotations().map((q) => ({ ...q, sincronizado: true }));
    safeSet(STORAGE_KEYS.QUOTATIONS, quotations);
  },

  // Reset to factory sample data
  resetToSampleData(): void {
    safeSet(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    safeSet(STORAGE_KEYS.SALE_NOTES, INITIAL_SALE_NOTES);
    safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    safeSet(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    safeSet(STORAGE_KEYS.PROFILE, INITIAL_COMPANY_PROFILE);
    safeSet(STORAGE_KEYS.SYNC_QUEUE, []);
  },
};

