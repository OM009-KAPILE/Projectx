import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const SplashScreen: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (user) {
          navigate('/home');
        } else {
          navigate('/welcome');
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-6 text-center z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 flex items-center justify-center shadow-glow animate-pulse">
            <span className="font-mono font-black text-slate-950 text-3xl tracking-tighter">PX</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-400/20 border border-brand-400/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            Project<span className="text-brand-400">X</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            AI-Powered Cross-College Team Formation
          </p>
        </div>

        {/* Minimal loading bar */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full animate-[loading_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
