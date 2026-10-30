import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  Phone,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { CompanyProfile, SaleNote } from '../types';
import { generateSaleNotePDF } from '../utils/saleNotePdfGenerator';
import { exportSingleSaleNoteToExcel } from '../utils/excelExporter';

interface SaleNoteDetailModalProps {
  saleNote: SaleNote | null;
  profile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (saleNote: SaleNote) => void;
  onDelete?: (id: string) => void;
}

export const SaleNoteDetailModal: React.FC<SaleNoteDetailModalProps> = ({
  saleNote,
  profile,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen || !saleNote) return null;

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      const doc = await generateSaleNotePDF(saleNote, profile);
      doc.save(`Nota_de_Venta_${saleNote.folio}_ROGUX.pdf`);
    } catch (err: any) {
      alert(`Error al generar el PDF: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    exportSingleSaleNoteToExcel(saleNote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#66C34E] text-white rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#66C34E]">
                  Nota de Venta
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  #{saleNote.folio}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {saleNote.clienteNombre}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Descargar PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generando...' : 'PDF'}</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(saleNote);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Physical Paper Preview Replica */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100">
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 text-xs text-gray-900 space-y-6">
            {/* Header: Logo, Emisor center, Folio right */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="w-20 h-20 shrink-0">
                <img
                  src={profile.logoUrl || 'https://appdesignproyectos.com/raguxdistribuciones.jpeg'}
                  alt="ROGUX"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center space-y-0.5 flex-1">
                <span className="font-extrabold text-sm text-gray-900 block">
                  {saleNote.emisorNombre || 'RAGUX DISTRIBUCIONES'}
                </span>
                <p className="text-gray-600">{saleNote.emisorDireccion || 'VILLERIAS #273'}</p>
                <p className="text-gray-600">{saleNote.emisorColoniaCp || 'SAUCITO C.P. 78110'}</p>
                <p className="text-gray-600">{saleNote.emisorCiudadEstado || 'SAN LUIS POTOSI, San Luis Potosi'}</p>
                <p className="text-gray-600">{saleNote.emisorTelefono || 'TEL. whatsapp (444)-3053182'}</p>
                <p className="text-gray-600">{saleNote.emisorEmail || 'correo. raguxdistribuciones@gmail.com'}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 bg-[#66C34E] rounded-xs" />
                  <span className="font-bold text-xs uppercase text-gray-800">NOTA DE VENTA</span>
                </div>
                <div className="text-2xl font-black text-red-600 tracking-tight">
                  {saleNote.folio}
                </div>
                <span className="text-[11px] text-gray-500 block mt-1">Fecha de Emisión</span>
                <span className="text-xs font-bold text-gray-800">
                  {saleNote.fechaEmision}
                </span>
              </div>
            </div>

            {/* Vendido a and Lugar de expedicion */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-black uppercase text-gray-900 block">Vendido a:</span>
                <p className="font-bold text-gray-900">{saleNote.clienteNombre}</p>
                {saleNote.clienteRfc && <p className="font-mono text-gray-600">{saleNote.clienteRfc}</p>}
                {saleNote.clienteDireccion && <p className="text-gray-600">{saleNote.clienteDireccion}</p>}
                {saleNote.clienteColoniaCp && <p className="text-gray-600">{saleNote.clienteColoniaCp}</p>}
                {saleNote.clienteCiudad && <p className="text-gray-600">{saleNote.clienteCiudad}</p>}
                {saleNote.clienteTelefono && <p className="text-gray-600">{saleNote.clienteTelefono}</p>}
              </div>

              <div className="text-left sm:text-right">
                <span className="font-bold text-gray-700">Lugar de Expedición: </span>
                <span className="font-semibold text-gray-900">{saleNote.lugarExpedicion}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#C3CAD0] text-gray-900 font-bold uppercase text-[11px]">
                    <th className="py-2 px-3 text-right w-16">Cant.</th>
                    <th className="py-2 px-3 text-center w-24">UNIDAD</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-right w-24">Pcio. Unit.</th>
                    <th className="py-2 px-3 text-right w-24">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saleNote.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-right font-bold text-gray-800">
                        {item.cantidad.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-gray-600 font-medium">
                        {item.unidad || 'PIEZAS'}
                      </td>
                      <td className="py-2 px-3 text-gray-900 font-medium">
                        {item.descripcion}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 font-mono">
                        ${item.precioUnitario.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900 font-mono">
                        ${item.importe.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total con Letra and Total */}
            <div className="space-y-2 pt-2">
              <div className="bg-[#C3CAD0] px-3 py-1 rounded-t">
                <span className="text-[11px] font-bold uppercase text-gray-900">
                  Importe Total Con Letra:
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-xs font-black uppercase text-gray-900">
                  {saleNote.totalLetra}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm">Total:</span>
                  <div className="border-b-4 border-double border-black pb-0.5">
                    <span className="text-xl font-black font-mono">
                      ${saleNote.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1 pt-2">
              <span className="font-bold uppercase text-gray-800 text-[11px]">Observaciones:</span>
              <p className="text-[10px] text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                {saleNote.observaciones}
              </p>
            </div>

            {/* Pagaré and Signature */}
            <div className="border-t-2 border-gray-900 pt-3 space-y-4">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                En <strong>{saleNote.lugarExpedicion}</strong> Debe(mos) y pagare(mos) incondicionalmente por este Pagaré a la orden de <strong>(RAGUXDISTRIBUCIONES)</strong> en el lugar que se requiera La cantidad de <strong>${saleNote.total.toFixed(2)} M.N.</strong> Valor recibido de mi (nuestra) entera satisfacción, sujetos a la condición de que, al no pagarse a su vencimiento, desde la fecha de vencimiento de este documento hasta el día de su liquidación, causará intereses moratorios del ______ mensual, pagadero en esta ciudad juntamente con el principal.
              </p>

              <div className="flex justify-end pt-3">
                <div className="text-center w-52 border-t border-gray-900 pt-1">
                  <span className="text-xs font-bold text-gray-900">Recibí de conformidad</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar la nota de venta #${saleNote.folio}?`)) {
                  onDelete(saleNote.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Registro</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
