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
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return StorageService.getCurrentUser();
  });
  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    return StorageService.getActiveRole() || 'admin';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('nueva_cotizacion');

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
    setCurrentUser(user);
    setActiveRole(user.rol);
    refreshAllData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
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
      clienteRfc: client.rfc,
      clienteDireccion: client.direccion,
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
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

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
          />

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

              {activeTab === 'productos' && (
                <ProductsModule
                  products={products}
                  onRefresh={refreshAllData}
                />
              )}

              {activeTab === 'clientes' && (
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
          />
        </div>
      )}
    </div>
  );
}
