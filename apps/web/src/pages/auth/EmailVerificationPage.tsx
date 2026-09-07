import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';
  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState(
    codeParam.length === 6 ? codeParam.split('') : ['', '', '', '', '', '']
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(
    codeParam ? `Verification code auto-detected: ${codeParam}` : ''
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input or verify button on mount
    if (codeParam.length === 6) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[0]?.focus();
    }
  }, [codeParam]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    // Handle pasting 6 digits
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
        if (pasted.length === 6) {
          triggerVerification(newDigits.join(''));
        }
      }
      return;
    }

    const singleDigit = val.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (index === 5 && singleDigit) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        triggerVerification(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = async (codeToVerify: string) => {
    if (!email) {
      setError('Please provide your university email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim().toLowerCase(),
        code: codeToVerify,
      });

      if (res.data.success) {
        const { tokens, user } = res.data.data;
        localStorage.setItem('projectx_access_token', tokens.accessToken);
        localStorage.setItem('projectx_refresh_token', tokens.refreshToken);
        localStorage.setItem('projectx_user', JSON.stringify(user));
        navigate('/signup-success');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');

    try {
      const res = await api.post('/auth/resend-verification', {
        email: email.trim().toLowerCase(),
      });

      if (res.data.success) {
        setInfoMessage('Fresh verification code dispatched to your inbox.');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error resending code.');
    } finally {
      setIsResending(false);
    }
  };

  const fullCode = digits.join('');

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-glow">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Verify Your Email</h1>
          <p className="text-xs text-slate-400">
            We sent a 6-digit security code to your university inbox
          </p>
          {email && (
            <span className="inline-block font-mono text-xs text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              {email}
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {!emailParam && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Your University Email
              </label>
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {/* 6 Digit Input Group */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 text-center mb-4">
              Enter 6-Digit Code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-black rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all selection:bg-transparent"
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerVerification(fullCode)}
            disabled={isLoading || fullCode.length !== 6}
            className="w-full py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Verifying Code...' : 'Verify Email & Activate Account'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Resend Actions */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="font-bold text-brand-400 hover:text-brand-300 disabled:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
