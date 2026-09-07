import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  User,
  Building2,
  Calendar,
  Github,
  Globe,
  Linkedin,
  ShieldCheck,
  Plus,
  Trash2,
  FolderKanban,
  Award,
  ExternalLink,
  Code2,
  Clock,
  Sparkles,
  Edit3,
  Briefcase,
  Trophy,
  CheckCircle2,
  FileCode,
  Layers,
  Flame,
  Check,
  Tag,
  MessageSquare,
  Send,
  AlertCircle,
  HelpCircle,
  GitFork,
  Star,
  GitBranch,
  RefreshCw,
  Unlink,
  Settings,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/common/Modal';
import { SettingsPage } from '../settings/SettingsPage';
import {
  getSkillVerificationBadge,
  SkillVerificationStatus,
  SkillEvidenceType,
  GitHubProfileData,
} from '@projectx/common';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, refreshUser } = useAuth();

  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState<'ALL' | 'VERIFIED' | 'EVIDENCE' | 'SELF'>('ALL');

  // GitHub Integration Data State
  const [githubData, setGithubData] = useState<GitHubProfileData | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubInput, setGithubInput] = useState('');
  const [isSavingGithub, setIsSavingGithub] = useState(false);

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editGradYear, setEditGradYear] = useState(2027);
  const [editBio, setEditBio] = useState('');
  const [editAvailability, setEditAvailability] = useState('10-20h');
  const [editInterests, setEditInterests] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Skill Form
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('AI/ML');
  const [proficiency, setProficiency] = useState(4);
  const [verificationStatus, setVerificationStatus] = useState<SkillVerificationStatus>('EVIDENCE_SUPPORTED');
  const [evidenceType, setEvidenceType] = useState<SkillEvidenceType>('GITHUB_PROJECT');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  // Experience Form
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [isSavingExp, setIsSavingExp] = useState(false);

  // Hackathon Form
  const [hackTitle, setHackTitle] = useState('');
  const [hackProject, setHackProject] = useState('');
  const [hackAward, setHackAward] = useState('');
  const [hackDate, setHackDate] = useState('');
  const [hackDesc, setHackDesc] = useState('');
  const [hackUrl, setHackUrl] = useState('');
  const [isSavingHack, setIsSavingHack] = useState(false);

  // Past Project Form
  const [projTitle, setProjTitle] = useState('');
  const [projRole, setProjRole] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projFeatured, setProjFeatured] = useState(true);
  const [isSavingProj, setIsSavingProj] = useState(false);

  const isOwnProfile = !id || id === currentUser?.id;
  const targetId = id || currentUser?.id;

  const fetchProfile = async () => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${targetId}`);
      if (res.data.success) {
        setProfile(res.data.data);
        // Preload edit fields
        const d = res.data.data;
        setEditName(d.name || '');
        setEditCourse(d.course || d.major || '');
        setEditGradYear(d.graduationYear || 2027);
        setEditBio(d.bio || '');
        setEditAvailability(d.weeklyAvailability || '10-20h');
        setEditInterests(d.interests || '');
        setEditGithub(d.githubUrl || '');
        setEditPortfolio(d.portfolioUrl || '');
        setEditLinkedin(d.linkedinUrl || '');
        setEditAvatarUrl(d.avatarUrl || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGithubData = async () => {
    if (!targetId) return;
    setIsLoadingGithub(true);
    try {
      const res = await api.get(`/users/${targetId}/github`);
      if (res.data.success && res.data.data) {
        setGithubData(res.data.data);
      } else {
        setGithubData(null);
      }
    } catch {
      setGithubData(null);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchGithubData();
  }, [targetId]);

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubInput.trim()) return;
    setIsSavingGithub(true);
    try {
      const res = await api.post('/users/me/github', {
        githubUrlOrUsername: githubInput.trim(),
      });
      if (res.data.success) {
        setIsGithubModalOpen(false);
        setGithubInput('');
        await refreshUser();
        fetchProfile();
        fetchGithubData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error connecting GitHub account.');
    } finally {
      setIsSavingGithub(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub?')) return;
    try {
      const res = await api.delete('/users/me/github');
      if (res.data.success) {
        setGithubData(null);
        await refreshUser();
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error disconnecting GitHub.');
    }
  };

  // Handler: Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.patch('/users/me', {
        name: editName.trim(),
        course: editCourse.trim() || undefined,
        major: editCourse.trim() || undefined,
        graduationYear: Number(editGradYear),
        bio: editBio.trim() || undefined,
        weeklyAvailability: editAvailability as any,
        interests: editInterests.trim() || undefined,
        githubUrl: editGithub.trim() || undefined,
        portfolioUrl: editPortfolio.trim() || undefined,
        linkedinUrl: editLinkedin.trim() || undefined,
        avatarUrl: editAvatarUrl.trim() || undefined,
      });

      if (res.data.success) {
        setIsEditProfileModalOpen(false);
        await refreshUser();
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler: Add Skill with Evidence
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    setIsSavingSkill(true);
    try {
      const res = await api.post('/users/me/skills', {
        skillName: skillName.trim(),
        category,
        proficiency: Number(proficiency),
        verificationStatus,
        evidenceType: evidenceUrl.trim() ? evidenceType : undefined,
        evidenceTitle: evidenceTitle.trim() || undefined,
        evidenceUrl: evidenceUrl.trim() || undefined,
        evidenceSummary: evidenceSummary.trim() || undefined,
      });

      if (res.data.success) {
        setIsSkillModalOpen(false);
        setSkillName('');
        setEvidenceTitle('');
        setEvidenceUrl('');
        setEvidenceSummary('');
        await refreshUser();
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding skill.');
    } finally {
      setIsSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to remove this skill from your profile?')) return;
    try {
      await api.delete(`/users/me/skills/${skillId}`);
      await refreshUser();
      fetchProfile();
    } catch (err) {
      console.error('Error removing skill:', err);
    }
  };

  // Handler: Add Experience
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim() || !expStart.trim()) return;

    setIsSavingExp(true);
    try {
      const res = await api.post('/users/me/experiences', {
        title: expTitle.trim(),
        company: expCompany.trim(),
        location: expLocation.trim() || undefined,
        startDate: expStart.trim(),
        endDate: expCurrent ? 'Present' : expEnd.trim() || undefined,
        isCurrent: expCurrent,
        description: expDesc.trim() || undefined,
      });

      if (res.data.success) {
        setIsExpModalOpen(false);
        setExpTitle('');
        setExpCompany('');
        setExpLocation('');
        setExpStart('');
        setExpEnd('');
        setExpDesc('');
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add experience.');
    } finally {
      setIsSavingExp(false);
    }
  };

  const handleDeleteExperience = async (expId: string) => {
    if (!confirm('Remove this experience entry?')) return;
    try {
      await api.delete(`/users/me/experiences/${expId}`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Add Hackathon
  const handleAddHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackTitle.trim() || !hackDate.trim()) return;

    setIsSavingHack(true);
    try {
      const res = await api.post('/users/me/hackathons', {
        title: hackTitle.trim(),
        projectName: hackProject.trim() || undefined,
        award: hackAward.trim() || undefined,
        date: hackDate.trim(),
        description: hackDesc.trim() || undefined,
        projectUrl: hackUrl.trim() || undefined,
      });

      if (res.data.success) {
        setIsHackathonModalOpen(false);
        setHackTitle('');
        setHackProject('');
        setHackAward('');
        setHackDate('');
        setHackDesc('');
        setHackUrl('');
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add hackathon.');
    } finally {
      setIsSavingHack(false);
    }
  };

  const handleDeleteHackathon = async (hackId: string) => {
    if (!confirm('Remove this hackathon entry?')) return;
    try {
      await api.delete(`/users/me/hackathons/${hackId}`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Add Past Project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projDesc.trim() || !projTech.trim()) return;

    setIsSavingProj(true);
    try {
      const res = await api.post('/users/me/projects', {
        title: projTitle.trim(),
        role: projRole.trim() || undefined,
        description: projDesc.trim(),
        technologies: projTech.trim(),
        projectUrl: projUrl.trim() || undefined,
        githubUrl: projGithub.trim() || undefined,
        isFeatured: projFeatured,
      });

      if (res.data.success) {
        setIsProjectModalOpen(false);
        setProjTitle('');
        setProjRole('');
        setProjDesc('');
        setProjTech('');
        setProjUrl('');
        setProjGithub('');
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add project.');
    } finally {
      setIsSavingProj(false);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm('Remove this portfolio project?')) return;
    try {
      await api.delete(`/users/me/projects/${projId}`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400 font-mono">Loading student profile & credentials...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        Profile not found.
      </div>
    );
  }

  const interestsList = profile.interests
    ? profile.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const filteredSkills = (profile.skills || []).filter((s: any) => {
    const badge = getSkillVerificationBadge(s);
    if (skillFilter === 'VERIFIED') return badge.status === 'VERIFIED';
    if (skillFilter === 'EVIDENCE') return badge.status === 'EVIDENCE_SUPPORTED';
    if (skillFilter === 'SELF') return badge.status === 'SELF_DECLARED';
    return true;
  });

  const isSettingsTab = searchParams.get('tab') === 'settings';

  if (isSettingsTab && isOwnProfile) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Portfolio & Evidence</span>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 shadow-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Privacy</span>
          </button>
        </div>
        <SettingsPage />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Tab Switcher if Viewing Own Profile */}
      {isOwnProfile && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 shadow-sm transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Portfolio & Evidence</span>
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'settings' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Privacy</span>
          </button>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <div className="relative p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <img
                src={
                  profile.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.name}`
                }
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 border-slate-700/80 object-cover shadow-xl bg-slate-950"
              />
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-xl bg-brand-500 text-slate-950 hover:bg-brand-400 shadow-glow transition-all"
                  title="Edit Avatar & Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Student
                  </span>
                )}
              </div>

              {/* College & Degree */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-brand-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile.college?.name}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-medium">
                  {profile.course || profile.major || 'Computer Science'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Class of {profile.graduationYear || '2027'}</span>
              </div>

              {/* Availability Indicator */}
              <div className="flex items-center gap-4 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>Availability:</span>
                  <span className="font-bold text-emerald-400">
                    {profile.weeklyAvailability || '10-20h / week'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links & Profile Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 z-10">
            <div className="flex items-center gap-2">
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors shadow-sm"
                  title="GitHub Profile"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors shadow-sm"
                  title="Personal Portfolio"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors shadow-sm"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>

            {isOwnProfile ? (
              <button
                onClick={() => setIsEditProfileModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                Edit Profile Info
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="pt-2">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              "{profile.bio}"
            </p>
          </div>
        )}

        {/* Interests */}
        {interestsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              Interests:
            </span>
            {interestsList.map((interest: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* GITHUB REPOSITORY EVIDENCE & INTELLIGENCE CARD           */}
      {/* ========================================================= */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Github className="w-4 h-4 text-slate-100" />
                GitHub Skill Evidence
              </span>
              {githubData && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                    githubData.isLiveSync
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {githubData.isLiveSync ? '● Live Repositories Synced' : '● Profile Fallback Link'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Code Repositories & Language Breakdown
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <>
                {githubData ? (
                  <>
                    <button
                      onClick={() => {
                        setGithubInput(githubData.username || profile.githubUrl || '');
                        setIsGithubModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
                      Sync Repositories
                    </button>
                    <button
                      onClick={handleDisconnectGithub}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                      title="Disconnect GitHub"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setGithubInput(profile?.githubUrl || '');
                      setIsGithubModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 shadow-sm transition-all"
                  >
                    <Github className="w-4 h-4 text-brand-400" />
                    Connect GitHub Account
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {githubData ? (
          <div className="space-y-6">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">GitHub User</p>
                  <a
                    href={githubData.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    @{githubData.username || 'profile'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <Github className="w-6 h-6 text-slate-700" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Public Repositories</p>
                  <p className="text-lg font-black text-slate-100 mt-0.5">{githubData.publicReposCount}</p>
                </div>
                <GitBranch className="w-6 h-6 text-slate-700" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Evidence Integration</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Evidence-Supported
                  </p>
                </div>
                <Award className="w-6 h-6 text-slate-700" />
              </div>
            </div>

            {/* Languages Distribution Bar */}
            {githubData.languages && githubData.languages.length > 0 && (
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-brand-400" />
                    Languages Distribution
                  </span>
                  <span className="text-[11px] text-slate-500">From public repository codebases</span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-900">
                  {githubData.languages.map((lang, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: lang.color || '#3b82f6',
                      }}
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {githubData.languages.map((lang, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lang.color || '#3b82f6' }}
                      />
                      <span className="text-slate-300 font-medium">{lang.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{lang.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relevant Repositories Grid */}
            {githubData.repositories && githubData.repositories.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Featured Public Repositories ({githubData.repositories.slice(0, 6).length})
                  </h3>
                  <a
                    href={githubData.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-400 hover:underline flex items-center gap-1"
                  >
                    View all on GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {githubData.repositories.slice(0, 6).map((repo) => (
                    <div
                      key={repo.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1.5 group-hover:underline truncate"
                        >
                          <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{repo.name}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
                          {repo.stars > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {repo.stars}
                            </span>
                          )}
                          {repo.forks > 0 && (
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <GitFork className="w-3 h-3" />
                              {repo.forks}
                            </span>
                          )}
                        </div>
                      </div>

                      {repo.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {repo.language && (
                          <span className="text-[10px] font-medium text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                            {repo.language}
                          </span>
                        )}
                        {repo.topics &&
                          repo.topics.slice(0, 3).map((t, tidx) => (
                            <span
                              key={tidx}
                              className="text-[10px] text-slate-500 bg-slate-950 border border-slate-800/60 px-1.5 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                {githubData.fallbackMessage || 'Public repositories available at '}
                <a
                  href={githubData.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 hover:underline font-mono ml-1 inline-flex items-center gap-1"
                >
                  {githubData.profileUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Evidence Confidence Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Evidence-Confidence Rule:</strong> GitHub repositories provide transparent proof-of-work to support your declared skills with confidence metrics (High / Medium). Having a GitHub account does not automatically award an official "Verified" credential without institutional verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-bold text-slate-200">
                {isOwnProfile
                  ? 'Connect your GitHub profile to back your skills with real code evidence'
                  : 'No public GitHub profile connected for this builder'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                Repository languages, activity, and project links are automatically analyzed to calculate Evidence Confidence for your skill profile.
              </p>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => {
                  setGithubInput(profile?.githubUrl || '');
                  setIsGithubModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all shrink-0 flex items-center gap-1.5"
              >
                <Github className="w-4 h-4" />
                Connect GitHub
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. VERIFIED SKILLS & PROOF-OF-WORK SECTION */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                Proof-of-Competency
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                {profile.skills?.length || 0} skills
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Skills & Code Evidence Repository
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSkillFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  skillFilter === 'ALL'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSkillFilter('VERIFIED')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  skillFilter === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setSkillFilter('EVIDENCE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  skillFilter === 'EVIDENCE'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Evidence-supported
              </button>
              <button
                onClick={() => setSkillFilter('SELF')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  skillFilter === 'SELF'
                    ? 'bg-slate-700 text-slate-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Self-declared
              </button>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill
              </button>
            )}
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((s: any) => {
            const badge = getSkillVerificationBadge(s);
            const proficiencyLabels = ['', 'Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

            return (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3.5 hover:border-slate-700 transition-all group"
              >
                {/* Header: Skill Name + Category + Level */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{s.skillName}</span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                        {s.category}
                      </span>
                    </div>

                    {/* Verification Status Badge & Evidence Confidence */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.badgeClass}`}
                      >
                        {badge.status === 'VERIFIED' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : badge.status === 'EVIDENCE_SUPPORTED' ? (
                          <FileCode className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <User className="w-3 h-3 text-slate-400" />
                        )}
                        {badge.label}
                      </span>

                      {/* Evidence Confidence Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          s.evidenceConfidenceLevel === 'HIGH' || s.evidenceConfidenceLevel === 'STRONG'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : s.evidenceConfidenceLevel === 'MEDIUM'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : s.evidenceConfidenceLevel === 'LOW'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {s.evidenceConfidence || (badge.status === 'VERIFIED' ? 95 : badge.status === 'EVIDENCE_SUPPORTED' ? 75 : 15)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-brand-400">
                      Lvl {s.proficiency}/5
                    </span>
                    <p className="text-[10px] text-slate-500">{proficiencyLabels[s.proficiency] || 'Proficient'}</p>
                  </div>
                </div>

                {/* Proficiency Visual Bar */}
                <div className="flex gap-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`flex-1 rounded-full ${
                        s.proficiency >= lvl
                          ? badge.status === 'VERIFIED'
                            ? 'bg-emerald-400'
                            : badge.status === 'EVIDENCE_SUPPORTED'
                            ? 'bg-cyan-400'
                            : 'bg-brand-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Evidence Summary / Title */}
                {(s.evidenceTitle || s.evidenceSummary) && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1">
                    {s.evidenceTitle && (
                      <p className="text-xs font-bold text-slate-200">{s.evidenceTitle}</p>
                    )}
                    {s.evidenceSummary && (
                      <p className="text-xs text-slate-400 leading-relaxed">{s.evidenceSummary}</p>
                    )}
                  </div>
                )}

                {/* Matched GitHub Repositories for this Skill */}
                {githubData &&
                  githubData.repositories &&
                  githubData.repositories.some(
                    (r) =>
                      (r.language && s.skillName.toLowerCase().includes(r.language.toLowerCase())) ||
                      r.name.toLowerCase().includes(s.skillName.toLowerCase()) ||
                      r.topics.some((t) => t.toLowerCase().includes(s.skillName.toLowerCase()))
                  ) && (
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Github className="w-3 h-3 text-slate-300" />
                        Backed by GitHub Code:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {githubData.repositories
                          .filter(
                            (r) =>
                              (r.language && s.skillName.toLowerCase().includes(r.language.toLowerCase())) ||
                              r.name.toLowerCase().includes(s.skillName.toLowerCase()) ||
                              r.topics.some((t) => t.toLowerCase().includes(s.skillName.toLowerCase()))
                          )
                          .slice(0, 2)
                          .map((r) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-brand-300 hover:border-brand-500/50 hover:text-brand-200 transition-colors"
                            >
                              <FileCode className="w-3 h-3 text-slate-400" />
                              {r.name}
                              {r.stars > 0 && <span className="text-amber-400">★{r.stars}</span>}
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Evidence Link Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  {s.evidenceUrl ? (
                    <a
                      href={s.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1.5 font-mono font-semibold truncate max-w-[260px] group-hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {s.evidenceType === 'GITHUB_PROJECT'
                          ? 'GitHub Repository'
                          : s.evidenceType === 'PORTFOLIO'
                          ? 'Live Demo / Portfolio'
                          : s.evidenceType === 'CERTIFICATE'
                          ? 'Verified Certificate'
                          : 'Completed Project Proof'}
                      </span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No external proof linked</span>
                  )}

                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveSkill(s.skillId)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs">
            No skills found under this filter.
          </div>
        )}
      </div>

      {/* 3. PAST PROJECTS & PORTFOLIO */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              Showcase
            </span>
            <h2 className="text-xl font-extrabold text-slate-100">
              Projects & Engineering Portfolio ({profile.pastProjects?.length || 0})
            </h2>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Project
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(profile.pastProjects || []).map((proj: any) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{proj.title}</h3>
                  {proj.role && (
                    <p className="text-xs text-brand-400 font-semibold">{proj.role}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.technologies.split(',').map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {t.trim()}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-100 inline-flex items-center gap-1 font-mono"
                  >
                    <Github className="w-3.5 h-3.5" />
                    Source Code
                  </a>
                )}
                {proj.projectUrl && (
                  <a
                    href={proj.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!profile.pastProjects || profile.pastProjects.length === 0) && (
          <p className="text-xs text-slate-500 italic text-center py-4">
            No portfolio projects added yet.
          </p>
        )}
      </div>

      {/* 4. HACKATHONS & HONORS */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              Competitions
            </span>
            <h2 className="text-xl font-extrabold text-slate-100">
              Hackathons & Awards ({profile.hackathons?.length || 0})
            </h2>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsHackathonModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Hackathon
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(profile.hackathons || []).map((h: any) => (
            <div
              key={h.id}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-slate-100">{h.title}</h3>
                  </div>
                  {h.award && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {h.award}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">{h.date}</span>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeleteHackathon(h.id)}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {h.projectName && (
                <p className="text-xs font-semibold text-brand-400">Project: {h.projectName}</p>
              )}

              {h.description && (
                <p className="text-xs text-slate-300 leading-relaxed">{h.description}</p>
              )}

              {h.projectUrl && (
                <a
                  href={h.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-400 hover:underline font-mono"
                >
                  <ExternalLink className="w-3 h-3" />
                  Devpost / Submission Link
                </a>
              )}
            </div>
          ))}
        </div>

        {(!profile.hackathons || profile.hackathons.length === 0) && (
          <p className="text-xs text-slate-500 italic text-center py-4">
            No hackathon records added yet.
          </p>
        )}
      </div>

      {/* 5. EXPERIENCE & INTERNSHIPS */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              Employment
            </span>
            <h2 className="text-xl font-extrabold text-slate-100">
              Work & Research Experience ({profile.experiences?.length || 0})
            </h2>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Experience
            </button>
          )}
        </div>

        <div className="space-y-4">
          {(profile.experiences || []).map((exp: any) => (
            <div
              key={exp.id}
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-sm text-slate-100">{exp.title}</h3>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-semibold text-brand-300">{exp.company}</span>
                </div>
                {exp.location && (
                  <p className="text-xs text-slate-400">{exp.location}</p>
                )}
                {exp.description && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">{exp.description}</p>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <span className="text-xs font-mono font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {exp.startDate} – {exp.endDate || (exp.isCurrent ? 'Present' : '')}
                </span>
                {isOwnProfile && (
                  <button
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="text-slate-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!profile.experiences || profile.experiences.length === 0) && (
          <p className="text-xs text-slate-500 italic text-center py-4">
            No employment or research experience listed yet.
          </p>
        )}
      </div>

      {/* 6. ACTIVE TEAM PROJECTS */}
      {profile.activeProjects?.length > 0 && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-slate-100">Active Project Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.activeProjects.map((ap: any, idx: number) => (
              <Link
                key={idx}
                to={`/workspace/${ap.projectId}`}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors block space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-100">{ap.project.title}</span>
                  <span className="text-[10px] text-brand-400 font-semibold">{ap.roleTitle}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{ap.project.publicTeaser}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: EDIT PROFILE */}
      {/* ========================================== */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title="Edit Student Profile"
        subtitle="Update your university affiliation, availability, and public links"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Graduation Year
              </label>
              <input
                type="number"
                value={editGradYear}
                onChange={(e) => setEditGradYear(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Degree / Course
              </label>
              <input
                type="text"
                placeholder="e.g. B.S. Computer Science"
                value={editCourse}
                onChange={(e) => setEditCourse(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Weekly Availability
              </label>
              <select
                value={editAvailability}
                onChange={(e) => setEditAvailability(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="0-5h">0-5 hours / week</option>
                <option value="5-10h">5-10 hours / week</option>
                <option value="10-20h">10-20 hours / week</option>
                <option value="20+h">20+ hours / week</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Bio
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell other students about your interests, project passions, and engineering mindset."
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              value={editInterests}
              onChange={(e) => setEditInterests(e.target.value)}
              placeholder="Graph Neural Networks, Autonomous Vehicles, Web3, Distributed Consensus"
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                value={editGithub}
                onChange={(e) => setEditGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                value={editPortfolio}
                onChange={(e) => setEditPortfolio(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 2: ADD SKILL & EVIDENCE */}
      {/* ========================================== */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Skill & Competency Evidence"
        subtitle="Provide proof-of-work (GitHub repo, portfolio demo, certificate) to unlock verified matching status"
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Skill Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PyTorch, Graph Neural Networks, ROS2, Flutter, Go..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="AI/ML">AI / Machine Learning</option>
                <option value="Hardware & IoT">Hardware & Robotics</option>
                <option value="Backend">Backend & Systems</option>
                <option value="Frontend">Frontend & Web</option>
                <option value="Mobile">Mobile Development</option>
                <option value="UI/UX & Design">UI/UX & Design</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Proficiency Level (1-5)
              </label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="1">1 - Novice (Introductory concepts)</option>
                <option value="2">2 - Beginner (Class projects)</option>
                <option value="3">3 - Intermediate (Functional applications)</option>
                <option value="4">4 - Advanced (Production / Hackathons)</option>
                <option value="5">5 - Expert (Published paper / Core maintainer)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              Skill Evidence Attachment
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Evidence Type
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="GITHUB_PROJECT">GitHub projects</option>
                  <option value="PORTFOLIO">Portfolio link</option>
                  <option value="CERTIFICATE">Certificates</option>
                  <option value="COMPLETED_PROJECT">Completed projects</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Evidence Project / Certificate Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. PyG Dynamic Routing Engine"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Evidence Link URL (GitHub / Demo / Credential)
              </label>
              <input
                type="url"
                placeholder="https://github.com/your-username/repo-name"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Evidence Summary (What did you implement?)
              </label>
              <textarea
                rows={2}
                placeholder="Implemented custom spatio-temporal GNN model in PyTorch Geometric achieving 94% benchmark accuracy."
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
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
              disabled={isSavingSkill || !skillName.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              {isSavingSkill ? 'Saving...' : 'Save Skill & Evidence'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 3: ADD EXPERIENCE */}
      {/* ========================================== */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title="Add Work / Research Experience"
        subtitle="Add employment, internships, or lab positions"
      >
        <form onSubmit={handleAddExperience} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Role Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ML Engineering Intern"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Company / Organization
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, MIT CSAIL, ISRO"
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={expLocation}
                onChange={(e) => setExpLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jun 2025"
                value={expStart}
                onChange={(e) => setExpStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="text"
                disabled={expCurrent}
                placeholder={expCurrent ? 'Present' : 'e.g. Sep 2025'}
                value={expEnd}
                onChange={(e) => setExpEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={expCurrent}
              onChange={(e) => setExpCurrent(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-brand-500"
            />
            <span>I currently work here / ongoing position</span>
          </label>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Description & Key Contributions
            </label>
            <textarea
              rows={3}
              placeholder="Engineered dashboard components in React. Reduced bundle load time by 28%."
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingExp}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              Save Experience
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 4: ADD HACKATHON */}
      {/* ========================================== */}
      <Modal
        isOpen={isHackathonModalOpen}
        onClose={() => setIsHackathonModalOpen(false)}
        title="Add Hackathon / Competition"
        subtitle="Showcase competition awards, finalist rankings, and track prizes"
      >
        <form onSubmit={handleAddHackathon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Hackathon Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TreeHacks 2026, HackMIT, CalHacks"
                value={hackTitle}
                onChange={(e) => setHackTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Date / Year
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Feb 2026"
                value={hackDate}
                onChange={(e) => setHackDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g. MedFlow Connect"
                value={hackProject}
                onChange={(e) => setHackProject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Award / Placement
              </label>
              <input
                type="text"
                placeholder="e.g. 🏆 1st Place Winner - AI Track"
                value={hackAward}
                onChange={(e) => setHackAward(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Devpost / Submission URL
            </label>
            <input
              type="url"
              placeholder="https://devpost.com/software/..."
              value={hackUrl}
              onChange={(e) => setHackUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Built an autonomous cross-hospital coordination system with real-time WebSockets."
              value={hackDesc}
              onChange={(e) => setHackDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsHackathonModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingHack}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              Save Hackathon
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 5: ADD PAST PROJECT */}
      {/* ========================================== */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Add Portfolio Project"
        subtitle="Feature open-source repos, web applications, or robotics builds"
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Project Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Spatial UI Component Library"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Your Role
              </label>
              <input
                type="text"
                placeholder="e.g. Creator & Lead Architect"
                value={projRole}
                onChange={(e) => setProjRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Technologies (comma-separated)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. React, TypeScript, PyTorch, ROS2, Docker"
              value={projTech}
              onChange={(e) => setProjTech(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe the system architecture, challenges overcome, and key features."
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={projGithub}
                onChange={(e) => setProjGithub(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Live Demo URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={projUrl}
                onChange={(e) => setProjUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProj}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              {isSavingProj ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 6: CONNECT GITHUB REPOSITORY EVIDENCE */}
      {/* ========================================== */}
      <Modal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        title="Connect GitHub Account"
        subtitle="Link your GitHub profile or provide your handle to attach public repositories and languages as transparent skill evidence"
      >
        <form onSubmit={handleConnectGithub} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              GitHub Username or Profile URL
            </label>
            <div className="relative">
              <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. torvalds or https://github.com/alicechen"
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              We analyze your public repositories, languages, and stars to calculate evidence confidence for your declared skills.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              Evidence-Confidence System
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Repositories are used strictly as supporting evidence. Connecting GitHub boosts evidence confidence but never automatically marks skills as officially "Verified".
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsGithubModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingGithub || !githubInput.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSavingGithub ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Repositories...
                </>
              ) : (
                'Connect & Sync Evidence'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
