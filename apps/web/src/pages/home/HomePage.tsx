import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Plus,
  Search,
  Users,
  ShieldCheck,
  FolderKanban,
  Clock,
  CheckCircle2,
  Check,
  X,
  Star,
  Sparkles,
  Github,
  Globe,
  Building2,
  ExternalLink,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Modal } from '../../components/common/Modal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [myLeadingProjects, setMyLeadingProjects] = useState<any[]>([]);
  const [projectsICanApplyFor, setProjectsICanApplyFor] = useState<any[]>([]);
  const [sentApplications, setSentApplications] = useState<any[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<any[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAppForModal, setSelectedAppForModal] = useState<any | null>(null);

  const fetchHomeFeed = async () => {
    setIsLoading(true);
    try {
      const [createdRes, exploreRes, sentAppsRes, receivedAppsRes, joinedRes] = await Promise.allSettled([
        api.get('/projects/user/created'),
        api.get('/projects?status=RECRUITING'),
        api.get('/applications/sent'),
        api.get('/applications/received'),
        api.get('/projects/user/joined'),
      ]);

      if (createdRes.status === 'fulfilled' && createdRes.value.data.success) {
        setMyLeadingProjects(createdRes.value.data.data || []);
      }

      if (sentAppsRes.status === 'fulfilled' && sentAppsRes.value.data.success) {
        setSentApplications(sentAppsRes.value.data.data || []);
      }

      if (receivedAppsRes.status === 'fulfilled' && receivedAppsRes.value.data.success) {
        setReceivedApplications(receivedAppsRes.value.data.data || []);
      }

      if (joinedRes.status === 'fulfilled' && joinedRes.value.data.success) {
        setJoinedProjects(joinedRes.value.data.data || []);
      }

      if (exploreRes.status === 'fulfilled' && exploreRes.value.data.success) {
        const allExplore = exploreRes.value.data.data || [];
        const canApply = allExplore.filter((p: any) => {
          if (!user) return true;
          const isCreator = p.creator?.id === user.id || p.creatorId === user.id;
          return !isCreator;
        });
        setProjectsICanApplyFor(canApply);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeFeed();
    const socket = getSocket();
    const handleUpdate = () => {
      fetchHomeFeed();
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

  const handleReviewApplication = async (appId: string, status: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED') => {
    setActionLoadingId(appId);
    try {
      const res = await api.patch(`/applications/${appId}/review`, { status });
      if (res.data.success) {
        if (selectedAppForModal && selectedAppForModal.id === appId) {
          setSelectedAppForModal((prev: any) => (prev ? { ...prev, status } : null));
        }
        await fetchHomeFeed();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reviewing application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isAppliedToProject = (projectId: string) => {
    return sentApplications.some((a) => a.projectId === projectId || a.project?.id === projectId);
  };

  const getApplicationForProject = (projectId: string) => {
    return sentApplications.find((a) => a.projectId === projectId || a.project?.id === projectId);
  };

  const isMemberOfProject = (projectId: string) => {
    return joinedProjects.some((p) => p.id === projectId);
  };

  const pendingApplications = receivedApplications.filter(
    (a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Cross-College Builder Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Builder'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
            {user?.college?.name || 'University'} • {user?.major || 'Computer Science'} • Find a project to join or lead your own team.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'Builder'}`}
            alt={user?.name || 'User'}
            className="w-11 h-11 rounded-xl object-cover border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
          />
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>{user?.name || 'Student Builder'}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {user?.college?.name ? `${user.college.name.split(' ')[0]} Student` : 'Verified Student'}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HIGH PRIORITY: PENDING ROLE APPLICATIONS AWAITING DECISION     */}
      {/* ============================================================== */}
      {pendingApplications.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-brand-500/5 to-transparent border-2 border-amber-500/40 dark:border-amber-500/30 shadow-lg space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  <span>Action Required</span>
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {pendingApplications.length} Pending Candidate Application{pendingApplications.length > 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Role Applications Awaiting Your Decision
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Applicants want to join your projects. Accept or reject them right here to form your team.
              </p>
            </div>

            <Link
              to="/my-projects?tab=lead"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 self-start sm:self-auto bg-white/80 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <span>Full Management Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pendingApplications.map((app: any) => {
              const applicant = app.applicant;
              const skills = applicant?.skills || [];
              const isActionLoading = actionLoadingId === app.id;

              return (
                <div
                  key={app.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all"
                >
                  {/* Top Bar: Target Project & Applied Role + Match Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        📁 {app.projectTitle || app.project?.title}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Applied for: <strong className="text-brand-600 dark:text-brand-400">{app.roleTitle || app.roleName || 'Team Member'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{app.matchScore ?? 85}% AI Match</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Applicant Profile & Pitch */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={
                          applicant?.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${applicant?.name || 'Applicant'}`
                        }
                        alt={applicant?.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {applicant?.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              Pending Review
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {applicant?.collegeName || applicant?.college || 'Sanjivani University'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {applicant?.course || applicant?.major || 'Undergraduate Student'}
                            {applicant?.graduationYear ? ` • Class of ${applicant.graduationYear}` : ''}
                          </p>
                        </div>

                        {/* Pitch Quote */}
                        {app.pitch && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
                            "{app.pitch}"
                          </div>
                        )}

                        {/* Skills */}
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {skills.slice(0, 5).map((s: any, idx: number) => {
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

                        {/* Links */}
                        {(applicant?.githubUrl || applicant?.portfolioUrl) && (
                          <div className="flex items-center gap-3 pt-1">
                            {applicant?.githubUrl && (
                              <a
                                href={applicant.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                              >
                                <Github className="w-3 h-3" />
                                <span>GitHub</span>
                              </a>
                            )}
                            {applicant?.portfolioUrl && (
                              <a
                                href={applicant.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Portfolio</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Action Buttons: Accept / Shortlist / Reject */}
                    <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => handleReviewApplication(app.id, 'ACCEPTED')}
                        disabled={isActionLoading}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Candidate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReviewApplication(app.id, 'SHORTLISTED')}
                        disabled={isActionLoading}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Shortlist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                        disabled={isActionLoading}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAppForModal(app)}
                        className="w-full text-center px-3 py-1.5 rounded-xl font-semibold text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        View Full Profile →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/80 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800/60 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Find a Project
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Discover active projects recruiting students across universities. Filter by skills, campus, or domain.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/explore"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all group-hover:gap-3"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Create a Project
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Post your idea in 1 minute, define the required skills, and assemble your cross-college dream team.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/projects/new"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-all group-hover:gap-3"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by skill (e.g. Python, React, PyTorch) or keyword..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all shrink-0"
          >
            Search Projects
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span>MY PROJECTS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Projects you created and are leading.</p>
          </div>
          {myLeadingProjects.length > 0 && (
            <Link to="/my-projects" className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 self-start sm:self-auto">
              <span>Manage All ({myLeadingProjects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (<div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-48" />))}
          </div>
        ) : myLeadingProjects.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><FolderKanban className="w-6 h-6" /></div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">You haven't created a project yet.</p>
            <Link to="/projects/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">
              <Plus className="w-4 h-4" />
              <span>+ Create Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myLeadingProjects.map((project) => {
              const currentMembers = project.members?.length || 1;
              const maxMembers = project.teamSize || project.maxMembers || 4;
              const applicationsCount = project.applications?.length || 0;
              const pendingCount = project.pendingApplicationsCount ?? (project.applications?.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length || 0);
              const skillSet = new Set<string>();
              (project.requiredRoles || []).forEach((r: any) => { (r.requiredSkills || []).forEach((s: any) => { skillSet.add(s.skillName || s.skill?.name || s.name || s); }); });
              const skillsList = Array.from(skillSet);

              return (
                <div key={project.id} className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">{project.status || 'Recruiting'}</span>
                        {pendingCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                            🔴 {pendingCount} New Application{pendingCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> <span>{currentMembers} / {maxMembers}</span></span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{project.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">{project.publicTeaser || project.problemStatement || 'Collaborative project.'}</p>
                    </div>
                    {skillsList.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {skillsList.slice(0, 4).map((skill) => (<span key={skill} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{skill}</span>))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Link to={`/projects/${project.id}`} className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">View Project</Link>
                    <Link to={`/my-projects?tab=lead&project=${project.id}`} className="py-2.5 px-4 rounded-xl text-center text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition-colors">Manage</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>PROJECTS I CAN APPLY FOR</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Find projects looking for students like you.</p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 self-start sm:self-auto">
            <span>Explore All ({projectsICanApplyFor.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (<div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-48" />))}
          </div>
        ) : projectsICanApplyFor.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No open recruiting projects available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsICanApplyFor.slice(0, 6).map((project) => {
              const currentMembers = project.memberCount || project.members?.length || 1;
              const maxMembers = project.teamSize || 4;
              const isFull = currentMembers >= maxMembers;
              const hasApplied = isAppliedToProject(project.id);
              const isMember = isMemberOfProject(project.id);
              const skillSet = new Set<string>();
              (project.openRoles || project.requiredRoles || []).forEach((r: any) => { (r.requiredSkills || []).forEach((s: any) => { skillSet.add(s.skillName || s.skill?.name || s.name || s); }); });
              const skillsList = Array.from(skillSet);

              return (
                <div key={project.id} className="p-5 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">{project.status || 'Recruiting'}</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400"><Users className="w-3.5 h-3.5 inline mr-1" />{currentMembers}/{maxMembers}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{project.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{project.publicTeaser || 'Student project.'}</p>
                    </div>
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skillsList.slice(0, 3).map((s) => (<span key={s} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{s}</span>))}
                      </div>
                    )}
                  </div>
                  <div>
                    {isMember ? (
                      <Link to={`/workspace/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"><CheckCircle2 className="w-3.5 h-3.5" /> Open Project</Link>
                    ) : hasApplied ? (
                      (() => {
                        const userApp = getApplicationForProject(project.id);
                        const st = userApp?.status || 'PENDING';
                        if (st === 'ACCEPTED') {
                          return (
                            <Link to={`/workspace/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted • Open Workspace
                            </Link>
                          );
                        }
                        if (st === 'SHORTLISTED') {
                          return (
                            <Link to={`/projects/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors">
                              <Clock className="w-3.5 h-3.5 inline mr-1" /> Shortlisted
                            </Link>
                          );
                        }
                        if (st === 'REJECTED') {
                          return (
                            <Link to={`/projects/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors">
                              Rejected
                            </Link>
                          );
                        }
                        return (
                          <Link to={`/projects/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 transition-colors">
                            <Clock className="w-3.5 h-3.5 inline mr-1" /> Pending
                          </Link>
                        );
                      })()
                    ) : isFull ? (
                      <div className="w-full py-2.5 rounded-xl font-bold text-xs text-center bg-slate-100 text-slate-500">Team Full</div>
                    ) : (
                      <Link to={`/projects/${project.id}`} className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all">View & Apply</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CANDIDATE DETAIL MODAL                                         */}
      {/* ============================================================== */}
      {selectedAppForModal && (
        <Modal
          isOpen={!!selectedAppForModal}
          onClose={() => setSelectedAppForModal(null)}
          title={`Application: ${selectedAppForModal.applicant?.name || 'Applicant'}`}
          subtitle={`Applied for ${selectedAppForModal.roleTitle || selectedAppForModal.roleName || 'Team Member'} on ${selectedAppForModal.projectTitle || selectedAppForModal.project?.title || 'Project'}`}
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
