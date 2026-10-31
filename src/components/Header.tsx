import React from 'react';
import { LogOut, Shield, Wifi, WifiOff, User as UserIcon, Database } from 'lucide-react';
import { APP_ROLES } from '../data/initialData';
import { RoleType, UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  activeRole: RoleType;
  currentUser?: UserAccount | null;
  onLogout: () => void;
  onSwitchRole?: (role: RoleType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeRole, currentUser, onLogout }) => {
  const isOnline = useOnlineStatus();
  const currentRoleInfo = APP_ROLES.find((r) => r.id === activeRole) || {
    id: activeRole,
    name: activeRole === 'admin' ? 'Admin' : activeRole === 'vendedor' ? 'Ventas' : activeRole,
    description: '',
    badgeColor: '#66C34E',
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logotipo del sistema - no encapsulado */}
        <div className="flex items-center gap-3">
          <img
            src="https://appdesignproyectos.com/raguxdistribuciones.jpeg"
            alt="ROGUX"
            className="h-10 sm:h-12 w-auto object-contain rounded-full shadow-2xs cursor-pointer"
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs uppercase tracking-widest text-[#66C34E] font-bold leading-tight">
              Distribuciones
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              Sistema de Cotizaciones
            </span>
          </div>
        </div>

        {/* Right: Identificación del rol activo, Offline status, Botón de instalación y Botón de cierre de sesión */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${
              isOnline
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}
            title={isOnline ? 'Conectado a Internet' : 'Modo Offline: Guardando en almacenamiento local'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-600" />
                <span className="hidden md:inline">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Identificación del usuario y rol activo */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-lg border border-gray-200 text-xs font-semibold text-gray-800">
            {currentUser ? (
              <>
                {currentUser.fotoUrl ? (
                  <img
                    src={currentUser.fotoUrl}
                    alt={currentUser.nombre}
                    className="w-5 h-5 rounded-full object-cover border border-[#66C34E] shrink-0"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-[#66C34E] shrink-0" />
                )}
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{currentUser.nombre}</span>
                <span className="text-[10px] bg-white border border-gray-200 px-1 py-0.2 rounded text-emerald-700 capitalize font-bold">
                  {currentRoleInfo.name}
                </span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-[#66C34E]" />
                <span className="capitalize">{currentRoleInfo.name}</span>
              </>
            )}
          </div>

          {/* Botón de instalación rápida de la aplicación */}
          <PWAInstallButton compact />

          {/* Botón de cierre de sesión */}
          <button
            onClick={onLogout}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition cursor-pointer"
            title="Cerrar sesión y cambiar de rol"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
