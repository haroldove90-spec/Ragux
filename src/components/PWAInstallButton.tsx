import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        type="button"
        className={`flex items-center gap-1.5 font-medium rounded-lg bg-[#66C34E] hover:bg-[#52a33c] text-white shadow-sm transition active:scale-95 cursor-pointer ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        }`}
        title="Instalar aplicación ROGUX en este dispositivo"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className={`flex items-center gap-1.5 font-medium rounded-lg border border-[#66C34E] text-[#2d6e1b] bg-green-50 hover:bg-green-100 transition active:scale-95 cursor-pointer ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title="Instalar en iPhone o iPad"
        >
          <Download className="w-4 h-4" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-[#66C34E]" />
                  Instalar ROGUX en iOS
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-[#2d6e1b] font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    Presiona el botón <strong className="text-gray-900">Compartir</strong> <Share2 className="w-4 h-4 inline text-blue-600 align-text-bottom" /> en la barra inferior de Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-[#2d6e1b] font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    Desliza hacia abajo y pulsa en <strong className="text-gray-900">Agregar a inicio</strong> (+).
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-[#2d6e1b] font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    Pulsa <strong className="text-gray-900">Agregar</strong> en la esquina superior derecha.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback direct button for browsers that support install or manual prompt
  return (
    <button
      onClick={() => {
        window.alert(
          'Para instalar ROGUX:\n• En Chrome/Edge: Haz clic en el ícono de instalar en la barra de direcciones.\n• En móvil: Menú de opciones (...) y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".'
        );
      }}
      type="button"
      className={`flex items-center gap-1.5 font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition active:scale-95 cursor-pointer ${
        compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'
      }`}
      title="Información de instalación PWA"
    >
      <Download className="w-3.5 h-3.5 text-[#66C34E]" />
      <span className="hidden sm:inline">Instalar</span>
    </button>
  );
};
