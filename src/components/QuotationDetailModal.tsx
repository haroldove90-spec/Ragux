import React, { useState } from 'react';
import { Download, Printer, X, Check, Loader2, FileSpreadsheet } from 'lucide-react';
import { CompanyProfile, Quotation } from '../types';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { exportSingleQuotationToExcel } from '../utils/excelExporter';

interface QuotationDetailModalProps {
  quotation: Quotation | null;
  profile: CompanyProfile;
  onClose: () => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  profile,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!quotation) return null;

  const handleDownloadPDF = async () => {
    if (quotation.items.length > 30) {
      window.alert(
        `Aviso al Administrador: Esta cotización tiene ${quotation.items.length} partidas y excede la capacidad de 1 página tamaño carta (máximo 30 partidas). Para evitar que salgan cotizaciones en 2 páginas, debe llenar otra cotización nueva para los productos restantes.`
      );
      return;
    }

    try {
      setDownloading(true);
      const doc = await generateQuotationPDF(quotation, profile);
      doc.save(`Cotizacion_${quotation.folio}_${quotation.clienteNombre.slice(0, 15).trim()}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      window.alert(err?.message || 'No se pudo generar el archivo PDF. Intente de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gray-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold">
              Cotización #{quotation.folio}
            </span>
            <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded font-mono font-semibold">
              {quotation.estado.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => exportSingleQuotationToExcel(quotation)}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Paper Document Replica */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-6 sm:p-10 shadow-md border border-gray-200 text-black text-xs font-sans">
            {/* Top row: Logo, Emisor info, Folio & Date box */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-100">
              {/* Logo - no encapsulado */}
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={profile.logoUrl || 'https://appdesignproyectos.com/raguxdistribuciones.jpeg'}
                  alt="ROGUX Logo"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </div>

              {/* Emisor data */}
              <div className="text-center flex-1 px-2 space-y-0.5">
                <div className="font-bold text-xs sm:text-sm uppercase text-gray-900">
                  {profile.nombreComercial}
                </div>
                <div className="text-[11px] text-gray-700 uppercase font-medium">{profile.rfc}</div>
                <div className="text-[11px] text-gray-600 uppercase">{profile.direccionCalle}</div>
                <div className="text-[11px] text-gray-600 uppercase">{profile.coloniaCp}</div>
                <div className="text-[11px] text-gray-600 uppercase">{profile.ciudadEstado}</div>
                <div className="text-[11px] text-gray-800 uppercase font-semibold">
                  TEL. {profile.telefono}
                </div>
              </div>

              {/* Right: Folio & Date */}
              <div className="w-full md:w-36 shrink-0 flex flex-col items-center">
                {/* Header box */}
                <div className="w-full bg-[#C3CAD0] text-gray-900 font-bold text-center py-1 text-[11px] uppercase tracking-wide">
                  COTIZACION
                </div>
                {/* Folio value with green indicator */}
                <div className="w-full py-2 flex items-center justify-center gap-1.5 border-x border-b border-gray-200 bg-white">
                  <span className="w-2.5 h-2.5 bg-[#66C34E] inline-block" />
                  <span className="font-bold text-base text-gray-900 font-mono">
                    #{quotation.folio}
                  </span>
                </div>

                {/* Fecha expedición header box */}
                <div className="w-full bg-[#C3CAD0] text-gray-900 font-bold text-center py-0.5 text-[10px] uppercase tracking-wide mt-1">
                  Fecha de expedición
                </div>
                {/* Fecha value */}
                <div className="w-full py-1 text-center border-x border-b border-gray-200 bg-white font-mono text-[11px]">
                  {quotation.fechaExpedicion}
                </div>
              </div>
            </div>

            {/* Lugar de expedición row */}
            <div className="flex justify-end mt-3 mb-4">
              <div className="flex items-center border border-gray-300 text-[11px]">
                <div className="bg-[#D2D7DC] px-3 py-1 font-bold text-gray-900 border-r border-gray-300">
                  Lugar de expedición:
                </div>
                <div className="px-3 py-1 bg-white font-medium uppercase text-gray-800">
                  {quotation.lugarExpedicion}
                </div>
              </div>
            </div>

            {/* Client info ("Cotizado a:") */}
            <div className="mb-6 space-y-1">
              <div className="inline-block bg-[#D2D7DC] px-3 py-0.5 font-bold text-gray-900 text-[11px]">
                Cotizado a:
              </div>
              <div className="font-bold text-gray-900 text-xs sm:text-sm uppercase">
                {quotation.clienteNombre}
              </div>
              {quotation.clienteRfc && (
                <div className="text-[11px] text-gray-700 font-mono uppercase">
                  {quotation.clienteRfc}
                </div>
              )}
              {quotation.clienteDireccion && (
                <div className="text-[11px] text-gray-600 uppercase">
                  {quotation.clienteDireccion}
                </div>
              )}
              {quotation.clienteCiudad && (
                <div className="text-[11px] text-gray-600 uppercase">
                  {quotation.clienteCiudad}
                </div>
              )}
              {quotation.clienteTelefono && (
                <div className="text-[11px] text-gray-700 font-medium">
                  TEL: {quotation.clienteTelefono}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#C3CAD0] text-gray-900 font-bold text-center border-b border-gray-300">
                    <th className="py-1 px-2 text-right w-16">Cant.</th>
                    <th className="py-1 px-2 text-center w-24">Unid. de Medida</th>
                    <th className="py-1 px-3 text-left">Descripción</th>
                    <th className="py-1 px-2 text-right w-24">Pcio. Unitario</th>
                    <th className="py-1 px-2 text-right w-24">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                      <td className="py-1 px-2 text-right text-gray-800">
                        {item.cantidad.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-center text-gray-600">
                        {item.unidadMedida || 'H87'}
                      </td>
                      <td className="py-1 px-3 text-left font-sans text-gray-900 uppercase">
                        {item.descripcion}
                      </td>
                      <td className="py-1 px-2 text-right text-gray-800">
                        {item.precioUnitario.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-1 px-2 text-right font-semibold text-gray-900">
                        {item.importe.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total con Letra & Totals Box */}
            <div className="space-y-2 mb-6">
              <div className="inline-block bg-[#D2D7DC] px-3 py-0.5 font-bold text-gray-900 text-[11px]">
                Total con letra
              </div>
              <div className="w-full bg-[#EBEEF0] py-1.5 px-3 font-bold text-center text-gray-900 text-xs uppercase tracking-wide border border-gray-200">
                {quotation.totalLetra}
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="font-bold text-gray-700">Subtotal</span>
                    <span className="font-mono font-semibold text-gray-900">
                      $
                      {quotation.subtotal.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {quotation.descuento > 0 && (
                    <div className="flex justify-between py-0.5 text-red-600">
                      <span className="font-bold">Descuento</span>
                      <span className="font-mono font-semibold">
                        -$
                        {quotation.descuento.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 px-2 bg-[#C3CAD0] font-bold text-gray-900 text-sm border-t border-gray-400">
                    <span>Total</span>
                    <span className="font-mono">
                      $
                      {quotation.total.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 3 Condition Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-gray-200 mb-2">
              <div className="border border-gray-300">
                <div className="bg-[#C3CAD0] py-0.5 text-center font-bold text-[10px] uppercase text-gray-900">
                  Válido hasta
                </div>
                <div className="p-1.5 text-center font-medium text-[10.5px] uppercase text-gray-800">
                  {quotation.validoHasta || '30 DÍAS'}
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-[#C3CAD0] py-0.5 text-center font-bold text-[10px] uppercase text-gray-900">
                  Tiempo de entrega
                </div>
                <div className="p-1.5 text-center font-medium text-[10.5px] uppercase text-gray-800">
                  {quotation.tiempoEntrega || 'INMEDIATA'}
                </div>
              </div>

              <div className="border border-gray-300">
                <div className="bg-[#C3CAD0] py-0.5 text-center font-bold text-[10px] uppercase text-gray-900">
                  Forma de pago
                </div>
                <div className="p-1.5 text-center font-medium text-[10.5px] uppercase text-gray-800">
                  {quotation.formaPago || 'PAGO EN PARCIALIDADES O DIFERIDO'}
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] text-gray-500 italic">
              Pago en parcialidades o diferido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
