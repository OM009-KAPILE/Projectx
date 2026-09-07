import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  FolderKanban,
  FileCheck2,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Layers,
  Settings,
  Plus,
  Menu,
  X,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';

export const Navbar: React.FC = () => {
  const { user, logout, quickLoginAs } = useAuth();
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=20');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const socket = getSocket();
    socket.on('notification_received', (newNotif: any) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => {
      socket.off('notification_received');
    };
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(event.target as Node)) {
        setShowDemoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const markAsRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (link) {
        navigate(link);
        setShowNotifications(false);
      }
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const demoUsers = [
    { name: 'Om Kapile (Lead)', college: 'Sanjivani University', role: 'Team Creator', email: 'kapileom27@gmail.com' },
    { name: 'Vivek Jadhav (Applicant)', college: 'Sanjivani University', role: 'AI Specialist', email: 'student1@test.com' },
    { name: 'Rohan Sharma', college: 'Sanjivani University', role: 'Embedded Systems', email: 'rohan@iitb.ac.in' },
    { name: 'Clara Rossi', college: 'Sanjivani University', role: 'Go Systems', email: 'clara@berkeley.edu' },
    { name: 'Administrator', college: 'Sanjivani University', role: 'Platform Admin', email: 'admin@projectx.edu' },
  ];

  const navLinks = [
    { name: 'Home', path: '/home', icon: FolderKanban },
    { name: 'My Projects', path: '/my-projects', icon: FileCheck2 },
    { name: 'Explore Projects', path: '/explore', icon: Compass },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Profile', path: `/profile/${user?.id || 'me'}`, icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 text-slate-800 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Primary Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to={user ? '/home' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="font-mono font-black text-slate-950 text-xl tracking-tighter">PX</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Project<span className="text-brand-600 dark:text-brand-400">X</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path === '/home' && (location.pathname === '/' || location.pathname === '/home')) ||
                  (link.path === '/my-projects' && (location.pathname === '/my-projects' || location.pathname === '/applications')) ||
                  (link.path === '/explore' && location.pathname.startsWith('/explore')) ||
                  (link.path.startsWith('/profile') && location.pathname.startsWith('/profile'));

                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold dark:bg-brand-950/60 dark:text-brand-400 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Quick Action, Persona Switcher, Theme, Notifications & User */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Create Project Quick Button */}
          {user && (
            <Link
              to="/projects/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </Link>
          )}

          {/* Quick Demo Persona Switcher */}
          <div className="relative" ref={demoMenuRef}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 dark:border-slate-800 transition-colors"
              title="Switch active demo persona"
            >
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span>Switch Student</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Test Student Personas
                </div>
                {demoUsers.map((u) => (
                  <button
                    key={u.email}
                    onClick={async () => {
                      await quickLoginAs(u.email);
                      setShowDemoMenu(false);
                      navigate('/home');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors ${
                      user?.email === u.email ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.college}</div>
                    </div>
                    {user?.email === u.email && (
                      <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notifications Popover */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-950" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet. You're all caught up!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id, n.link || '/home')}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex gap-3 ${
                            !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-brand-500 block" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                              {(n.type === 'APPLICATION_RECEIVED' || n.title?.includes('Applied')) && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shrink-0">
                                  Review
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{n.message}</p>
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {(n.type === 'APPLICATION_RECEIVED' || n.title?.includes('Applied')) && (
                                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                                  <span>Review & Decide</span>
                                  <span>→</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Avatar Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                aria-label="User account menu"
              >
                <img
                  src={
                    user.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80'
                  }
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                />
                <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.college?.name || user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>View Profile</span>
                    </Link>
                    <Link
                      to={`/profile/${user.id}?tab=settings`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Settings & Privacy</span>
                    </Link>
                    {(user.role === 'ADMIN' || user.email === 'kapileom27@gmail.com' || user.email === 'admin@projectx.edu') && (
                      <Link
                        to="/database-view"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold transition-colors"
                      >
                        <Database className="w-4 h-4" />
                        <span>Database View (Judge)</span>
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        navigate('/welcome');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const IconComponent = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path === '/home' && (location.pathname === '/' || location.pathname === '/home')) ||
              (link.path === '/my-projects' && (location.pathname === '/my-projects' || location.pathname === '/applications')) ||
              (link.path === '/explore' && location.pathname.startsWith('/explore')) ||
              (link.path.startsWith('/profile') && location.pathname.startsWith('/profile'));

            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold dark:bg-brand-950/60 dark:text-brand-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/projects/new"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
