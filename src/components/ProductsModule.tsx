import React, { useId, useMemo, useRef, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  X,
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
  Info,
  DollarSign,
  Boxes,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { StorageService } from '../services/storage';
import {
  downloadProductLayoutTemplate,
  exportProductsToExcel,
} from '../utils/excelExporter';

interface ProductsModuleProps {
  products: Product[];
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

export const ProductsModule: React.FC<ProductsModuleProps> = ({ products, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importedPreviewData, setImportedPreviewData] = useState<Product[]>([]);

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formUnidadMedida, setFormUnidadMedida] = useState('PIEZAS');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<number>(0);
  const [formCategoria, setFormCategoria] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formActivo, setFormActivo] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputId = useId();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.categoria).filter(Boolean) as string[])
    ).sort();
  }, [products]);

  // Smart Search & Filtering
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      // Status filter
      if (statusFilter === 'activos' && p.activo === false) return false;
      if (statusFilter === 'inactivos' && p.activo !== false) return false;

      // Category filter
      if (categoryFilter !== 'todas' && p.categoria !== categoryFilter) return false;

      if (!term) return true;

      const fullString = [
        p.codigo,
        p.descripcion,
        p.unidadMedida,
        p.categoria,
        p.precioUnitario?.toString(),
        p.stock?.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return fullString.includes(term);
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  // Pagination (10 en 10)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safeCurrentPage]);

  // Multi-selection helpers
  const allCurrentPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAllPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(paginatedProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = Array.from(new Set([...selectedIds, ...paginatedProducts.map((p) => p.id)]));
      setSelectedIds(newIds);
    }
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
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
        `¿Confirmas eliminar los ${count} producto(s) seleccionados? Esta acción no se puede deshacer.`
      )
    ) {
      StorageService.deleteMultipleProducts(selectedIds);
      setSelectedIds([]);
      onRefresh();
      showToast(`${count} producto(s) eliminados correctamente`);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormCodigo(`M${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDescripcion('');
    setFormUnidadMedida('PIEZAS');
    setFormPrecioUnitario(0);
    setFormCategoria(categories[0] || 'Abarrotes y Alimentos');
    setFormStock(0);
    setFormActivo(true);
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormCodigo(p.codigo || '');
    setFormDescripcion(p.descripcion || '');
    setFormUnidadMedida(p.unidadMedida || 'PIEZAS');
    setFormPrecioUnitario(p.precioUnitario || 0);
    setFormCategoria(p.categoria || '');
    setFormStock(p.stock !== undefined ? p.stock : 0);
    setFormActivo(p.activo !== false);
    setShowFormModal(true);
  };

  // Open View Modal
  const handleOpenView = (p: Product) => {
    setViewingProduct(p);
  };

  // Toggle Single Product Active
  const handleToggleActive = (p: Product) => {
    StorageService.toggleProductActive(p.id);
    onRefresh();
    showToast(
      `Producto "${p.codigo}" ahora está ${p.activo === false ? 'ACTIVO' : 'INACTIVO'}`
    );
  };

  // Delete Single Product
  const handleDeleteOne = (p: Product) => {
    if (window.confirm(`¿Eliminar del catálogo el producto "${p.descripcion}"?`)) {
      StorageService.deleteProduct(p.id);
      setSelectedIds((prev) => prev.filter((id) => id !== p.id));
      onRefresh();
      showToast('Producto eliminado');
    }
  };

  // Save Product Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescripcion.trim()) {
      showToast('La descripción del producto es obligatoria', 'error');
      return;
    }

    const prodToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      codigo: formCodigo.trim().toUpperCase() || `M${Math.floor(1000 + Math.random() * 9000)}`,
      descripcion: formDescripcion.trim().toUpperCase(),
      unidadMedida: formUnidadMedida.trim().toUpperCase() || 'PIEZAS',
      precioUnitario: Number(formPrecioUnitario) || 0,
      categoria: formCategoria.trim() || 'General',
      stock: Number(formStock) || 0,
      activo: formActivo,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    StorageService.saveProduct(prodToSave);
    onRefresh();
    setShowFormModal(false);
    showToast(
      editingProduct ? 'Producto actualizado con éxito' : 'Producto agregado al catálogo'
    );
  };

  // File Import Logic (.xlsx, .xls, .csv)
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

        // Column match helper
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

        const parsed: Product[] = rawJson
          .map((row, idx) => {
            const codigoVal = getVal(row, 'código / clave', 'codigo / clave', 'codigo', 'clave', 'cod');
            const descVal = getVal(row, 'descripción del producto', 'descripcion del producto', 'descripcion', 'producto', 'articulo');
            const unidadVal = getVal(row, 'unidad de medida', 'unidad', 'medida', 'u.m.');
            const precioRaw = getVal(row, 'precio unitario ($)', 'precio unitario', 'precio', 'costo', 'p.u.');
            const catVal = getVal(row, 'categoría', 'categoria', 'linea', 'departamento');
            const stockRaw = getVal(row, 'stock disponible', 'stock', 'existencia', 'cantidad');

            if (!descVal && !codigoVal) return null;

            const cleanPrecio = parseFloat(precioRaw.replace(/[^0-9.]/g, '')) || 0;
            const cleanStock = parseInt(stockRaw.replace(/[^0-9-]/g, ''), 10) || 0;

            const item: Product = {
              id: `prod-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
              codigo: codigoVal.toUpperCase() || `P-${idx + 1}`,
              descripcion: (descVal || codigoVal).toUpperCase(),
              unidadMedida: (unidadVal || 'PIEZAS').toUpperCase(),
              precioUnitario: cleanPrecio,
              categoria: catVal || 'General',
              stock: Math.max(0, cleanStock),
              activo: true,
              createdAt: new Date().toISOString(),
            };
            return item;
          })
          .filter(Boolean) as Product[];

        if (parsed.length === 0) {
          showToast('No se identificaron productos válidos en el archivo', 'error');
          return;
        }

        setImportedPreviewData(parsed);
        setShowImportPreview(true);
      } catch (err: any) {
        console.error('Error importando catálogo:', err);
        showToast('Error al leer el archivo. Verifica el formato Excel o CSV.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (importedPreviewData.length === 0) return;
    StorageService.saveProductsBatch(importedPreviewData);
    setShowImportPreview(false);
    setImportedPreviewData([]);
    onRefresh();
    showToast(
      `¡Se importaron ${importedPreviewData.length} productos correctamente a tu catálogo!`
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Hidden File Input */}
      <input
        type="file"
        id={productFileInputId}
        name="product_excel_file"
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
              <Package className="w-6 h-6 text-[#66C34E]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Catálogo de Productos
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {products.length} artículos
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Estructura oficial del catálogo ROGUX. Importa, exporta en Excel, actualiza stock y precios de lista.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Download Template */}
          <button
            onClick={downloadProductLayoutTemplate}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-gray-200"
            title="Descargar plantilla de Excel vacía con el formato de catálogo"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Descargar Plantilla</span>
          </button>

          {/* Import File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Importar catálogo completo desde Excel (.xlsx) o CSV"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Excel / CSV</span>
          </button>

          {/* Export File Button */}
          <button
            onClick={() => exportProductsToExcel(filteredProducts)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Exportar catálogo filtrado a Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          {/* New Product */}
          <button
            onClick={handleOpenAdd}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#66C34E] hover:bg-[#52a33c] text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
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

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search, Filters & Status Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscador inteligente: código, producto, categoría..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Categoría:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
                >
                  <option value="todas">Todas ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                Todos ({products.length})
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
                Activos ({products.filter((p) => p.activo !== false).length})
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
                Inactivos ({products.filter((p) => p.activo === false).length})
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
                {selectedIds.length} producto(s) seleccionado(s)
              </span>
              <button
                onClick={toggleSelectAllFiltered}
                type="button"
                className="text-xs text-emerald-700 underline font-semibold ml-2 hover:text-emerald-900"
              >
                {selectedIds.length === filteredProducts.length
                  ? 'Deseleccionar todos'
                  : `Seleccionar los ${filteredProducts.length} filtrados`}
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
                <th className="py-3 px-3 w-28 font-mono">Código / Clave</th>
                <th className="py-3 px-4 min-w-[280px]">Descripción del Producto</th>
                <th className="py-3 px-3 text-center w-28">Unidad de Medida</th>
                <th className="py-3 px-3 w-36">Categoría</th>
                <th className="py-3 px-3 text-right w-32">Precio Unitario ($)</th>
                <th className="py-3 px-3 text-center w-24">Stock Disp.</th>
                <th className="py-3 px-3 w-24 text-center">Estado</th>
                <th className="py-3 px-3 w-32 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {searchTerm
                          ? 'No hay productos que coincidan con la búsqueda'
                          : 'No hay productos registrados en el catálogo'}
                      </div>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? 'Intenta con otro término o limpia el buscador inteligente.'
                          : 'Importa tu archivo Excel con la estructura de productos ROGUX o registra un nuevo producto.'}
                      </p>
                      {!searchTerm && (
                        <div className="pt-2 flex items-center justify-center gap-3">
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
                            <span>Registrar Producto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isInactive = p.activo === false;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/90 transition ${
                        isSelected ? 'bg-emerald-50/50' : ''
                      } ${isInactive ? 'opacity-65 bg-gray-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(p.id)}
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

                      {/* Código */}
                      <td className="py-3 px-3 font-mono font-black text-gray-900">
                        {p.codigo}
                      </td>

                      {/* Descripción */}
                      <td className="py-3 px-4 font-bold text-gray-900 uppercase">
                        <div className="leading-snug">{p.descripcion}</div>
                      </td>

                      {/* Unidad de Medida */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-gray-700">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                          {p.unidadMedida || 'PIEZAS'}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3 text-gray-600 text-[11px] font-medium">
                        {p.categoria || 'General'}
                      </td>

                      {/* Precio Unitario */}
                      <td className="py-3 px-3 text-right font-mono font-black text-gray-900 text-sm">
                        $
                        {p.precioUnitario.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            (p.stock ?? 0) <= 0
                              ? 'bg-red-100 text-red-800'
                              : (p.stock ?? 0) < 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock !== undefined ? p.stock : 0}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(p)}
                          type="button"
                          className="group inline-flex items-center gap-1 cursor-pointer"
                          title={isInactive ? 'Hacer clic para activar producto' : 'Hacer clic para desactivar producto'}
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
                          {/* View */}
                          <button
                            onClick={() => handleOpenView(p)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Ver detalle del producto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteOne(p)}
                            type="button"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar producto"
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
        {filteredProducts.length > 0 && (
          <div className="p-4 sm:px-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 text-xs">
            <div className="text-gray-600 font-medium">
              Mostrando <span className="font-bold text-gray-900">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
              <span className="font-bold text-gray-900">
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredProducts.length)}
              </span>{' '}
              de <span className="font-bold text-gray-900">{filteredProducts.length}</span> productos
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

      {/* Modal Add / Edit Product */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#66C34E]" />
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Código / Clave *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="M0054"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Unidad de Medida *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnidadMedida}
                    onChange={(e) => setFormUnidadMedida(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="PIEZAS / H87 / BULTO / CAJA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                  Descripción Completa del Producto *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase font-semibold focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="SALSA VALENTINA PICANTE 24/370ML 097339000054 -M0054"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Precio Unitario ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formPrecioUnitario}
                      onChange={(e) => setFormPrecioUnitario(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#66C34E]"
                      placeholder="15.95"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Stock Disponible en Almacén
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Categoría / Línea
                  </label>
                  <input
                    type="text"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="Abarrotes y Alimentos"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Estatus
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1 text-xs font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="radio"
                        name="prod_status"
                        checked={formActivo}
                        onChange={() => setFormActivo(true)}
                        className="text-[#66C34E]"
                      />
                      <span>Activo</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs font-bold text-amber-800 cursor-pointer">
                      <input
                        type="radio"
                        name="prod_status"
                        checked={!formActivo}
                        onChange={() => setFormActivo(false)}
                        className="text-amber-600"
                      />
                      <span>Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
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
                  {editingProduct ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Product */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#66C34E] flex items-center justify-center font-bold">
                  <Package className="w-5 h-5 text-[#66C34E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Ficha del Producto</h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-800">
                    {viewingProduct.codigo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-[10px] font-bold uppercase text-gray-500">Descripción Completa</div>
                <div className="text-sm font-bold text-gray-900 uppercase mt-0.5 leading-snug">
                  {viewingProduct.descripcion}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">Precio Unitario</div>
                  <div className="text-base font-black text-gray-900 font-mono mt-0.5">
                    ${viewingProduct.precioUnitario.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">Stock en Almacén</div>
                  <div className="text-base font-black font-mono mt-0.5 text-emerald-700">
                    {viewingProduct.stock !== undefined ? viewingProduct.stock : 0}{' '}
                    <span className="text-[11px] font-medium text-gray-500">
                      {viewingProduct.unidadMedida}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">Categoría</div>
                  <div className="font-semibold text-gray-800 mt-0.5">
                    {viewingProduct.categoria || 'General'}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[10px] font-bold uppercase text-gray-500">Estatus</div>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingProduct.activo === false
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {viewingProduct.activo === false ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEdit(p);
                }}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Preview */}
      {showImportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Vista Previa de Importación de Catálogo ({importedPreviewData.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportPreview(false);
                  setImportedPreviewData([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-xs text-emerald-900">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Se detectaron <strong>{importedPreviewData.length} productos</strong> válidos listos para ser incorporados al catálogo y sincronizados con Supabase.
              </span>
            </div>

            <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold uppercase text-[10px] text-gray-700 sticky top-0">
                    <th className="p-2 w-24">Código</th>
                    <th className="p-2">Descripción</th>
                    <th className="p-2 text-center w-20">Unidad</th>
                    <th className="p-2 text-right w-24">Precio</th>
                    <th className="p-2 text-center w-20">Stock</th>
                    <th className="p-2 w-28">Categoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importedPreviewData.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 font-mono font-bold text-gray-900">{row.codigo}</td>
                      <td className="p-2 font-bold text-gray-900 uppercase">{row.descripcion}</td>
                      <td className="p-2 text-center font-mono text-[11px]">{row.unidadMedida}</td>
                      <td className="p-2 text-right font-mono font-bold text-gray-900">
                        ${row.precioUnitario.toFixed(2)}
                      </td>
                      <td className="p-2 text-center font-mono">{row.stock}</td>
                      <td className="p-2 text-gray-600 text-[11px]">{row.categoria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importedPreviewData.length > 15 && (
                <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 font-medium">
                  ... y {importedPreviewData.length - 15} productos más
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Los productos con el mismo código se actualizarán automáticamente.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportPreview(false);
                    setImportedPreviewData([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Confirmar e Importar {importedPreviewData.length} Productos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
