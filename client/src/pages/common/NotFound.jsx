import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">
          The page or resource you are looking for has been moved or does not exist in the SocioHub directory.
        </p>

        <button
          onClick={() => navigate('/')}
          className="mt-6 py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 transition-all shadow-glow-cyan"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SocioHub Home</span>
        </button>
      </div>
    </div>
  );
};
