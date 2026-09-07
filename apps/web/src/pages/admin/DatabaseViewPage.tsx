import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Users,
  FolderKanban,
  FileCheck2,
  Users2,
  CheckSquare,
  Bell,
  Search,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Star,
  XCircle,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const DatabaseViewPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<
    'all' | 'users' | 'projects' | 'applications' | 'members' | 'tasks' | 'notifications'
  >('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchDatabaseView = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/database-view');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch database records.');
      }
    } catch (err: any) {
      console.error('Error fetching database view:', err);
      setError(
        err.response?.data?.message ||
          'Access restricted: Authorization required for Database View.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseView();
  }, []);

  const q = searchQuery.toLowerCase().trim();

  // Filter Users
  const filteredUsers = (data?.users || []).filter((u: any) => {
    if (!q) return true;
    return (
      String(u.name ?? '').toLowerCase().includes(q) ||
      String(u.email ?? '').toLowerCase().includes(q) ||
      String(u.university ?? '').toLowerCase().includes(q) ||
      String(u.course ?? '').toLowerCase().includes(q)
    );
  });

  // Filter Projects
  const filteredProjects = (data?.projects || []).filter((p: any) => {
    if (!q) return true;
    return (
      String(p.title ?? '').toLowerCase().includes(q) ||
      String(p.ownerName ?? '').toLowerCase().includes(q) ||
      String(p.category ?? '').toLowerCase().includes(q) ||
      String(p.university ?? '').toLowerCase().includes(q)
    );
  });

  // Filter Applications
  const filteredApplications = (data?.applications || []).filter((a: any) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    if (!matchesStatus) return false;
    if (!q) return true;
    return (
      String(a.applicantName ?? '').toLowerCase().includes(q) ||
      String(a.projectName ?? '').toLowerCase().includes(q) ||
      String(a.appliedRole ?? '').toLowerCase().includes(q) ||
      String(a.projectOwnerName ?? '').toLowerCase().includes(q) ||
      String(a.applicantUniversity ?? '').toLowerCase().includes(q)
    );
  });

  // Filter Project Members
  const filteredMembers = (data?.projectMembers || []).filter((m: any) => {
    if (!q) return true;
    return (
      String(m.memberName ?? '').toLowerCase().includes(q) ||
      String(m.projectName ?? '').toLowerCase().includes(q) ||
      String(m.role ?? '').toLowerCase().includes(q) ||
      String(m.university ?? '').toLowerCase().includes(q)
    );
  });

  // Filter Tasks
  const filteredTasks = (data?.tasks || []).filter((t: any) => {
    if (!q) return true;
    return (
      String(t.taskName ?? '').toLowerCase().includes(q) ||
      String(t.projectName ?? '').toLowerCase().includes(q) ||
      String(t.assignedMemberName ?? '').toLowerCase().includes(q) ||
      String(t.status ?? '').toLowerCase().includes(q)
    );
  });

  // Filter Notifications
  const filteredNotifications = (data?.notifications || []).filter((n: any) => {
    if (!q) return true;
    return (
      String(n.recipientName ?? '').toLowerCase().includes(q) ||
      String(n.title ?? '').toLowerCase().includes(q) ||
      String(n.message ?? '').toLowerCase().includes(q) ||
      String(n.type ?? '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>ACCEPTED</span>
          </span>
        );
      case 'SHORTLISTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Star className="w-3 h-3" />
            <span>SHORTLISTED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>REJECTED</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Context Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
              <span>LIVE DATABASE VIEW</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              SIH Judge Evaluation Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <span>ProjectX Database Inspector</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            This view displays live records persisted by the ProjectX backend database. Data shown here is retrieved directly from the same PostgreSQL / SQLite database used in real-time by the application.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={fetchDatabaseView}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Data</span>
          </button>
          <Link
            to="/home"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to App</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Summary Metrics Row */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Users</span>
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.users}
            </div>
            <div className="text-[10px] text-slate-500">Registered Students</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Projects</span>
              <FolderKanban className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.projects}
            </div>
            <div className="text-[10px] text-slate-500">Active Repositories</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Applications</span>
              <FileCheck2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.applications}
            </div>
            <div className="text-[10px] text-slate-500">Submitted & Reviewed</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Team Members</span>
              <Users2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.teamMembers}
            </div>
            <div className="text-[10px] text-slate-500">Accepted Memberships</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tasks</span>
              <CheckSquare className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.tasks}
            </div>
            <div className="text-[10px] text-slate-500">Sprint Deliverables</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Notifications</span>
              <Bell className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {data.summary.notifications}
            </div>
            <div className="text-[10px] text-slate-500">System Logs Dispatched</div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across names, projects, roles, universities..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Application Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="SHORTLISTED">SHORTLISTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { key: 'all', label: 'All Tables', count: null },
            { key: 'users', label: 'Users', count: data?.users?.length },
            { key: 'projects', label: 'Projects', count: data?.projects?.length },
            { key: 'applications', label: 'Applications', count: data?.applications?.length },
            { key: 'members', label: 'Project Members', count: data?.projectMembers?.length },
            { key: 'tasks', label: 'Tasks', count: data?.tasks?.length },
            { key: 'notifications', label: 'Notifications', count: data?.notifications?.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedTab === tab.key
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-200/80 dark:bg-slate-800/80 font-extrabold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Querying live database tables...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ============================================================== */}
          {/* 1. APPLICATIONS TABLE                                          */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'applications') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-amber-500" />
                    <span>APPLICATIONS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Candidate applications linking applicant users to specific project roles.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredApplications.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Applicant Name</th>
                      <th className="py-3 px-4">Applicant University</th>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Project Owner</th>
                      <th className="py-3 px-4">Applied Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Application Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No application records found.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {a.applicantName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-brand-600" />
                              <span>{a.applicantUniversity}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                            📁 {a.projectName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {a.projectOwnerName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {a.appliedRole}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(a.status)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. PROJECT MEMBERS TABLE                                       */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'members') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-indigo-500" />
                    <span>PROJECT MEMBERS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Active team roster memberships formed upon application acceptance.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredMembers.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">University</th>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Membership Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No team membership records found.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {m.memberName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-brand-600" />
                              <span>{m.university}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                            📁 {m.projectName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {m.role}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {new Date(m.joinedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. USERS TABLE                                                 */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'users') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <span>USERS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified student accounts and platform administrators in the database.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredUsers.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">University</th>
                      <th className="py-3 px-4">Course & Major</th>
                      <th className="py-3 px-4">Graduation</th>
                      <th className="py-3 px-4">Platform Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.role === 'ADMIN' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-600" />
                            <span>{u.university}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.course}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {u.graduationYear}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. PROJECTS TABLE                                              */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'projects') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>PROJECTS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cross-college student project repositories and recruitment listings.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredProjects.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">University</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredProjects.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          📁 {p.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {p.ownerName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-600" />
                            <span>{p.university}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-semibold">
                          {p.category}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. TASKS TABLE                                                 */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'tasks') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cyan-500" />
                    <span>TASKS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Weighted sprint tasks and progress tracking across project workspaces.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredTasks.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Task Name</th>
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Assigned Member</th>
                      <th className="py-3 px-4">Weight</th>
                      <th className="py-3 px-4">Progress</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No sprint tasks recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {t.taskName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-brand-600 dark:text-brand-400">
                            📁 {t.projectName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {t.assignedMemberName}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400">
                            {t.weight}%
                          </td>
                          <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                            {t.progress}%
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.status === 'DONE'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW'
                                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. NOTIFICATIONS TABLE                                         */}
          {/* ============================================================== */}
          {(selectedTab === 'all' || selectedTab === 'notifications') && (
            <div className="rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-rose-500" />
                    <span>NOTIFICATIONS TABLE</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time in-app alerts and application event notifications logged by the system.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredNotifications.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Recipient Name</th>
                      <th className="py-3 px-4">Notification Type</th>
                      <th className="py-3 px-4">Title & Message</th>
                      <th className="py-3 px-4">Read Status</th>
                      <th className="py-3 px-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                    {filteredNotifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No notification records found.
                        </td>
                      </tr>
                    ) : (
                      filteredNotifications.map((n: any) => (
                        <tr key={n.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {n.recipientName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                            {n.type}
                          </td>
                          <td className="py-3.5 px-4 space-y-0.5 max-w-md">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{n.title}</div>
                            <div className="text-slate-500 text-[11px] leading-snug">{n.message}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                n.isRead
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-extrabold'
                              }`}
                            >
                              {n.isRead ? 'Read' : 'Unread'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseViewPage;
