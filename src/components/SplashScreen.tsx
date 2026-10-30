import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => {
        setFade(true);
        if (onFinish) onFinish();
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 cursor-pointer ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center p-6 max-w-sm text-center">
        {/* Unboxed logo as requested */}
        <img
          src="https://appdesignproyectos.com/raguxdistribuciones.jpeg"
          alt="ROGUX Distribuciones"
          className="h-28 w-28 rounded-full shadow-lg object-contain mb-6 animate-pulse"
          onError={(e) => {
            // High-fidelity fallback if offline
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <h1 className="text-3xl font-extrabold tracking-wider text-black">ROGUX</h1>
        <p className="text-xs uppercase tracking-widest text-[#66C34E] font-semibold mt-1">
          Distribuciones &bull; Cotizaciones
        </p>

        <div className="mt-8 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#66C34E] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#66C34E] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#66C34E] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
