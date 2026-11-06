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
  AlertTriangle,
  RefreshCw,
  Cloud,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { StorageService } from '../services/storage';
import {
  downloadProductLayoutTemplate,
  exportProductsToExcel,
} from '../utils/excelExporter';

export type ProductSortField =
  | 'codigo'
  | 'descripcion'
  | 'unidadMedida'
  | 'categoria'
  | 'precioUnitario'
  | 'stock'
  | 'activo';

export type SortDirection = 'asc' | 'desc';

interface ProductsModuleProps {
  products: Product[];
  onRefresh: () => void;
  onSyncCloud?: () => Promise<any>;
  readOnly?: boolean;
}

interface DuplicateProductItem {
  incoming: Product;
  existing: Product;
  action: 'replace' | 'skip';
}

const ITEMS_PER_PAGE = 10;

export const ProductsModule: React.FC<ProductsModuleProps> = ({
  products,
  onRefresh,
  onSyncCloud,
  readOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [sortField, setSortField] = useState<ProductSortField>('codigo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Duplicate Resolution & Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [newProductsList, setNewProductsList] = useState<Product[]>([]);
  const [duplicateProductsList, setDuplicateProductsList] = useState<DuplicateProductItem[]>([]);
  const [activeImportTab, setActiveImportTab] = useState<'duplicados' | 'nuevos'>('duplicados');

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formUnidadMedida, setFormUnidadMedida] = useState('PIEZAS');
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<number>(0);
  const [formCategoria, setFormCategoria] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formActivo, setFormActivo] = useState(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputId = useId();

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
      showToast('Catálogo sincronizado exitosamente con Supabase', 'success');
    } catch {
      showToast('Error al sincronizar con Supabase', 'error');
    } finally {
      setIsSyncing(false);
    }
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

  // Handle column header sort
  const handleSort = (field: ProductSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort filtered products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'codigo':
          comparison = (a.codigo || '').localeCompare(b.codigo || '', 'es', { numeric: true, sensitivity: 'base' });
          break;
        case 'descripcion':
          comparison = (a.descripcion || '').localeCompare(b.descripcion || '', 'es', { numeric: true, sensitivity: 'base' });
          break;
        case 'unidadMedida':
          comparison = (a.unidadMedida || '').localeCompare(b.unidadMedida || '', 'es', { sensitivity: 'base' });
          break;
        case 'categoria':
          comparison = (a.categoria || '').localeCompare(b.categoria || '', 'es', { sensitivity: 'base' });
          break;
        case 'precioUnitario':
          comparison = (a.precioUnitario ?? 0) - (b.precioUnitario ?? 0);
          break;
        case 'stock':
          comparison = (a.stock ?? 0) - (b.stock ?? 0);
          break;
        case 'activo':
          comparison = (a.activo === false ? 0 : 1) - (b.activo === false ? 0 : 1);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredProducts, sortField, sortDirection]);

  // Pagination (10 en 10)
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, safeCurrentPage]);

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
    if (selectedIds.length === sortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedProducts.map((p) => p.id));
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

        // Duplicate Detection against current catalog
        const existingProducts = StorageService.getProducts();
        const duplicates: DuplicateProductItem[] = [];
        const newItems: Product[] = [];

        parsed.forEach((incoming) => {
          const match = existingProducts.find((p) => {
            const sameCode =
              p.codigo &&
              incoming.codigo &&
              p.codigo.trim().toLowerCase() === incoming.codigo.trim().toLowerCase();
            const sameDesc =
              p.descripcion &&
              incoming.descripcion &&
              p.descripcion.trim().toLowerCase() === incoming.descripcion.trim().toLowerCase();
            return sameCode || sameDesc;
          });

          if (match) {
            duplicates.push({
              incoming,
              existing: match,
              action: 'replace', // Default action: replace
            });
          } else {
            newItems.push(incoming);
          }
        });

        setNewProductsList(newItems);
        setDuplicateProductsList(duplicates);
        setActiveImportTab(duplicates.length > 0 ? 'duplicados' : 'nuevos');
        setShowImportModal(true);
      } catch (err: any) {
        console.error('Error importando catálogo:', err);
        showToast('Error al leer el archivo. Verifica el formato Excel o CSV.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Bulk set action for all duplicates
  const handleSetAllDuplicatesAction = (action: 'replace' | 'skip') => {
    setDuplicateProductsList((prev) =>
      prev.map((item) => ({ ...item, action }))
    );
  };

  // Toggle single duplicate action
  const handleToggleDuplicateAction = (index: number) => {
    setDuplicateProductsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        action: updated[index].action === 'replace' ? 'skip' : 'replace',
      };
      return updated;
    });
  };

  // Confirm Import with Duplicate Resolution
  const handleConfirmImportWithResolution = () => {
    const duplicatesToReplace = duplicateProductsList
      .filter((d) => d.action === 'replace')
      .map((d) => ({
        incoming: d.incoming,
        existingId: d.existing.id,
      }));

    const skippedCount = duplicateProductsList.filter((d) => d.action === 'skip').length;

    const result = StorageService.importProductsWithResolution(
      newProductsList,
      duplicatesToReplace
    );

    setShowImportModal(false);
    setNewProductsList([]);
    setDuplicateProductsList([]);
    onRefresh();

    showToast(
      `¡Importación exitosa! ${result.added} nuevos agregados, ${result.replaced} reemplazados${
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Catálogo de Productos
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {products.length} artículos
                </span>
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                  title="Sincronizar catálogo con Supabase en la nube"
                >
                  <Cloud className={`w-3 h-3 ${isSyncing ? 'animate-pulse text-blue-500' : 'text-blue-600'}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Nube Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Estructura oficial del catálogo ROGUX con detección inteligente de duplicados (Reemplazar u Omitir).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {readOnly ? (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-bold shadow-xs">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Rol Logística: Catálogo en Modo Consulta</span>
            </div>
          ) : (
            <>
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
                title="Importar catálogo completo desde Excel (.xlsx) o CSV con detección de duplicados"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Excel / CSV</span>
              </button>

              {/* Export File Button */}
              <button
                onClick={() => exportProductsToExcel(sortedProducts)}
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
            </>
          )}
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

      {/* Zero Products Cloud Restore Prompt if Supabase has data */}
      {products.length === 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-950">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">¿Tienes productos guardados en Supabase?</span>
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
            {/* Quick Sort Selector & Direction Toggle */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
              <span className="text-gray-500 font-medium hidden sm:inline">Orden:</span>
              <select
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as ProductSortField);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="codigo">Código / Clave</option>
                <option value="descripcion">Descripción</option>
                <option value="precioUnitario">Precio Unitario</option>
                <option value="stock">Stock Disponible</option>
                <option value="categoria">Categoría</option>
                <option value="unidadMedida">Unidad</option>
                <option value="activo">Estado</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] cursor-pointer transition"
                title={
                  sortDirection === 'asc'
                    ? 'Orden Ascendente (clic para Descendente)'
                    : 'Orden Descendente (clic para Ascendente)'
                }
              >
                {sortDirection === 'asc' ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Asc</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3.5 h-3.5 text-blue-700" />
                    <span>Desc</span>
                  </>
                )}
              </button>
            </div>

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

        {/* Bulk Action Banner when 1+ selected (Admin only) */}
        {!readOnly && selectedIds.length > 0 && (
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
                {selectedIds.length === sortedProducts.length
                  ? 'Deseleccionar todos'
                  : `Seleccionar los ${sortedProducts.length} filtrados`}
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
                  {readOnly ? (
                    <span className="text-gray-700 font-bold">#</span>
                  ) : (
                    <button
                      onClick={toggleSelectAllPage}
                      type="button"
                      className="cursor-pointer text-gray-700 hover:text-black flex items-center justify-center mx-auto"
                      title={allCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar página completa'}
                    >
                      {allCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#66C34E]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                </th>
                <th
                  onClick={() => handleSort('codigo')}
                  className="py-3 px-3 w-28 font-mono cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Código (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center gap-1">
                    <span>Código / Clave</span>
                    {sortField === 'codigo' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('descripcion')}
                  className="py-3 px-4 min-w-[280px] cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Descripción (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center gap-1">
                    <span>Descripción del Producto</span>
                    {sortField === 'descripcion' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unidadMedida')}
                  className="py-3 px-3 text-center w-28 cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Unidad de Medida (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Unidad</span>
                    {sortField === 'unidadMedida' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('categoria')}
                  className="py-3 px-3 w-36 cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Categoría (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center gap-1">
                    <span>Categoría</span>
                    {sortField === 'categoria' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('precioUnitario')}
                  className="py-3 px-3 text-right w-32 cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Precio (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Precio ($)</span>
                    {sortField === 'precioUnitario' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="py-3 px-3 text-center w-24 cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Stock (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stock</span>
                    {sortField === 'stock' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('activo')}
                  className="py-3 px-3 w-24 text-center cursor-pointer hover:bg-[#b0b8bf] transition select-none"
                  title="Ordenar por Estado (clic para alternar Asc/Desc)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Estado</span>
                    {sortField === 'activo' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-gray-900" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-gray-900" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-center">{readOnly ? 'Detalle' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {searchTerm
                          ? 'No hay productos que coincidan con la búsqueda'
                          : 'No hay productos registrados en el catálogo local'}
                      </div>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? 'Intenta con otro término o limpia el buscador inteligente.'
                          : 'Sincroniza con Supabase o contacta al administrador para cargar productos.'}
                      </p>
                      {!searchTerm && !readOnly && (
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
                            <span>Registrar Producto</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isInactive = p.activo === false;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/90 transition ${
                        isSelected ? 'bg-emerald-50/50' : ''
                      } ${isInactive ? 'opacity-65 bg-gray-50/40' : ''}`}
                    >
                      {/* Checkbox or Row Index */}
                      <td className="py-3 px-3 text-center">
                        {readOnly ? (
                          <span className="text-gray-400 font-mono text-[11px]">
                            {(safeCurrentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleSelectOne(p.id)}
                            type="button"
                            className="cursor-pointer text-gray-500 hover:text-black flex items-center justify-center mx-auto"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#66C34E]" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
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
                        {readOnly ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isInactive ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isInactive ? 'Inactivo' : 'Activo'}
                          </span>
                        ) : (
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
                        )}
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
                            <Eye className="w-4 h-4" />
                          </button>

                          {!readOnly && (
                            <>
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
                            </>
                          )}
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
        {sortedProducts.length > 0 && (
          <div className="p-4 sm:px-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 text-xs">
            <div className="text-gray-600 font-medium">
              Mostrando <span className="font-bold text-gray-900">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
              <span className="font-bold text-gray-900">
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedProducts.length)}
              </span>{' '}
              de <span className="font-bold text-gray-900">{sortedProducts.length}</span> productos
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    handleOpenEdit(p);
                  }}
                  className="px-3.5 py-1.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Editar
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-4 py-1.5 bg-[#66C34E] text-white rounded-xl text-xs font-bold hover:bg-[#52a33c] transition cursor-pointer"
              >
                Cerrar
              </button>
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
                    Importación de Catálogo con Detección de Duplicados
                  </h3>
                  <span className="text-xs text-gray-500">
                    Total en archivo: {newProductsList.length + duplicateProductsList.length} productos
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setNewProductsList([]);
                  setDuplicateProductsList([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate Notice Banner */}
            {duplicateProductsList.length > 0 ? (
              <div className="p-4 my-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">
                      ¡Se detectaron {duplicateProductsList.length} registro(s) duplicado(s)!
                    </span>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Coinciden en Código o Descripción con productos ya existentes. ¿Deseas <strong>Reemplazarlos</strong> con los nuevos datos del Excel u <strong>Omitirlos</strong> para conservar los existentes?
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
                  No se detectaron duplicados. Se agregarán <strong>{newProductsList.length} nuevos productos</strong> al catálogo.
                </span>
              </div>
            )}

            {/* Tabs (Duplicados vs Nuevos) */}
            <div className="flex items-center gap-2 border-b border-gray-200 mb-3 text-xs">
              {duplicateProductsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveImportTab('duplicados')}
                  className={`pb-2.5 px-3 font-bold border-b-2 transition ${
                    activeImportTab === 'duplicados'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Duplicados Detectados ({duplicateProductsList.length})
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
                Productos Nuevos ({newProductsList.length})
              </button>
            </div>

            {/* Tab 1: DUPLICATES RESOLUTION TABLE */}
            {activeImportTab === 'duplicados' && duplicateProductsList.length > 0 && (
              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 font-bold uppercase text-[10px] text-gray-700 sticky top-0 border-b border-gray-200">
                      <th className="p-2.5 w-24">Código</th>
                      <th className="p-2.5">Datos Actuales en el Sistema</th>
                      <th className="p-2.5">Nuevos Datos en el Archivo Excel</th>
                      <th className="p-2.5 w-44 text-center">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {duplicateProductsList.map((item, idx) => {
                      const isReplacing = item.action === 'replace';
                      return (
                        <tr key={idx} className={isReplacing ? 'bg-emerald-50/30' : 'bg-gray-50/60 opacity-80'}>
                          <td className="p-2.5 font-mono font-bold text-gray-900 align-top">
                            {item.incoming.codigo}
                          </td>
                          <td className="p-2.5 align-top">
                            <div className="font-semibold text-gray-800">{item.existing.descripcion}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              Precio: <span className="font-mono font-bold text-gray-900">${item.existing.precioUnitario.toFixed(2)}</span> | Stock: {item.existing.stock ?? 0} {item.existing.unidadMedida}
                            </div>
                          </td>
                          <td className="p-2.5 align-top">
                            <div className="font-semibold text-emerald-900">{item.incoming.descripcion}</div>
                            <div className="text-[11px] text-emerald-700 mt-0.5">
                              Precio: <span className="font-mono font-bold text-emerald-950">${item.incoming.precioUnitario.toFixed(2)}</span> | Stock: {item.incoming.stock ?? 0} {item.incoming.unidadMedida}
                            </div>
                          </td>
                          <td className="p-2.5 text-center align-middle">
                            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white shadow-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...duplicateProductsList];
                                  updated[idx].action = 'replace';
                                  setDuplicateProductsList(updated);
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
                                  const updated = [...duplicateProductsList];
                                  updated[idx].action = 'skip';
                                  setDuplicateProductsList(updated);
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

            {/* Tab 2: NEW PRODUCTS TABLE */}
            {activeImportTab === 'nuevos' && (
              <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl">
                {newProductsList.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Todos los productos en el archivo ya existían en el catálogo (fueron detectados como duplicados).
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-100 font-bold uppercase text-[10px] text-gray-700 sticky top-0 border-b border-gray-200">
                        <th className="p-2 w-24">Código</th>
                        <th className="p-2">Descripción</th>
                        <th className="p-2 text-center w-20">Unidad</th>
                        <th className="p-2 text-right w-24">Precio ($)</th>
                        <th className="p-2 text-center w-20">Stock</th>
                        <th className="p-2 w-28">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {newProductsList.map((row, idx) => (
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
                )}
              </div>
            )}

            {/* Footer Summary & Action */}
            <div className="pt-4 mt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-gray-600">
                Resumen de importación:{' '}
                <strong className="text-emerald-700">{newProductsList.length} nuevos</strong> +{' '}
                <strong className="text-blue-700">
                  {duplicateProductsList.filter((d) => d.action === 'replace').length} a reemplazar
                </strong>{' '}
                ({duplicateProductsList.filter((d) => d.action === 'skip').length} a omitir)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setNewProductsList([]);
                    setDuplicateProductsList([]);
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
