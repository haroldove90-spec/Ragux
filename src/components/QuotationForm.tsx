import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Save,
  Eye,
  UserPlus,
  PackagePlus,
  CheckCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Client, CompanyProfile, Product, Quotation, QuotationItem } from '../types';
import { StorageService } from '../services/storage';
import { numeroALetras } from '../utils/numberToWords';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { QuotationDetailModal } from './QuotationDetailModal';

interface QuotationFormProps {
  profile: CompanyProfile;
  clients: Client[];
  products: Product[];
  onSaved: (quotation: Quotation) => void;
  onRefreshData: () => void;
  initialQuotation?: Quotation | null;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({
  profile,
  clients,
  products,
  onSaved,
  onRefreshData,
  initialQuotation,
}) => {
  // Document header fields
  const [folio, setFolio] = useState('');
  const [fechaExpedicion, setFechaExpedicion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [lugarExpedicion, setLugarExpedicion] = useState(
    profile.lugarExpedicionDefecto || 'SAN LUIS POTOSI, SAN LUIS POTOSI'
  );

  // Client fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteRfc, setClienteRfc] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteCiudad, setClienteCiudad] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  // Items table
  const [items, setItems] = useState<QuotationItem[]>([]);

  // Selected product picker state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [addItemQty, setAddItemQty] = useState<number>(1);

  // Conditions
  const [descuento, setDescuento] = useState<number>(0);
  const [validoHasta, setValidoHasta] = useState(
    profile.terminosPorDefecto?.validez || '30 DÍAS'
  );
  const [tiempoEntrega, setTiempoEntrega] = useState(
    profile.terminosPorDefecto?.tiempoEntrega || 'INMEDIATA SALVO PREVIA VENTA'
  );
  const [formaPago, setFormaPago] = useState(
    profile.terminosPorDefecto?.formaPago || 'PAGO EN PARCIALIDADES O DIFERIDO'
  );
  const [notas, setNotas] = useState('');

  // UI state
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (initialQuotation) {
      setFolio(initialQuotation.folio);
      setFechaExpedicion(initialQuotation.fechaExpedicion);
      setLugarExpedicion(initialQuotation.lugarExpedicion);
      setSelectedClientId(initialQuotation.clienteId || '');
      setClienteNombre(initialQuotation.clienteNombre);
      setClienteRfc(initialQuotation.clienteRfc);
      setClienteDireccion(initialQuotation.clienteDireccion);
      setClienteCiudad(initialQuotation.clienteCiudad);
      setClienteTelefono(initialQuotation.clienteTelefono);
      setItems(initialQuotation.items);
      setDescuento(initialQuotation.descuento || 0);
      setValidoHasta(initialQuotation.validoHasta);
      setTiempoEntrega(initialQuotation.tiempoEntrega);
      setFormaPago(initialQuotation.formaPago);
      setNotas(initialQuotation.notas || '');
    } else {
      const nextFolio = StorageService.getNextFolio();
      setFolio(nextFolio);
      setFechaExpedicion(new Date().toISOString().split('T')[0]);
      setLugarExpedicion(profile.lugarExpedicionDefecto || 'SAN LUIS POTOSI, SAN LUIS POTOSI');
      setItems([]);
      setDescuento(0);
      setNotas('');
    }
  }, [initialQuotation, profile]);

