import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  ShieldCheck,
  Star,
  Trash2,
  Github,
  Globe,
  Plus,
  Compass,
  Check,
  X,
  Briefcase,
  GraduationCap,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/common/Modal';
import { getSocket } from '../../services/socket';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'lead' | 'joined' | 'sent'>(
    tabParam === 'joined' ? 'joined' : tabParam === 'sent' ? 'sent' : 'lead'
  );

  const [myCreatedProjects, setMyCreatedProjects] = useState<any[]>([]);
  const [myJoinedProjects, setMyJoinedProjects] = useState<any[]>([]);
  const [sentApplications, setSentApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAppForModal, setSelectedAppForModal] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [createdRes, joinedRes, sentRes] = await Promise.allSettled([
        api.get('/projects/user/created'),
        api.get('/projects/user/joined'),
        api.get('/applications/sent'),
      ]);

      if (createdRes.status === 'fulfilled' && createdRes.value.data.success) {
        setMyCreatedProjects(createdRes.value.data.data || []);
      }
      if (joinedRes.status === 'fulfilled' && joinedRes.value.data.success) {
        setMyJoinedProjects(joinedRes.value.data.data || []);
      }
      if (sentRes.status === 'fulfilled' && sentRes.value.data.success) {
        setSentApplications(sentRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching application management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    const handleUpdate = () => {
      fetchData();
    };
    socket.on('application_status_updated', handleUpdate);
    socket.on('notification_received', handleUpdate);
    socket.on('team_updated', handleUpdate);
    return () => {
      socket.off('application_status_updated', handleUpdate);
      socket.off('notification_received', handleUpdate);
      socket.off('team_updated', handleUpdate);
    };
  }, [user]);

  const handleTabChange = (tab: 'lead' | 'joined' | 'sent') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleReviewApplication = async (appId: string, status: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED') => {
    setActionLoadingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/review`, { status });
      if (res.data.success) {
        if (selectedAppForModal && selectedAppForModal.id === appId) {
          setSelectedAppForModal((prev: any) => (prev ? { ...prev, status } : null));
        }
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reviewing application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    setActionLoadingId(appId);
    try {
      const res = await api.delete(`/applications/${appId}`);
      if (res.data.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error withdrawing application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculate total pending applicants across led projects
  const totalPendingApplicants = myCreatedProjects.reduce((acc, p) => {
    return acc + (p.applications?.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW')?.length || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>My Projects & Applications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your project leadership, review applicants grouped by role, and track your applications.
          </p>
        </div>

        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Project</span>
        </Link>
      </div>

      {/* 2. Top Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab 1: Projects I Lead */}
        <button
          type="button"
          onClick={() => handleTabChange('lead')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'lead'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Projects I Lead ({myCreatedProjects.length})</span>
          {totalPendingApplicants > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {totalPendingApplicants} new
            </span>
          )}
        </button>

        {/* Tab 2: Projects I Joined */}
        <button
          type="button"
          onClick={() => handleTabChange('joined')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'joined'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Projects I Joined ({myJoinedProjects.length})</span>
        </button>

        {/* Tab 3: Applications I Sent */}
        <button
          type="button"
          onClick={() => handleTabChange('sent')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'sent'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Applications I Sent ({sentApplications.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PROJECTS I LEAD (Role-Wise Applicants Grouping)        */}
      {/* ============================================================== */}
      {activeTab === 'lead' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-48" />
              ))}
            </div>
          ) : myCreatedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                You haven't created any projects yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create a project in 1 minute, define open roles, and review candidate applications from fellow students.
              </p>
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Project</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {myCreatedProjects.map((project) => {
                const currentMembers = project.members?.length || 1;
                const maxMembers = project.teamSize || project.maxMembers || 4;
                const applications = project.applications || [];
                const pendingApps = applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW');
                const requiredRoles = project.requiredRoles || [];

                return (
                  <div
                    key={project.id}
                    className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-6 transition-colors"
                  >
                    {/* Project Header Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">
                            👑 Project Lead
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {project.status || 'Recruiting'}
                          </span>
                          {pendingApps.length > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                              🔴 {pendingApps.length} New Application{pendingApps.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {project.title}
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Team: <strong className="text-slate-800 dark:text-slate-200">{currentMembers} / {maxMembers} members</strong></span>
                          <span>•</span>
                          <span>Duration: {project.duration || '8 weeks'}</span>
                        </div>
                      </div>

                      {/* Leadership Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition-colors"
                        >
                          View Public Page
                        </Link>
                        <Link
                          to={`/workspace/${project.id}`}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
                        >
                          Manage Workspace
                        </Link>
                      </div>
                    </div>

                    {/* Applications Grouped by Role */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span>Role-Wise Applicants ({applications.length} total)</span>
                        </h3>
                        {pendingApps.length > 0 && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
                            {pendingApps.length} pending review
                          </span>
                        )}
                      </div>

                      {requiredRoles.length === 0 ? (
                        /* If project has no defined roles */
                        applications.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 text-center">
                            No students have applied to this project yet. Open positions remain discoverable in Explore Projects.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {applications.map((app: any, idx: number) => (
                              <ApplicantCard
                                key={app.id}
                                index={idx + 1}
                                app={app}
                                roleTitle={app.roleTitle || 'Team Member'}
                                actionLoadingId={actionLoadingId}
                                onReview={handleReviewApplication}
                                onViewDetails={(selected) => setSelectedAppForModal(selected)}
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        /* Group applications by requiredRoles */
                        <div className="space-y-6">
                          {requiredRoles.map((role: any) => {
                            const roleApps = applications.filter((a: any) => a.projectRoleId === role.id);
                            const reqCount = role.requiredMembers || 1;
                            const appCount = roleApps.length;

                            return (
                              <div
                                key={role.id}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-4"
                              >
                                {/* Role Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {role.title}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                                      {appCount}/{reqCount} applications
                                    </span>
                                  </div>
                                  {role.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                      {role.description}
                                    </p>
                                  )}
                                </div>

                                {/* Role Applicants Cards or Empty State */}
                                {roleApps.length === 0 ? (
                                  <div className="py-6 px-4 rounded-xl bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      No applications received yet.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-4">
                                    {roleApps.map((app: any, idx: number) => (
                                      <ApplicantCard
                                        key={app.id}
                                        index={idx + 1}
                                        app={app}
                                        roleTitle={role.title}
                                        actionLoadingId={actionLoadingId}
                                        onReview={handleReviewApplication}
                                        onViewDetails={(selected) => setSelectedAppForModal(selected)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Check for any general/unassigned role applications */}
                          {applications.filter((a: any) => !requiredRoles.some((r: any) => r.id === a.projectRoleId)).length > 0 && (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-4">
                              <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  Other / General Applications
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                                  {applications.filter((a: any) => !requiredRoles.some((r: any) => r.id === a.projectRoleId)).length} applications
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                {applications
                                  .filter((a: any) => !requiredRoles.some((r: any) => r.id === a.projectRoleId))
                                  .map((app: any, idx: number) => (
                                    <ApplicantCard
                                      key={app.id}
                                      index={idx + 1}
                                      app={app}
                                      roleTitle={app.roleTitle || 'General Member'}
                                      actionLoadingId={actionLoadingId}
                                      onReview={handleReviewApplication}
                                      onViewDetails={(selected) => setSelectedAppForModal(selected)}
                                    />
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLICANT DETAIL MODAL (Clean Student Profile Viewer)          */}
      {/* ============================================================== */}
      {selectedAppForModal && (
        <Modal
          isOpen={!!selectedAppForModal}
          onClose={() => setSelectedAppForModal(null)}
          title={`Application: ${selectedAppForModal.applicant?.name || 'Applicant'}`}
          subtitle={`Applied for ${selectedAppForModal.roleTitle || selectedAppForModal.projectRole?.title || 'Team Member'} • ${new Date(selectedAppForModal.createdAt).toLocaleDateString()}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* 1. Applicant Header Profile */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3.5">
                <img
                  src={
                    selectedAppForModal.applicant?.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAppForModal.applicant?.name || 'Applicant'}`
                  }
                  alt={selectedAppForModal.applicant?.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
                />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedAppForModal.applicant?.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedAppForModal.applicant?.collegeName || selectedAppForModal.applicant?.college || 'Partner College'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedAppForModal.applicant?.course || selectedAppForModal.applicant?.major || 'Undergraduate'} {selectedAppForModal.applicant?.graduationYear ? `• Class of ${selectedAppForModal.applicant.graduationYear}` : ''}
                  </p>
                  {selectedAppForModal.applicant?.email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Email: <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedAppForModal.applicant.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto shrink-0 ${
                  selectedAppForModal.status === 'ACCEPTED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    : selectedAppForModal.status === 'SHORTLISTED'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                    : selectedAppForModal.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                    : selectedAppForModal.status === 'UNDER_REVIEW'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                }`}
              >
                {selectedAppForModal.status === 'ACCEPTED'
                  ? 'Accepted'
                  : selectedAppForModal.status === 'SHORTLISTED'
                  ? 'Shortlisted'
                  : selectedAppForModal.status === 'REJECTED'
                  ? 'Rejected'
                  : selectedAppForModal.status === 'UNDER_REVIEW'
                  ? 'Under Review'
                  : 'Pending'}
              </span>
            </div>

            {/* 2. Bio & Availability */}
            {(selectedAppForModal.applicant?.bio || selectedAppForModal.applicant?.weeklyAvailability || selectedAppForModal.availability) && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  About & Availability
                </h5>
                {selectedAppForModal.applicant?.bio && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedAppForModal.applicant.bio}
                  </p>
                )}
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Weekly Availability:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {selectedAppForModal.applicant?.weeklyAvailability || selectedAppForModal.availability || '10-20 hours/week'}
                  </strong>
                </div>
              </div>
            )}

            {/* 3. Skills */}
            {selectedAppForModal.applicant?.skills && selectedAppForModal.applicant.skills.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skills & Proficiencies
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedAppForModal.applicant.skills.map((s: any, idx: number) => {
                    const skillName = typeof s === 'string' ? s : s.skillName || s.name;
                    const prof = typeof s === 'object' && s.proficiency ? s.proficiency : null;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        <span>{skillName}</span>
                        {prof && <span className="text-[10px] text-slate-500 font-bold">({prof}/5)</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Portfolio & Links */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Portfolio & Profiles
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedAppForModal.applicant?.githubUrl && (
                  <a
                    href={selectedAppForModal.applicant.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {selectedAppForModal.applicant?.portfolioUrl && (
                  <a
                    href={selectedAppForModal.applicant.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
                {selectedAppForModal.relevantLinks && selectedAppForModal.relevantLinks.length > 0 && (
                  selectedAppForModal.relevantLinks.map((link: string, lIdx: number) => (
                    <a
                      key={lIdx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors truncate max-w-xs"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ))
                )}
                {!selectedAppForModal.applicant?.githubUrl &&
                  !selectedAppForModal.applicant?.portfolioUrl &&
                  (!selectedAppForModal.relevantLinks || selectedAppForModal.relevantLinks.length === 0) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No external links provided.</p>
                  )}
              </div>
            </div>

            {/* 5. Why they want to join (Pitch) */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Why They Want To Join (Pitch)
              </h5>
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{selectedAppForModal.pitch || 'No pitch provided.'}"
              </div>
            </div>

            {/* 6. Experience */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Experience & Background
              </h5>
              {selectedAppForModal.applicant?.experiences && selectedAppForModal.applicant.experiences.length > 0 ? (
                <div className="space-y-2">
                  {selectedAppForModal.applicant.experiences.map((exp: any, expIdx: number) => (
                    <div
                      key={expIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{exp.title}</span>
                        <span className="text-slate-500 text-[11px]">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 font-medium">{exp.company || exp.organization}</div>
                      {exp.description && (
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No prior experience listed.</p>
              )}
            </div>

            {/* 7. Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Link
                to={`/profile/${selectedAppForModal.applicant?.id}`}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                View Full Profile →
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReviewApplication(selectedAppForModal.id, 'SHORTLISTED')}
                  disabled={actionLoadingId === selectedAppForModal.id}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                >
                  Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication(selectedAppForModal.id, 'REJECTED')}
                  disabled={actionLoadingId === selectedAppForModal.id}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication(selectedAppForModal.id, 'ACCEPTED')}
                  disabled={actionLoadingId === selectedAppForModal.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PROJECTS I JOINED (Member view)                         */}
      {/* ============================================================== */}
      {activeTab === 'joined' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-40" />
              ))}
            </div>
          ) : myJoinedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                You haven't joined any project teams yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore open projects across universities, submit an application, and collaborate as an accepted builder.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 shadow-sm transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Open Projects</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myJoinedProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        {project.status || 'Active Team'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Lead: {project.creator?.name} ({project.creator?.collegeName})
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                        {project.publicTeaser || project.problemStatement}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="text-slate-500 dark:text-slate-400">
                        Your Role: <strong className="text-slate-800 dark:text-slate-200">{project.myRole || 'Team Member'}</strong>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Team Size: <strong className="text-slate-800 dark:text-slate-200">{project.memberCount} members</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/workspace/${project.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: APPLICATIONS I SENT                                     */}
      {/* ============================================================== */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-28" />
              ))}
            </div>
          ) : sentApplications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                You haven't submitted any applications yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discover projects looking for your skills and apply to join collaborative cross-college teams.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 shadow-sm transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Find a Project</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {app.project?.title || app.projectTitle || 'Project Application'}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target Role: <strong className="text-slate-700 dark:text-slate-300">{app.projectRole?.title || app.roleTitle || 'Builder'}</strong> • Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {app.status === 'ACCEPTED'
                        ? 'Accepted'
                        : app.status === 'SHORTLISTED'
                        ? 'Shortlisted'
                        : app.status === 'REJECTED'
                        ? 'Rejected'
                        : 'Pending'}
                    </span>
                  </div>

                  {app.pitch && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{app.pitch}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {app.status === 'ACCEPTED' ? (
                      <Link
                        to={`/workspace/${app.projectId}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enter Workspace</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/projects/${app.projectId}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        View Project Page →
                      </Link>
                    )}

                    {app.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleWithdrawApplication(app.id)}
                        disabled={actionLoadingId === app.id}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === app.id ? 'Withdrawing...' : 'Withdraw Application'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ApplicantCardProps {
  app: any;
  roleTitle: string;
  index?: number;
  actionLoadingId: string | null;
  onReview: (appId: string, status: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED') => void;
  onViewDetails: (app: any) => void;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({
  app,
  roleTitle,
  index,
  actionLoadingId,
  onReview,
  onViewDetails,
}) => {
  const applicant = app.applicant;
  const isPending = app.status === 'PENDING' || app.status === 'UNDER_REVIEW';
  const isReviewable = app.status !== 'ACCEPTED' && app.status !== 'REJECTED';

  // Calculate Year string
  const getYearDisplay = (gradYear?: number) => {
    if (!gradYear) return '';
    const currentYear = new Date().getFullYear();
    const diff = gradYear - currentYear;
    if (diff === 0) return '4th Year';
    if (diff === 1) return '3rd Year';
    if (diff === 2) return '2nd Year';
    if (diff >= 3) return '1st Year';
    return `Class of ${gradYear}`;
  };

  const yearDisplay = getYearDisplay(applicant?.graduationYear);

  // Experience Display
  const getExperienceDisplay = () => {
    if (app.experience) return app.experience;
    const expCount = (applicant?.experiences?.length || 0) + (applicant?.pastProjects?.length || 0);
    if (expCount > 0) return `${expCount} project${expCount > 1 ? 's' : ''}`;
    return '1 project';
  };

  const experienceText = getExperienceDisplay();

  // Availability Display
  const availabilityText =
    app.availability ||
    app.availabilityHours ? `${app.availabilityHours} hrs/week` : (applicant?.weeklyAvailability || '10-20 hrs/week');

  // Application Date
  const applicationDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Skills string
  const skillsList: string[] = (applicant?.skills || [])
    .map((s: any) => (typeof s === 'string' ? s : s.skillName || s.name))
    .filter(Boolean);

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        isPending
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-brand-700/60'
          : 'bg-white/90 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        {/* Left: Applicant Information */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <img
            src={
              applicant?.avatarUrl ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${applicant?.name || 'Applicant'}`
            }
            alt={applicant?.name}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm mt-0.5"
          />
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* 1. Applicant Name & Status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {index ? `${index}. ` : ''}{applicant?.name || 'Student Applicant'}
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  app.status === 'ACCEPTED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    : app.status === 'SHORTLISTED'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                    : app.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                    : app.status === 'UNDER_REVIEW'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                }`}
              >
                Status: {app.status === 'ACCEPTED'
                  ? 'Accepted'
                  : app.status === 'SHORTLISTED'
                  ? 'Shortlisted'
                  : app.status === 'REJECTED'
                  ? 'Rejected'
                  : app.status === 'UNDER_REVIEW'
                  ? 'Pending Review'
                  : 'Pending'}
              </span>
            </div>

            {/* 2. College Name */}
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {applicant?.collegeName || applicant?.college || 'Partner College'}
            </div>

            {/* 3. Course & Year */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span>{applicant?.course || applicant?.major || 'Undergraduate Engineering'}</span>
              {yearDisplay && (
                <>
                  <span className="mx-1.5">•</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{yearDisplay}</span>
                </>
              )}
            </div>

            {/* 4. Applied for Role */}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Applied for: <strong className="text-slate-900 dark:text-slate-100 font-bold">{roleTitle}</strong>
            </div>

            {/* 5. Skills */}
            {skillsList.length > 0 && (
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {skillsList.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Experience, Availability & Applied Date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div>
                Experience:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-medium">{experienceText}</strong>
              </div>
              <div>•</div>
              <div>
                Availability:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-medium">{availabilityText}</strong>
              </div>
              <div>•</div>
              <div>
                Applied:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-medium">{applicationDate}</strong>
              </div>
            </div>

            {/* 7. Portfolio / GitHub Links */}
            {(applicant?.githubUrl || applicant?.portfolioUrl || (app.relevantLinks && app.relevantLinks.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {applicant?.githubUrl && (
                  <a
                    href={applicant.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {applicant?.portfolioUrl && (
                  <a
                    href={applicant.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
                {app.relevantLinks && app.relevantLinks.length > 0 && (
                  app.relevantLinks.map((link: string, lIdx: number) => (
                    <a
                      key={lIdx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors truncate max-w-xs"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap pt-2 lg:pt-0">
          <button
            type="button"
            onClick={() => onViewDetails({ ...app, roleTitle })}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 transition-colors shadow-sm"
          >
            View Application
          </button>

          {isReviewable && (
            <>
              <button
                type="button"
                onClick={() => onReview(app.id, 'SHORTLISTED')}
                disabled={actionLoadingId === app.id}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
              >
                Shortlist
              </button>
              <button
                type="button"
                onClick={() => onReview(app.id, 'ACCEPTED')}
                disabled={actionLoadingId === app.id}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
              <button
                type="button"
                onClick={() => onReview(app.id, 'REJECTED')}
                disabled={actionLoadingId === app.id}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;
