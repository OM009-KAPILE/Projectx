import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Compass,
  Plus,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const SignupSuccessPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Celebration Badge */}
        <div className="relative inline-block mx-auto animate-in zoom-in-75 duration-500">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 flex items-center justify-center shadow-glow mx-auto">
            <CheckCircle2 className="w-10 h-10 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-900 border border-brand-500/40 shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Account Verified & Activated!
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Welcome to ProjectX, <span className="font-semibold text-slate-200">{user?.name || 'Builder'}</span>! Your university domain is authenticated and your cross-college privileges are unlocked.
          </p>
        </div>

        {/* Perks Box */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Your Builder Network Privileges
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-brand-400" />
                Cross-College Access
              </div>
              <p className="text-[11px] text-slate-400">
                Collaborate with students across Stanford, MIT, Berkeley, CMU & IIT.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                AI Skill Gap Analysis
              </div>
              <p className="text-[11px] text-slate-400">
                Decompose project architectures and match exact missing roles.
              </p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/onboarding"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
          >
            Complete Builder Profile
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/explore"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore Projects Directly
          </Link>
        </div>
      </div>
    </div>
  );
};
