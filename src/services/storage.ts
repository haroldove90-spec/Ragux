import {
  Client,
  CompanyProfile,
  NavTab,
  Product,
  Quotation,
  RoleType,
  SaleNote,
  UserAccount,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_PRODUCTS,
  INITIAL_QUOTATIONS,
  INITIAL_SALE_NOTES,
  INITIAL_USERS,
} from '../data/initialData';
import { SupabaseService } from './supabase';

const STORAGE_KEYS = {
  QUOTATIONS: 'rogux_quotations',
  SALE_NOTES: 'rogux_sale_notes',
  PRODUCTS: 'rogux_products',
  CLIENTS: 'rogux_clients',
  USERS: 'rogux_users',
  CURRENT_USER: 'rogux_current_user',
  CURRENT_USER_ID: 'rogux_current_user_id',
  PROFILE: 'rogux_company_profile',
  ACTIVE_ROLE: 'rogux_active_role',
  ACTIVE_TAB: 'rogux_active_tab',
  SYNC_QUEUE: 'rogux_sync_queue',
};

// Safe JSON parse helper with localStorage and sessionStorage fallback
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item && item !== 'undefined' && item !== 'null') {
      return JSON.parse(item);
    }
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
  }

  try {
    const sessionItem = sessionStorage.getItem(key);
    if (sessionItem && sessionItem !== 'undefined' && sessionItem !== 'null') {
      return JSON.parse(sessionItem);
    }
  } catch (error) {
    console.warn(`Error reading ${key} from sessionStorage:`, error);
  }

  return fallback;
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Warning saving ${key} to localStorage:`, error);
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Warning saving ${key} to sessionStorage:`, error);
  }
}

