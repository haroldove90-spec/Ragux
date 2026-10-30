import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  Tag,
  DollarSign,
  X,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import { Product } from '../types';
import { StorageService } from '../services/storage';
import { exportProductsToExcel } from '../utils/excelExporter';

interface ProductsModuleProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ products, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('H87');
  const [precioUnitario, setPrecioUnitario] = useState<number>(0);
  const [categoria, setCategoria] = useState('');
  const [stock, setStock] = useState<number>(100);

  // Success alert
  const [successMessage, setSuccessMessage] = useState('');

  // Extract unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.categoria).filter(Boolean) as string[])
  );

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.descripcion.toLowerCase().includes(term) ||
      p.codigo.toLowerCase().includes(term) ||
      (p.categoria && p.categoria.toLowerCase().includes(term));

    const matchCategory = categoryFilter === 'todas' || p.categoria === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setCodigo(`M${Math.floor(1000 + Math.random() * 9000)}`);
    setDescripcion('');
    setUnidadMedida('H87');
    setPrecioUnitario(0);
    setCategoria(categories[0] || 'Línea General');
    setStock(100);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setCodigo(p.codigo);
    setDescripcion(p.descripcion);
    setUnidadMedida(p.unidadMedida || 'H87');
    setPrecioUnitario(p.precioUnitario);
    setCategoria(p.categoria || '');
    setStock(p.stock || 0);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      codigo: codigo.trim() || `M${Math.floor(1000 + Math.random() * 9000)}`,
      descripcion: descripcion.trim().toUpperCase(),
      unidadMedida: unidadMedida.trim().toUpperCase() || 'H87',
      precioUnitario: Number(precioUnitario) || 0,
      categoria: categoria.trim() || 'General',
      stock: Number(stock) || 0,
    };

    StorageService.saveProduct(newProd);
    onRefresh();
    setShowModal(false);
    setSuccessMessage(
      editingProduct ? 'Producto actualizado con éxito' : 'Producto agregado al catálogo'
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar el producto "${name}" del catálogo?`)) {
      StorageService.deleteProduct(id);
      onRefresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#66C34E]" />
            Catálogo de Productos ({products.length})
          </h2>
          <p className="text-xs text-gray-500">
            Administra tus productos, códigos, unidades de medida y precios de lista
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportProductsToExcel(filtered)}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Exportar catálogo completo a Excel (.xlsx)"
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
            <span>Registrar Producto</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#66C34E]" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, descripción, marca..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#66C34E]"
            >
              <option value="todas">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#C3CAD0] text-gray-900 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3 w-24">Código</th>
                <th className="py-2.5 px-4">Descripción del Producto</th>
                <th className="py-2.5 px-3 text-center w-24">Unid. Medida</th>
                <th className="py-2.5 px-3 w-32">Categoría</th>
                <th className="py-2.5 px-3 text-right w-28">Precio Unitario</th>
                <th className="py-2.5 px-3 text-center w-20">Stock</th>
                <th className="py-2.5 px-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                      {p.codigo}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-gray-900 uppercase">
                      {p.descripcion}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-gray-700">
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {p.unidadMedida || 'H87'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                      {p.categoria || 'General'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 text-sm">
                      $
                      {p.precioUnitario.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-gray-600">
                      {p.stock !== undefined ? p.stock : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          type="button"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.descripcion)}
                          type="button"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#66C34E]" />
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Código / Clave *
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="M1251"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="H87 (Pieza)"
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
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="BICARBONATO DE SODIO C/12 100 GRS JALOMA-7501094911059 M1251"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="10.21"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Stock en Almacén
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#66C34E]"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                  Categoría / Línea
                </label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#66C34E]"
                  placeholder="Higiene y Cuidado, Curación, etc."
                />
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
                  {editingProduct ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
