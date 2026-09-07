import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Bell,
  Sun,
  Moon,
  Monitor,
  Lock,
  LifeBuoy,
  Info,
  CheckCircle2,
  Save,
  Send,
  AlertTriangle,
  FolderKanban,
  UserCheck,
  Calendar,
  MessageSquare,
  Activity,
  Layers,
  KeyRound,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  HelpCircle,
  Flag,
  FileText,
  ExternalLink,
  Laptop,
  Check,
  ChevronRight,
  Sparkles,
  Search,
  School,
  Globe,
  Award,
  Clock,
  Github,
  Linkedin,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { NotificationType, NotificationPreferenceItem } from '@projectx/common';

type SettingsTab =
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'security'
  | 'support'
  | 'about';

interface ActiveSessionItem {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType: string;
  browser?: string;
  os?: string;
  location?: string;
  isCurrent: boolean;
  lastActive: string;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, resolvedTheme, setThemeMode } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // 1. ACCOUNT STATE
  // ==========================================
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    course: user?.course || user?.major || '',
    graduationYear: user?.graduationYear || new Date().getFullYear() + 2,
    weeklyAvailability: user?.weeklyAvailability || '10-20h',
    interests: user?.interests || '',
    avatarUrl: user?.avatarUrl || '',
    githubUrl: user?.githubUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ==========================================
  // 2. PRIVACY STATE
  // ==========================================
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.profileVisibility || 'PUBLIC',
    collegeVisibility: user?.collegeVisibility ?? true,
    portfolioVisibility: user?.portfolioVisibility ?? true,
    defaultProjectPrivacy: user?.defaultProjectPrivacy || 'PROGRESSIVE',
  });

  // ==========================================
  // 3. NOTIFICATIONS STATE
  // ==========================================
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferenceItem | null>(null);
  const [testNotificationType, setTestNotificationType] = useState<string>(NotificationType.PROJECT_HEALTH_WARNING);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // ==========================================
  // 5. SECURITY STATE (SESSIONS)
  // ==========================================
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ==========================================
  // 6. SUPPORT STATE
  // ==========================================
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [supportForm, setSupportForm] = useState({
    category: 'GENERAL_SUPPORT' as 'PROBLEM' | 'USER_REPORT' | 'PROJECT_REPORT' | 'GENERAL_SUPPORT',
    targetId: '',
    subject: '',
    description: '',
    email: user?.email || '',
  });
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Sync user profile into form when auth updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        bio: user.bio || '',
        course: user.course || user.major || '',
        graduationYear: user.graduationYear || new Date().getFullYear() + 2,
        weeklyAvailability: user.weeklyAvailability || '10-20h',
        interests: user.interests || '',
        avatarUrl: user.avatarUrl || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        linkedinUrl: user.linkedinUrl || '',
      });
      setPrivacySettings({
        profileVisibility: user.profileVisibility || 'PUBLIC',
        collegeVisibility: user.collegeVisibility ?? true,
        portfolioVisibility: user.portfolioVisibility ?? true,
        defaultProjectPrivacy: user.defaultProjectPrivacy || 'PROGRESSIVE',
      });
    }
  }, [user]);

  // Load initial remote settings data
  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        // 1. Notification Preferences
        const notifRes = await api.get('/notifications/preferences');
        if (notifRes.data.success) {
          setNotificationPreferences(notifRes.data.data);
        }

        // 2. Active Sessions
        const sessRes = await api.get('/auth/sessions');
        if (sessRes.data.success) {
          setSessions(sessRes.data.data);
        }

        // 3. FAQs
        const faqRes = await api.get('/support/faqs');
        if (faqRes.data.success) {
          setFaqs(faqRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching settings data:', err);
      }
    };

    loadSettingsData();
  }, []);

  const triggerSuccessAlert = (msg: string) => {
    setSaveSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const triggerErrorAlert = (msg: string) => {
    setErrorMessage(msg);
    setSaveSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // ==========================================
  // HANDLERS: ACCOUNT
  // ==========================================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.patch('/users/me', {
        name: profileForm.name,
        bio: profileForm.bio,
        course: profileForm.course,
        major: profileForm.course,
        graduationYear: Number(profileForm.graduationYear),
        weeklyAvailability: profileForm.weeklyAvailability,
        interests: profileForm.interests,
        avatarUrl: profileForm.avatarUrl || null,
        githubUrl: profileForm.githubUrl || null,
        portfolioUrl: profileForm.portfolioUrl || null,
        linkedinUrl: profileForm.linkedinUrl || null,
      });

      if (res.data.success) {
        await refreshUser();
        triggerSuccessAlert('Profile details updated successfully!');
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      triggerErrorAlert('Please enter your new email and current password.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/change-email', emailForm);
      if (res.data.success) {
        setEmailForm({ newEmail: '', currentPassword: '' });
        await refreshUser();
        triggerSuccessAlert('Email address successfully changed!');
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to change email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerErrorAlert('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      triggerErrorAlert('New password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/change-password', passwordForm);
      if (res.data.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        triggerSuccessAlert('Password updated successfully!');
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: PRIVACY
  // ==========================================
  const handleSavePrivacy = async (updated: typeof privacySettings) => {
    setPrivacySettings(updated);
    try {
      const res = await api.patch('/users/me/privacy', updated);
      if (res.data.success) {
        await refreshUser();
        triggerSuccessAlert('Privacy preferences saved.');
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to update privacy settings.');
    }
  };

  // ==========================================
  // HANDLERS: NOTIFICATIONS
  // ==========================================
  const handleToggleNotification = async (key: keyof NotificationPreferenceItem) => {
    if (!notificationPreferences) return;
    const updated = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };
    setNotificationPreferences(updated);

    try {
      const res = await api.patch('/notifications/preferences', updated);
      if (res.data.success) {
        triggerSuccessAlert('Notification settings updated.');
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to save preferences.');
    }
  };

  const handleTestDispatch = async () => {
    setIsTestingNotification(true);
    setTestResult(null);
    try {
      const res = await api.post('/notifications/test-dispatch', {
        type: testNotificationType,
        title: `Test Notification (${testNotificationType.replace(/_/g, ' ')})`,
        message: 'This is a live test ping verifying multi-channel alerts across In-App, Email, and Push.',
        link: '/settings',
      });
      if (res.data.success) {
        setTestResult(res.data.data);
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Error executing notification test.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  // ==========================================
  // HANDLERS: APPEARANCE
  // ==========================================
  const handleSelectTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await api.patch('/users/me/appearance', {
        themePreference: mode.toUpperCase(),
      });
      triggerSuccessAlert(`Theme preference set to ${mode} mode.`);
    } catch (err) {
      // Offline fallback
    }
  };

  // ==========================================
  // HANDLERS: SECURITY & SESSIONS
  // ==========================================
  const handleLogoutAllDevices = async () => {
    if (window.confirm('Are you sure you want to sign out from all devices? You will need to log back in.')) {
      try {
        await api.post('/auth/logout-all');
        logout();
      } catch (err) {
        logout();
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      triggerErrorAlert('Please type DELETE to confirm account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.delete('/users/me/account');
      alert('Your student account and associated data have been permanently deleted.');
      logout();
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  // ==========================================
  // HANDLERS: SUPPORT & REPORTING
  // ==========================================
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.description) {
      triggerErrorAlert('Please fill in both a subject and details.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/support/tickets', supportForm);
      if (res.data.success) {
        setSupportSuccess(true);
        setSupportForm({
          category: 'GENERAL_SUPPORT',
          targetId: '',
          subject: '',
          description: '',
          email: user?.email || '',
        });
        triggerSuccessAlert('Ticket submitted! Our safety team will review it within 24 hours.');
        setTimeout(() => setSupportSuccess(false), 5000);
      }
    } catch (err: any) {
      triggerErrorAlert(err.response?.data?.message || 'Failed to submit support request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation Items Roster
  const navTabs = [
    { id: 'account', label: 'Account', icon: User, desc: 'Profile details, email, password' },
    { id: 'privacy', label: 'Privacy', icon: Shield, desc: 'Visibility & IP access rules' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Multi-channel triggers & alerts' },
    { id: 'appearance', label: 'Appearance', icon: Sun, desc: 'Theme, dark mode & layout' },
    { id: 'security', label: 'Security', icon: Lock, desc: 'Active sessions & danger zone' },
    { id: 'support', label: 'Support & Reports', icon: LifeBuoy, desc: 'Help center & problem reporting' },
    { id: 'about', label: 'About', icon: Info, desc: 'Terms, privacy policy & version' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert Feedback */}
      {saveSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{saveSuccessMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-rose-500/10 border border-rose-500/40 text-rose-400 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Settings & Configuration
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                v1.4.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your student profile, privacy controls, alerts, and platform experience.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <nav className="p-2 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as SettingsTab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-brand-500/10 border border-brand-500/30 text-brand-400 shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight">{tab.label}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{tab.desc}</div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Quick Profile Mini Card */}
          {user && (
            <div className="mt-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800/60 space-y-3">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-100 truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  <div className="text-[10px] text-brand-400 font-medium truncate mt-0.5">{user.college?.name}</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* TAB CONTENT PANELS */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* ============================================================== */}
          {/* SECTION 1: ACCOUNT                                            */}
          {/* ============================================================== */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Details Edit Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-400" />
                    Edit Student Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your public builder bio, academic focus, weekly availability, and portfolio links.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Course / Degree Major</label>
                      <input
                        type="text"
                        placeholder="e.g. M.S. Computer Science (AI Track)"
                        value={profileForm.course}
                        onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Graduation Year</label>
                      <input
                        type="number"
                        min={2022}
                        max={2035}
                        value={profileForm.graduationYear}
                        onChange={(e) => setProfileForm({ ...profileForm, graduationYear: Number(e.target.value) })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Weekly Availability</label>
                      <select
                        value={profileForm.weeklyAvailability}
                        onChange={(e) => setProfileForm({ ...profileForm, weeklyAvailability: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      >
                        <option value="0-5h">0-5 hours / week (Light Advisor)</option>
                        <option value="5-10h">5-10 hours / week (Part-time Contributor)</option>
                        <option value="10-20h">10-20 hours / week (Core Builder)</option>
                        <option value="20+h">20+ hours / week (Full Sprint / Lead)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Builder Bio</label>
                    <textarea
                      rows={3}
                      placeholder="Share your engineering focus, research topics, or what problems you enjoy solving..."
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Technical Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Graph Neural Networks, Distributed Systems, Autonomous Flight"
                      value={profileForm.interests}
                      onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  {/* External Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-slate-400" />
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={profileForm.githubUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Portfolio URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://portfolio.dev"
                        value={profileForm.portfolioUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={profileForm.linkedinUrl}
                        onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Profile Photo Avatar URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 shadow-glow transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Email Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-brand-400" />
                    Change University Email
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Current verified email: <span className="text-brand-400 font-mono">{user?.email}</span>
                  </p>
                </div>

                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">New University Email</label>
                      <input
                        type="email"
                        placeholder="new.email@university.edu"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password (Verify Identity)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={emailForm.currentPassword}
                        onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !emailForm.newEmail || !emailForm.currentPassword}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 border border-slate-700 transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-brand-400" />
                      Update Email Address
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-brand-400" />
                    Change Account Password
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ensure your account is protected with a strong password (minimum 6 characters).
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 border border-slate-700 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                      Save New Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: PRIVACY                                             */}
          {/* ============================================================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-400" />
                    Privacy & Visibility Controls
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Control who can discover your profile, your university affiliation, and project intellectual property.
                  </p>
                </div>

                {/* Profile Visibility */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Profile Visibility
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'PUBLIC',
                        title: 'Public to All Campuses',
                        desc: 'Discoverable by students and project leads across all verified institutions.',
                      },
                      {
                        key: 'REGISTERED_ONLY',
                        title: 'Registered Students Only',
                        desc: 'Only authenticated students with active sessions can view your builder profile.',
                      },
                      {
                        key: 'PRIVATE',
                        title: 'Private / Direct Invite',
                        desc: 'Hidden from search and recommendations; visible only via direct project collaboration.',
                      },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => handleSavePrivacy({ ...privacySettings, profileVisibility: opt.key as any })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          privacySettings.profileVisibility === opt.key
                            ? 'bg-brand-500/10 border-brand-500/40 shadow-glow'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{opt.title}</span>
                          {privacySettings.profileVisibility === opt.key && (
                            <Check className="w-4 h-4 text-brand-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discrete Toggles */}
                <div className="border-t border-slate-800/80 pt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <School className="w-4 h-4 text-brand-400" />
                        College Visibility
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Display your university name and verified badge on public explore listings.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.collegeVisibility}
                      onChange={(e) =>
                        handleSavePrivacy({ ...privacySettings, collegeVisibility: e.target.checked })
                      }
                      className="w-5 h-5 accent-brand-500 cursor-pointer rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-400" />
                        Portfolio Visibility
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Allow other student builders to view your linked GitHub and live project demo links.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.portfolioVisibility}
                      onChange={(e) =>
                        handleSavePrivacy({ ...privacySettings, portfolioVisibility: e.target.checked })
                      }
                      className="w-5 h-5 accent-brand-500 cursor-pointer rounded"
                    />
                  </div>
                </div>

                {/* Default Project Privacy */}
                <div className="border-t border-slate-800/80 pt-6 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Default Project Privacy (When Creating Projects)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'PROGRESSIVE',
                        title: 'Progressive Disclosure (Recommended)',
                        desc: 'Technical specs & private repos protected across 4 verification tiers.',
                      },
                      {
                        key: 'PUBLIC',
                        title: 'Public Open Source',
                        desc: 'All project information is visible to the entire student community immediately.',
                      },
                      {
                        key: 'PRIVATE',
                        title: 'Stealth / Private Team',
                        desc: 'Project details are completely hidden until explicit member approval.',
                      },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => handleSavePrivacy({ ...privacySettings, defaultProjectPrivacy: opt.key as any })}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          privacySettings.defaultProjectPrivacy === opt.key
                            ? 'bg-brand-500/10 border-brand-500/40 shadow-glow'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{opt.title}</span>
                          {privacySettings.defaultProjectPrivacy === opt.key && (
                            <Check className="w-4 h-4 text-brand-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: NOTIFICATIONS                                      */}
          {/* ============================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Delivery Channels */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-brand-400" />
                    Delivery Channels
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Toggle which communication mediums are enabled for platform events.
                  </p>
                </div>

                {notificationPreferences && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      onClick={() => handleToggleNotification('inAppNotifications')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        notificationPreferences.inAppNotifications
                          ? 'bg-brand-500/10 border-brand-500/40 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-xl bg-slate-800 text-brand-400">
                          <Bell className="w-4 h-4" />
                        </span>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.inAppNotifications}
                          readOnly
                          className="w-4 h-4 accent-brand-500"
                        />
                      </div>
                      <div className="text-xs font-bold">In-App Alerts</div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Real-time Socket.IO alerts and navbar bell counter.
                      </p>
                    </div>

                    <div
                      onClick={() => handleToggleNotification('emailNotifications')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        notificationPreferences.emailNotifications
                          ? 'bg-brand-500/10 border-brand-500/40 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-xl bg-slate-800 text-brand-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.emailNotifications}
                          readOnly
                          className="w-4 h-4 accent-brand-500"
                        />
                      </div>
                      <div className="text-xs font-bold">Email Notifications</div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Professional emails to your verified <span className="font-mono text-brand-400">{user?.email}</span>.
                      </p>
                    </div>

                    <div
                      onClick={() => handleToggleNotification('pushNotifications')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        notificationPreferences.pushNotifications
                          ? 'bg-brand-500/10 border-brand-500/40 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-xl bg-slate-800 text-brand-400">
                          <Smartphone className="w-4 h-4" />
                        </span>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.pushNotifications}
                          readOnly
                          className="w-4 h-4 accent-brand-500"
                        />
                      </div>
                      <div className="text-xs font-bold">Mobile Push</div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Push notifications to registered iOS / Android device tokens.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Granular Triggers */}
              {notificationPreferences && (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Application & Project Triggers
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'notifyNewApplication', label: 'New Application Received', desc: 'When a candidate applies for an open role' },
                      { key: 'notifyApplicationStatus', label: 'Application Status Decisions', desc: 'When you are accepted, shortlisted, or reviewed' },
                      { key: 'notifyTeamInvitation', label: 'Team Invitations', desc: 'When a project owner invites you to build' },
                      { key: 'notifyNewMessage', label: 'Direct Messages & Mentions', desc: 'When a team member messages you or mentions your handle' },
                      { key: 'notifyTaskAssigned', label: 'Task Assigned', desc: 'When a sprint task is assigned to you' },
                      { key: 'notifyTaskDeadline', label: 'Task Deadline Reminders', desc: '24-hour reminder before a task is due' },
                      { key: 'notifyHealthWarning', label: 'Project Health Warning', desc: 'When project health dips or tasks are overdue' },
                      { key: 'notifySkillGap', label: 'Skill Gap Detected', desc: 'When missing technical requirements are detected' },
                      { key: 'notifyMilestoneCompleted', label: 'Milestone Completed', desc: 'When a major delivery deliverable is finalized' },
                    ].map((item) => {
                      const isEnabled = (notificationPreferences as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleNotification(item.key as any)}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            readOnly
                            className="w-4 h-4 accent-brand-500 cursor-pointer shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Multi-Channel Test Tool */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Live Notification Test Dispatcher
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Test your multi-channel delivery configuration on demand.
                    </p>
                  </div>

                  <button
                    onClick={handleTestDispatch}
                    disabled={isTestingNotification}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 transition-all shadow-glow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isTestingNotification ? 'Dispatching...' : 'Dispatch Test Alert'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    NotificationType.PROJECT_HEALTH_WARNING,
                    NotificationType.NEW_APPLICATION,
                    NotificationType.TASK_ASSIGNED,
                    NotificationType.APPLICATION_ACCEPTED,
                    NotificationType.MILESTONE_COMPLETED,
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTestNotificationType(type)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                        testNotificationType === type
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                          : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {testResult && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2 mt-4 text-xs font-mono">
                    <div className="text-emerald-400 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Dispatched Successfully:
                    </div>
                    <div className="text-slate-300 text-[11px] space-y-1">
                      <div>In-App ID: <span className="text-brand-400">{testResult.inAppNotification?.id}</span></div>
                      <div>Email Sent: <span className="text-cyan-400">{testResult.emailDispatched ? 'Yes (Verified SMTP Inbox)' : 'Disabled / Skipped'}</span></div>
                      <div>Push Tokens Reached: <span className="text-purple-400">{testResult.pushTokensCount} device(s)</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: APPEARANCE                                          */}
          {/* ============================================================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-brand-400" />
                    Appearance & Theme
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose your preferred display theme. Theme changes apply instantly across all platform screens.
                  </p>
                </div>

                {/* 3 Theme Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'light',
                      label: 'Light Mode',
                      icon: Sun,
                      desc: 'Clean, high-contrast light workspace for bright study environments.',
                      bgPreview: 'bg-white text-slate-900 border-slate-200',
                    },
                    {
                      id: 'dark',
                      label: 'Dark Mode (Default)',
                      icon: Moon,
                      desc: 'Cybernetic obsidian palette with emerald accents, tuned for late-night builds.',
                      bgPreview: 'bg-slate-950 text-slate-100 border-slate-800',
                    },
                    {
                      id: 'system',
                      label: 'System Default',
                      icon: Monitor,
                      desc: 'Automatically synchronizes with your device OS dark/light schedule.',
                      bgPreview: 'bg-gradient-to-r from-slate-900 to-slate-950 text-slate-200 border-slate-800',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectTheme(item.id as ThemeMode)}
                        className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/50 shadow-glow ring-2 ring-brand-500/20'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`p-2.5 rounded-2xl ${isSelected ? 'bg-brand-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                              <Icon className="w-5 h-5" />
                            </span>
                            {isSelected && <Check className="w-5 h-5 text-brand-400" />}
                          </div>
                          <div className="text-sm font-bold text-slate-100">{item.label}</div>
                          <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                        </div>

                        {/* Mini Preview Box */}
                        <div className={`mt-4 p-3 rounded-2xl border text-[10px] space-y-1.5 ${item.bgPreview}`}>
                          <div className="font-bold flex items-center justify-between">
                            <span>Workspace Preview</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                          <div className="opacity-70 text-[9px]">AeroRoute AI • 88% Match</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Theme Summary Badge */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-300">
                    Active Rendering Engine: <span className="font-bold text-brand-400 uppercase">{resolvedTheme}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Stored in localStorage & syncs with profile
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 5: SECURITY                                            */}
          {/* ============================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Active Sessions */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-brand-400" />
                      Active Devices & Sessions
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage all devices currently authenticated to your student account.
                    </p>
                  </div>

                  <button
                    onClick={handleLogoutAllDevices}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out All Devices
                  </button>
                </div>

                <div className="space-y-3">
                  {sessions.length > 0 ? (
                    sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="p-2.5 rounded-2xl bg-slate-800/80 text-brand-400">
                            <Laptop className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                              {sess.deviceType || 'Web Browser'}
                              {sess.isCurrent && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {sess.browser || 'Chrome'} • {sess.os || 'macOS'} • {sess.location || 'Campus Network'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400">
                          <div>IP: <span className="font-mono text-slate-300">{sess.ipAddress || '127.0.0.1'}</span></div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sess.isCurrent ? 'Active Now' : new Date(sess.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      1 active session (Current Browser)
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/10 border border-rose-500/20 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Danger Zone: Permanent Account Deletion
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Once deleted, all your project memberships, applications, verified skill credentials, and message history are permanently removed. This action cannot be undone.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </button>
                </div>
              </div>

              {/* Delete Modal Confirmation */}
              {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                      <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-lg font-bold text-slate-100">Delete Account Permanently?</h3>
                      <p className="text-xs text-slate-400 mt-2">
                        Please type <span className="font-mono text-rose-400 font-bold">DELETE</span> below to confirm permanent deletion of your profile and data.
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full bg-slate-950 border border-rose-500/30 rounded-2xl px-4 py-2.5 text-xs text-slate-100 text-center font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteConfirmText('');
                        }}
                        className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all"
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 6: SUPPORT & REPORTING                                  */}
          {/* ============================================================== */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Help Center FAQ */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <LifeBuoy className="w-5 h-5 text-brand-400" />
                    Help Center & FAQs
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Find immediate answers on cross-college matching, progressive disclosure, and workspace tools.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                  <input
                    type="text"
                    placeholder="Search Help Center articles..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  {faqs
                    .filter((f) =>
                      faqSearch
                        ? f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                          f.answer.toLowerCase().includes(faqSearch.toLowerCase())
                        : true
                    )
                    .map((faq) => {
                      const isExpanded = expandedFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <HelpCircle className="w-4 h-4 text-brand-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-200">{faq.question}</span>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                              {faq.category}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Submit Report / Contact Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-brand-400" />
                    Report an Issue or Contact Support
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Report bugs, policy violations, plagiarism, abusive users, or get direct support.
                  </p>
                </div>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Inquiry / Report Category</label>
                      <select
                        value={supportForm.category}
                        onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value as any })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      >
                        <option value="GENERAL_SUPPORT">General Support / Question</option>
                        <option value="PROBLEM">Report a Problem / Technical Bug</option>
                        <option value="USER_REPORT">Report a User (Impersonation, Harassment)</option>
                        <option value="PROJECT_REPORT">Report a Project (Fake IP, Policy Violation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Email</label>
                      <input
                        type="email"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                        required
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  {supportForm.category !== 'GENERAL_SUPPORT' && supportForm.category !== 'PROBLEM' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Target User ID or Project ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Paste user UUID or project UUID if applicable"
                        value={supportForm.targetId}
                        onChange={(e) => setSupportForm({ ...supportForm, targetId: e.target.value })}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject Summary</label>
                    <input
                      type="text"
                      placeholder="Brief summary of the issue or inquiry"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Detailed Description</label>
                    <textarea
                      rows={4}
                      placeholder="Please describe what happened in detail so our safety & support engineers can assist..."
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isLoading || !supportForm.subject || !supportForm.description}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 shadow-glow transition-all"
                    >
                      <Send className="w-4 h-4" />
                      {isLoading ? 'Submitting...' : 'Submit Support Ticket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 7: ABOUT                                               */}
          {/* ============================================================== */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* App Version & Build Metadata */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Info className="w-5 h-5 text-brand-400" />
                    About ProjectX Platform
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified Inter-College Project Collaboration & Progressive IP Disclosure Platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">App Version</div>
                    <div className="text-base font-extrabold text-slate-100 font-mono mt-1">v1.4.0-prod</div>
                    <div className="text-[10px] text-brand-400 mt-0.5">Latest Release</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Environment</div>
                    <div className="text-base font-extrabold text-emerald-400 font-mono mt-1">Online & Active</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">All Systems Operational</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Open Source License</div>
                    <div className="text-base font-extrabold text-indigo-400 font-mono mt-1">MIT Campus</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Campus Consortium</div>
                  </div>
                </div>
              </div>

              {/* Terms of Service & Privacy Policy Documents */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Legal, Terms & Privacy Commitments
                </h3>

                <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-400" />
                      1. Terms of Service
                    </div>
                    <p className="text-[11px]">
                      By utilizing ProjectX, all participants agree to respect academic integrity, protect shared intellectual property under Progressive Disclosure tiers, and refrain from scraping or unauthorized distribution of proprietary research repositories.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-400" />
                      2. Student Privacy Policy & FERPA Compliance
                    </div>
                    <p className="text-[11px]">
                      ProjectX does not sell student data, personal phone numbers, or private transcripts. Technical communications and workspace code files are end-to-end encrypted with multi-tier authorization boundaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