export const StorageService = {
  // Current Authenticated User & Persistent Session
  getCurrentUser(): UserAccount | null {
    let user = safeGet<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);

    // Resilience fallback: if user object wasn't retrieved, check stored user ID
    if (!user) {
      try {
        const storedId =
          localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) ||
          sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        if (storedId) {
          const users = this.getUsers();
          const found = users.find(
            (u) =>
              u.id === storedId ||
              u.usuario.toLowerCase() === storedId.toLowerCase()
          );
          if (found && found.activo) {
            user = found;
            this.setCurrentUser(user);
          }
        }
      } catch (e) {
        console.warn('Error reading fallback user ID:', e);
      }
    }

    // Always keep current session in sync with the registered users list (e.g. photo or name updates)
    if (user) {
      const allUsers = this.getUsers();
      const freshRecord = allUsers.find(
        (u) =>
          u.id === user?.id ||
          u.usuario.toLowerCase() === user?.usuario.toLowerCase()
      );
      if (freshRecord) {
        if (!freshRecord.activo) {
          this.setCurrentUser(null);
          return null;
        }
        return freshRecord;
      }
    }

    return user;
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      safeSet(STORAGE_KEYS.CURRENT_USER, user);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, user.rol);
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, user.rol);
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      } catch {}
    }
  },

  getActiveRole(): RoleType | null {
    try {
      const user = this.getCurrentUser();
      if (user) return user.rol;
      const role =
        localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) ||
        sessionStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
      if (
        role === 'admin' ||
        role === 'vendedor' ||
        role === 'almacen' ||
        role === 'empleado'
      ) {
        return role;
      }
      return null;
    } catch {
      return null;
    }
  },

  setActiveRole(role: RoleType | null): void {
    if (role) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
      } catch {}
    } else {
      this.setCurrentUser(null);
    }
  },

  // Active Tab Persistence across page refreshes and browser reloads
  getActiveTab(): NavTab {
    const validTabs: NavTab[] = [
      'nueva_cotizacion',
      'cotizaciones',
      'nueva_nota_venta',
      'notas_venta',
      'productos',
      'clientes',
      'empleados',
      'perfil',
    ];

    // 1. Check URL hash first (e.g., #perfil, #cotizaciones)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashTab = window.location.hash.replace('#', '') as NavTab;
      if (validTabs.includes(hashTab)) {
        return hashTab;
      }
    }

    // 2. Check localStorage / sessionStorage
    const saved = safeGet<NavTab | null>(STORAGE_KEYS.ACTIVE_TAB, null);
    if (saved && validTabs.includes(saved)) {
      return saved;
    }

    return 'nueva_cotizacion';
  },

  setActiveTab(tab: NavTab): void {
    safeSet(STORAGE_KEYS.ACTIVE_TAB, tab);
    if (typeof window !== 'undefined') {
      try {
        if (window.location.hash !== `#${tab}`) {
          window.location.hash = tab;
        }
      } catch {}
    }
  },

  // USERS / EMPLOYEES
  getUsers(): UserAccount[] {
    const users = safeGet<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Guarantee required users exist
    const hasAdmin = users.some((u) => u.usuario.toLowerCase() === 'admin_123');
    const hasHarold = users.some((u) => u.usuario.toLowerCase() === 'haroldo90');
    if (!hasAdmin || !hasHarold) {
      const combined = [...users];
      if (!hasAdmin) {
        const adminSeed = INITIAL_USERS.find((u) => u.usuario === 'admin_123');
        if (adminSeed) combined.unshift(adminSeed);
      }
      if (!hasHarold) {
        const haroldSeed = INITIAL_USERS.find((u) => u.usuario === 'haroldo90');
        if (haroldSeed) combined.push(haroldSeed);
      }
      safeSet(STORAGE_KEYS.USERS, combined);
      return combined;
    }
    return users;
  },

  saveUser(user: UserAccount): void {
    const current = this.getUsers();
    const existingIndex = current.findIndex(
      (u) => u.id === user.id || u.usuario.toLowerCase() === user.usuario.toLowerCase()
    );
    let updatedUser: UserAccount;
    let updated: UserAccount[];

    if (existingIndex >= 0) {
      updatedUser = { ...current[existingIndex], ...user };
      updated = [...current];
      updated[existingIndex] = updatedUser;
    } else {
      updatedUser = user;
      updated = [user, ...current];
    }

    safeSet(STORAGE_KEYS.USERS, updated);

    // If currently logged in user is being updated, sync state in session
    const currentUser = this.getCurrentUser();
    if (
      currentUser &&
      (currentUser.id === user.id || currentUser.usuario.toLowerCase() === user.usuario.toLowerCase())
    ) {
      this.setCurrentUser(updatedUser);
    }

    // Push to Supabase asynchronously
    SupabaseService.upsertUser(updatedUser).catch((err) => console.warn('Supabase upsertUser background:', err));
  },

  deleteUser(id: string): void {
    const current = this.getUsers();
    const filtered = current.filter((u) => u.id !== id);
    safeSet(STORAGE_KEYS.USERS, filtered);

    // Push to Supabase asynchronously
    SupabaseService.deleteUser(id).catch((err) => console.warn('Supabase deleteUser background:', err));
  },

  login(usuario: string, clave: string): { success: boolean; user?: UserAccount; message?: string } {
    const cleanUser = usuario.trim().toLowerCase();
    const cleanPass = clave.trim();

    const users = this.getUsers();
    const found = users.find(
      (u) => u.usuario.toLowerCase() === cleanUser && u.clave === cleanPass
    );

    if (!found) {
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos. Verifica las mayúsculas y caracteres.',
      };
    }

    if (!found.activo) {
      return {
        success: false,
        message: 'Tu cuenta de usuario se encuentra temporalmente inactiva. Contacta al Administrador.',
      };
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  logout(): void {
    this.setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
      sessionStorage.removeItem('rogux_splash_shown');
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {}
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
      updated[existingIndex] = { ...quotation, sincronizado: true };
    } else {
      updated = [{ ...quotation, sincronizado: true }, ...current];
    }

    safeSet(STORAGE_KEYS.QUOTATIONS, updated);

    // Push to Supabase asynchronously
    SupabaseService.upsertQuotation(quotation).catch((err) =>
      console.warn('Supabase upsertQuotation background:', err)
    );
  },

  deleteQuotation(id: string): void {
    const current = this.getQuotations();
    const filtered = current.filter((q) => q.id !== id);
    safeSet(STORAGE_KEYS.QUOTATIONS, filtered);

    // Push to Supabase asynchronously
    SupabaseService.deleteQuotation(id).catch((err) =>
      console.warn('Supabase deleteQuotation background:', err)
    );
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
      updated[existingIndex] = { ...note, sincronizado: true };
    } else {
      updated = [{ ...note, sincronizado: true }, ...current];
    }

    safeSet(STORAGE_KEYS.SALE_NOTES, updated);

    // Push to Supabase asynchronously
    SupabaseService.upsertSaleNote(note).catch((err) =>
      console.warn('Supabase upsertSaleNote background:', err)
    );
  },

  deleteSaleNote(id: string): void {
    const current = this.getSaleNotes();
    const filtered = current.filter((n) => n.id !== id);
    safeSet(STORAGE_KEYS.SALE_NOTES, filtered);

    // Push to Supabase asynchronously
    SupabaseService.deleteSaleNote(id).catch((err) =>
      console.warn('Supabase deleteSaleNote background:', err)
    );
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

    // Push to Supabase asynchronously
    SupabaseService.upsertProduct(product).catch((err) =>
      console.warn('Supabase upsertProduct background:', err)
    );
  },

  deleteProduct(id: string): void {
    const current = this.getProducts();
    const filtered = current.filter((p) => p.id !== id);
    safeSet(STORAGE_KEYS.PRODUCTS, filtered);

    // Push to Supabase asynchronously
    SupabaseService.deleteProduct(id).catch((err) =>
      console.warn('Supabase deleteProduct background:', err)
    );
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

    // Push to Supabase asynchronously
    SupabaseService.upsertClient(client).catch((err) =>
      console.warn('Supabase upsertClient background:', err)
    );
  },

  deleteClient(id: string): void {
    const current = this.getClients();
    const filtered = current.filter((c) => c.id !== id);
    safeSet(STORAGE_KEYS.CLIENTS, filtered);

    // Push to Supabase asynchronously
    SupabaseService.deleteClient(id).catch((err) =>
      console.warn('Supabase deleteClient background:', err)
    );
  },

  // Two-way sync with Supabase
  async syncWithSupabase(): Promise<{ ok: boolean; message: string }> {
    try {
      const [remoteUsers, remoteProducts, remoteClients, remoteQuotations, remoteSaleNotes] =
        await Promise.allSettled([
          SupabaseService.getUsers(),
          SupabaseService.getProducts(),
          SupabaseService.getClients(),
          SupabaseService.getQuotations(),
          SupabaseService.getSaleNotes(),
        ]);

      if (remoteUsers.status === 'fulfilled' && remoteUsers.value && remoteUsers.value.length > 0) {
        safeSet(STORAGE_KEYS.USERS, remoteUsers.value);
      }
      if (remoteProducts.status === 'fulfilled' && remoteProducts.value && remoteProducts.value.length > 0) {
        safeSet(STORAGE_KEYS.PRODUCTS, remoteProducts.value);
      }
      if (remoteClients.status === 'fulfilled' && remoteClients.value && remoteClients.value.length > 0) {
        safeSet(STORAGE_KEYS.CLIENTS, remoteClients.value);
      }
      if (remoteQuotations.status === 'fulfilled' && remoteQuotations.value && remoteQuotations.value.length > 0) {
        safeSet(STORAGE_KEYS.QUOTATIONS, remoteQuotations.value);
      }
      if (remoteSaleNotes.status === 'fulfilled' && remoteSaleNotes.value && remoteSaleNotes.value.length > 0) {
        safeSet(STORAGE_KEYS.SALE_NOTES, remoteSaleNotes.value);
      }

      return { ok: true, message: 'Datos sincronizados con Supabase' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Error al sincronizar con Supabase' };
    }
  },

  // Sync Queue (for offline inspection)
  getSyncQueue(): Array<{ action: string; entity: string; data: any; timestamp: string }> {
    return safeGet(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  clearSyncQueue(): void {
    safeSet(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  // Reset to factory sample data
  resetToSampleData(): void {
    safeSet(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    safeSet(STORAGE_KEYS.SALE_NOTES, INITIAL_SALE_NOTES);
    safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    safeSet(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
    safeSet(STORAGE_KEYS.PROFILE, INITIAL_COMPANY_PROFILE);
    safeSet(STORAGE_KEYS.SYNC_QUEUE, []);
  },
};
