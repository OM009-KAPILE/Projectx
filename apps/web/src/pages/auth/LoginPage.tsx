import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

export const LoginPage: React.FC = () => {
  const { login, quickLoginAs, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');
    setRequiresVerification(false);

    try {
      await login({ email: email.trim(), password });
      navigate('/explore');
    } catch (err: any) {
      if (err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setError(err.response?.data?.message || 'Please verify your email.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const googleEmail = email.includes('@') ? email.trim() : 'google.student@stanford.edu';
      const name = googleEmail.split('@')[0].replace('.', ' ');
      const domain = googleEmail.split('@')[1] || 'stanford.edu';

      await googleLogin({
        email: googleEmail,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        collegeDomain: domain,
      });
      navigate('/explore');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (demoEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      await quickLoginAs(demoEmail);
      navigate('/explore');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    {
      name: 'Om Kapile (Lead)',
      college: 'Sanjivani University',
      role: 'Project Creator',
      email: 'kapileom27@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    },
    {
      name: 'Vivek Jadhav (Applicant)',
      college: 'Sanjivani University',
      role: 'Python Developer',
      email: 'student1@test.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    },
    {
      name: 'Student 2',
      college: 'Sanjivani University',
      role: 'Cloud & Python',
      email: 'student2@test.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
    },
    {
      name: 'Om Kapile',
      college: 'Sanjivani University',
      role: 'Lead Architect',
      email: 'alice@stanford.edu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-glow mx-auto mb-3">
            <span className="font-mono font-black text-slate-950 text-xl tracking-tighter">PX</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Sign in to ProjectX</h1>
          <p className="text-xs text-slate-400">
            Enter your university credentials to access project workspaces
          </p>
        </div>

        {/* 1-Click Demo Personas */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Demo Student Personas
          </span>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => handleDemoClick(d.email)}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-brand-500/40 text-left transition-all group flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center gap-2">
                  <img src={d.avatar} alt={d.name} className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs font-bold text-slate-200 group-hover:text-brand-300">
                    {d.name.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{d.college} • {d.role}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{error}</span>
                {requiresVerification && (
                  <div>
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="text-brand-400 font-bold underline hover:text-brand-300"
                    >
                      Enter Verification Code →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google Sign-in Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[11px] text-slate-500 font-medium uppercase">Or with Email</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              University Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="alice@stanford.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 font-semibold hover:underline">
              Create Student Account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
