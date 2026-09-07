import React, { useState, useEffect } from 'react';
import {
  Layers,
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  FileCheck,
  Flag,
  LifeBuoy,
  Code2,
  Tag,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Trash2,
  Ban,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/common/Modal';

type AdminSection =
  | 'dashboard'
  | 'users'
  | 'colleges'
  | 'projects'
  | 'applications'
  | 'reports'
  | 'tickets'
  | 'skills'
  | 'categories'
  | 'settings';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Action States
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add College Modal
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);
  const [colName, setColName] = useState('');
  const [colDomain, setColDomain] = useState('');
  const [colCity, setColCity] = useState('');
  const [colCountry, setColCountry] = useState('United States');

  // Add Skill Modal
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Backend');

  // Add Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Suspend User Modal
  const [suspendModalUser, setSuspendModalUser] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Remove Project Modal
  const [removeModalProject, setRemoveModalProjectProject] = useState<any | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSectionData = async (section: AdminSection) => {
    setIsLoading(true);
    try {
      if (section === 'dashboard') {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) setDashboardData(res.data.data);
      } else if (section === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) setUsersList(res.data.data);
      } else if (section === 'colleges') {
        const res = await api.get('/admin/colleges');
        if (res.data.success) setCollegesList(res.data.data);
      } else if (section === 'projects') {
        const res = await api.get('/admin/projects');
        if (res.data.success) setProjectsList(res.data.data);
      } else if (section === 'applications') {
        const res = await api.get('/admin/applications');
        if (res.data.success) setApplicationsList(res.data.data);
      } else if (section === 'reports') {
        const res = await api.get('/admin/reports');
        if (res.data.success) setReportsList(res.data.data);
      } else if (section === 'tickets') {
        const res = await api.get('/support/admin/tickets');
        if (res.data.success) setTicketsList(res.data.data);
      } else if (section === 'skills') {
        const res = await api.get('/admin/skills');
        if (res.data.success) setSkillsList(res.data.data);
      } else if (section === 'categories') {
        const res = await api.get('/admin/categories');
        if (res.data.success) setCategoriesList(res.data.data);
      } else if (section === 'settings') {
        const res = await api.get('/admin/settings');
        if (res.data.success) setSystemSettings(res.data.data);
      }
    } catch (err: any) {
      console.error(`Error loading ${section}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSectionData(activeSection);
  }, [activeSection]);

  // Initial load for dashboard counters
  useEffect(() => {
    fetchSectionData('dashboard');
  }, []);

  // Handlers for User Actions
  const handleSuspendUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendModalUser) return;
    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/users/${suspendModalUser.id}/suspend`, {
        reason: suspendReason.trim() || 'Suspended by platform administrator.',
      });
      if (res.data.success) {
        showToast(`User ${suspendModalUser.name} suspended.`);
        setSuspendModalUser(null);
        setSuspendReason('');
        fetchSectionData('users');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error suspending user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/users/${userId}/restore`);
      if (res.data.success) {
        showToast('User restored successfully.');
        fetchSectionData('users');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error restoring user.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Project Actions
  const handleRemoveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeModalProject) return;
    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/projects/${removeModalProject.id}/remove`, {
        reason: removeReason.trim() || 'Removed for violating community standards.',
      });
      if (res.data.success) {
        showToast(`Project "${removeModalProject.title}" removed.`);
        setRemoveModalProjectProject(null);
        setRemoveReason('');
        fetchSectionData('projects');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error removing project.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreProject = async (projId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/projects/${projId}/restore`);
      if (res.data.success) {
        showToast('Project restored successfully.');
        fetchSectionData('projects');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error restoring project.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for College
  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim() || !colDomain.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/admin/colleges', {
        name: colName.trim(),
        domain: colDomain.trim(),
        city: colCity.trim() || 'Campus',
        country: colCountry.trim() || 'Global',
      });
      if (res.data.success) {
        showToast(`University ${colName} registered.`);
        setIsCollegeModalOpen(false);
        setColName('');
        setColDomain('');
        setColCity('');
        fetchSectionData('colleges');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating college.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Skills & Categories
  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/admin/skills', {
        name: skillName.trim(),
        category: skillCategory,
      });
      if (res.data.success) {
        showToast(`Skill "${skillName}" created.`);
        setIsSkillModalOpen(false);
        setSkillName('');
        fetchSectionData('skills');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating skill.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      const res = await api.delete(`/admin/skills/${id}`);
      if (res.data.success) {
        showToast('Skill deleted.');
        fetchSectionData('skills');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting skill.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/admin/categories', {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });
      if (res.data.success) {
        showToast(`Category "${catName}" created.`);
        setIsCategoryModalOpen(false);
        setCatName('');
        setCatDesc('');
        fetchSectionData('categories');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating category.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for Support Tickets
  const handleUpdateTicket = async (ticketId: string, status: string, responseMessage?: string) => {
    setIsProcessing(true);
    try {
      const res = await api.patch(`/support/admin/tickets/${ticketId}`, {
        status,
        adminResponse: responseMessage || undefined,
      });
      if (res.data.success) {
        showToast(`Ticket status updated to ${status}.`);
        setSelectedTicket(res.data.data);
        setAdminResponseText('');
        fetchSectionData('tickets');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handlers for System Settings
  const handleUpdateSetting = async (key: string, value: string, description?: string) => {
    try {
      const res = await api.put('/admin/settings', { key, value, description });
      if (res.data.success) {
        showToast(`Setting ${key} updated.`);
        fetchSectionData('settings');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating setting.');
    }
  };

  // Nav Items Configuration
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users, badge: dashboardData?.metrics?.totalUsers },
    { key: 'colleges', label: 'Colleges', icon: Building2, badge: dashboardData?.metrics?.totalColleges },
    { key: 'projects', label: 'Projects', icon: FolderKanban, badge: dashboardData?.metrics?.activeProjects },
    { key: 'applications', label: 'Applications', icon: FileCheck, badge: dashboardData?.metrics?.totalApplications },
    { key: 'reports', label: 'Reports', icon: Flag, badge: dashboardData?.metrics?.openReports, badgeColor: 'bg-rose-500' },
    { key: 'tickets', label: 'Support Tickets', icon: LifeBuoy, badge: dashboardData?.metrics?.openTickets, badgeColor: 'bg-amber-500' },
    { key: 'skills', label: 'Skills', icon: Code2 },
    { key: 'categories', label: 'Categories', icon: Tag },
    { key: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <Layers className="w-3.5 h-3.5" />
            Platform Control & Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            ProjectX Web Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time inter-college network management, role-based governance, safety review, and platform telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-brand-400" />
          <span>Role: <strong className="text-slate-200">ADMIN</strong> (Backend Enforced)</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1 bg-slate-900/60 p-3 rounded-3xl border border-slate-800 sticky top-6">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Console
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key as AdminSection);
                  setSearchTerm('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-slate-950 shadow-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-slate-950 text-brand-400'
                        : item.badgeColor ? `${item.badgeColor} text-white` : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6 min-h-[500px]">
          {isLoading && activeSection !== 'dashboard' ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* ================================================================= */}
              {/* 1. DASHBOARD                                                     */}
              {/* ================================================================= */}
              {activeSection === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in">
                  {/* Top 7 Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Total Users</span>
                        <Users className="w-4 h-4 text-brand-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-slate-100">{dashboardData?.metrics?.totalUsers || 0}</p>
                      <p className="text-[11px] text-brand-400">{dashboardData?.metrics?.suspendedUsers || 0} suspended</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Active Projects</span>
                        <FolderKanban className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-emerald-400">{dashboardData?.metrics?.activeProjects || 0}</p>
                      <p className="text-[11px] text-slate-400">Total: {dashboardData?.metrics?.totalProjects || 0}</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Colleges</span>
                        <Building2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-slate-100">{dashboardData?.metrics?.totalColleges || 0}</p>
                      <p className="text-[11px] text-slate-400">Verified partner campuses</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Applications</span>
                        <FileCheck className="w-4 h-4 text-brand-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-slate-100">{dashboardData?.metrics?.totalApplications || 0}</p>
                      <p className="text-[11px] text-slate-400">{dashboardData?.metrics?.pendingApplications || 0} pending review</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Active Teams</span>
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-indigo-400">{dashboardData?.metrics?.activeTeams || 0}</p>
                      <p className="text-[11px] text-slate-400">{dashboardData?.metrics?.crossCollegeFormationRate || 0}% cross-college</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                      <div className="flex items-center justify-between text-rose-400 text-xs">
                        <span>Open Reports</span>
                        <Flag className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-rose-400">{dashboardData?.metrics?.openReports || 0}</p>
                      <p className="text-[11px] text-rose-400/80">Pending moderation review</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-1 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-amber-400 text-xs">
                        <span>Open Support Tickets</span>
                        <LifeBuoy className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-mono font-bold text-amber-400">{dashboardData?.metrics?.openTickets || 0}</p>
                      <p className="text-[11px] text-amber-400/80">Active tickets requiring staff</p>
                    </div>
                  </div>

                  {/* Activity Summary Stream */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-400" /> Recent Student Signups
                        </h3>
                        <button onClick={() => setActiveSection('users')} className="text-xs text-brand-400 hover:underline">View All</button>
                      </div>
                      <div className="space-y-3">
                        {dashboardData?.recentUsers?.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                            <div>
                              <div className="font-bold text-slate-200">{u.name}</div>
                              <div className="text-[10px] text-slate-400">{u.college?.name} • {u.email}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isSuspended ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {u.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-emerald-400" /> Recent Projects
                        </h3>
                        <button onClick={() => setActiveSection('projects')} className="text-xs text-brand-400 hover:underline">View All</button>
                      </div>
                      <div className="space-y-3">
                        {dashboardData?.recentProjects?.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                            <div>
                              <div className="font-bold text-slate-200">{p.title}</div>
                              <div className="text-[10px] text-slate-400">{p.creator?.name} ({p.creator?.college?.name})</div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{p.members?.length || 0} members</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 2. USERS MANAGEMENT                                              */}
              {/* ================================================================= */}
              {activeSection === 'users' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
                    <div className="relative min-w-[260px] flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search student name, email, major..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">University</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {usersList
                            .filter((u) => !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-slate-100">{u.name}</div>
                                  <div className="text-[11px] text-slate-400">{u.email}</div>
                                </td>
                                <td className="p-4">
                                  <div className="text-slate-200">{u.college}</div>
                                  <div className="text-[10px] font-mono text-brand-400">@{u.collegeDomain}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {u.isSuspended ? (
                                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                                      <XCircle className="w-3.5 h-3.5" /> Suspended
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  {u.isSuspended ? (
                                    <button
                                      onClick={() => handleRestoreUser(u.id)}
                                      disabled={isProcessing}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSuspendModalUser(u)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30"
                                    >
                                      <Ban className="w-3.5 h-3.5" /> Suspend
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 3. COLLEGES MANAGEMENT                                           */}
              {/* ================================================================= */}
              {activeSection === 'colleges' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Partner Academic Institutions</h3>
                      <p className="text-xs text-slate-400">Total verified university domains connected to ProjectX</p>
                    </div>
                    <button
                      onClick={() => setIsCollegeModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-500 text-slate-950 font-bold text-xs shadow-glow hover:bg-brand-600"
                    >
                      <Plus className="w-4 h-4" /> Add Partner College
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collegesList.map((col) => (
                      <div key={col.id} className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={col.logoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80'}
                            alt={col.name}
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-800"
                          />
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-slate-100 truncate">{col.name}</h4>
                            <p className="font-mono text-[11px] text-brand-400 truncate">@{col.domain}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{col.city}, {col.country}</span>
                          <span className="font-mono font-bold text-slate-300">{col.studentsCount} Students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 4. PROJECTS MODERATION                                           */}
              {/* ================================================================= */}
              {activeSection === 'projects' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-4">Project</th>
                            <th className="p-4">Creator</th>
                            <th className="p-4">Domain</th>
                            <th className="p-4">Health</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Moderation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {projectsList.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-100">{p.title}</div>
                                <div className="text-[11px] text-slate-400 line-clamp-1">{p.pitch}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-slate-200">{p.creator?.name}</div>
                                <div className="text-[10px] text-slate-400">{p.creator?.college}</div>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-brand-400">{p.domain}</td>
                              <td className="p-4">
                                <span className="font-mono font-bold text-emerald-400">{p.healthScore}%</span>
                              </td>
                              <td className="p-4">
                                {p.isRemoved ? (
                                  <span className="text-rose-400 font-bold text-[11px]">Flagged / Removed</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold text-[11px]">Live Listing</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {p.isRemoved ? (
                                  <button
                                    onClick={() => handleRestoreProject(p.id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold"
                                  >
                                    Restore
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setRemoveModalProjectProject(p)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold"
                                  >
                                    Remove Project
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 5. APPLICATIONS TELEMETRY                                        */}
              {/* ================================================================= */}
              {activeSection === 'applications' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-4">Applicant</th>
                            <th className="p-4">Target Project</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Match</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {applicationsList.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-100">{a.applicantName}</div>
                                <div className="text-[10px] text-slate-400">{a.applicantCollege}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-200">{a.projectTitle}</div>
                                <div className="text-[10px] text-slate-400">by {a.projectCreator} ({a.projectCollege})</div>
                              </td>
                              <td className="p-4 text-brand-400 font-semibold">{a.roleTitle}</td>
                              <td className="p-4 font-mono font-bold text-emerald-400">{a.matchScore}%</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 6. REPORTS MODERATION                                            */}
              {/* ================================================================= */}
              {activeSection === 'reports' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-3">
                    {reportsList.map((rep) => (
                      <div key={rep.id} className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {rep.status} Report
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-100">{rep.reason}</div>
                        {rep.details && <p className="text-xs text-slate-400 leading-relaxed">{rep.details}</p>}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <div>Reporter: <strong className="text-slate-200">{rep.reporter?.name}</strong></div>
                          <div>Target: <strong className="text-slate-200">{rep.reportedUser?.name || rep.project?.title || 'Platform Entity'}</strong></div>
                        </div>
                      </div>
                    ))}
                    {reportsList.length === 0 && (
                      <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                        No pending moderation reports.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 7. SUPPORT TICKETS                                               */}
              {/* ================================================================= */}
              {activeSection === 'tickets' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in">
                  <div className="lg:col-span-6 space-y-3">
                    {ticketsList.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedTicket?.id === t.id
                            ? 'bg-brand-500/10 border-brand-500/50 shadow-glow'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-slate-800 text-slate-300">
                            {t.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-100 mt-2">{t.subject}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{t.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-6 sticky top-6">
                    {selectedTicket ? (
                      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                        <div className="border-b border-slate-800 pb-3">
                          <span className="text-[10px] font-mono text-brand-400">TICKET #{selectedTicket.id.slice(0, 8)}</span>
                          <h3 className="text-base font-bold text-slate-100">{selectedTicket.subject}</h3>
                        </div>
                        <p className="text-xs text-slate-200 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 whitespace-pre-wrap">
                          {selectedTicket.description}
                        </p>
                        <textarea
                          rows={3}
                          placeholder="Type official response to student..."
                          value={adminResponseText}
                          onChange={(e) => setAdminResponseText(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleUpdateTicket(selectedTicket.id, 'RESOLVED', adminResponseText)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleUpdateTicket(selectedTicket.id, 'CLOSED', adminResponseText)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                          >
                            Close Ticket
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                        Select a ticket to review and respond.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 8. SKILLS & CATEGORIES                                           */}
              {/* ================================================================= */}
              {activeSection === 'skills' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Technical Skill Taxonomy</h3>
                      <p className="text-xs text-slate-400">Available skills for student portfolios and project requirements</p>
                    </div>
                    <button
                      onClick={() => setIsSkillModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-500 text-slate-950 font-bold text-xs shadow-glow hover:bg-brand-600"
                    >
                      <Plus className="w-4 h-4" /> Add Skill
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {skillsList.map((sk) => (
                      <div key={sk.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-100">{sk.name}</div>
                          <div className="text-[10px] text-slate-400">{sk.category} • {sk.studentCount} builders</div>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill(sk.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'categories' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Skill & Project Categories</h3>
                      <p className="text-xs text-slate-400">Taxonomy groupings for cross-domain matching</p>
                    </div>
                    <button
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-500 text-slate-950 font-bold text-xs shadow-glow hover:bg-brand-600"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoriesList.map((cat) => (
                      <div key={cat.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-xs text-slate-100">{cat.name}</div>
                        <p className="text-[11px] text-slate-400">{cat.description || 'General engineering category'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* 9. SYSTEM SETTINGS                                               */}
              {/* ================================================================= */}
              {activeSection === 'settings' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Global Platform System Configurations</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Configure runtime parameters, AI service integration, support routing, and IP security defaults.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {systemSettings.map((set) => (
                        <div key={set.key} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-0.5 max-w-lg">
                            <span className="text-[10px] font-mono font-bold text-brand-400 uppercase">{set.category}</span>
                            <div className="font-mono text-xs font-bold text-slate-200">{set.key}</div>
                            <div className="text-[11px] text-slate-400">{set.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={set.value}
                              onBlur={(e) => {
                                if (e.target.value !== set.value) {
                                  handleUpdateSetting(set.key, e.target.value, set.description);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500 w-44"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SUSPEND USER MODAL */}
      <Modal
        isOpen={!!suspendModalUser}
        onClose={() => setSuspendModalUser(null)}
        title="Suspend User Account"
        subtitle={`Suspend platform access for ${suspendModalUser?.name} (${suspendModalUser?.email})`}
      >
        <form onSubmit={handleSuspendUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Reason for Suspension
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Violation of academic integrity standards, unauthorized scraping..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSuspendModalUser(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white transition-all"
            >
              Confirm Suspension
            </button>
          </div>
        </form>
      </Modal>

      {/* REMOVE PROJECT MODAL */}
      <Modal
        isOpen={!!removeModalProject}
        onClose={() => setRemoveModalProjectProject(null)}
        title="Remove Inappropriate Project"
        subtitle={`Remove listing for "${removeModalProject?.title}"`}
      >
        <form onSubmit={handleRemoveProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Removal Reason
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Plagiarism of patented research, unauthorized commercial advertising..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRemoveModalProjectProject(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white transition-all"
            >
              Remove Project
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD COLLEGE MODAL */}
      <Modal
        isOpen={isCollegeModalOpen}
        onClose={() => setIsCollegeModalOpen(false)}
        title="Register Partner University"
        subtitle="Connect a new academic institution to the ProjectX network"
      >
        <form onSubmit={handleCreateCollege} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              University Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oxford University, Harvard University..."
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Institutional Email Domain
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ox.ac.uk, harvard.edu..."
              value={colDomain}
              onChange={(e) => setColDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCollegeModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !colName.trim() || !colDomain.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
            >
              Register University
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD SKILL MODAL */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Technical Skill"
        subtitle="Add a new skill to the platform taxonomy"
      >
        <form onSubmit={handleCreateSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Skill Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rust, PyTorch Geometric, Solana..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Category
            </label>
            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Mobile">Mobile</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="Hardware & IoT">Hardware & IoT</option>
              <option value="UI/UX & Design">UI/UX & Design</option>
            </select>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSkillModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !skillName.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
            >
              Add Skill
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD CATEGORY MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Category"
        subtitle="Add a new category taxonomy grouping"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Systems, Quantum Computing..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of domains covered..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !catName.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
