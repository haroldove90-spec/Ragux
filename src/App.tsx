/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, CompanyProfile, Product, Quotation, RoleType, SaleNote, UserAccount } from './types';
import { StorageService } from './services/storage';
import { SplashScreen } from './components/SplashScreen';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { QuotationForm } from './components/QuotationForm';
import { QuotationsList } from './components/QuotationsList';
import { SaleNoteForm } from './components/SaleNoteForm';
import { SaleNotesList } from './components/SaleNotesList';
import { ProductsModule } from './components/ProductsModule';
import { ClientsModule } from './components/ClientsModule';
import { EmployeesModule } from './components/EmployeesModule';
import { ProfileModule } from './components/ProfileModule';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return StorageService.getCurrentUser();
  });
  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    const user = StorageService.getCurrentUser();
    return user ? user.rol : StorageService.getActiveRole() || 'admin';
  });
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    return StorageService.getActiveTab();
  });

  // Persistent tab switcher syncing state, localStorage, and URL hash
  const setActiveTab = (tab: NavTab) => {
    // Role permissions validation
    if (activeRole === 'vendedor') {
      if (tab !== 'nueva_nota_venta' && tab !== 'notas_venta' && tab !== 'perfil') {
        setActiveTabState('nueva_nota_venta');
        StorageService.setActiveTab('nueva_nota_venta');
        return;
      }
    } else if (activeRole === 'logistica') {
      if (tab === 'productos' || tab === 'clientes' || tab === 'empleados') {
        setActiveTabState('cotizaciones');
        StorageService.setActiveTab('cotizaciones');
        return;
      }
    } else if (activeRole !== 'admin') {
      if (tab === 'productos' || tab === 'clientes' || tab === 'empleados') {
        setActiveTabState('nueva_nota_venta');
        StorageService.setActiveTab('nueva_nota_venta');
        return;
      }
    }

    setActiveTabState(tab);
    StorageService.setActiveTab(tab);
  };

  // Only show splash screen if user has not yet seen it in this session and is not logged in
  const [showSplash, setShowSplash] = useState(() => {
    const user = StorageService.getCurrentUser();
    if (user) {
      return false; // Skip splash on reload if already logged in so user stays seamlessly in their view
    }
    try {
      return sessionStorage.getItem('rogux_splash_shown') !== 'true';
    } catch {
      return true;
    }
  });

  const handleSplashFinish = () => {
    setShowSplash(false);
    try {
      sessionStorage.setItem('rogux_splash_shown', 'true');
    } catch {}
  };

  // Listen to browser back/forward and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const currentTab = StorageService.getActiveTab();
      if (activeRole === 'vendedor' && currentTab !== 'nueva_nota_venta' && currentTab !== 'notas_venta' && currentTab !== 'perfil') {
        setActiveTab('nueva_nota_venta');
      } else if (activeRole === 'logistica' && (currentTab === 'productos' || currentTab === 'clientes' || currentTab === 'empleados')) {
        setActiveTab('cotizaciones');
      } else if (activeRole !== 'admin' && (currentTab === 'productos' || currentTab === 'clientes' || currentTab === 'empleados')) {
        setActiveTab('nueva_nota_venta');
      } else {
        setActiveTabState(currentTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeRole]);

  // Ensure role permissions are enforced whenever activeRole or activeTab changes
  useEffect(() => {
    if (activeRole === 'vendedor') {
      if (activeTab !== 'nueva_nota_venta' && activeTab !== 'notas_venta' && activeTab !== 'perfil') {
        setActiveTab('nueva_nota_venta');
      }
    } else if (activeRole === 'logistica') {
      if (activeTab === 'productos' || activeTab === 'clientes' || activeTab === 'empleados') {
        setActiveTab('cotizaciones');
      }
    } else if (activeRole !== 'admin') {
      if (activeTab === 'productos' || activeTab === 'clientes' || activeTab === 'empleados') {
        setActiveTab('nueva_nota_venta');
      }
    }
  }, [activeRole, activeTab]);

  // Admin role switching without logging out
  const handleSwitchRole = (newRole: RoleType) => {
    setActiveRole(newRole);
    StorageService.setActiveRole(newRole);
    if (newRole === 'vendedor') {
      setActiveTab('nueva_nota_venta');
    } else if (newRole === 'logistica') {
      setActiveTab('cotizaciones');
    } else if (newRole === 'admin') {
      setActiveTab('cotizaciones');
    }
  };

  // Application state loaded from StorageService (offline ready + Supabase sync)
  const [profile, setProfile] = useState<CompanyProfile>(() => StorageService.getProfile());
  const [quotations, setQuotations] = useState<Quotation[]>(() => StorageService.getQuotations());
  const [saleNotes, setSaleNotes] = useState<SaleNote[]>(() => StorageService.getSaleNotes());
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [clients, setClients] = useState<Client[]>(() => StorageService.getClients());

  // Documents being edited or cloned in form
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [editingSaleNote, setEditingSaleNote] = useState<SaleNote | null>(null);

  // Initial Supabase cloud sync in background
  useEffect(() => {
    StorageService.syncWithSupabase()
      .then((res) => {
        if (res.ok) {
          refreshAllData();
        }
      })
      .catch((err) => console.log('Supabase background sync skipped/pending tables:', err));
  }, []);

  // Reload all data from storage
  const refreshAllData = () => {
    setProfile(StorageService.getProfile());
    setQuotations(StorageService.getQuotations());
    setSaleNotes(StorageService.getSaleNotes());
    setProducts(StorageService.getProducts());
    setClients(StorageService.getClients());
  };

  const handleLoginSuccess = (user: UserAccount) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setActiveRole(user.rol);
    const destinationTab = StorageService.getActiveTab();
    setActiveTab(destinationTab || 'nueva_cotizacion');
    refreshAllData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setActiveRole('admin');
    setActiveTabState('nueva_cotizacion');
    setEditingQuotation(null);
    setEditingSaleNote(null);
  };

  // Quotation handlers
  const handleQuotationSaved = (savedQuotation: Quotation) => {
    refreshAllData();
    setActiveTab('cotizaciones');
  };

  const handleNewQuotation = () => {
    setEditingQuotation(null);
    setActiveTab('nueva_cotizacion');
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setActiveTab('nueva_cotizacion');
  };

  // Sale Note handlers
  const handleSaleNoteSaved = (savedSaleNote: SaleNote) => {
    refreshAllData();
    setActiveTab('notas_venta');
  };

  const handleNewSaleNote = () => {
    setEditingSaleNote(null);
    setActiveTab('nueva_nota_venta');
  };

  const handleEditSaleNote = (saleNote: SaleNote) => {
    setEditingSaleNote(saleNote);
    setActiveTab('nueva_nota_venta');
  };

  const handleSelectClientForQuotation = (client: Client) => {
    setEditingQuotation({
      id: `cot-${Date.now()}`,
      folio: StorageService.getNextFolio(),
      fechaExpedicion: new Date().toISOString().split('T')[0],
      lugarExpedicion: profile.lugarExpedicionDefecto,
      clienteId: client.id,
      clienteNombre: client.nombre,
      clienteRfc: client.rfc || '',
      clienteDireccion: client.direccion || `${client.calle || ''} ${client.numeroExt ? '#' + client.numeroExt : ''}`.trim(),
      clienteCiudad: client.ciudad,
      clienteTelefono: client.telefono,
      items: [],
      subtotal: 0,
      descuento: 0,
      total: 0,
      totalLetra: 'CERO PESOS 00/100 M.N.',
      validoHasta: profile.terminosPorDefecto.validez,
      tiempoEntrega: profile.terminosPorDefecto.tiempoEntrega,
      formaPago: profile.terminosPorDefecto.formaPago,
      creadoPor: currentUser?.nombre || activeRole,
      fechaCreacion: new Date().toISOString(),
      estado: 'vigente',
      sincronizado: true,
    });
    setActiveTab('nueva_cotizacion');
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 text-gray-900 font-sans antialiased flex flex-col">
      {/* 1. Splash Screen on initial load */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      {/* 2. Login Form (Strictly for system access) */}
      {!currentUser ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        /* 3. Main Application Fullscreen Layout */
        <div className="w-full min-h-screen flex flex-col">
          {/* Cabecera Institucional Unificada */}
          <Header
            activeRole={activeRole}
            currentUser={currentUser}
            onLogout={handleLogout}
            onSwitchRole={handleSwitchRole}
          />

          {/* Banner de simulación de rol cuando el Administrador navega como otro rol */}
          {currentUser?.rol === 'admin' && activeRole !== 'admin' && (
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  Modo de simulación activo: Visualizando el sistema como <strong>{activeRole.toUpperCase()}</strong> (sin cerrar sesión de Admin).
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchRole('admin')}
                className="px-3 py-1 bg-white text-blue-900 rounded-lg font-black hover:bg-blue-50 transition active:scale-95 shadow-xs cursor-pointer text-xs"
              >
                ← Volver a Vista Administrador Completo
              </button>
            </div>
          )}

          {/* Body with Desktop Sidebar + Main Content */}
          <div className="flex-1 flex w-full">
            {/* Desktop Sidebar (lg:flex) */}
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              activeRole={activeRole}
              onLogout={handleLogout}
            />

            {/* Main Area: Full width, no repetitive tabs */}
            <main className="flex-1 w-full p-3 sm:p-6 md:p-8 overflow-y-auto">
              {activeTab === 'nueva_cotizacion' && (
                <QuotationForm
                  profile={profile}
                  clients={clients}
                  products={products}
                  onSaved={handleQuotationSaved}
                  onRefreshData={refreshAllData}
                  initialQuotation={editingQuotation}
                />
              )}

              {activeTab === 'cotizaciones' && (
                <QuotationsList
                  quotations={quotations}
                  profile={profile}
                  onRefresh={refreshAllData}
                  onNewQuotation={handleNewQuotation}
                  onEditQuotation={handleEditQuotation}
                />
              )}

              {activeTab === 'nueva_nota_venta' && (
                <SaleNoteForm
                  profile={profile}
                  clients={clients}
                  products={products}
                  onSaved={handleSaleNoteSaved}
                  onRefreshData={refreshAllData}
                  initialSaleNote={editingSaleNote}
                />
              )}

              {activeTab === 'notas_venta' && (
                <SaleNotesList
                  saleNotes={saleNotes}
                  profile={profile}
                  onRefresh={refreshAllData}
                  onNewSaleNote={handleNewSaleNote}
                  onEditSaleNote={handleEditSaleNote}
                />
              )}

              {activeTab === 'productos' && activeRole === 'admin' && (
                <ProductsModule
                  products={products}
                  onRefresh={refreshAllData}
                />
              )}

              {activeTab === 'clientes' && activeRole === 'admin' && (
                <ClientsModule
                  clients={clients}
                  onRefresh={refreshAllData}
                  onSelectForQuotation={handleSelectClientForQuotation}
                />
              )}

              {activeTab === 'empleados' && activeRole === 'admin' && (
                <EmployeesModule onRefresh={refreshAllData} />
              )}

              {activeTab === 'perfil' && (
                <ProfileModule
                  profile={profile}
                  currentUser={currentUser}
                  onUpdateUser={(updatedUser) => {
                    setCurrentUser(updatedUser);
                    refreshAllData();
                  }}
                  onUpdateProfile={(updated) => setProfile(updated)}
                  onRefreshAllData={refreshAllData}
                />
              )}
            </main>
          </div>

          {/* Navegación Móvil y Tablet (Bottom Bar) con fondo #66C34E */}
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={activeRole === 'admin'}
            activeRole={activeRole}
          />
        </div>
      )}
    </div>
  );
}
