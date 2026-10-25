import React from 'react';
import { APP_ROLES } from '../data/initialData';
import { RoleType } from '../types';

interface RoleSelectorProps {
  onSelectRole: (role: RoleType) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-6 md:p-12">
      {/* Cuadrícula 2 Columnas Móvil / 4 Columnas Escritorio: Sin header, sin descripciones, solo nombre del rol y el logo */}
      <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {APP_ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#66C34E] transition-all duration-200 active:scale-95 cursor-pointer text-center"
          >
            {/* Logo del sistema - no encapsulado */}
            <div className="w-full flex items-center justify-center h-24 sm:h-28 mb-4">
              <img
                src="https://appdesignproyectos.com/raguxlogo.png"
                alt="ROGUX"
                className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            {/* Solo nombre del rol */}
            <span className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#66C34E] transition-colors">
              {role.name}
            </span>

            {/* Active accent underline */}
            <div className="w-8 h-1 bg-transparent group-hover:bg-[#66C34E] rounded-full mt-2 transition-all duration-200" />
          </button>
        ))}
      </div>
    </div>
  );
};
