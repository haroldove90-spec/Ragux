import React, { useState } from 'react';
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
} from 'lucide-react';
import { Client } from '../types';
import { StorageService } from '../services/storage';
import { exportClientsToExcel } from '../utils/excelExporter';

interface ClientsModuleProps {
  clients: Client[];
  onRefresh: () => void;
  onSelectForQuotation?: (client: Client) => void;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  clients,
  onRefresh,
  onSelectForQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [rfc, setRfc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [contacto, setContacto] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const filtered = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.rfc && c.rfc.toLowerCase().includes(term)) ||
      (c.ciudad && c.ciudad.toLowerCase().includes(term)) ||
      (c.telefono && c.telefono.includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setNombre('');
    setRfc('');
    setDireccion('');
    setCiudad('SAN LUIS POTOSI, SAN LUIS POTOSI');
    setTelefono('');
    setEmail('');
    setContacto('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setNombre(c.nombre);
    setRfc(c.rfc);
    setDireccion(c.direccion);
    setCiudad(c.ciudad);
    setTelefono(c.telefono);
    setEmail(c.email || '');
    setContacto(c.contacto || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const newClient: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      nombre: nombre.trim().toUpperCase(),
      rfc: rfc.trim().toUpperCase(),
      direccion: direccion.trim().toUpperCase(),
      ciudad: ciudad.trim().toUpperCase(),
      telefono: telefono.trim(),
      email: email.trim(),
      contacto: contacto.trim(),
    };

    StorageService.saveClient(newClient);
    onRefresh();
    setShowModal(false);
    setSuccessMessage(
      editingClient ? 'Cliente actualizado exitosamente' : 'Cliente registrado exitosamente'
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar al cliente "${name}"?`)) {
      StorageService.deleteClient(id);
      onRefresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#66C34E]" />
            Directorio de Clientes ({clients.length})
          </h2>
          <p className="text-xs text-gray-500">
            Administra tus clientes, RFC, domicilios fiscales y teléfonos para cotizaciones rápidas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportClientsToExcel(filtered)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Exportar directorio de clientes a Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#66C34E]" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="w-full sm:w-96 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, RFC, ciudad o teléfono..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            />
          </div>
        </div>

        {/* Clients Cards Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 space-y-2">
              <Users className="w-12 h-12 mx-auto text-gray-300" />
              <div className="text-sm font-semibold text-gray-600">No se encontraron clientes</div>
              <p className="text-xs text-gray-400">
                {searchTerm
                  ? 'No hay resultados para la búsqueda ingresada.'
                  : 'Registra a tu primer cliente para comenzar a cotizar.'}
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-gray-50/70 hover:bg-white border border-gray-200 hover:border-[#66C34E] rounded-xl shadow-xs transition duration-150 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 uppercase leading-snug">
                      {c.nombre}
                    </span>
                    <span className="bg-[#C3CAD0] text-gray-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0">
                      {c.rfc || 'S/RFC'}
                    </span>
                  </div>

                  {c.direccion && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="uppercase text-[11px]">{c.direccion}</span>
                    </div>
                  )}

                  {c.ciudad && (
                    <div className="text-[11px] font-medium text-gray-500 pl-5 uppercase">
                      {c.ciudad}
                    </div>
                  )}

                  {c.telefono && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#66C34E] shrink-0" />
                      <span>{c.telefono}</span>
                    </div>
                  )}

                  {c.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  {onSelectForQuotation && (
                    <button
                      onClick={() => onSelectForQuotation(c)}
                      type="button"
                      className="text-xs font-bold text-[#66C34E] hover:underline"
                    >
                      Cotizar a este cliente &rarr;
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      type="button"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-200 transition cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.nombre)}
                      type="button"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add / Edit Client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#66C34E]" />
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase font-semibold focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="FRANCISCO JAVIER MATA MOLINA"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    RFC
                  </label>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="MAMF5512033Y8"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="(488) 123-45-67"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                  Dirección (Calle, Número, Colonia, C.P.)
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="GUERRERO 100, MATEHUALA CENTRO C.P. 78700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Ciudad / Estado
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="MATEHUALA, SAN LUIS POTOSI"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
