import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Plus, Filter, Tag, DollarSign, PackageCheck, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface SmartProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product, quantity: number) => void;
  title?: string;
}

export const SmartProductSearchModal: React.FC<SmartProductSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  title = 'Buscador Inteligente de Productos',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setMinPrice('');
      setMaxPrice('');
      setSelectedCategory('todas');
      setOnlyInStock(false);
    }
  }, [isOpen]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products by all criteria
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;

    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'todas' && p.categoria !== selectedCategory) {
        return false;
      }

      // Stock filter
      if (onlyInStock && (p.stock === undefined || p.stock <= 0)) {
        return false;
      }

      // Price filter
      if (min !== null && !isNaN(min) && p.precioUnitario < min) {
        return false;
      }
      if (max !== null && !isNaN(max) && p.precioUnitario > max) {
        return false;
      }

      // Search term across code, description, and category
      if (term) {
        const matchCode = p.codigo.toLowerCase().includes(term);
        const matchDesc = p.descripcion.toLowerCase().includes(term);
        const matchCat = (p.categoria || '').toLowerCase().includes(term);
        const matchPrice = p.precioUnitario.toString().includes(term);
        if (!matchCode && !matchDesc && !matchCat && !matchPrice) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchTerm, selectedCategory, minPrice, maxPrice, onlyInStock]);

  const handleQuantityChange = (prodId: string, val: string) => {
    const parsed = parseFloat(val);
    setQuantities((prev) => ({
      ...prev,
      [prodId]: isNaN(parsed) || parsed <= 0 ? 1 : parsed,
    }));
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onSelectProduct(product, qty);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#66C34E] text-white rounded-xl shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">
                Búsqueda ultra rápida por clave, código, descripción o rango de precio ({filteredProducts.length} encontrados)
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

        {/* Search Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          {/* Main search bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe código (ej. M1251), descripción (ej. Jaloma, Valentina) o precio..."
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

          {/* Quick Filters: Price Range & In-Stock */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtros:
            </span>

            {/* Price inputs */}
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Mín $"
                className="w-16 bg-transparent outline-none text-xs"
              />
              <span className="text-gray-300">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Máx $"
                className="w-16 bg-transparent outline-none text-xs"
              />
            </div>

            {/* In stock toggle */}
            <button
              type="button"
              onClick={() => setOnlyInStock(!onlyInStock)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                onlyInStock
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              Solo con Stock
            </button>

            {/* Clear filters button if active */}
            {(searchTerm || minPrice || maxPrice || selectedCategory !== 'todas' || onlyInStock) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedCategory('todas');
                  setOnlyInStock(false);
                }}
                className="text-emerald-700 hover:underline font-semibold ml-auto text-xs"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('todas')}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer ${
                  selectedCategory === 'todas'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Todas ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#66C34E] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No se encontraron productos con estos criterios</p>
              <p className="text-xs text-gray-400 mt-1">Prueba con otra palabra clave o limpia los filtros</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const currentQty = quantities[product.id] || 1;
              return (
                <div
                  key={product.id}
                  className="p-3 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">
                        {product.codigo}
                      </span>
                      {product.categoria && (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {product.categoria}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                        UM: {product.unidadMedida}
                      </span>
                      {product.stock !== undefined && (
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                            product.stock > 10
                              ? 'text-green-700 bg-green-50'
                              : product.stock > 0
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-600 bg-red-50'
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-950 transition-colors">
                      {product.descripcion}
                    </p>
                  </div>

                  {/* Price & Add Action */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block leading-none">Precio unitario</span>
                      <span className="text-base font-extrabold text-gray-900">
                        ${product.precioUnitario.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={currentQty}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-center text-xs font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66C34E]"
                          title="Cantidad a agregar"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#66C34E] hover:bg-[#57a942] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredProducts.length} de {products.length} productos disponibles
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
