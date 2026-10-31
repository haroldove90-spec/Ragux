import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Database, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storage';
import { UserAccount } from '../types';

interface LoginFormProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usuario.trim()) {
      setError('Por favor ingresa tu nombre de usuario.');
      return;
    }
    if (!clave.trim()) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.login(usuario, clave);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message || 'Credenciales incorrectas');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50/40 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
        {/* Logo - no encapsulado */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="https://appdesignproyectos.com/raguxdistribuciones.jpeg"
            alt="ROGUX Distribuciones"
            className="h-20 sm:h-24 w-auto object-contain rounded-full shadow-md mb-3"
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            ROGUX <span className="text-[#66C34E]">DISTRIBUCIONES</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Acceso Exclusivo al Sistema Comercial
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario registrado"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-gray-900 text-sm font-medium transition outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ingresa tu clave"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-300 focus:border-[#66C34E] focus:ring-2 focus:ring-[#66C34E]/20 text-gray-900 text-sm font-medium transition outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2"
            style={{ backgroundColor: '#66C34E' }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validando acceso...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                Entrar al Sistema
              </>
            )}
          </button>
        </form>

        {/* Footer info - Conexión Segura */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
          <Database className="w-4 h-4 text-[#66C34E]" />
          <span>Sistema Privado · Sincronizado en la Nube</span>
        </div>
      </div>
    </div>
  );
};
