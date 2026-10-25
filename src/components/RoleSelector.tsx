import React from 'react';
import { APP_ROLES } from '../data/initialData';
import { RoleType } from '../types';

interface RoleSelectorProps {
  onSelectRole: (role: RoleType) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-6 md:p-12">
      {/* Selector limpio con tarjeta independiente para rol Admin. Sin header, sin descripciones, solo nombre del rol y el logo */}
      <div className="w-full max-w-xs sm:max-w-sm flex justify-center">
        {APP_ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className="w-full group relative flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-3xl shadow-md hover:shadow-xl hover:border-[#66C34E] transition-all duration-200 active:scale-95 cursor-pointer text-center"
          >
            {/* Logo del sistema - no encapsulado */}
            <div className="w-full flex items-center justify-center h-28 sm:h-32 mb-6">
              <img
                src="https://appdesignproyectos.com/raguxlogo.png"
                alt="ROGUX"
                className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>

            {/* Solo nombre del rol */}
            <span className="text-2xl font-extrabold text-gray-900 group-hover:text-[#66C34E] transition-colors">
              {role.name}
            </span>

            {/* Active accent underline */}
            <div className="w-12 h-1.5 bg-[#66C34E] rounded-full mt-3 transition-all duration-200" />
          </button>
        ))}
      </div>
    </div>
  );
};
