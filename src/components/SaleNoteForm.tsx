import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  FileSpreadsheet,
  CheckCircle,
  FileCheck,
  Users,
} from 'lucide-react';
import { Client, CompanyProfile, Product, SaleNote, SaleNoteItem } from '../types';
import { StorageService } from '../services/storage';
import { numeroALetras } from '../utils/numberToWords';
import { generateSaleNotePDF, MAX_SALE_NOTE_ITEMS } from '../utils/saleNotePdfGenerator';
import { exportSingleSaleNoteToExcel } from '../utils/excelExporter';
import { SmartProductSearchModal } from './SmartProductSearchModal';
import { SmartClientSearchModal } from './SmartClientSearchModal';

interface SaleNoteFormProps {
  profile: CompanyProfile;
  clients: Client[];
  products: Product[];
  onSaved: (saleNote: SaleNote) => void;
  onRefreshData?: () => void;
  initialSaleNote?: SaleNote | null;
}

export const SaleNoteForm: React.FC<SaleNoteFormProps> = ({
  profile,
  clients,
  products,
  onSaved,
  onRefreshData,
  initialSaleNote,
}) => {
  // Folio and basic info
  const [folio, setFolio] = useState<string>(() => {
    return initialSaleNote?.folio || StorageService.getNextNotaFolio();
  });
  const [fechaEmision, setFechaEmision] = useState<string>(() => {
    return initialSaleNote?.fechaEmision || new Date().toISOString().split('T')[0];
  });
  const [lugarExpedicion, setLugarExpedicion] = useState<string>(() => {
    return initialSaleNote?.lugarExpedicion || 'SAN LUIS POTOSI, San Luis Potosi';
  });

  // Emisor details
  const [emisorNombre, setEmisorNombre] = useState(
    initialSaleNote?.emisorNombre || 'RAGUX DISTRIBUCIONES'
  );
  const [emisorDireccion, setEmisorDireccion] = useState(
    initialSaleNote?.emisorDireccion || 'VILLERIAS #273'
  );
  const [emisorColoniaCp, setEmisorColoniaCp] = useState(
    initialSaleNote?.emisorColoniaCp || 'SAUCITO C.P. 78110'
  );
  const [emisorCiudadEstado, setEmisorCiudadEstado] = useState(
    initialSaleNote?.emisorCiudadEstado || 'SAN LUIS POTOSI, San Luis Potosi'
  );
  const [emisorTelefono, setEmisorTelefono] = useState(
    initialSaleNote?.emisorTelefono || 'TEL. whatsapp (444)-3053182'
  );
  const [emisorEmail, setEmisorEmail] = useState(
    initialSaleNote?.emisorEmail || 'correo. raguxdistribuciones@gmail.com'
  );

  // Client info ("Vendido a:")
  const [selectedClientId, setSelectedClientId] = useState<string>(initialSaleNote?.clienteId || '');
  const [clienteNombre, setClienteNombre] = useState(initialSaleNote?.clienteNombre || '');
  const [clienteRfc, setClienteRfc] = useState(initialSaleNote?.clienteRfc || '');
  const [clienteDireccion, setClienteDireccion] = useState(initialSaleNote?.clienteDireccion || '');
  const [clienteColoniaCp, setClienteColoniaCp] = useState(initialSaleNote?.clienteColoniaCp || '');
  const [clienteCiudad, setClienteCiudad] = useState(initialSaleNote?.clienteCiudad || '');
  const [clienteTelefono, setClienteTelefono] = useState(initialSaleNote?.clienteTelefono || '');

  // Items table
  const [items, setItems] = useState<SaleNoteItem[]>(() => {
    if (initialSaleNote && initialSaleNote.items.length > 0) {
      return initialSaleNote.items;
    }
    return [
      {
        id: `item-${Date.now()}-1`,
        cantidad: 1,
        unidad: 'PIEZAS',
        codigo: '',
        descripcion: '',
        precioUnitario: 0,
        importe: 0,
      },
    ];
  });

  // Observations & Status
  const [observaciones, setObservaciones] = useState<string>(() => {
    return (
      initialSaleNote?.observaciones ||
      'ESTIMADO CLIENTE UNA VEZ CHECADA,ENTREGADA,ACEPTADA LAMERCANCIA Y FIRMADA ESTE COMPROBANTE POR NIGUN MOTIVO SE ACEPTAN RECLAMACIONES Y/O DEVOLUCIONES POSTERIORES A LA FECHA DE ENTREGA FAVOR DE REVISAR BIEN SU MERCANCIA. GRACIAS.'
    );
  });
  const [estado, setEstado] = useState<'pagada' | 'pendiente' | 'cancelada'>(
    initialSaleNote?.estado || 'pagada'
  );

  // Catalog quick add
  const [quickAddProductId, setQuickAddProductId] = useState<string>('');
  const [quickAddQty, setQuickAddQty] = useState<number>(1);

  // Smart Search Modals
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  // Single Page Constraint Alert
  const [showMaxItemsWarning, setShowMaxItemsWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Re-fill on initialSaleNote prop change
  useEffect(() => {
    if (initialSaleNote) {
      setFolio(initialSaleNote.folio);
      setFechaEmision(initialSaleNote.fechaEmision);
      setLugarExpedicion(initialSaleNote.lugarExpedicion);
      setEmisorNombre(initialSaleNote.emisorNombre || 'RAGUX DISTRIBUCIONES');
      setEmisorDireccion(initialSaleNote.emisorDireccion || 'VILLERIAS #273');
      setEmisorColoniaCp(initialSaleNote.emisorColoniaCp || 'SAUCITO C.P. 78110');
      setEmisorCiudadEstado(initialSaleNote.emisorCiudadEstado || 'SAN LUIS POTOSI, San Luis Potosi');
      setEmisorTelefono(initialSaleNote.emisorTelefono || 'TEL. whatsapp (444)-3053182');
      setEmisorEmail(initialSaleNote.emisorEmail || 'correo. raguxdistribuciones@gmail.com');
      setSelectedClientId(initialSaleNote.clienteId || '');
      setClienteNombre(initialSaleNote.clienteNombre);
      setClienteRfc(initialSaleNote.clienteRfc || '');
      setClienteDireccion(initialSaleNote.clienteDireccion || '');
      setClienteColoniaCp(initialSaleNote.clienteColoniaCp || '');
      setClienteCiudad(initialSaleNote.clienteCiudad || '');
      setClienteTelefono(initialSaleNote.clienteTelefono || '');
      setItems(initialSaleNote.items);
      setObservaciones(initialSaleNote.observaciones || '');
      setEstado(initialSaleNote.estado || 'pagada');
    }
  }, [initialSaleNote]);

  // Handle client selection from dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClienteNombre(found.nombre);
      setClienteRfc(found.rfc);
      setClienteDireccion(found.direccion);
      setClienteCiudad(found.ciudad);
      setClienteTelefono(found.telefono);
    }
  };

  // Handle client selected via Smart Client Search Modal
  const handleClientSelectedFromModal = (client: Client) => {
    setSelectedClientId(client.id);
    setClienteNombre(client.nombre);
    setClienteRfc(client.rfc);
    setClienteDireccion(client.direccion);
    setClienteCiudad(client.ciudad);
    setClienteTelefono(client.telefono);
  };

  // Add item from quick select or modal
  const handleAddProductItem = (product: Product, quantity = 1) => {
    if (items.length >= MAX_SALE_NOTE_ITEMS) {
      setShowMaxItemsWarning(true);
      return;
    }

    const newItem: SaleNoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: product.id,
      codigo: product.codigo,
      cantidad: quantity,
      unidad: product.unidadMedida === 'H87' ? 'PIEZAS' : product.unidadMedida || 'PIEZAS',
      descripcion: product.descripcion,
      precioUnitario: product.precioUnitario,
      importe: Math.round(quantity * product.precioUnitario * 100) / 100,
    };

    setItems((prev) => [...prev, newItem]);
    setQuickAddProductId('');
    setQuickAddQty(1);
  };

  // Add empty manual row
  const handleAddManualRow = () => {
    if (items.length >= MAX_SALE_NOTE_ITEMS) {
      setShowMaxItemsWarning(true);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        cantidad: 1,
        unidad: 'PIEZAS',
        codigo: '',
        descripcion: '',
        precioUnitario: 0,
        importe: 0,
      },
    ]);
  };

  // Update item field
  const handleUpdateItem = (
    index: number,
    field: keyof SaleNoteItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'cantidad') {
        const qty = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        item.cantidad = qty;
        item.importe = Math.round(qty * item.precioUnitario * 100) / 100;
      } else if (field === 'precioUnitario') {
        const price = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        item.precioUnitario = price;
        item.importe = Math.round(item.cantidad * price * 100) / 100;
      } else if (field === 'descripcion') {
        item.descripcion = value as string;
        // Check if matches product description
        const matched = products.find((p) => p.descripcion === value);
        if (matched) {
          item.productId = matched.id;
          item.codigo = matched.codigo;
          item.precioUnitario = matched.precioUnitario;
          item.unidad = matched.unidadMedida === 'H87' ? 'PIEZAS' : matched.unidadMedida || 'PIEZAS';
          item.importe = Math.round(item.cantidad * matched.precioUnitario * 100) / 100;
        }
      } else if (field === 'codigo') {
        item.codigo = value as string;
        const matched = products.find((p) => p.codigo === value);
        if (matched) {
          item.productId = matched.id;
          item.descripcion = matched.descripcion;
          item.precioUnitario = matched.precioUnitario;
          item.unidad = matched.unidadMedida === 'H87' ? 'PIEZAS' : matched.unidadMedida || 'PIEZAS';
          item.importe = Math.round(item.cantidad * matched.precioUnitario * 100) / 100;
        }
      } else if (field === 'unidad') {
        item.unidad = value as string;
      }

      updated[index] = item;
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.importe || 0), 0) * 100) / 100;
  const total = subtotal;
  const totalLetra = numeroALetras(total);

  // Build current SaleNote object
  const buildCurrentSaleNote = (): SaleNote => {
    return {
      id: initialSaleNote?.id || `nota-${Date.now()}`,
      folio,
      fechaEmision,
      lugarExpedicion,
      emisorNombre,
      emisorDireccion,
      emisorColoniaCp,
      emisorCiudadEstado,
      emisorTelefono,
      emisorEmail,
      clienteId: selectedClientId || undefined,
      clienteNombre: clienteNombre.trim() || 'PÚBLICO EN GENERAL',
      clienteRfc: clienteRfc.trim() || 'XAXX010101000',
      clienteDireccion: clienteDireccion.trim(),
      clienteColoniaCp: clienteColoniaCp.trim(),
      clienteCiudad: clienteCiudad.trim(),
      clienteTelefono: clienteTelefono.trim(),
      items,
      subtotal,
      descuento: 0,
      total,
      totalLetra,
      observaciones,
      fechaCreacion: initialSaleNote?.fechaCreacion || new Date().toISOString(),
      estado,
      sincronizado: false,
    };
  };

  // Save handler
  const handleSave = () => {
    if (items.length === 0) {
      alert('Por favor agrega al menos un producto a la nota de venta.');
      return;
    }
    if (items.length > MAX_SALE_NOTE_ITEMS) {
      setShowMaxItemsWarning(true);
      return;
    }

    setIsSaving(true);
    const saleNoteToSave = buildCurrentSaleNote();
    StorageService.saveSaleNote(saleNoteToSave);
    setIsSaving(false);
    onSaved(saleNoteToSave);
  };

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (items.length > MAX_SALE_NOTE_ITEMS) {
      setShowMaxItemsWarning(true);
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const current = buildCurrentSaleNote();
      const doc = await generateSaleNotePDF(current, profile);
      doc.save(`Nota_de_Venta_${current.folio}_ROGUX.pdf`);
    } catch (err: any) {
      alert(`Error al generar el PDF: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export Excel handler
  const handleExportExcel = () => {
    const current = buildCurrentSaleNote();
    exportSingleSaleNoteToExcel(current);
  };

  // Reset form
  const handleReset = () => {
    if (confirm('¿Deseas limpiar el formulario para una nueva nota de venta?')) {
      setFolio(StorageService.getNextNotaFolio());
      setFechaEmision(new Date().toISOString().split('T')[0]);
      setSelectedClientId('');
      setClienteNombre('');
      setClienteRfc('');
      setClienteDireccion('');
      setClienteColoniaCp('');
      setClienteCiudad('');
      setClienteTelefono('');
      setItems([
        {
          id: `item-${Date.now()}`,
          cantidad: 1,
          unidad: 'PIEZAS',
          codigo: '',
          descripcion: '',
          precioUnitario: 0,
          importe: 0,
        },
      ]);
      setObservaciones(
        'ESTIMADO CLIENTE UNA VEZ CHECADA,ENTREGADA,ACEPTADA LAMERCANCIA Y FIRMADA ESTE COMPROBANTE POR NIGUN MOTIVO SE ACEPTAN RECLAMACIONES Y/O DEVOLUCIONES POSTERIORES A LA FECHA DE ENTREGA FAVOR DE REVISAR BIEN SU MERCANCIA. GRACIAS.'
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Warning Modal if items exceed 30 items for Letter size */}
      {showMaxItemsWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-500 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                Límite de Tamaño Carta Alcanzado
              </h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              La nota de venta ya cubrió la capacidad máxima de{' '}
              <strong>1 página tamaño carta ({MAX_SALE_NOTE_ITEMS} partidas)</strong>.
            </p>
            <p className="text-sm text-amber-800 font-medium mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Para garantizar que no salgan notas de venta en 2 páginas, deberás generar una nueva nota para las siguientes partidas.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMaxItemsWarning(false)}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-black transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Search Modals */}
      <SmartProductSearchModal
        isOpen={isProductSearchOpen}
        onClose={() => setIsProductSearchOpen(false)}
        products={products}
        onSelectProduct={handleAddProductItem}
        title="Buscador Inteligente de Productos (Nota de Venta)"
      />

      <SmartClientSearchModal
        isOpen={isClientSearchOpen}
        onClose={() => setIsClientSearchOpen(false)}
        clients={clients}
        onSelectClient={handleClientSelectedFromModal}
      />

      {/* Main Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#66C34E] text-white rounded-xl shadow-xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#66C34E]">
                  Módulo de Ventas
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  Carta 1 Pág.
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {initialSaleNote ? `Editar Nota de Venta #${folio}` : 'Nueva Nota de Venta'}
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Limpiar formulario"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Exportar a Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Descargar en PDF tamaño carta"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando...' : 'PDF Carta'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#66C34E] hover:bg-[#57a942] text-white rounded-xl text-xs font-black tracking-wide shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Nota'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
          {/* Section 1: Header Folio, Date & Emisor Data */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            {/* Left: Emisor logo and info */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={profile.logoUrl || 'https://appdesignproyectos.com/raguxdistribuciones.jpeg'}
                alt="ROGUX Distribuciones"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full shadow-xs shrink-0"
              />
              <div className="space-y-1 text-xs text-gray-700">
                <span className="text-sm font-extrabold text-gray-900 block">
                  {emisorNombre}
                </span>
                <p>{emisorDireccion}, {emisorColoniaCp}</p>
                <p>{emisorCiudadEstado}</p>
                <p className="font-semibold text-emerald-800">{emisorTelefono} &bull; {emisorEmail}</p>
              </div>
            </div>

            {/* Right: Folio & Date (styled faithfully matching user sample 0387269a.png) */}
            <div className="lg:col-span-4 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-center space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-800">
                  <div className="w-2.5 h-2.5 bg-[#66C34E] rounded-xs" />
                  <span>NOTA DE VENTA</span>
                </div>
                {/* Red bold Folio */}
                <div className="flex items-center gap-1">
                  <span className="text-xl sm:text-2xl font-black text-red-600 tracking-tight">
                    {folio}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Fecha Emisión
                  </label>
                  <input
                    type="date"
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-[#66C34E] outline-none text-xs py-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full font-bold text-xs bg-transparent border-b border-gray-300 focus:border-[#66C34E] outline-none py-0.5"
                  >
                    <option value="pagada">Pagada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Lugar de Expedición
                </label>
                <input
                  type="text"
                  value={lugarExpedicion}
                  onChange={(e) => setLugarExpedicion(e.target.value)}
                  className="w-full text-xs font-medium text-gray-800 bg-transparent border-b border-gray-300 focus:border-[#66C34E] outline-none py-0.5"
                  placeholder="SAN LUIS POTOSI, San Luis Potosi"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Client ("Vendido a:") */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                  Vendido a: (Datos del Cliente)
                </span>
                <span className="text-[11px] text-gray-400">
                  {clients.length} registrados
                </span>
              </div>

              {/* Smart Client Search Button */}
              <button
                type="button"
                onClick={() => setIsClientSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5 text-[#66C34E]" />
                <span>Buscador Inteligente de Clientes</span>
              </button>
            </div>

            {/* Quick dropdown select */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                >
                  <option value="">-- Seleccionar de clientes registrados o llenar abajo --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.rfc}) - {c.ciudad}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="MAXSTORE SUCURSAL ARRIAGA"
                  className="w-full px-3 py-1.5 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  value={clienteRfc}
                  onChange={(e) => setClienteRfc(e.target.value.toUpperCase())}
                  placeholder="SEFA900405BC9"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="( ) - - -"
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Dirección y Colonia / C.P.
                </label>
                <input
                  type="text"
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  placeholder="VILLA DE ARRIAGA s/n, CENTRO C.P. 78490"
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Ciudad / Estado
                </label>
                <input
                  type="text"
                  value={clienteCiudad}
                  onChange={(e) => setClienteCiudad(e.target.value)}
                  placeholder="VILLA DE ARRIAGA , SAN LUIS POTOSI"
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#66C34E] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Catalog Quick Add Bar & Smart Product Search Trigger */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#66C34E] shrink-0" />
              <div>
                <span className="text-xs font-extrabold text-emerald-950 block">
                  Catálogo de Productos ({products.length} disponibles)
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  Agrega rápidamente partidas a la nota de venta
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Smart Product Search Button */}
              <button
                type="button"
                onClick={() => setIsProductSearchOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#66C34E]" />
                <span>Buscador Inteligente de Productos</span>
              </button>

              <button
                type="button"
                onClick={handleAddManualRow}
                className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Fila Manual</span>
              </button>
            </div>
          </div>

          {/* Section 4: Items Table (Matching exact format from sample 0387269a.png) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
              <span>
                Partidas de la Nota ({items.length} / {MAX_SALE_NOTE_ITEMS})
              </span>
              {items.length >= MAX_SALE_NOTE_ITEMS - 3 && (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cercano al límite de 1 página carta
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#C3CAD0] text-gray-900 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 text-right w-20">Cant.</th>
                    <th className="py-2.5 px-3 text-center w-28">UNIDAD</th>
                    <th className="py-2.5 px-3 text-center w-28">CÓDIGO</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-3 text-right w-28">Pcio. Unit.</th>
                    <th className="py-2.5 px-3 text-right w-28">Importe</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Cant. (manual without spin arrows) */}
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.cantidad || ''}
                          onChange={(e) => handleUpdateItem(index, 'cantidad', e.target.value)}
                          className="no-spin w-16 text-right font-bold text-xs bg-gray-50 border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#66C34E] outline-none"
                        />
                      </td>

                      {/* UNIDAD */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={item.unidad || 'PIEZAS'}
                          onChange={(e) => handleUpdateItem(index, 'unidad', e.target.value.toUpperCase())}
                          placeholder="PIEZAS"
                          className="w-24 text-center font-semibold text-xs bg-gray-50 border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#66C34E] outline-none"
                        />
                      </td>

                      {/* CÓDIGO (dropdown of catalog or free text) */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          list={`codigos-list-${index}`}
                          value={item.codigo || ''}
                          onChange={(e) => handleUpdateItem(index, 'codigo', e.target.value)}
                          placeholder="Código"
                          className="w-24 font-mono font-bold text-center text-xs bg-gray-50 border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#66C34E] outline-none"
                        />
                        <datalist id={`codigos-list-${index}`}>
                          {products.map((p) => (
                            <option key={p.id} value={p.codigo}>
                              {p.descripcion}
                            </option>
                          ))}
                        </datalist>
                      </td>

                      {/* DESCRIPCIÓN (dropdown with datalist of catalog or manual) */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          list={`desc-list-${index}`}
                          value={item.descripcion}
                          onChange={(e) => handleUpdateItem(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del producto..."
                          className="w-full text-xs font-semibold text-gray-900 bg-gray-50 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-[#66C34E] outline-none"
                        />
                        <datalist id={`desc-list-${index}`}>
                          {products.map((p) => (
                            <option key={p.id} value={p.descripcion}>
                              ${p.precioUnitario.toFixed(2)} - {p.codigo}
                            </option>
                          ))}
                        </datalist>
                      </td>

                      {/* Pcio. Unit. */}
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precioUnitario || ''}
                          onChange={(e) => handleUpdateItem(index, 'precioUnitario', e.target.value)}
                          className="no-spin w-20 text-right font-semibold text-xs bg-gray-50 border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#66C34E] outline-none"
                        />
                      </td>

                      {/* Importe */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-xs text-gray-900">
                        ${item.importe.toFixed(2)}
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Totals Bar matching user sample 39bfaab5.png */}
          <div className="space-y-3">
            {/* Grey bar: Importe Total Con Letra */}
            <div className="bg-[#C3CAD0] px-4 py-1.5 rounded-t-lg">
              <span className="text-xs font-extrabold uppercase text-gray-900">
                Importe Total Con Letra:
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-b-xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-black uppercase text-gray-900 tracking-wide">
                  {totalLetra}
                </span>
              </div>

              {/* Right: Total with double underline styling */}
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-base font-black text-gray-900">Total:</span>
                <div className="border-b-4 border-double border-gray-900 pb-0.5">
                  <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                    ${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Observaciones (Warranty & Returns Terms) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-gray-800">
              Observaciones (Garantía y Políticas):
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-[#66C34E] outline-none"
            />
          </div>

          {/* Section 7: Legal Pagaré Preview */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs text-gray-700">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-extrabold uppercase text-gray-900">
                Pagaré Comercial Legal Integrado
              </span>
              <span className="text-[11px] text-gray-400">
                Se incluye automáticamente en el PDF
              </span>
            </div>
            <p className="leading-relaxed text-gray-600 text-[11px]">
              En <strong>{lugarExpedicion}</strong> Debe(mos) y pagare(mos) incondicionalmente por este Pagaré a la orden de <strong>(RAGUXDISTRIBUCIONES)</strong> en el lugar que se requiera La cantidad de <strong>${total.toFixed(2)} M.N.</strong> Valor recibido de mi (nuestra) entera satisfacción, sujetos a la condición de que, al no pagarse a su vencimiento, desde la fecha de vencimiento de este documento hasta el día de su liquidación, causará intereses moratorios del ______ mensual, pagadero en esta ciudad juntamente con el principal.
            </p>
            <div className="flex justify-end pt-4">
              <div className="text-center w-56 border-t border-gray-800 pt-1">
                <span className="text-xs font-bold text-gray-900">Recibí de conformidad</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
