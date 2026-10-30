import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  Edit,
  Trash2,
  Copy,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { CompanyProfile, SaleNote } from '../types';
import { StorageService } from '../services/storage';
import { exportSaleNotesToExcel, exportSingleSaleNoteToExcel } from '../utils/excelExporter';
import { generateSaleNotePDF } from '../utils/saleNotePdfGenerator';
import { SaleNoteDetailModal } from './SaleNoteDetailModal';

interface SaleNotesListProps {
  saleNotes: SaleNote[];
  profile: CompanyProfile;
  onRefresh: () => void;
  onNewSaleNote: () => void;
  onEditSaleNote: (saleNote: SaleNote) => void;
}

export const SaleNotesList: React.FC<SaleNotesListProps> = ({
  saleNotes,
  profile,
  onRefresh,
  onNewSaleNote,
  onEditSaleNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedNoteForModal, setSelectedNoteForModal] = useState<SaleNote | null>(null);

  // Filtered sales notes
  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return saleNotes.filter((note) => {
      if (statusFilter !== 'todos' && note.estado !== statusFilter) {
        return false;
      }
      if (!term) return true;

      const matchFolio = note.folio.toLowerCase().includes(term);
      const matchClient = note.clienteNombre.toLowerCase().includes(term);
      const matchRfc = (note.clienteRfc || '').toLowerCase().includes(term);
      const matchCity = (note.clienteCiudad || '').toLowerCase().includes(term);
      const matchProduct = note.items.some((i) =>
        i.descripcion.toLowerCase().includes(term) || (i.codigo || '').toLowerCase().includes(term)
      );

      return matchFolio || matchClient || matchRfc || matchCity || matchProduct;
    });
  }, [saleNotes, searchTerm, statusFilter]);

  // Statistics
  const totalAmount = useMemo(() => {
    return filteredNotes.reduce((sum, n) => sum + (n.total || 0), 0);
  }, [filteredNotes]);

  // Handle single download
  const handleDownloadPDF = async (note: SaleNote, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const doc = await generateSaleNotePDF(note, profile);
      doc.save(`Nota_de_Venta_${note.folio}_ROGUX.pdf`);
    } catch (err: any) {
      alert(`Error al generar el PDF: ${err.message}`);
    }
  };

  // Handle single Excel
  const handleExportSingleExcel = (note: SaleNote, e: React.MouseEvent) => {
    e.stopPropagation();
    exportSingleSaleNoteToExcel(note);
  };

  // Handle duplicate
  const handleDuplicate = (note: SaleNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: SaleNote = {
      ...note,
      id: `nota-${Date.now()}`,
      folio: StorageService.getNextNotaFolio(),
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaCreacion: new Date().toISOString(),
      estado: 'pagada',
      sincronizado: false,
    };
    StorageService.saveSaleNote(duplicated);
    onRefresh();
    alert(`Nota duplicada exitosamente con el Folio #${duplicated.folio}`);
  };

  // Handle delete
  const handleDelete = (id: string, folio: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar la nota de venta #${folio}? Esta acción no se puede deshacer.`)) {
      StorageService.deleteSaleNote(id);
      onRefresh();
    }
  };

  // Status badge helper
  const renderStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Pagada
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Detail Modal */}
      <SaleNoteDetailModal
        saleNote={selectedNoteForModal}
        profile={profile}
        isOpen={Boolean(selectedNoteForModal)}
        onClose={() => setSelectedNoteForModal(null)}
        onEdit={(n) => onEditSaleNote(n)}
        onDelete={(id) => handleDelete(id, selectedNoteForModal?.folio || '')}
      />

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#66C34E] text-white rounded-xl shadow-xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Notas de Venta
              </h1>
              <p className="text-xs text-gray-500">
                Registro histórico, comprobantes comerciales y pagarés en tamaño carta
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => exportSaleNotesToExcel(filteredNotes)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="Exportar todas las notas de venta a Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Todo a Excel</span>
          </button>

          <button
            type="button"
            onClick={onNewSaleNote}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#66C34E] hover:bg-[#57a942] active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Nota de Venta</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">Total Notas</span>
          <span className="text-xl font-extrabold text-gray-900">{filteredNotes.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">Monto Facturado</span>
          <span className="text-xl font-extrabold text-[#66C34E]">
            ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">Pagadas</span>
          <span className="text-xl font-extrabold text-green-700">
            {filteredNotes.filter((n) => n.estado === 'pagada').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">Pendientes</span>
          <span className="text-xl font-extrabold text-amber-700">
            {filteredNotes.filter((n) => n.estado === 'pendiente').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por folio (ej. 003087), cliente, RFC o producto..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#66C34E] focus:bg-white transition"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {['todos', 'pagada', 'pendiente', 'cancelada'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Notes Table (Desktop) & Cards (Mobile) */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">No se encontraron notas de venta</h3>
          <p className="text-xs text-gray-500 mt-1">
            Crea una nueva nota de venta o ajusta tus filtros de búsqueda.
          </p>
          <button
            type="button"
            onClick={onNewSaleNote}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#66C34E] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#57a942] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Nota</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente / Razón Social</th>
                  <th className="py-3 px-4 text-center">Partidas</th>
                  <th className="py-3 px-4 text-right">Total ($)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredNotes.map((note) => (
                  <tr
                    key={note.id}
                    onClick={() => setSelectedNoteForModal(note)}
                    className="hover:bg-emerald-50/40 transition cursor-pointer group"
                  >
                    {/* Folio in Red */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#66C34E]" />
                        <span className="font-mono font-black text-red-600 text-sm">
                          {note.folio}
                        </span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                      {note.fechaEmision}
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block group-hover:text-emerald-950">
                        {note.clienteNombre}
                      </span>
                      {note.clienteRfc && (
                        <span className="text-[10px] font-mono text-gray-500">
                          {note.clienteRfc} {note.clienteCiudad ? `&bull; ${note.clienteCiudad}` : ''}
                        </span>
                      )}
                    </td>

                    {/* Partidas */}
                    <td className="py-3 px-4 text-center font-semibold text-gray-600">
                      {note.items.length}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-gray-900">
                      ${note.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      {renderStatusBadge(note.estado)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNoteForModal(note);
                          }}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadPDF(note, e)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Descargar PDF Carta"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleExportSingleExcel(note, e)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Exportar a Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSaleNote(note);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Editar Nota"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(note, e)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Duplicar con nuevo Folio"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(note.id, note.folio, e)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteForModal(note)}
                className="p-4 space-y-3 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-red-600 text-base">
                      #{note.folio}
                    </span>
                    {renderStatusBadge(note.estado)}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {note.fechaEmision}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                    {note.clienteNombre}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {note.clienteCiudad || 'Sin ciudad'} &bull; {note.items.length} partidas
                  </p>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold">Total a pagar:</span>
                  <span className="text-lg font-black text-gray-900 font-mono">
                    ${note.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Mobile action buttons */}
                <div
                  className="grid grid-cols-4 gap-1 pt-2 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => handleDownloadPDF(note, e)}
                    className="flex flex-col items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-[10px] font-bold"
                  >
                    <Download className="w-4 h-4 mb-0.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleExportSingleExcel(note, e)}
                    className="flex flex-col items-center justify-center p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg text-[10px] font-bold"
                  >
                    <FileSpreadsheet className="w-4 h-4 mb-0.5" />
                    <span>Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSaleNote(note);
                    }}
                    className="flex flex-col items-center justify-center p-2 text-amber-600 hover:bg-amber-50 rounded-lg text-[10px] font-bold"
                  >
                    <Edit className="w-4 h-4 mb-0.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(note.id, note.folio, e)}
                    className="flex flex-col items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg text-[10px] font-bold"
                  >
                    <Trash2 className="w-4 h-4 mb-0.5" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
