import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  Cpu,
  Lock,
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-glow">
            <span className="font-mono font-black text-slate-950 text-base tracking-tighter">PX</span>
          </div>
          <span className="font-bold text-base tracking-tight text-slate-100">
            Project<span className="text-brand-400">X</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Explore Projects
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Hero Body */}
      <div className="max-w-4xl mx-auto w-full text-center space-y-8 my-auto py-12 z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Cross-College Engineering & AI Team Formation
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.15]">
            Transform your project idea into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">world-class team</span>.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            ProjectX understands your project vision, detects critical missing skills, recommends proven student builders from partner universities, and protects your intellectual property.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all group"
          >
            Create Student Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 transition-colors"
          >
            Sign In with University Email
          </Link>
        </div>

        {/* Three Core Pillars Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">1. AI Skill-Gap Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decomposes raw pitches into domain architectures and identifies exact missing capabilities.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">2. Cross-College Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Matches verified candidates across Stanford, MIT, IIT Bombay, Berkeley, CMU, and Waterloo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">3. Progressive IP Disclosure</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Safe public teasers protect proprietary algorithms until teammates are accepted.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-600 border-t border-slate-900 pt-6">
        © 2026 ProjectX Platform • Connected to Top University Innovation Hubs
      </div>
    </div>
  );
};
