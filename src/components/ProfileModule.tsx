import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Building,
  Save,
  CheckCircle,
  Database,
  Cloud,
  RefreshCw,
  FileCheck,
  Shield,
  Download,
  Camera,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Phone,
  MessageCircle,
  Mail,
  Sparkles,
  Lock,
  Upload,
} from 'lucide-react';
import { CompanyProfile, UserAccount } from '../types';
import { StorageService } from '../services/storage';

interface ProfileModuleProps {
  profile: CompanyProfile;
  currentUser?: UserAccount | null;
  onUpdateUser?: (updated: UserAccount) => void;
  onUpdateProfile: (updated: CompanyProfile) => void;
  onRefreshAllData: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  profile,
  currentUser,
  onUpdateUser,
  onUpdateProfile,
  onRefreshAllData,
}) => {
  // If user is admin, allow switching between Personal Profile and Company Fiscal Settings
  const isAdmin = currentUser?.rol === 'admin';
  const [activeTab, setActiveTab] = useState<'personal' | 'fiscal'>('personal');

  // Personal profile form state
  const activeUser = currentUser || StorageService.getCurrentUser() || {
    id: 'usr-default',
    nombre: 'Usuario ROGUX',
    usuario: 'usuario',
    clave: '123456',
    rol: 'vendedor' as const,
    telefono: '',
    whatsapp: '',
    email: '',
    fotoUrl: '',
    activo: true,
  };

  const [userForm, setUserForm] = useState<UserAccount>({
    id: activeUser.id,
    nombre: activeUser.nombre || '',
    usuario: activeUser.usuario || '',
    clave: activeUser.clave || '',
    rol: activeUser.rol || 'vendedor',
    telefono: activeUser.telefono || '',
    whatsapp: activeUser.whatsapp || activeUser.telefono || '',
    email: activeUser.email || '',
    fotoUrl: activeUser.fotoUrl || '',
    activo: activeUser.activo ?? true,
    createdAt: activeUser.createdAt,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(activeUser.fotoUrl || '');
  const [userSuccessMessage, setUserSuccessMessage] = useState('');
  const [generatedNotification, setGeneratedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUser prop updates
  useEffect(() => {
    if (currentUser) {
      setUserForm({
        id: currentUser.id,
        nombre: currentUser.nombre || '',
        usuario: currentUser.usuario || '',
        clave: currentUser.clave || '',
        rol: currentUser.rol || 'vendedor',
        telefono: currentUser.telefono || '',
        whatsapp: currentUser.whatsapp || currentUser.telefono || '',
        email: currentUser.email || '',
        fotoUrl: currentUser.fotoUrl || '',
        activo: currentUser.activo ?? true,
        createdAt: currentUser.createdAt,
      });
      setPhotoPreview(currentUser.fotoUrl || '');
    }
  }, [currentUser]);

  // Company fiscal data state (for admin)
  const [companyForm, setCompanyForm] = useState<CompanyProfile>({ ...profile });
  const [companySuccessMessage, setCompanySuccessMessage] = useState('');
  const [syncStatusMessage, setSyncStatusMessage] = useState('');

  const syncQueue = StorageService.getSyncQueue();

  // Handlers for Personal User Profile
  const handleUserChange = (field: keyof UserAccount, value: any) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Guarantee structure
    newPassword = 'Rx#' + newPassword.slice(3) + '9';
    setUserForm((prev) => ({ ...prev, clave: newPassword }));
    setShowPassword(true);
    setGeneratedNotification(true);
    setTimeout(() => setGeneratedNotification(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar los 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Compress and resize to max 256x256 avatar to guarantee fast loading and avoid localStorage quota limits
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoPreview(compressed);
          setUserForm((prev) => ({ ...prev, fotoUrl: compressed }));
        } else {
          setPhotoPreview(rawBase64);
          setUserForm((prev) => ({ ...prev, fotoUrl: rawBase64 }));
        }
      };
      img.onerror = () => {
        setPhotoPreview(rawBase64);
        setUserForm((prev) => ({ ...prev, fotoUrl: rawBase64 }));
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setUserForm((prev) => ({ ...prev, fotoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userForm.nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    if (!userForm.clave.trim()) {
      alert('La contraseña no puede estar vacía.');
      return;
    }

    const updatedUser: UserAccount = {
      ...userForm,
      fotoUrl: photoPreview,
    };

    // Save in storage (local + supabase)
    StorageService.saveUser(updatedUser);
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    onRefreshAllData();

    setUserSuccessMessage('¡Tu perfil personal se ha guardado exitosamente y está sincronizado!');
    setTimeout(() => setUserSuccessMessage(''), 4000);
  };

  // Handlers for Company Profile (Admin)
  const handleCompanyChange = (field: keyof CompanyProfile, value: any) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTerminoChange = (
    field: keyof CompanyProfile['terminosPorDefecto'],
    value: string
  ) => {
    setCompanyForm((prev) => ({
      ...prev,
      terminosPorDefecto: {
        ...prev.terminosPorDefecto,
        [field]: value,
      },
    }));
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateProfile(companyForm);
    onUpdateProfile(updated);
    setCompanySuccessMessage('¡Datos fiscales de la empresa actualizados exitosamente!');
    setTimeout(() => setCompanySuccessMessage(''), 3500);
  };

  const handleSimulateSync = () => {
    StorageService.clearSyncQueue();
    onRefreshAllData();
    setSyncStatusMessage('¡Sincronización completada! Todos los registros locales están actualizados.');
    setTimeout(() => setSyncStatusMessage(''), 4000);
  };

  const handleExportBackup = () => {
    const backupData = {
      profile: StorageService.getProfile(),
      quotations: StorageService.getQuotations(),
      saleNotes: StorageService.getSaleNotes(),
      products: StorageService.getProducts(),
      clients: StorageService.getClients(),
      users: StorageService.getUsers(),
      timestamp: new Date().toISOString(),
      app: 'ROGUX',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROGUX_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado del Módulo Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-[#66C34E] border border-emerald-100">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Perfil de Usuario
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {userForm.rol === 'admin' ? 'Administrador' : 'Ventas'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Datos personales, credenciales de acceso seguras y fotografía de cuenta
            </p>
          </div>
        </div>

        {/* Sync or Backup Quick Action */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Respaldar Datos</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs selector: Only show if user is admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 text-[#66C34E]" />
            Mi Perfil Personal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'fiscal'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-600" />
            Configuración Fiscal de la Empresa
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB: MI PERFIL PERSONAL (Nombre, Tel, WhatsApp, Email, Pass, Foto)   */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSaveUserProfile} className="space-y-6">
          {userSuccessMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{userSuccessMessage}</span>
            </div>
          )}

          {/* Tarjeta de Fotografía y Resumen */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#66C34E]" />
              Fotografía Personal y Datos de Acceso
            </h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar circular con preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md bg-gray-50 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={userForm.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <User className="w-14 h-14 stroke-1 text-gray-300" />
                        <span className="text-[10px] text-gray-400 font-semibold mt-1">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Quick upload overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span>Cambiar</span>
                  </button>
                </div>

                {/* Input file oculto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                    <span>Subir foto</span>
                  </button>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                      title="Quitar fotografía"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Informacion lateral del usuario */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">
                    {userForm.nombre || 'Nombre de Usuario'}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    @{userForm.usuario} ·{' '}
                    <span className="font-sans font-semibold text-emerald-700">
                      {userForm.rol === 'admin' ? 'Administrador General' : 'Ventas en Ruta'}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Registrado en la nube con Supabase (Proyecto{' '}
                      <span className="font-mono text-gray-800">unhnyzyejdpwxgvbgbda</span>)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Tu fotografía aparecerá en la cabecera del sistema y en los comprobantes que emitas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario con campos detallados */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4 text-[#66C34E]" />
              Datos Personales y de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={userForm.nombre}
                    onChange={(e) => handleUserChange('nombre', e.target.value)}
                    placeholder="Ej. Harold Anguiano Morales"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-medium text-gray-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Teléfono Directo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={userForm.telefono || ''}
                    onChange={(e) => handleUserChange('telefono', e.target.value)}
                    placeholder="Ej. 4443053182"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-medium text-gray-900 outline-none transition"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    WhatsApp (Móvil)
                  </label>
                  {userForm.whatsapp && (
                    <a
                      href={`https://wa.me/52${userForm.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3 text-[#25D366]" />
                      Abrir chat
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <input
                    type="tel"
                    value={userForm.whatsapp || ''}
                    onChange={(e) => handleUserChange('whatsapp', e.target.value)}
                    placeholder="Ej. 4443053182 (10 dígitos)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 text-sm font-medium text-gray-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={userForm.email || ''}
                    onChange={(e) => handleUserChange('email', e.target.value)}
                    placeholder="Ej. haroldanguiano@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-medium text-gray-900 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad y Contraseña */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#66C34E]" />
                Seguridad de la Cuenta
              </h2>

              <button
                type="button"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer w-fit"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#66C34E]" />
                <span>Generar Contraseña Segura</span>
              </button>
            </div>

            {generatedNotification && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <Key className="w-4 h-4 text-amber-600 shrink-0" />
                <span>¡Contraseña generada con éxito! Recuerda hacer clic en "Guardar Mi Perfil".</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Usuario */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Usuario de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-mono font-bold">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={userForm.usuario}
                    onChange={(e) => handleUserChange('usuario', e.target.value.toLowerCase().trim())}
                    placeholder="usuario"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono font-semibold text-gray-900 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Tu nombre de usuario para iniciar sesión en la app.
                </p>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={userForm.clave}
                    onChange={(e) => handleUserChange('clave', e.target.value)}
                    placeholder="Ingresa tu clave"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono font-semibold text-gray-900 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Recomendada: Mínimo 8 caracteres, números y signos.
                </p>
              </div>
            </div>
          </div>

          {/* Botón Principal Guardar */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-150 cursor-pointer hover:brightness-105 active:scale-[0.99]"
              style={{ backgroundColor: '#66C34E' }}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Mi Perfil</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: CONFIGURACIÓN FISCAL DE LA EMPRESA (Sólo Administrador)          */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'fiscal' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          {companySuccessMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold shadow-xs animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{companySuccessMessage}</span>
            </div>
          )}

          {/* Datos Fiscales y Domicilio de la Empresa */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#66C34E]" />
              Datos Fiscales y Domicilio de la Empresa
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nombre Comercial / Encabezado *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.nombreComercial}
                  onChange={(e) => handleCompanyChange('nombreComercial', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-semibold text-gray-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={companyForm.razonSocial}
                    onChange={(e) => handleCompanyChange('razonSocial', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    RFC del Emisor *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.rfc}
                    onChange={(e) => handleCompanyChange('rfc', e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Calle y Número
                  </label>
                  <input
                    type="text"
                    value={companyForm.direccionCalle}
                    onChange={(e) => handleCompanyChange('direccionCalle', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Colonia y Código Postal
                  </label>
                  <input
                    type="text"
                    value={companyForm.coloniaCp}
                    onChange={(e) => handleCompanyChange('coloniaCp', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Ciudad y Estado
                  </label>
                  <input
                    type="text"
                    value={companyForm.ciudadEstado}
                    onChange={(e) => handleCompanyChange('ciudadEstado', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Teléfono Institucional
                  </label>
                  <input
                    type="text"
                    value={companyForm.telefono}
                    onChange={(e) => handleCompanyChange('telefono', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Lugar de Expedición Predeterminado
                  </label>
                  <input
                    type="text"
                    value={companyForm.lugarExpedicionDefecto}
                    onChange={(e) => handleCompanyChange('lugarExpedicionDefecto', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Último Folio Emitido (Consecutivo)
                  </label>
                  <input
                    type="number"
                    value={companyForm.ultimoFolio}
                    onChange={(e) => handleCompanyChange('ultimoFolio', parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm font-mono font-bold text-gray-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Condiciones Predeterminadas */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#66C34E]" />
              Condiciones Predeterminadas para Cotizaciones
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Vigencia / Válido Hasta
                </label>
                <input
                  type="text"
                  value={companyForm.terminosPorDefecto.validez}
                  onChange={(e) => handleTerminoChange('validez', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Tiempo de Entrega
                </label>
                <input
                  type="text"
                  value={companyForm.terminosPorDefecto.tiempoEntrega}
                  onChange={(e) => handleTerminoChange('tiempoEntrega', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Forma de Pago
                </label>
                <input
                  type="text"
                  value={companyForm.terminosPorDefecto.formaPago}
                  onChange={(e) => handleTerminoChange('formaPago', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-sm text-gray-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sincronización Local / Supabase */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#66C34E]" />
              Estado de la Base de Datos y Supabase
            </h2>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Cloud className="w-5 h-5 text-[#66C34E]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Almacenamiento Local Offline + Supabase Cloud
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Cola de cambios locales pendientes: {syncQueue.length} registro(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateSync}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-xs font-bold text-gray-800 transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sincronizar Ahora</span>
              </button>
            </div>

            {syncStatusMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {syncStatusMessage}
              </div>
            )}
          </div>

          {/* Guardar Configuración de la Empresa */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-150 cursor-pointer hover:brightness-105 active:scale-[0.99]"
              style={{ backgroundColor: '#66C34E' }}
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Configuración de Empresa</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
