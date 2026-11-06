import React, { useId, useMemo, useRef, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Phone,
  MapPin,
  Mail,
  X,
  Building,
  FileSpreadsheet,
  Upload,
  Download,
  Eye,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Cloud,
  RefreshCw,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Client } from '../types';
import { StorageService } from '../services/storage';
import {
  downloadClientLayoutTemplate,
  exportClientsToExcel,
} from '../utils/excelExporter';

interface ClientsModuleProps {
  clients: Client[];
  onRefresh: () => void;
  onSelectForQuotation?: (client: Client) => void;
  onSyncCloud?: () => Promise<any>;
}

interface DuplicateClientItem {
  incoming: Client;
  existing: Client;
  action: 'replace' | 'skip';
}

const ITEMS_PER_PAGE = 10;

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  clients,
  onRefresh,
  onSelectForQuotation,
  onSyncCloud,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Duplicate Resolution & Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [newClientsList, setNewClientsList] = useState<Client[]>([]);
  const [duplicateClientsList, setDuplicateClientsList] = useState<DuplicateClientItem[]>([]);
  const [activeImportTab, setActiveImportTab] = useState<'duplicados' | 'nuevos'>('duplicados');

  // Form inputs matching ley_yout_clientes
  const [formNo, setFormNo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [formCalle, setFormCalle] = useState('');
  const [formNumeroExt, setFormNumeroExt] = useState('');
  const [formColonia, setFormColonia] = useState('');
  const [formCp, setFormCp] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formEstado, setFormEstado] = useState('');
  const [formPais, setFormPais] = useState('MEXICO');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientFileInputId = useId();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync with Supabase on demand
  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      if (onSyncCloud) {
        await onSyncCloud();
      } else {
        await StorageService.syncWithSupabase();
      }
      onRefresh();
      showToast('Clientes sincronizados exitosamente con Supabase', 'success');
    } catch {
      showToast('Error al sincronizar con Supabase', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Smart Search & Filtering
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clients.filter((c) => {
      // Status filter
      if (statusFilter === 'activos' && c.activo === false) return false;
      if (statusFilter === 'inactivos' && c.activo !== false) return false;

      if (!term) return true;

      const fullString = [
        c.no,
        c.nombre,
        c.rfc,
        c.calle,
        c.numeroExt,
        c.colonia,
        c.cp,
        c.ciudad,
        c.estado,
        c.pais,
        c.telefono,
        c.email,
        c.direccion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return fullString.includes(term);
    });
  }, [clients, searchTerm, statusFilter]);

  // Pagination (10 en 10)
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedClients = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, safeCurrentPage]);

  // Multi-selection helpers
  const allCurrentPageSelected =
    paginatedClients.length > 0 &&
    paginatedClients.every((c) => selectedIds.includes(c.id));

  const toggleSelectAllPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(paginatedClients.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...paginatedClients.map((c) => c.id)]));
      setSelectedIds(newIds);
    }
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === filteredClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (
      window.confirm(
        `¿Confirmas eliminar los ${count} cliente(s) seleccionados? Esta acción no se puede deshacer.`
      )
    ) {
      StorageService.deleteMultipleClients(selectedIds);
      setSelectedIds([]);
      onRefresh();
      showToast(`${count} cliente(s) eliminados correctamente`);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormNo(String(clients.length + 1));
    setFormNombre('');
    setFormRfc('');
    setFormCalle('');
    setFormNumeroExt('');
    setFormColonia('');
    setFormCp('');
    setFormCiudad('SAN LUIS POTOSI');
    setFormEstado('SAN LUIS POTOSI');
    setFormPais('MEXICO');
    setFormTelefono('');
    setFormEmail('');
    setFormActivo(true);
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setFormNo(c.no ? String(c.no) : '');
    setFormNombre(c.nombre || '');
    setFormRfc(c.rfc || '');
    setFormCalle(c.calle || c.direccion || '');
    setFormNumeroExt(c.numeroExt || '');
    setFormColonia(c.colonia || '');
    setFormCp(c.cp || '');
    setFormCiudad(c.ciudad || 'SAN LUIS POTOSI');
    setFormEstado(c.estado || 'SAN LUIS POTOSI');
    setFormPais(c.pais || 'MEXICO');
    setFormTelefono(c.telefono || '');
    setFormEmail(c.email || '');
    setFormActivo(c.activo !== false);
    setShowFormModal(true);
  };

  // Open View Details Modal
  const handleOpenView = (c: Client) => {
    setViewingClient(c);
  };

  // Toggle Single Client Active Status
  const handleToggleActive = (c: Client) => {
    StorageService.toggleClientActive(c.id);
    onRefresh();
    showToast(
      `Cliente "${c.nombre}" ahora está ${c.activo === false ? 'ACTIVO' : 'INACTIVO'}`
    );
  };

  // Single Delete
  const handleDeleteOne = (c: Client) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente "${c.nombre}"?`)) {
      StorageService.deleteClient(c.id);
      setSelectedIds((prev) => prev.filter((id) => id !== c.id));
      onRefresh();
      showToast('Cliente eliminado');
    }
  };

  // Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      showToast('El nombre del cliente es obligatorio', 'error');
      return;
    }

    const fullDireccion = `${formCalle.trim()} ${formNumeroExt.trim() ? '#' + formNumeroExt.trim() : ''}${formColonia.trim() ? ', Col. ' + formColonia.trim() : ''}${formCp.trim() ? ' C.P. ' + formCp.trim() : ''}`.trim();

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      no: formNo.trim() || undefined,
      nombre: formNombre.trim().toUpperCase(),
      rfc: formRfc.trim().toUpperCase(),
      calle: formCalle.trim().toUpperCase(),
      numeroExt: formNumeroExt.trim().toUpperCase(),
      colonia: formColonia.trim().toUpperCase(),
      cp: formCp.trim().toUpperCase(),
      ciudad: formCiudad.trim().toUpperCase(),
      estado: formEstado.trim().toUpperCase(),
      pais: formPais.trim().toUpperCase(),
      telefono: formTelefono.trim(),
      email: formEmail.trim(),
      direccion: fullDireccion.toUpperCase() || formCalle.trim().toUpperCase(),
      activo: formActivo,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
    };

    StorageService.saveClient(clientToSave);
    onRefresh();
    setShowFormModal(false);
    showToast(
      editingClient ? 'Cliente actualizado exitosamente' : 'Cliente registrado exitosamente'
    );
  };

  // File Import Logic (.xlsx, .xls, .csv) with DUPLICATE DETECTION
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          showToast('El archivo no contiene registros válidos', 'error');
          return;
        }

        // Helper to find case-insensitive column match
        const getVal = (row: any, ...candidates: string[]): string => {
          for (const cand of candidates) {
            const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const key of Object.keys(row)) {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanKey === cleanCand || cleanKey.includes(cleanCand)) {
                return String(row[key] || '').trim();
              }
            }
          }
          return '';
        };

        const parsed: Client[] = rawJson
          .map((row, idx) => {
            const noVal = getVal(row, 'no.', 'no', 'numero', 'id');
            const nombreVal = getVal(row, 'nombre', 'razon social', 'cliente');
            const rfcVal = getVal(row, 'rfc', 'tax_id');
            const calleVal = getVal(row, 'calle', 'direccion', 'domicilio');
            const numExtVal = getVal(row, '# ext.', 'ext', 'numero ext', 'num ext', 'no ext');
            const coloniaVal = getVal(row, 'colonia', 'asentamiento');
            const cpVal = getVal(row, 'c.p.', 'cp', 'codigo postal');
            const ciudadVal = getVal(row, 'ciudad', 'municipio', 'localidad');
            const estadoVal = getVal(row, 'estado', 'provincia', 'entidad');
            const paisVal = getVal(row, 'pais', 'country') || 'MEXICO';
            const telefonoVal = getVal(row, 'telefono1', 'telefono', 'tel', 'celular', 'whatsapp');
            const emailVal = getVal(row, 'e-mail1', 'email', 'correo', 'e-mail');

            if (!nombreVal) return null;

            const fullDireccion = `${calleVal} ${numExtVal ? '#' + numExtVal : ''}${coloniaVal ? ', Col. ' + coloniaVal : ''}${cpVal ? ' C.P. ' + cpVal : ''}`.trim();

            const item: Client = {
              id: `cli-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
              no: noVal || idx + 1,
              nombre: nombreVal.toUpperCase(),
              rfc: rfcVal.toUpperCase(),
              calle: calleVal.toUpperCase(),
              numeroExt: numExtVal.toUpperCase(),
              colonia: coloniaVal.toUpperCase(),
              cp: cpVal.toUpperCase(),
              ciudad: ciudadVal.toUpperCase(),
              estado: estadoVal.toUpperCase(),
              pais: paisVal.toUpperCase(),
              telefono: telefonoVal,
              email: emailVal,
              direccion: fullDireccion.toUpperCase() || calleVal.toUpperCase(),
              activo: true,
              createdAt: new Date().toISOString(),
            };
            return item;
          })
          .filter(Boolean) as Client[];

        if (parsed.length === 0) {
          showToast('No se identificaron clientes válidos en el archivo', 'error');
          return;
        }

        // Duplicate Detection against current directory
        const existingClients = StorageService.getClients();
        const duplicates: DuplicateClientItem[] = [];
        const newItems: Client[] = [];

        parsed.forEach((incoming) => {
          const match = existingClients.find((c) => {
            const sameRfc =
              c.rfc &&
              incoming.rfc &&
              c.rfc.trim().length > 4 &&
              c.rfc.trim().toUpperCase() === incoming.rfc.trim().toUpperCase();
            const sameName =
              c.nombre &&
              incoming.nombre &&
              c.nombre.trim().toUpperCase() === incoming.nombre.trim().toUpperCase();
            return sameRfc || sameName;
          });

          if (match) {
            duplicates.push({
              incoming,
              existing: match,
              action: 'replace',
            });
          } else {
            newItems.push(incoming);
          }
        });

        setNewClientsList(newItems);
        setDuplicateClientsList(duplicates);
        setActiveImportTab(duplicates.length > 0 ? 'duplicados' : 'nuevos');
        setShowImportModal(true);
      } catch (err: any) {
        console.error('Error importando archivo:', err);
        showToast('Error al leer el archivo. Verifica el formato Excel o CSV.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk set action for all duplicate clients
  const handleSetAllDuplicatesAction = (action: 'replace' | 'skip') => {
    setDuplicateClientsList((prev) =>
      prev.map((item) => ({ ...item, action }))
    );
  };

  // Confirm Import with Duplicate Resolution
  const handleConfirmImportWithResolution = () => {
    const duplicatesToReplace = duplicateClientsList
      .filter((d) => d.action === 'replace')
      .map((d) => ({
        incoming: d.incoming,
        existingId: d.existing.id,
      }));

    const skippedCount = duplicateClientsList.filter((d) => d.action === 'skip').length;

    const result = StorageService.importClientsWithResolution(
      newClientsList,
      duplicatesToReplace
    );

    setShowImportModal(false);
    setNewClientsList([]);
    setDuplicateClientsList([]);
    onRefresh();

    showToast(
      `¡Importación exitosa! ${result.added} nuevos clientes agregados, ${result.replaced} reemplazados${
        skippedCount > 0 ? `, ${skippedCount} omitidos` : ''
      }.`,
      'success'
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Hidden File Input */}
      <input
        type="file"
        id={clientFileInputId}
        name="client_excel_file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Top Banner & Main Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#66C34E] flex items-center justify-center font-bold">
              <Users className="w-6 h-6 text-[#66C34E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Directorio de Clientes
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {clients.length} registrados
                </span>
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                  title="Sincronizar directorio de clientes con Supabase en la nube"
                >
                  <Cloud className={`w-3 h-3 ${isSyncing ? 'animate-pulse text-blue-500' : 'text-blue-600'}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Nube Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Estructura oficial del layout ley_yout_clientes con detección inteligente de duplicados (Reemplazar u Omitir).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Download Template */}
          <button
            onClick={downloadClientLayoutTemplate}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-gray-200"
            title="Descargar plantilla de Excel vacía con el formato de clientes"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Descargar Plantilla</span>
          </button>

          {/* Import File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Importar base de datos de clientes desde Excel (.xlsx) o CSV"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Excel / CSV</span>
          </button>

          {/* Export File Button */}
          <button
            onClick={() => exportClientsToExcel(filteredClients)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Exportar registros filtrados a Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          {/* New Client */}
          <button
            onClick={handleOpenAdd}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#66C34E]" />
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Zero Clients Cloud Restore Prompt if Supabase has data */}
      {clients.length === 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-950">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">¿Tienes clientes guardados en Supabase?</span>
              <p className="text-blue-700 text-[11px]">
                Haz clic en sincronizar para cargarlos inmediatamente a tu pantalla.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Cargando de Supabase...' : 'Recargar desde Supabase'}</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search, Status Tabs & Bulk Action Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscador inteligente: nombre, RFC, calle, CP, ciudad, tel..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Status Segmented Buttons */}
            <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('todos');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'todos'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('activos');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'activos'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Activos ({clients.filter((c) => c.activo !== false).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('inactivos');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'inactivos'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inactivos ({clients.filter((c) => c.activo === false).length})
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Banner when 1+ selected */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#66C34E]" />
              <span className="text-xs font-bold text-emerald-950">
                {selectedIds.length} cliente(s) seleccionado(s)
              </span>
              <button
                onClick={toggleSelectAllFiltered}
                type="button"
                className="text-xs text-emerald-700 underline font-semibold ml-2 hover:text-emerald-900"
              >
                {selectedIds.length === filteredClients.length
                  ? 'Deseleccionar todos'
                  : `Seleccionar los ${filteredClients.length} filtrados`}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg"
              >
                Cancelar Selección
              </button>
              <button
                onClick={handleBulkDelete}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar seleccionados ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Layout Table View */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#C3CAD0] text-gray-900 font-bold uppercase text-[11px] border-b border-gray-300 select-none">
                <th className="py-3 px-3 text-center w-10">
                  <button
                    onClick={toggleSelectAllPage}
                    type="button"
                    className="cursor-pointer text-gray-700 hover:text-black flex items-center justify-center"
                    title={allCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar página completa'}
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#66C34E]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 w-14 text-center">No.</th>
                <th className="py-3 px-3 min-w-[200px]">Nombre / Razón Social</th>
                <th className="py-3 px-3 w-32">RFC</th>
                <th className="py-3 px-3 min-w-[220px]">Dirección (Calle, #, Col, C.P.)</th>
                <th className="py-3 px-3 w-36">Ciudad / Estado</th>
                <th className="py-3 px-3 w-32">Teléfono</th>
                <th className="py-3 px-3 w-24 text-center">Estado</th>
                <th className="py-3 px-3 w-36 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {searchTerm
                          ? 'No hay clientes que coincidan con la búsqueda'
                          : 'No hay clientes registrados en el directorio local'}
                      </div>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? 'Intenta con otro término o limpia el buscador inteligente.'
                          : 'Sincroniza con Supabase o importa tu archivo Excel con la estructura ley_yout_clientes.'}
                      </p>
                      {!searchTerm && (
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                          <button
                            onClick={handleCloudSync}
                            type="button"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Cloud className="w-4 h-4" />
                            <span>Cargar desde Supabase</span>
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Importar desde Excel</span>
                          </button>
                          <button
                            onClick={handleOpenAdd}
                            type="button"
                            className="px-4 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo Cliente</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((c, index) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isInactive = c.activo === false;
                  const displayNo = c.no || (safeCurrentPage - 1) * ITEMS_PER_PAGE + index + 1;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50/90 transition ${
                        isSelected ? 'bg-emerald-50/50' : ''
                      } ${isInactive ? 'opacity-65 bg-gray-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(c.id)}
                          type="button"
                          className="cursor-pointer text-gray-500 hover:text-black flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#66C34E]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* No. */}
                      <td className="py-3 px-2 text-center font-mono text-xs font-bold text-gray-600">
                        {displayNo}
                      </td>

                      {/* Nombre */}
                      <td className="py-3 px-3 font-bold text-gray-900 uppercase">
                        <div className="flex flex-col">
                          <span className="leading-snug">{c.nombre}</span>
                          {c.email && (
                            <span className="text-[11px] font-normal text-gray-500 lowercase flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RFC */}
                      <td className="py-3 px-3 font-mono font-bold text-gray-800">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                          {c.rfc || 'S/RFC'}
                        </span>
                      </td>

                      {/* Domicilio Completo */}
                      <td className="py-3 px-3 text-gray-700">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="uppercase text-[11px] leading-tight">
                            {c.direccion || `${c.calle || ''} ${c.numeroExt ? '#' + c.numeroExt : ''} ${c.colonia ? 'Col. ' + c.colonia : ''} ${c.cp ? 'C.P. ' + c.cp : ''}`.trim() || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Ciudad / Estado */}
                      <td className="py-3 px-3 uppercase font-medium text-gray-600 text-[11px]">
                        {c.ciudad || c.estado ? `${c.ciudad || ''}${c.estado ? ', ' + c.estado : ''}` : '—'}
                      </td>

                      {/* Teléfono */}
                      <td className="py-3 px-3 font-medium text-gray-800">
                        {c.telefono ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-[#66C34E] shrink-0" />
                            <span>{c.telefono}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Estado (Activo / Inactivo) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(c)}
                          type="button"
                          className="group inline-flex items-center gap-1 cursor-pointer"
                          title={isInactive ? 'Hacer clic para activar cliente' : 'Hacer clic para desactivar cliente'}
                        >
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 group-hover:bg-amber-200">
                              <ToggleLeft className="w-3 h-3 text-amber-600" /> Inactivo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200">
                              <ToggleRight className="w-3 h-3 text-emerald-600" /> Activo
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => handleOpenView(c)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Ver ficha completa del cliente"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            title="Editar datos del cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteOne(c)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (10 en 10) */}
        {filteredClients.length > 0 && (
          <div className="p-4 sm:px-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 text-xs">
            <div className="text-gray-600 font-medium">
              Mostrando <span className="font-bold text-gray-900">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
              <span className="font-bold text-gray-900">
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredClients.length)}
              </span>{' '}
              de <span className="font-bold text-gray-900">{filteredClients.length}</span> clientes
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800">
                Página {safeCurrentPage} de {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Client with all layout fields */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#66C34E]" />
                {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              {/* Row 1: No. & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    No. de Registro
                  </label>
                  <input
                    type="text"
                    value={formNo}
                    onChange={(e) => setFormNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Estatus del Cliente
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="client_status"
                        checked={formActivo}
                        onChange={() => setFormActivo(true)}
                        className="text-[#66C34E] focus:ring-[#66C34E]"
                      />
                      <span className="text-emerald-700">Activo (Habilitado para cotizar)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="client_status"
                        checked={!formActivo}
                        onChange={() => setFormActivo(false)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-amber-700">Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 2: Nombre Completo */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase font-bold text-gray-900 focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="FRANCISCO JAVIER MATA MOLINA"
                />
              </div>

              {/* Row 3: RFC, Teléfono, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={formRfc}
                    onChange={(e) => setFormRfc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="MAMF5512033Y8"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Teléfono 1
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="(488) 123-45-67"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Correo Electrónico (E-MAIL 1)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              {/* Row 4: Calle & # Ext. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Calle
                  </label>
                  <input
                    type="text"
                    value={formCalle}
                    onChange={(e) => setFormCalle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="GUERRERO"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    # Ext.
                  </label>
                  <input
                    type="text"
                    value={formNumeroExt}
                    onChange={(e) => setFormNumeroExt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Row 5: Colonia & C.P. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Colonia
                  </label>
                  <input
                    type="text"
                    value={formColonia}
                    onChange={(e) => setFormColonia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="CENTRO"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Código Postal (C.P.)
                  </label>
                  <input
                    type="text"
                    value={formCp}
                    onChange={(e) => setFormCp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="78700"
                  />
                </div>
              </div>

              {/* Row 6: Ciudad, Estado, País */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formCiudad}
                    onChange={(e) => setFormCiudad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="MATEHUALA"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="SAN LUIS POTOSI"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formPais}
                    onChange={(e) => setFormPais(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="MEXICO"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Client Details */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#66C34E] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-[#66C34E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ficha del Cliente</h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    No. {viewingClient.no || '—'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingClient(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500">Nombre / Razón Social</div>
                <div className="text-sm font-black text-gray-900 uppercase mt-0.5">
                  {viewingClient.nombre}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono font-bold bg-[#C3CAD0] text-gray-900 px-2 py-0.5 rounded text-[11px]">
                    RFC: {viewingClient.rfc || 'S/RFC'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingClient.activo === false
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {viewingClient.activo === false ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">Teléfono</div>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {viewingClient.telefono || 'Sin teléfono'}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">E-mail</div>
                  <div className="font-medium text-gray-900 mt-0.5 truncate">
                    {viewingClient.email || 'Sin correo'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="text-[10px] font-bold uppercase text-gray-500">Domicilio Fiscal</div>
                <div className="font-semibold text-gray-900 uppercase">
                  {viewingClient.direccion ||
                    `${viewingClient.calle || ''} ${viewingClient.numeroExt ? '#' + viewingClient.numeroExt : ''}`.trim() ||
                    'Sin domicilio'}
                </div>
                <div className="text-gray-600 uppercase text-[11px]">
                  {[
                    viewingClient.colonia ? `Col. ${viewingClient.colonia}` : null,
                    viewingClient.cp ? `C.P. ${viewingClient.cp}` : null,
                    viewingClient.ciudad,
                    viewingClient.estado,
                    viewingClient.pais,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
              {onSelectForQuotation && viewingClient.activo !== false && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectForQuotation(viewingClient);
                    setViewingClient(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#66C34E] text-white rounded-xl text-xs font-bold hover:bg-[#52a33c]"
                >
                  Usar para Cotizar
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewingClient;
                    setViewingClient(null);
                    handleOpenEdit(c);
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setViewingClient(null)}
                  className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-900"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import with SMART DUPLICATE RESOLUTION (Reemplazar u Omitir) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Importación de Clientes con Detección de Duplicados
                  </h3>
                  <span className="text-xs text-gray-500">
                    Total en archivo: {newClientsList.length + duplicateClientsList.length} clientes
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setNewClientsList([]);
                  setDuplicateClientsList([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate Notice Banner */}
            {duplicateClientsList.length > 0 ? (
              <div className="p-4 my-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">
                      ¡Se detectaron {duplicateClientsList.length} cliente(s) duplicado(s)!
                    </span>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Coinciden en RFC o Nombre con registros ya existentes. ¿Deseas <strong>Reemplazarlos</strong> con los nuevos datos del Excel u <strong>Omitirlos</strong> para conservar los existentes?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSetAllDuplicatesAction('replace')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                  >
                    Reemplazar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllDuplicatesAction('skip')}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold text-[11px] transition"
                  >
                    Omitir Todos
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 my-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  No se detectaron duplicados. Se agregarán <strong>{newClientsList.length} nuevos clientes</strong> al directorio.
                </span>
              </div>
            )}

            {/* Tabs (Duplicados vs Nuevos) */}
            <div className="flex items-center gap-2 border-b border-gray-200 mb-3 text-xs">
              {duplicateClientsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveImportTab('duplicados')}
                  className={`pb-2.5 px-3 font-bold border-b-2 transition ${
                    activeImportTab === 'duplicados'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Duplicados Detectados ({duplicateClientsList.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveImportTab('nuevos')}
                className={`pb-2.5 px-3 font-bold border-b-2 transition ${
                  activeImportTab === 'nuevos'
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Clientes Nuevos ({newClientsList.length})
              </button>
            </div>

            {/* Tab 1: DUPLICATES RESOLUTION TABLE */}
            {activeImportTab === 'duplicados' && duplicateClientsList.length > 0 && (
              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 font-bold uppercase text-[10px] text-gray-700 sticky top-0 border-b border-gray-200">
                      <th className="p-2.5 w-28">RFC</th>
                      <th className="p-2.5">Datos Actuales en el Sistema</th>
                      <th className="p-2.5">Nuevos Datos en el Archivo Excel</th>
                      <th className="p-2.5 w-44 text-center">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {duplicateClientsList.map((item, idx) => {
                      const isReplacing = item.action === 'replace';
                      return (
                        <tr key={idx} className={isReplacing ? 'bg-emerald-50/30' : 'bg-gray-50/60 opacity-80'}>
                          <td className="p-2.5 font-mono font-bold text-gray-900 align-top">
                            {item.incoming.rfc || 'S/RFC'}
                          </td>
                          <td className="p-2.5 align-top">
                            <div className="font-semibold text-gray-800">{item.existing.nombre}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {item.existing.direccion || item.existing.calle || 'Sin dirección'} | Tel: {item.existing.telefono || '—'}
                            </div>
                          </td>
                          <td className="p-2.5 align-top">
                            <div className="font-semibold text-emerald-900">{item.incoming.nombre}</div>
                            <div className="text-[11px] text-emerald-700 mt-0.5">
                              {item.incoming.direccion || item.incoming.calle || 'Sin dirección'} | Tel: {item.incoming.telefono || '—'}
                            </div>
                          </td>
                          <td className="p-2.5 text-center align-middle">
                            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white shadow-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...duplicateClientsList];
                                  updated[idx].action = 'replace';
                                  setDuplicateClientsList(updated);
                                }}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  isReplacing
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-black'
                                }`}
                              >
                                Reemplazar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...duplicateClientsList];
                                  updated[idx].action = 'skip';
                                  setDuplicateClientsList(updated);
                                }}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  !isReplacing
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-black'
                                }`}
                              >
                                Omitir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: NEW CLIENTS TABLE */}
            {activeImportTab === 'nuevos' && (
              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl">
                {newClientsList.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Todos los clientes en el archivo ya existían en el directorio (fueron detectados como duplicados).
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold uppercase text-[10px] text-gray-700 sticky top-0 border-b border-gray-200">
                        <th className="p-2 w-10 text-center">No.</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">RFC</th>
                        <th className="p-2">Domicilio</th>
                        <th className="p-2">Ciudad</th>
                        <th className="p-2">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {newClientsList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 text-center font-mono text-[11px] text-gray-600">
                            {row.no || idx + 1}
                          </td>
                          <td className="p-2 font-bold text-gray-900 uppercase">
                            {row.nombre}
                          </td>
                          <td className="p-2 font-mono text-[11px]">{row.rfc || 'S/RFC'}</td>
                          <td className="p-2 text-gray-600 truncate max-w-xs uppercase">
                            {row.direccion || row.calle || '—'}
                          </td>
                          <td className="p-2 text-gray-600 uppercase">{row.ciudad || '—'}</td>
                          <td className="p-2 text-gray-800">{row.telefono || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Footer Summary & Action */}
            <div className="pt-4 mt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-gray-600">
                Resumen de importación:{' '}
                <strong className="text-emerald-700">{newClientsList.length} nuevos</strong> +{' '}
                <strong className="text-blue-700">
                  {duplicateClientsList.filter((d) => d.action === 'replace').length} a reemplazar
                </strong>{' '}
                ({duplicateClientsList.filter((d) => d.action === 'skip').length} a omitir)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setNewClientsList([]);
                    setDuplicateClientsList([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImportWithResolution}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Importación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
