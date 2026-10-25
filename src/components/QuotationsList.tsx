import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Trash2,
  Copy,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { CompanyProfile, Quotation } from '../types';
import { StorageService } from '../services/storage';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationDetailModal } from './QuotationDetailModal';

interface QuotationsListProps {
  quotations: Quotation[];
  profile: CompanyProfile;
  onRefresh: () => void;
  onNewQuotation: () => void;
  onEditQuotation: (quotation: Quotation) => void;
}

export const QuotationsList: React.FC<QuotationsListProps> = ({
  quotations,
  profile,
  onRefresh,
  onNewQuotation,
  onEditQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'vigente' | 'aprobada'>('todos');

  // Filter list
  const filtered = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      q.folio.toLowerCase().includes(term) ||
      q.clienteNombre.toLowerCase().includes(term) ||
      (q.clienteRfc && q.clienteRfc.toLowerCase().includes(term)) ||
      q.fechaExpedicion.includes(term);

    const matchStatus = statusFilter === 'todos' || q.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  // Delete quotation
  const handleDelete = (id: string, folio: string) => {
    if (window.confirm(`¿Está seguro de eliminar la cotización #${folio}?`)) {
      StorageService.deleteQuotation(id);
      onRefresh();
    }
  };

  // Export PDF directly
  const handleExportPDF = async (q: Quotation) => {
    try {
      setExportingId(q.id);
      const doc = await generateQuotationPDF(q, profile);
      doc.save(`Cotizacion_${q.folio}_${q.clienteNombre.slice(0, 15).trim()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.alert('No se pudo generar el archivo PDF.');
    } finally {
      setExportingId(null);
    }
  };

  // Duplicate quotation
  const handleDuplicate = (q: Quotation) => {
    const nextFolio = StorageService.getNextFolio();
    const duplicated: Quotation = {
      ...q,
      id: `cot-${Date.now()}`,
      folio: nextFolio,
      fechaExpedicion: new Date().toISOString().split('T')[0],
      fechaCreacion: new Date().toISOString(),
      estado: 'vigente',
      sincronizado: false,
    };
    StorageService.saveQuotation(duplicated);
    onRefresh();
  };

  // Summary statistics
  const totalCotizaciones = quotations.length;
  const montoTotal = quotations.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Cotizaciones
            </span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {totalCotizaciones}
            </div>
          </div>
          <div className="p-3 bg-green-50 text-[#66C34E] rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Monto Total Cotizado
            </span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1 font-mono">
              $
              {montoTotal.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-[#66C34E] text-white rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Acción Rápida
            </span>
            <Plus className="w-5 h-5 text-white/90" />
          </div>
          <button
            onClick={onNewQuotation}
            type="button"
            className="mt-3 w-full py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition active:scale-95 cursor-pointer shadow-xs"
          >
            + Crear Nueva Cotización
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente, RFC..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todas ({quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('vigente')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === 'vigente'
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Vigentes
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-gray-300" />
            <div className="text-sm font-semibold text-gray-600">
              No se encontraron cotizaciones
            </div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchTerm
                ? 'No hay registros que coincidan con el término de búsqueda.'
                : 'Aún no se ha registrado ninguna cotización.'}
            </p>
            <button
              onClick={onNewQuotation}
              className="mt-2 px-4 py-2 bg-[#66C34E] text-white text-xs font-bold rounded-xl hover:bg-[#52a33c] transition"
            >
              Crear primera cotización
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((q) => (
              <div
                key={q.id}
                className="p-4 sm:p-5 hover:bg-gray-50/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm sm:text-base text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                      #{q.folio}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-[#2d6e1b]">
                      {q.estado.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {q.fechaExpedicion}
                    </span>
                    {!q.sincronizado && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        Guardado Local (Offline)
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-gray-900 uppercase truncate">
                    {q.clienteNombre}
                  </h4>

                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    {q.clienteRfc && <span>RFC: <strong className="font-mono">{q.clienteRfc}</strong></span>}
                    <span>Partidas: <strong className="text-gray-700">{q.items.length}</strong></span>
                    {q.lugarExpedicion && <span>Lugar: {q.lugarExpedicion}</span>}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-left md:text-right pr-2">
                    <div className="text-xs text-gray-400 uppercase font-bold">Total</div>
                    <div className="text-lg sm:text-xl font-extrabold text-gray-900 font-mono">
                      $
                      {q.total.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  {/* Action buttons: Ver, Exportar PDF, Borrar, Duplicar */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedQuotation(q)}
                      type="button"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition active:scale-95 cursor-pointer"
                      title="Ver cotización formato original"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleExportPDF(q)}
                      disabled={exportingId === q.id}
                      type="button"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#66C34E] hover:bg-[#52a33c] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Exportar en PDF de nuevo"
                    >
                      {exportingId === q.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    <button
                      onClick={() => handleDuplicate(q)}
                      type="button"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition active:scale-95 cursor-pointer"
                      title="Duplicar cotización con nuevo folio"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(q.id, q.folio)}
                      type="button"
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition active:scale-95 cursor-pointer"
                      title="Borrar cotización"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Detail Modal */}
      {selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          profile={profile}
          onClose={() => setSelectedQuotation(null)}
        />
      )}
    </div>
  );
};
