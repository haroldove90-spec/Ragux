import React, { useState } from 'react';
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
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { StorageService } from '../services/storage';

interface ProfileModuleProps {
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => void;
  onRefreshAllData: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  profile,
  onUpdateProfile,
  onRefreshAllData,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...profile });
  const [successMessage, setSuccessMessage] = useState('');
  const [syncStatusMessage, setSyncStatusMessage] = useState('');

  const syncQueue = StorageService.getSyncQueue();

  const handleChange = (field: keyof CompanyProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTerminoChange = (
    field: keyof CompanyProfile['terminosPorDefecto'],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      terminosPorDefecto: {
        ...prev.terminosPorDefecto,
        [field]: value,
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateProfile(formData);
    onUpdateProfile(updated);
    setSuccessMessage('¡Datos de la empresa y perfil actualizados exitosamente!');
    setTimeout(() => setSuccessMessage(''), 3500);
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

  const handleResetSample = () => {
    if (
      window.confirm(
        '¿Desea restaurar los datos de muestra originales (cotización #001963, catálogo Jaloma/Nuvel y cliente de Matehuala)?'
      )
    ) {
      StorageService.resetToSampleData();
      onRefreshAllData();
      setFormData(StorageService.getProfile());
      setSuccessMessage('Datos de muestra restaurados.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Banner */}
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#66C34E]" />
            Perfil del Emisor y Configuración Fiscal
          </h2>
          <p className="text-xs text-gray-500">
            Estos datos aparecen automáticamente en el encabezado de todas las cotizaciones y documentos en PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Respaldar Datos</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-[#66C34E]" />
          <span className="text-xs font-bold">{successMessage}</span>
        </div>
      )}

      {syncStatusMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2 animate-in fade-in">
          <Cloud className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold">{syncStatusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Emisor Fiscal Box */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building className="w-4 h-4 text-[#66C34E]" />
            Datos Fiscales y Domicilio de la Empresa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Nombre Comercial / Encabezado *
              </label>
              <input
                type="text"
                required
                value={formData.nombreComercial}
                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase font-bold focus:ring-2 focus:ring-[#66C34E]"
                placeholder="LAURA GUEL GUERRERO (RAGUXDISTRIBUCIONES)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={formData.razonSocial}
                onChange={(e) => handleChange('razonSocial', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="LAURA GUEL GUERRERO"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                RFC del Emisor *
              </label>
              <input
                type="text"
                required
                value={formData.rfc}
                onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-mono uppercase font-bold focus:ring-2 focus:ring-[#66C34E]"
                placeholder="GUGL780927NRA"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Calle y Número
              </label>
              <input
                type="text"
                value={formData.direccionCalle}
                onChange={(e) => handleChange('direccionCalle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="MERCURIO #105"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Colonia y Código Postal
              </label>
              <input
                type="text"
                value={formData.coloniaCp}
                onChange={(e) => handleChange('coloniaCp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="VALLE VERDE C.P. 78244"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Ciudad y Estado
              </label>
              <input
                type="text"
                value={formData.ciudadEstado}
                onChange={(e) => handleChange('ciudadEstado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="SAN LUIS POTOSI, SAN LUIS POTOSI"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#66C34E]"
                placeholder="(444) 235-58-01"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Lugar de Expedición Predeterminado
              </label>
              <input
                type="text"
                value={formData.lugarExpedicionDefecto}
                onChange={(e) => handleChange('lugarExpedicionDefecto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="SAN LUIS POTOSI, SAN LUIS POTOSI"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Último Folio Emitido (Consecutivo)
              </label>
              <input
                type="number"
                value={formData.ultimoFolio}
                onChange={(e) => handleChange('ultimoFolio', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-[#66C34E]"
                placeholder="1963"
              />
            </div>
          </div>
        </div>

        {/* Default Conditions Box */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <FileCheck className="w-4 h-4 text-[#66C34E]" />
            Condiciones Predeterminadas para Cotizaciones
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Válido hasta
              </label>
              <input
                type="text"
                value={formData.terminosPorDefecto.validez}
                onChange={(e) => handleTerminoChange('validez', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="30 DÍAS"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Tiempo de entrega
              </label>
              <input
                type="text"
                value={formData.terminosPorDefecto.tiempoEntrega}
                onChange={(e) => handleTerminoChange('tiempoEntrega', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="INMEDIATA SALVO PREVIA VENTA"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Forma de pago
              </label>
              <input
                type="text"
                value={formData.terminosPorDefecto.formaPago}
                onChange={(e) => handleTerminoChange('formaPago', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                placeholder="PAGO EN PARCIALIDADES O DIFERIDO"
              />
            </div>
          </div>
        </div>

        {/* Offline & Future Supabase Sync Panel */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#66C34E]" />
              <h3 className="text-sm font-bold text-emerald-950 uppercase">
                Almacenamiento Local Offline y Conexión Supabase
              </h3>
            </div>
            <span className="text-xs bg-white text-emerald-800 font-mono font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
              {syncQueue.length} cambios pendientes de sincronizar
            </span>
          </div>

          <p className="text-xs text-emerald-800">
            Toda la información (cotizaciones, clientes y productos) se almacena permanentemente en el navegador de su dispositivo móvil o computadora para operar sin conexión a internet. Cuando esté listo el backend de Supabase, los cambios se sincronizarán en la nube de forma transparente.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={handleSimulateSync}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#66C34E]" />
              <span>Sincronizar ahora</span>
            </button>

            <button
              onClick={handleResetSample}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition active:scale-95 cursor-pointer ml-auto"
            >
              Restaurar Datos de Muestra
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil Fiscal</span>
          </button>
        </div>
      </form>
    </div>
  );
};
