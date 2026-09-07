import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building2,
  Mail,
  User,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [collegeDomain, setCollegeDomain] = useState('');
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState<number>(2027);

  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await api.get('/auth/colleges');
        if (res.data.success) {
          setCollegesList(res.data.data);
        }
      } catch {
        // ignore
      }
    };
    fetchColleges();
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.includes('@')) {
      const domain = val.split('@')[1]?.toLowerCase();
      if (domain) {
        setCollegeDomain(domain);
      }
    }
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength();
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const googleEmail = email.includes('@') ? email.trim() : 'google.student@stanford.edu';
      const studentName = name.trim() || googleEmail.split('@')[0].replace('.', ' ');
      const domain = googleEmail.split('@')[1] || 'stanford.edu';

      await googleLogin({
        email: googleEmail,
        name: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        collegeDomain: domain,
      });
      navigate('/explore');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        collegeDomain: collegeDomain.trim() || email.split('@')[1] || 'stanford.edu',
        course: course.trim() || undefined,
        graduationYear: Number(graduationYear),
      });

      if (res.data.success) {
        const devCodeParam = res.data.data?.devCode ? `&code=${res.data.data.devCode}` : '';
        navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}${devCodeParam}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-glow mx-auto mb-3">
            <span className="font-mono font-black text-slate-950 text-xl tracking-tighter">PX</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Create Student Account</h1>
          <p className="text-xs text-slate-400">
            Join the cross-college engineering & project formation network
          </p>
        </div>

        {/* Google Quick Continue */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-slate-850 text-slate-100 border border-slate-700/80 transition-all flex items-center justify-center gap-3 shadow-sm hover:border-slate-600"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.8 2 14.6 1.2 12 1.2 7.5 1.2 3.7 3.8 1.9 7.6l3.4 2.6C6.2 7.3 8.8 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.6C.7 10 0 11.9 0 12.5s.7 2.5 1.9 4.9l3.4-2.6z"
            />
            <path
              fill="#34A853"
              d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.2L1.9 16.5C3.7 20.2 7.5 23.8 12 23.8z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            or register with university email
          </span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Elena Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                University Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="elena@uwaterloo.ca"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          {/* University Domain & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                College / Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="uwaterloo.ca"
                  value={collegeDomain}
                  onChange={(e) => setCollegeDomain(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Course / Major
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="B.S. Computer Science / AI"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Expected Graduation Year
            </label>
            <div className="relative">
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="2025">Class of 2025</option>
                <option value="2026">Class of 2026</option>
                <option value="2027">Class of 2027</option>
                <option value="2028">Class of 2028</option>
                <option value="2029">Class of 2029</option>
              </select>
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all ${
                          strength >= level
                            ? strength <= 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {strength <= 1 && 'Weak (min 6 characters)'}
                    {strength === 2 && 'Fair'}
                    {strength === 3 && 'Good'}
                    {strength >= 4 && 'Strong password'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && (
                <div className="mt-2 flex items-center gap-1 text-[10px]">
                  {passwordsMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (confirmPassword.length > 0 && !passwordsMatch)}
            className="w-full py-3 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating Account...' : 'Continue to Email Verification'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
