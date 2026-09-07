import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Unlock,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  Link2,
  ShieldCheck,
  Clock,
  Briefcase,
  ChevronRight,
  X,
  Check,
  Star,
  Github,
  Globe,
  GraduationCap,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { DomainBadge, SkillBadge, HealthBadge, PrivacyIndicatorBadge, MatchScorePill } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { getSocket } from '../../services/socket';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any | null>(null);
  const [userApplication, setUserApplication] = useState<any | null>(null);
  const [receivedApplications, setReceivedApplications] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAppForModal, setSelectedAppForModal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [pitch, setPitch] = useState('');
  const [availability, setAvailability] = useState('15');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const [projRes, sentAppsRes, receivedRes] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        user ? api.get('/applications/sent') : Promise.resolve({ data: { success: true, data: [] } }),
        user ? api.get(`/applications/received?projectId=${id}`) : Promise.resolve({ data: { success: true, data: [] } }),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value.data.success) {
        setProject(projRes.value.data.data);
      }

      if (sentAppsRes.status === 'fulfilled' && sentAppsRes.value.data.success) {
        const matchingApp = sentAppsRes.value.data.data.find((a: any) => a.projectId === id);
        setUserApplication(matchingApp || null);
      }

      if (receivedRes.status === 'fulfilled' && receivedRes.value.data.success) {
        setReceivedApplications(receivedRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching project detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewApplication = async (appId: string, status: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED') => {
    setActionLoadingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/review`, { status });
      if (res.data.success) {
        if (selectedAppForModal && selectedAppForModal.id === appId) {
          setSelectedAppForModal((prev: any) => (prev ? { ...prev, status } : null));
        }
        await fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reviewing application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
    const socket = getSocket();
    const handleUpdate = () => {
      if (id) fetchProject();
    };
    socket.on('application_status_updated', handleUpdate);
    socket.on('notification_received', handleUpdate);
    socket.on('team_updated', handleUpdate);
    return () => {
      socket.off('application_status_updated', handleUpdate);
      socket.off('notification_received', handleUpdate);
      socket.off('team_updated', handleUpdate);
    };
  }, [id, user]);

  const getAvailableRoles = () => {
    return project?.requiredRoles || project?.openRoles || [];
  };

  const handleOpenApply = (role?: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const rolesList = getAvailableRoles();
    setSelectedRole(role || (rolesList.length > 0 ? rolesList[0] : null));
    setPitch('');
    setPortfolioUrl(user.portfolioUrl || '');
    setGithubUrl(user.githubUrl || '');
    setFeedbackMessage(null);
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const rolesList = getAvailableRoles();
    const targetRoleId = selectedRole?.id || (rolesList.length > 0 ? rolesList[0]?.id : null);
    const cleanPitch = pitch.trim();

    if (!targetRoleId) {
      setFeedbackMessage('Please select a target role to apply for.');
      return;
    }

    if (cleanPitch.length < 10) {
      setFeedbackMessage('Please provide a pitch of at least 10 characters.');
      return;
    }

    setIsSubmittingApp(true);
    setFeedbackMessage(null);

    try {
      const cleanGithub = githubUrl.trim()
        ? githubUrl.trim().startsWith('http')
          ? githubUrl.trim()
          : `https://${githubUrl.trim()}`
        : null;

      const cleanPortfolio = portfolioUrl.trim()
        ? portfolioUrl.trim().startsWith('http')
          ? portfolioUrl.trim()
          : `https://${portfolioUrl.trim()}`
        : null;

      const payload = {
        projectId: project.id,
        projectRoleId: targetRoleId,
        pitch: cleanPitch,
        relevantSkills: selectedRole?.requiredSkills?.map((s: any) => s.skillName || s.name || s) || [],
        availability: availability || '10-20 hours/week',
        portfolioUrl: cleanPortfolio,
        githubUrl: cleanGithub,
        relevantLinks: [cleanGithub, cleanPortfolio].filter(Boolean) as string[],
      };

      const res = await api.post('/applications', payload);

      if (res.data.success) {
        setIsApplyModalOpen(false);
        await fetchProject();
      }
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorDetails = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(' • ');
        setFeedbackMessage(`Validation error: ${errorDetails}`);
      } else {
        setFeedbackMessage(err.response?.data?.message || 'Error submitting application.');
      }
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleWithdrawApplication = async () => {
    if (!userApplication) return;
    if (!window.confirm('Are you sure you want to withdraw your application?')) return;

    setIsWithdrawing(true);
    try {
      const res = await api.delete(`/applications/${userApplication.id}`);
      if (res.data.success) {
        setUserApplication(null);
        await fetchProject();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error withdrawing application.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Project not found</h2>
        <p className="text-xs text-slate-500">This project may have been removed or made private.</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === project.creator?.id;
  const isMember = project.members?.some((m: any) => m.userId === user?.id) || isOwner;
  const isRecruiting = project.status === 'RECRUITING';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span>← Back to All Projects</span>
        </Link>
        <div className="flex items-center gap-2">
          <PrivacyIndicatorBadge
            level={project.privacyLevel || (isOwner ? 4 : isMember ? 3 : userApplication ? 2 : 1)}
          />
          <HealthBadge status={project.healthStatus} score={project.healthScore} />
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DomainBadge domain={project.domain} />
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isRecruiting
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {project.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {project.title}
          </h1>

          {/* Owner & University Attribution */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-slate-400">Created by:</span>
              <strong className="text-slate-900 dark:text-slate-100 font-bold">{project.creator?.name || 'Student Lead'}</strong>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{project.creator?.college?.name || project.creatorCollege || 'Partner University'}</span>
            </div>
          </div>
        </div>

        {/* Core Project Meta Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Duration</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.duration || '8 weeks'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Difficulty</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.difficulty || 'Intermediate'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Team Size</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.members?.length || 1} Builders</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Visibility</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {project.collegeVisibility === 'SAME_COLLEGE' ? 'Campus Only' : 'All Partner Colleges'}
            </div>
          </div>
        </div>

        {/* Problem Statement & Description */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Problem & Opportunity
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {project.problemStatement || project.publicTeaser}
          </p>
        </div>

        {/* Primary Action Button (Dynamic based on state) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {isMember ? (
            <Link
              to={`/workspace/${project.id}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
            >
              <span>{isOwner ? '👑 Manage Team & Sprint Workspace' : '🚀 Open Team Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : userApplication ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Application Status:
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        userApplication.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : userApplication.status === 'SHORTLISTED'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                          : userApplication.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {userApplication.status === 'ACCEPTED'
                        ? 'Accepted'
                        : userApplication.status === 'SHORTLISTED'
                        ? 'Shortlisted'
                        : userApplication.status === 'REJECTED'
                        ? 'Rejected'
                        : 'Pending'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Role: {userApplication.roleTitle} • Applied {new Date(userApplication.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {userApplication.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={handleWithdrawApplication}
                  disabled={isWithdrawing}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-start sm:self-auto"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                </button>
              )}
            </div>
          ) : !isRecruiting ? (
            <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-center text-xs font-bold">
              🔒 This project is currently not accepting new applications ({project.status}).
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenApply()}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all hover:scale-[1.01]"
            >
              <span>Apply to Join Team</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* LEAD CANDIDATE APPLICATIONS MANAGEMENT SECTION                 */}
      {/* ============================================================== */}
      {isOwner && receivedApplications.length > 0 && (
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-transparent border-2 border-amber-500/40 dark:border-amber-500/30 shadow-md space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  <span>Lead Review</span>
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {receivedApplications.filter((a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length} Pending Review
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Candidate Applications for this Project ({receivedApplications.length})
              </h2>
            </div>

            <Link
              to={`/workspace/${id}?tab=applications`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 self-start sm:self-auto bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <span>Manage in Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {receivedApplications.map((app: any) => {
              const applicant = app.applicant;
              const skills = applicant?.skills || [];
              const isActionLoading = actionLoadingId === app.id;
              const isPending = app.status === 'PENDING' || app.status === 'UNDER_REVIEW';

              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Applied for: <strong className="text-brand-600 dark:text-brand-400">{app.roleTitle || app.roleName || 'Team Member'}</strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : app.status === 'SHORTLISTED'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        Status: {app.status === 'ACCEPTED'
                          ? 'Accepted'
                          : app.status === 'SHORTLISTED'
                          ? 'Shortlisted'
                          : app.status === 'REJECTED'
                          ? 'Rejected'
                          : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{app.matchScore ?? 85}% AI Match</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <img
                        src={
                          applicant?.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${applicant?.name || 'Applicant'}`
                        }
                        alt={applicant?.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-sm"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {applicant?.name}
                          </h4>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {applicant?.collegeName || applicant?.college || 'Sanjivani University'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {applicant?.course || applicant?.major || 'Undergraduate Student'}
                            {applicant?.graduationYear ? ` • Class of ${applicant.graduationYear}` : ''}
                          </p>
                        </div>

                        {app.pitch && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
                            "{app.pitch}"
                          </div>
                        )}

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {skills.slice(0, 4).map((s: any, idx: number) => {
                              const sName = typeof s === 'string' ? s : s.skillName || s.name;
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                                >
                                  {sName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReviewApplication(app.id, 'ACCEPTED')}
                            disabled={isActionLoading}
                            className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReviewApplication(app.id, 'SHORTLISTED')}
                            disabled={isActionLoading}
                            className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors disabled:opacity-50"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Shortlist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                            disabled={isActionLoading}
                            className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReviewApplication(app.id, app.status === 'ACCEPTED' ? 'REJECTED' : 'ACCEPTED')}
                          disabled={isActionLoading}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline text-center"
                        >
                          Change Decision
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedAppForModal(app)}
                        className="w-full text-center px-3 py-1 rounded-xl font-semibold text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recruiting Roles Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Open Roles & Required Skills
        </h3>

        <div className="space-y-3">
          {getAvailableRoles().length > 0 ? (
            getAvailableRoles().map((role: any) => (
              <div
                key={role.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      ⚡ {role.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">
                      {role.applicationCount ?? role.applicationsCount ?? 0}/{role.requiredMembers ?? 1} applications
                    </span>
                  </div>
                  {isRecruiting && !isMember && !userApplication && (
                    <button
                      type="button"
                      onClick={() => handleOpenApply(role)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline self-start sm:self-auto"
                    >
                      <span>Apply for this role</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {role.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                )}

                {/* Skills for this role */}
                {role.requiredSkills && role.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {role.requiredSkills.map((s: any) => (
                      <SkillBadge
                        key={s.id || s.skillName}
                        name={s.skillName || s.skill?.name}
                        isCritical={s.isCritical}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-500">
              General contributors and pair builders welcome.
            </div>
          )}
        </div>
      </div>

      {/* Current Team Members Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Current Team ({project.members?.length || 1})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Creator Member Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 flex items-center gap-3">
            <img
              src={
                project.creator?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80'
              }
              alt={project.creator?.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {project.creator?.name} (Lead)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {project.creator?.college?.name || project.creatorCollege}
              </div>
            </div>
          </div>

          {/* Other Members */}
          {project.members
            ?.filter((m: any) => m.userId !== project.creator?.id)
            .map((m: any) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 flex items-center gap-3"
              >
                <img
                  src={
                    m.user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop&q=80'
                  }
                  alt={m.user?.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {m.user?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {m.roleTitle || 'Builder'} • {m.user?.college?.name}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Application Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply to ${project.title}`}
        subtitle="Submit your pitch and relevant links to the project owner."
      >
        <form onSubmit={handleSubmitApplication} className="space-y-4">
          {feedbackMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {feedbackMessage}
            </div>
          )}

          {/* Target Role Selector */}
          {getAvailableRoles().length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Select Target Role
              </label>
              <select
                value={selectedRole?.id || ''}
                onChange={(e) => {
                  const r = getAvailableRoles().find((role: any) => role.id === e.target.value);
                  setSelectedRole(r || null);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {getAvailableRoles().map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.applicationCount ?? r.applicationsCount ?? 0}/{r.requiredMembers ?? 1} applications)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Application Pitch */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Your Pitch & Background *
            </label>
            <textarea
              required
              rows={4}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Explain why you're interested, relevant coursework/projects you've built, and how you can contribute..."
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Availability */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Weekly Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="5-10 hours/week">5-10 hours / week</option>
              <option value="10-20 hours/week">10-20 hours / week (Recommended)</option>
              <option value="20+ hours/week">20+ hours / week</option>
            </select>
          </div>

          {/* Portfolio & GitHub Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Portfolio / Demo URL
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://myportfolio.edu"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingApp}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmittingApp ? 'Submitting Application...' : 'Send Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CANDIDATE DETAIL MODAL */}
      {selectedAppForModal && (
        <Modal
          isOpen={!!selectedAppForModal}
          onClose={() => setSelectedAppForModal(null)}
          title={`Application: ${selectedAppForModal.applicant?.name || 'Applicant'}`}
          subtitle={`Applied for ${selectedAppForModal.roleTitle || selectedAppForModal.roleName || 'Team Member'} on ${project?.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Header Profile */}
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
                    {selectedAppForModal.applicant?.collegeName || selectedAppForModal.applicant?.college || 'Sanjivani University'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                      <span>{selectedAppForModal.applicant?.course || selectedAppForModal.applicant?.major || 'Undergraduate Engineering'}</span>
                    </span>
                    {selectedAppForModal.applicant?.graduationYear && (
                      <>
                        <span>•</span>
                        <span>Class of {selectedAppForModal.applicant.graduationYear}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{selectedAppForModal.matchScore ?? 85}% Match</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Applied {new Date(selectedAppForModal.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Why They Want To Join (Pitch)
              </h5>
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{selectedAppForModal.pitch || 'No pitch provided.'}"
              </div>
            </div>

            {/* Skills */}
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

            {/* Links */}
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
                {!selectedAppForModal.applicant?.githubUrl && !selectedAppForModal.applicant?.portfolioUrl && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No external links provided.</p>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors disabled:opacity-50"
                >
                  Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication(selectedAppForModal.id, 'REJECTED')}
                  disabled={actionLoadingId === selectedAppForModal.id}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewApplication(selectedAppForModal.id, 'ACCEPTED')}
                  disabled={actionLoadingId === selectedAppForModal.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Candidate</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
