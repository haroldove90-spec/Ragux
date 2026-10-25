import React from 'react';
import {
  FilePlus,
  FileText,
  Package,
  User,
  Users,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { RoleType } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeRole: RoleType;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeRole,
  onLogout,
}) => {
  const menuItems = [
    {
      id: 'nueva_cotizacion' as NavTab,
      label: 'Nueva Cotización',
      desc: 'Crear formato comercial',
      icon: FilePlus,
    },
    {
      id: 'cotizaciones' as NavTab,
      label: 'Cotizaciones',
      desc: 'Historial y exportación',
      icon: FileText,
    },
    {
      id: 'productos' as NavTab,
      label: 'Productos',
      desc: 'Catálogo de línea',
      icon: Package,
    },
    {
      id: 'clientes' as NavTab,
      label: 'Clientes',
      desc: 'Directorio y fiscales',
      icon: Users,
    },
    {
      id: 'perfil' as NavTab,
      label: 'Perfil Fiscal',
      desc: 'Datos del emisor y app',
      icon: User,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 min-h-[calc(100vh-4rem)] select-none">
      {/* Navigation list */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Módulos del Sistema
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 font-semibold shadow-xs border border-emerald-200/60'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-black font-medium'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isActive ? 'bg-[#66C34E] text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm leading-tight truncate">{item.label}</span>
                <span className="text-[11px] text-gray-500 font-normal leading-tight truncate">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer session info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/70 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#66C34E]" />
            <span>Rol: <strong className="text-gray-900 capitalize">{activeRole}</strong></span>
          </div>
          <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-mono">
            v1.0 PWA
          </span>
        </div>

        <button
          onClick={onLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cambiar de Rol / Salir</span>
        </button>
      </div>
    </aside>
  );
};
