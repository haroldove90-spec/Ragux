import React from 'react';
import { FilePlus, FileText, Package, User, Users, FileCheck } from 'lucide-react';

import { NavTab } from '../types';
export type { NavTab };

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, isAdmin }) => {
  const navItems = [
    {
      id: 'cotizaciones' as NavTab,
      label: 'Cotiz.',
      icon: FileText,
    },
    {
      id: 'notas_venta' as NavTab,
      label: 'Notas',
      icon: FileCheck,
    },
    {
      id: 'nueva_cotizacion' as NavTab,
      label: '+ Cotiz.',
      icon: FilePlus,
    },
    {
      id: 'productos' as NavTab,
      label: 'Catálogo',
      icon: Package,
    },
    {
      id: 'clientes' as NavTab,
      label: 'Clientes',
      icon: Users,
    },
    ...(isAdmin
      ? [
          {
            id: 'empleados' as NavTab,
            label: 'Personal',
            icon: Users,
          },
        ]
      : []),
    {
      id: 'perfil' as NavTab,
      label: 'Perfil',
      icon: User,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden shadow-lg border-t border-black/10 select-none pb-safe"
      style={{ backgroundColor: '#66C34E' }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-black/20 text-white font-bold shadow-inner'
                  : 'text-white/85 hover:text-white hover:bg-black/10'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] leading-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