  // Handle client selection from dropdown
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClienteNombre(found.nombre);
      setClienteRfc(found.rfc || '');
      setClienteDireccion(found.direccion || '');
      setClienteCiudad(found.ciudad || '');
      setClienteTelefono(found.telefono || '');
    }
  };

  // Add selected product to items table
  const handleAddProductFromCatalog = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = Math.max(1, addItemQty || 1);
    const unitPrice = prod.precioUnitario || 0;
    const totalItem = Math.round(qty * unitPrice * 100) / 100;

    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: prod.id,
      cantidad: qty,
      unidadMedida: prod.unidadMedida || 'H87',
      descripcion: prod.descripcion,
      precioUnitario: unitPrice,
      importe: totalItem,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedProductId('');
    setProductSearch('');
    setAddItemQty(1);
  };

  // Add empty manual item row
  const handleAddBlankItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cantidad: 1,
      unidadMedida: 'H87',
      descripcion: '',
      precioUnitario: 0,
      importe: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update item field in table
  const handleUpdateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        if (field === 'cantidad' || field === 'precioUnitario') {
          const qty = Number(field === 'cantidad' ? value : item.cantidad) || 0;
          const price = Number(field === 'precioUnitario' ? value : item.precioUnitario) || 0;
          updated.importe = Math.round(qty * price * 100) / 100;
        }
        return updated;
      })
    );
  };

  // Delete item row
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (curr.importe || 0), 0);
  const total = Math.max(0, Math.round((subtotal - (descuento || 0)) * 100) / 100);
  const totalLetra = numeroALetras(total);

  // Build current quotation object
  const buildQuotationObject = (): Quotation => {
    return {
      id: initialQuotation?.id || `cot-${Date.now()}`,
      folio: folio.trim() || '000001',
      fechaExpedicion,
      lugarExpedicion: lugarExpedicion.trim(),
      clienteId: selectedClientId || undefined,
      clienteNombre: clienteNombre.trim() || 'CLIENTE MOSTRADOR',
      clienteRfc: clienteRfc.trim(),
      clienteDireccion: clienteDireccion.trim(),
      clienteCiudad: clienteCiudad.trim(),
      clienteTelefono: clienteTelefono.trim(),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      descuento: Number(descuento) || 0,
      total,
      totalLetra,
      validoHasta: validoHasta.trim(),
      tiempoEntrega: tiempoEntrega.trim(),
      formaPago: formaPago.trim(),
      notas: notas.trim(),
      creadoPor: 'Admin',
      fechaCreacion: initialQuotation?.fechaCreacion || new Date().toISOString(),
      estado: initialQuotation?.estado || 'vigente',
      sincronizado: false, // will sync when online
    };
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!clienteNombre.trim()) {
      setErrorMessage('Por favor ingrese el nombre del cliente o seleccione uno registrado.');
      return false;
    }
    if (items.length === 0) {
      setErrorMessage('Agregue al menos una partida de producto a la cotización.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Save quotation
  const handleSave = (andExportPdf: boolean = false) => {
    if (!validateForm()) return;

    const quot = buildQuotationObject();
    StorageService.saveQuotation(quot);
    onSaved(quot);

    setSuccessMessage(`¡Cotización #${quot.folio} guardada exitosamente en el dispositivo!`);
    setTimeout(() => setSuccessMessage(''), 4000);

    if (andExportPdf) {
      exportPDF(quot);
    }
  };

  // Export PDF helper
  const exportPDF = async (quot: Quotation) => {
    try {
      setIsExporting(true);
      const doc = await generateQuotationPDF(quot, profile);
      doc.save(`Cotizacion_${quot.folio}_${quot.clienteNombre.slice(0, 15).trim()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setErrorMessage('Ocurrió un error al exportar el PDF. Revise los datos.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered products for dropdown search
  const filteredProducts = products.filter((p) => {
    const term = productSearch.toLowerCase();
    return (
      p.descripcion.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term) ||
      (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Alert Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-[#66C34E] shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Header of Section */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {initialQuotation ? `Editar Cotización #${folio}` : 'Nueva Cotización'}
            </h2>
            <p className="text-xs text-gray-500">
              Formulario de cotización comercial con cálculo automático y exportación en PDF
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const quot = buildQuotationObject();
                setPreviewQuotation(quot);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">Vista Previa</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#66C34E] hover:bg-[#52a33c] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Guardar y PDF'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Row 1: Document Metadata (Folio, Date, Place) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Número de Cotización / Folio
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-[#66C34E]">
                  #
                </span>
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="001963"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Fecha de Expedición
              </label>
              <input
                type="date"
                value={fechaExpedicion}
                onChange={(e) => setFechaExpedicion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Lugar de Expedición
              </label>
              <input
                type="text"
                value={lugarExpedicion}
                onChange={(e) => setLugarExpedicion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                placeholder="SAN LUIS POTOSI, SAN LUIS POTOSI"
              />
            </div>
          </div>

          {/* Row 2: Client Selector & Fiscal Info */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#C3CAD0] text-gray-900 text-xs font-bold px-2.5 py-0.5 rounded">
                  Cotizado a:
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Selecciona de tu catálogo o llena los datos directamente
                </span>
              </div>

              {/* Botón desplegable para seleccionar clientes registrados */}
              <div className="w-full sm:w-72">
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                >
                  <option value="">-- Seleccionar Cliente Registrado --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.rfc || 'Sin RFC'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="FRANCISCO JAVIER MATA MOLINA"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  value={clienteRfc}
                  onChange={(e) => setClienteRfc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="MAMF5512033Y8"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="(488) 123-45-67"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="GUERRERO 100, MATEHUALA CENTRO C.P. 78700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Ciudad / Estado
                </label>
                <input
                  type="text"
                  value={clienteCiudad}
                  onChange={(e) => setClienteCiudad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="MATEHUALA, SAN LUIS POTOSI"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Product Selector Bar */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                <PackagePlus className="w-4 h-4 text-[#66C34E]" />
                Agregar Producto del Catálogo Registrado
              </span>
              <span className="text-[11px] text-emerald-700">
                Selecciona de tus productos precargados para llenar más rápido
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                >
                  <option value="">-- Buscar o Seleccionar Producto Registrado ({products.length} disponibles) --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.descripcion} — ${p.precioUnitario.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(parseFloat(e.target.value) || 1)}
                  placeholder="Cant."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                  title="Cantidad a agregar"
                />
              </div>

              <div className="sm:col-span-2 flex gap-1">
                <button
                  type="button"
                  onClick={handleAddProductFromCatalog}
                  disabled={!selectedProductId}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase">
                Partidas de la Cotización ({items.length})
              </h3>

              <button
                type="button"
                onClick={handleAddBlankItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-400 text-gray-700 hover:border-[#66C34E] hover:text-[#66C34E] text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Fila Manual</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#C3CAD0] text-gray-900 font-bold uppercase text-[11px]">
                    <th className="py-2 px-2 text-right w-20">Cant.</th>
                    <th className="py-2 px-2 text-center w-24">Unid. Medida</th>
                    <th className="py-2 px-3">Descripción del Producto</th>
                    <th className="py-2 px-2 text-right w-28">Pcio. Unitario</th>
                    <th className="py-2 px-3 text-right w-28">Importe</th>
                    <th className="py-2 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No hay partidas agregadas aún. Selecciona un producto registrado arriba o pulsa "+ Fila Manual".
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/80">
                        {/* Cantidad */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.cantidad}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-[#66C34E]"
                          />
                        </td>

                        {/* Unidad de Medida */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.unidadMedida}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'unidadMedida', e.target.value.toUpperCase())
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center font-mono text-xs uppercase focus:ring-1 focus:ring-[#66C34E]"
                            placeholder="H87"
                          />
                        </td>

                        {/* Descripción */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'descripcion', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs uppercase text-gray-900 focus:ring-1 focus:ring-[#66C34E]"
                            placeholder="Descripción del producto..."
                          />
                        </td>

                        {/* Precio Unitario */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioUnitario}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'precioUnitario',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right font-mono text-xs focus:ring-1 focus:ring-[#66C34E]"
                          />
                        </td>

                        {/* Importe calculado */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                          $
                          {item.importe.toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Delete action */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                            title="Eliminar partida"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 5: Total con Letra & Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-gray-200">
            {/* Left: Total con Letra & Conditions */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="inline-block bg-[#D2D7DC] px-2.5 py-0.5 font-bold text-gray-900 text-[11px] mb-1">
                  Total con letra
                </span>
                <div className="w-full p-2.5 bg-[#EBEEF0] border border-gray-300 rounded-lg text-xs font-bold font-mono text-gray-900 uppercase">
                  {totalLetra}
                </div>
              </div>

              {/* Conditions Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                    Válido hasta
                  </label>
                  <input
                    type="text"
                    value={validoHasta}
                    onChange={(e) => setValidoHasta(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded uppercase font-medium"
                    placeholder="30 DÍAS / 20/11/2025"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                    Tiempo de entrega
                  </label>
                  <input
                    type="text"
                    value={tiempoEntrega}
                    onChange={(e) => setTiempoEntrega(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded uppercase font-medium"
                    placeholder="INMEDIATA"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                    Forma de pago
                  </label>
                  <input
                    type="text"
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded uppercase font-medium"
                    placeholder="PAGO EN PARCIALIDADES"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-800"
                  placeholder="Precios sujetos a cambio sin previo aviso..."
                />
              </div>
            </div>

            {/* Right: Subtotal, Descuento, Total */}
            <div className="md:col-span-5 bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Subtotal:</span>
                  <span className="font-mono font-bold text-gray-900 text-base">
                    $
                    {subtotal.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-gray-700">Descuento ($):</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={descuento}
                      onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-right font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 px-3 bg-[#C3CAD0] rounded-lg border border-gray-400 mt-2">
                  <span className="font-extrabold text-gray-900 text-base">TOTAL:</span>
                  <span className="font-mono font-extrabold text-gray-900 text-xl">
                    $
                    {total.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cotización</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewQuotation && (
        <QuotationDetailModal
          quotation={previewQuotation}
          profile={profile}
          onClose={() => setPreviewQuotation(null)}
        />
      )}
    </div>
  );
};
