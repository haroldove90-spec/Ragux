import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Users, MapPin, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Client } from '../types';

interface SmartClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export const SmartClientSearchModal: React.FC<SmartClientSearchModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSelectClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((c) => {
      const matchName = c.nombre.toLowerCase().includes(term);
      const matchRfc = c.rfc.toLowerCase().includes(term);
      const matchCity = c.ciudad.toLowerCase().includes(term);
      const matchAddress = c.direccion.toLowerCase().includes(term);
      const matchPhone = c.telefono.toLowerCase().includes(term);
      return matchName || matchRfc || matchCity || matchAddress || matchPhone;
    });
  }, [clients, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#66C34E] text-white rounded-xl shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Buscador Inteligente de Clientes
              </h2>
              <p className="text-xs text-gray-500">
                Localiza rápidamente por nombre, razón social, RFC o ciudad ({filteredClients.length} disponibles)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nombre (ej. Maxstore, Mata), RFC o ciudad..."
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#66C34E] focus:border-[#66C34E] shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredClients.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No se encontraron clientes registrados</p>
              <p className="text-xs text-gray-400 mt-1">Verifica el nombre o registra un nuevo cliente en el módulo correspondiente</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => {
                  onSelectClient(client);
                  onClose();
                }}
                className="p-3.5 bg-white hover:bg-emerald-50/60 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-950">
                      {client.nombre}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded border border-gray-200">
                      {client.rfc}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{client.direccion}, {client.ciudad}</span>
                    </span>
                    {client.telefono && client.telefono !== '( ) - - -' && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{client.telefono}</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-gray-100 group-hover:bg-[#66C34E] text-gray-700 group-hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Seleccionar</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredClients.length} clientes encontrados</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
