import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FolderGit2,
  MessageSquare,
  Target,
  Lock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Clock,
  MessageCircle,
  FileText,
  Trash2,
  Activity,
  FileCheck2,
  Sparkles,
  Check,
  X,
  Star,
  Github,
  Globe,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { getSocket } from '../../services/socket';
import { DomainBadge, HealthBadge, SkillBadge, MatchScorePill, PrivacyIndicatorBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { TaskStatus, TaskPriority } from '@projectx/common';

export const ProjectWorkspacePage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'applications'>(
    tabParam === 'applications' ? 'applications' : 'overview'
  );
  const [hoveredSlice, setHoveredSlice] = useState<'completed' | 'remaining' | null>(null);

  const [project, setProject] = useState<any | null>(null);
  const [workspaceOverview, setWorkspaceOverview] = useState<any | null>(null);
  const [teamOverview, setTeamOverview] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [skillGaps, setSkillGaps] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedAppForModal, setSelectedAppForModal] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');
  const [taskWeight, setTaskWeight] = useState<number>(25);
  const [taskInitialProgress, setTaskInitialProgress] = useState<number>(0);
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskMilestoneId, setTaskMilestoneId] = useState<string>('');

  // Task Details & Comments Modal
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [taskCommentInput, setTaskCommentInput] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // File Upload / Link Modal
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileCategory, setFileCategory] = useState('DOC');

  // Milestone Modal
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');

  // Team Management State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCandidateId, setInviteCandidateId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleTitle, setInviteRoleTitle] = useState('');
  const [inviteCustomMessage, setInviteCustomMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetMember, setAssignTargetMember] = useState<any | null>(null);
  const [assignRoleTitle, setAssignRoleTitle] = useState('');
  const [assignProjectRoleId, setAssignProjectRoleId] = useState('');
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const [
        projRes,
        overviewRes,
        tasksRes,
        filesRes,
        milestonesRes,
        teamRes,
        healthRes,
        appsRes,
        chatRes,
        gapsRes,
      ] = await Promise.allSettled([
        api.get(`/projects/${projectId}`),
        api.get(`/workspace/projects/${projectId}/overview`),
        api.get(`/workspace/projects/${projectId}/tasks`),
        api.get(`/workspace/projects/${projectId}/files`),
        api.get(`/workspace/projects/${projectId}/milestones`),
        api.get(`/projects/${projectId}/team`),
        api.get(`/health/projects/${projectId}/health`),
        api.get(`/applications/received?projectId=${projectId}`),
        api.get(`/workspace/projects/${projectId}/chat`),
        api.get(`/projects/${projectId}/gaps`),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value.data.success) {
        setProject(projRes.value.data.data);
      }
      if (overviewRes.status === 'fulfilled' && overviewRes.value.data.success) {
        setWorkspaceOverview(overviewRes.value.data.data);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.data.success) {
        setTasks(tasksRes.value.data.data);
      }
      if (filesRes.status === 'fulfilled' && filesRes.value.data.success) {
        setFiles(filesRes.value.data.data);
      }
      if (milestonesRes.status === 'fulfilled' && milestonesRes.value.data.success) {
        setMilestones(milestonesRes.value.data.data);
      }
      if (teamRes.status === 'fulfilled' && teamRes.value.data.success) {
        setTeamOverview(teamRes.value.data.data);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.data.success) {
        setHealthData(healthRes.value.data.data);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
        setApplications(appsRes.value.data.data);
      }
      if (chatRes.status === 'fulfilled' && chatRes.value.data.success) {
        setChatMessages(chatRes.value.data.data);
      }
      if (gapsRes.status === 'fulfilled' && gapsRes.value.data.success) {
        setSkillGaps(gapsRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidateMatches = async () => {
    if (!projectId) return;
    try {
      const res = await api.get(`/projects/${projectId}/matches`);
      if (res.data.success) {
        setCandidates(res.data.data.matches || []);
      }
    } catch (err) {
      console.error('Error fetching candidate matches:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchCandidateMatches();

    const socket = getSocket();
    socket.emit('join_project', projectId);

    socket.on('task_created', (newTask: any) => {
      setTasks((prev) => [...prev.filter((t) => t.id !== newTask.id), newTask]);
    });

    socket.on('task_updated', (updatedTask: any) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    });

    socket.on('health_updated', (healthReport: any) => {
      setHealthData(healthReport);
    });

    socket.on('task_comment_added', (comment: any) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === comment.taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
        )
      );
      if (selectedTaskForDetail?.id === comment.taskId) {
        setSelectedTaskForDetail((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), comment],
        }));
      }
    });

    socket.on('file_added', (newFile: any) => {
      setFiles((prev) => [newFile, ...prev]);
    });

    socket.on('new_message', (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('team_updated', () => {
      fetchProjectData();
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('health_updated');
      socket.off('task_comment_added');
      socket.off('file_added');
      socket.off('new_message');
      socket.off('team_updated');
    };
  }, [projectId]);

  // Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !projectId) return;

    try {
      const res = await api.post(`/workspace/projects/${projectId}/tasks`, {
        projectId,
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
        weight: Number(taskWeight) || 0,
        progress: Number(taskInitialProgress) || 0,
        dueDate: taskDueDate || undefined,
        milestoneId: taskMilestoneId || undefined,
      });

      if (res.data.success) {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskDueDate('');
        setTaskMilestoneId('');
        setTaskAssigneeId('');
        setTaskWeight(25);
        setTaskInitialProgress(0);
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await api.patch(`/workspace/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...res.data.data } : t)));
      } else {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      }
      fetchProjectData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating task status.');
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, newProgress: number) => {
    try {
      const res = await api.patch(`/workspace/tasks/${taskId}/status`, { progress: newProgress });
      if (res.data?.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...res.data.data } : t)));
        const overviewRes = await api.get(`/workspace/projects/${projectId}/overview`);
        if (overviewRes.data?.success) {
          setWorkspaceOverview(overviewRes.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating task progress.');
    }
  };

  const handlePostTaskComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDetail || !taskCommentInput.trim()) return;

    setIsPostingComment(true);
    try {
      const res = await api.post(`/workspace/tasks/${selectedTaskForDetail.id}/comments`, {
        content: taskCommentInput.trim(),
      });
      if (res.data.success) {
        setTaskCommentInput('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error posting comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // File handlers
  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;

    try {
      const res = await api.post(`/workspace/projects/${projectId}/files`, {
        name: fileName.trim(),
        url: fileUrl.trim(),
        category: fileCategory,
      });

      if (res.data.success) {
        setIsFileModalOpen(false);
        setFileName('');
        setFileUrl('');
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding file resource.');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to remove this file link?')) return;
    try {
      await api.delete(`/workspace/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error removing file.');
    }
  };

  // Milestone handlers
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDueDate) return;

    try {
      const res = await api.post(`/workspace/projects/${projectId}/milestones`, {
        title: milestoneTitle.trim(),
        description: milestoneDesc.trim() || undefined,
        dueDate: milestoneDueDate,
      });

      if (res.data.success) {
        setIsMilestoneModalOpen(false);
        setMilestoneTitle('');
        setMilestoneDesc('');
        setMilestoneDueDate('');
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating milestone.');
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/workspace/milestones/${milestoneId}/status`, {
        isCompleted: !currentStatus,
      });
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, isCompleted: !currentStatus } : m))
      );
      fetchProjectData();
    } catch (err) {
      console.error('Error updating milestone:', err);
    }
  };

  // Chat handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !projectId) return;

    const content = chatInput.trim();
    setChatInput('');
    try {
      await api.post(`/workspace/projects/${projectId}/chat`, {
        projectId,
        content,
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Team Member Role / Invite handlers
  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetMember || !assignRoleTitle.trim()) return;
    setIsAssigningRole(true);
    try {
      const res = await api.patch(`/projects/${projectId}/members/${assignTargetMember.memberId}/role`, {
        roleTitle: assignRoleTitle.trim(),
        projectRoleId: assignProjectRoleId || undefined,
      });
      if (res.data.success) {
        setIsAssignModalOpen(false);
        setAssignTargetMember(null);
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error assigning member role.');
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    try {
      const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
      if (res.data.success) {
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error removing member.');
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInvite(true);
    try {
      const res = await api.post(`/projects/${projectId}/invitations`, {
        candidateId: inviteCandidateId || undefined,
        email: inviteEmail.trim() || undefined,
        roleTitle: inviteRoleTitle.trim() || 'Builder',
        customMessage: inviteCustomMessage.trim() || undefined,
      });
      if (res.data.success) {
        alert(res.data.message || 'Invitation dispatched successfully!');
        setIsInviteModalOpen(false);
        setInviteCandidateId('');
        setInviteEmail('');
        setInviteRoleTitle('');
        setInviteCustomMessage('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error sending invitation.');
    } finally {
      setIsSendingInvite(false);
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
        await fetchProjectData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reviewing application.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-200">Workspace Unavailable</h2>
      </div>
    );
  }

  // Determine if logged-in user is project owner / creator
  const isOwner = project?.creatorId === user?.id || project?.isOwner || (teamOverview?.members?.find((m: any) => m.userId === user?.id)?.isCreator);

  // All team participants (including Lead and Members)
  const allTeamMembers = teamOverview?.members || (
    project?.members ? [
      ...(project.creator ? [{ userId: project.creator.id || project.creatorId, name: project.creator.name, college: project.creator.college?.name || project.creator.college || 'Lead', roleTitle: 'Project Lead', isCreator: true }] : []),
      ...project.members
    ] : []
  );

  // Calculate Task Counts & Progress
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  const remainingTasksCount = totalTasksCount - completedTasksCount;

  // Weighted task calculation
  const totalExplicitWeight = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
  let calculatedProgress = 0;
  if (totalTasksCount > 0) {
    if (totalExplicitWeight > 0) {
      calculatedProgress = tasks.reduce((sum, t) => {
        const w = t.weight || 0;
        const prog = t.progress !== undefined && t.progress !== null
          ? t.progress
          : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
        return sum + (w * (prog / 100));
      }, 0);
    } else {
      calculatedProgress = tasks.reduce((sum, t) => {
        const prog = t.progress !== undefined && t.progress !== null
          ? t.progress
          : (t.status === 'DONE' ? 100 : t.status === 'IN_REVIEW' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 0);
        return sum + ((100 / totalTasksCount) * (prog / 100));
      }, 0);
    }
  }
  const completionPercentage = Math.min(100, Math.max(0, Math.round(calculatedProgress)));
  const remainingPercentage = Math.max(0, 100 - completionPercentage);

  // Simple, Understandable Project Status
  const getProjectStatus = () => {
    if (totalTasksCount === 0) {
      return { label: 'ON TRACK', text: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' };
    }
    const now = new Date();
    // 1. Deadline passed with incomplete tasks -> DELAYED
    if (project?.deadline && new Date(project.deadline) < now && completedTasksCount < totalTasksCount) {
      return { label: 'DELAYED', text: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800/60' };
    }
    // 2. Overdue tasks exist -> AT RISK
    const hasOverdueTasks = tasks.some(
      (t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
    );
    if (hasOverdueTasks) {
      return { label: 'AT RISK', text: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60' };
    }
    // 3. Otherwise -> ON TRACK
    return { label: 'ON TRACK', text: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' };
  };

  const projectStatus = getProjectStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ==================================================== */}
      {/* MINIMAL PROJECT HEADER */}
      {/* ==================================================== */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {project.domain || 'Engineering & Technology'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${projectStatus.text}`}
              >
                {projectStatus.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-0.5">
              <span>{project.members?.length || 1} Members</span>
              <span>•</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {completionPercentage}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => {
                const used = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
                setTaskWeight(Math.max(0, 100 - used));
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>
          </div>
        </div>

        {/* Workspace Tabs: Overview | Team | Applications */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'team'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team ({project.members?.length || teamOverview?.members?.length || 1})</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'applications'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Applications ({applications.length})</span>
              {applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                  {applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length} new
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Top Banner when pending applications exist */}
      {isOwner && applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length > 0 && activeTab !== 'applications' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-brand-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                You have {applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length} pending role application{applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length > 1 ? 's' : ''} awaiting your decision.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Review candidates directly and accept or reject them to update your team roster.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('applications')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all self-start sm:self-auto shrink-0"
          >
            Review Applications →
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 1: SIMPLE PROJECT OVERVIEW & PROGRESS */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Doughnut Chart Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-8 relative">
            {/* Section Heading */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Project Progress
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Task completion breakdown for {project.title}
              </p>
            </div>

            {/* Interactive Doughnut Chart Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center group">
              {/* Floating Tooltip on Hover / Touch */}
              {hoveredSlice === 'completed' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-full px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-emerald-500/50 shadow-2xl text-center pointer-events-none z-30 transition-all duration-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Completed
                  </div>
                  <div className="text-lg font-extrabold font-mono text-white">
                    {completionPercentage}%
                  </div>
                  <div className="text-xs text-slate-300">
                    {completedTasksCount} {completedTasksCount === 1 ? 'task' : 'tasks'}
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-emerald-500/50 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                </div>
              )}

              {hoveredSlice === 'remaining' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-full px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-slate-600 shadow-2xl text-center pointer-events-none z-30 transition-all duration-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Remaining
                  </div>
                  <div className="text-lg font-extrabold font-mono text-white">
                    {remainingPercentage}%
                  </div>
                  <div className="text-xs text-slate-300">
                    {remainingTasksCount} {remainingTasksCount === 1 ? 'task' : 'tasks'}
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-600 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                </div>
              )}

              {/* SVG Doughnut */}
              <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 200 200">
                {/* Remaining Slice (Background Ring) */}
                <circle
                  cx="100"
                  cy="100"
                  r="78"
                  stroke="currentColor"
                  strokeWidth={hoveredSlice === 'remaining' ? 24 : 18}
                  fill="transparent"
                  className={`text-slate-200 dark:text-slate-800 transition-all duration-300 cursor-pointer ${
                    hoveredSlice === 'remaining' ? 'text-slate-300 dark:text-slate-700' : ''
                  }`}
                  onMouseEnter={() => setHoveredSlice('remaining')}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => setHoveredSlice(hoveredSlice === 'remaining' ? null : 'remaining')}
                  onTouchStart={() => setHoveredSlice(hoveredSlice === 'remaining' ? null : 'remaining')}
                />

                {/* Completed Slice (Foreground Ring) */}
                {totalTasksCount > 0 && completionPercentage > 0 && (
                  <circle
                    cx="100"
                    cy="100"
                    r="78"
                    stroke="#22c55e"
                    strokeWidth={hoveredSlice === 'completed' ? 24 : 18}
                    strokeDasharray={490.09}
                    strokeDashoffset={490.09 * (1 - completionPercentage / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 cursor-pointer drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                    onMouseEnter={() => setHoveredSlice('completed')}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => setHoveredSlice(hoveredSlice === 'completed' ? null : 'completed')}
                    onTouchStart={() => setHoveredSlice(hoveredSlice === 'completed' ? null : 'completed')}
                  />
                )}
              </svg>

              {/* Center Doughnut Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                  {completionPercentage}%
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Complete
                </span>
              </div>
            </div>

            {/* Below Chart Text & Interactive Legend */}
            <div className="space-y-4">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                {totalTasksCount === 0
                  ? 'No tasks yet'
                  : `${completedTasksCount} of ${totalTasksCount} tasks completed (${completionPercentage}% weighted progress)`}
              </p>

              {totalTasksCount > 0 ? (
                <div className="flex items-center justify-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredSlice('completed')}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => setHoveredSlice(hoveredSlice === 'completed' ? null : 'completed')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
                      hoveredSlice === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Completed ({completedTasksCount})</span>
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setHoveredSlice('remaining')}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => setHoveredSlice(hoveredSlice === 'remaining' ? null : 'remaining')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
                      hoveredSlice === 'remaining'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span>Remaining ({remainingTasksCount})</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Create your first task to start tracking project progress.
                  </p>
                  <button
                    onClick={() => {
                      setTaskWeight(100);
                      setIsTaskModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Task</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Task Progress & Breakdown Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-500" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    Sprint Tasks & Member Progress
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Individual task progress and weighted contributions directly driving overall project health.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                  totalExplicitWeight >= 100
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
                }`}>
                  Weight Budget: {totalExplicitWeight}% / 100%
                </span>
                <button
                  onClick={() => {
                    const used = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
                    setTaskWeight(Math.max(0, 100 - used));
                    setIsTaskModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Task list */}
            {tasks.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No sprint tasks created yet</p>
                <p className="text-xs text-slate-400">Create weighted sprint tasks to track real-time delivery velocity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const isLead = isOwner;
                  const isAssignee = task.assignee?.id === user?.id || task.assigneeId === user?.id;
                  const canUpdate = isLead || isAssignee;
                  const prog = task.progress !== undefined ? task.progress : (task.status === 'DONE' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0);

                  return (
                    <div
                      key={task.id}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {/* Top Row: Title, Priority, Weight, Contribution, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                                : task.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {task.priority}
                            </span>
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                              {task.title}
                            </h4>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 font-bold text-xs">
                            {task.weight || 0}% Weight
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-bold text-xs">
                            +{task.weightedContribution ?? 0}% Contrib.
                          </span>
                          <span className={`px-2.5 py-1 rounded-xl font-bold text-xs border ${
                            task.status === 'DONE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
                              : task.status === 'IN_REVIEW'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {task.status === 'DONE' ? 'Completed' : task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'IN_REVIEW' ? 'In Review' : 'To Do'}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Assigned Member */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Assignee:
                          </span>
                          {task.assignee ? (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <img
                                src={task.assignee.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${task.assignee.name}`}
                                alt={task.assignee.name}
                                className="w-5 h-5 rounded-full object-cover bg-slate-100 dark:bg-slate-800"
                              />
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {task.assignee.name}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                ({task.assignee.college?.split(' ')[0] || 'Member'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-500 dark:text-amber-400 font-semibold italic text-xs">
                              Unassigned
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Comments ({task.comments?.length || 0})</span>
                        </button>
                      </div>

                      {/* Progress Bar & Interactive Quick Progress Buttons */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Task Progress: <span className="font-mono text-brand-600 dark:text-brand-400">{prog}%</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Contributes <span className="font-bold text-emerald-600 dark:text-emerald-400">+{task.weightedContribution ?? 0}%</span> of total project
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              prog === 100
                                ? 'bg-emerald-500'
                                : prog > 0
                                ? 'bg-brand-500'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>

                        {/* Member Progress Controls */}
                        {canUpdate ? (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                              Update Progress:
                            </span>
                            {[
                              { label: '0% (Todo)', val: 0 },
                              { label: '25%', val: 25 },
                              { label: '50% (In Progress)', val: 50 },
                              { label: '75% (Review)', val: 75 },
                              { label: '100% (Done)', val: 100 },
                            ].map((btn) => (
                              <button
                                key={btn.val}
                                type="button"
                                onClick={() => handleUpdateTaskProgress(task.id, btn.val)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  prog === btn.val
                                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-400/50'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Assigned to {task.assignee?.name || 'team member'}. (Assignee or Lead can update)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 2: CLEAN TEAM ROSTER */}
      {/* ==================================================== */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Team Members
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Active students and builders collaborating on {project.title}
              </p>
            </div>

            {project?.isOwner && (
              <button
                onClick={() => {
                  setInviteCandidateId('');
                  setInviteEmail('');
                  setInviteRoleTitle(project?.roles?.[0]?.title || 'Builder');
                  setIsInviteModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Invite Student</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(teamOverview?.members || project.members || []).map((m: any) => (
              <div
                key={m.id || m.userId}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.name}`}
                      alt={m.name}
                      className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                          {m.name}
                        </h3>
                        {m.isCreator ? (
                          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 font-extrabold text-[10px] uppercase tracking-wider">
                            Owner
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px]">
                            Builder
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {m.college || m.collegeName || 'Verified University'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    {m.roleTitle || 'Builder'}
                  </span>
                </div>

                {/* Member Skills */}
                {m.skills && m.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.skills.map((sk: any, sIdx: number) => (
                        <SkillBadge
                          key={sIdx}
                          name={sk.skillName || sk.name}
                          minLevel={sk.proficiency || sk.level}
                          hasEvidence={sk.isVerified}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <Link
                    to={`/profile/${m.userId || m.id}`}
                    className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  {project?.isOwner && !m.isCreator && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAssignTargetMember(m);
                          setAssignRoleTitle(m.roleTitle || 'Builder');
                          setIsAssignModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m.memberId || m.id, m.name)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-semibold text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 3: APPLICANT REVIEW & TEAM FORMATION */}
      {/* ==================================================== */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Candidate Applications ({applications.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Review, shortlist, and accept applicants to assemble your project team
              </p>
            </div>

            {applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 self-start sm:self-auto shadow-sm">
                {applications.filter((a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW').length} Pending Decision
              </span>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                No Applications Received Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When students apply for open roles on {project.title}, their applications and match scores will appear here for you to accept or reject.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app: any) => {
                const applicant = app.applicant;
                const skills = applicant?.skills || [];
                const isActionLoading = actionLoadingId === app.id;
                const isPending = app.status === 'PENDING' || app.status === 'UNDER_REVIEW';

                return (
                  <div
                    key={app.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Role: <strong className="text-brand-600 dark:text-brand-400">{app.roleTitle || app.roleName || 'Team Member'}</strong>
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

                    {/* Applicant Info & Pitch */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={
                            applicant?.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${applicant?.name || 'Applicant'}`
                          }
                          alt={applicant?.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-sm"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {applicant?.name}
                            </h3>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {applicant?.collegeName || applicant?.college || 'Sanjivani University'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {applicant?.course || applicant?.major || 'Undergraduate Student'}
                              {applicant?.graduationYear ? ` • Class of ${applicant.graduationYear}` : ''}
                            </p>
                          </div>

                          {/* Pitch */}
                          {app.pitch && (
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
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

                      {/* Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col items-stretch justify-end gap-2 shrink-0 pt-2 lg:pt-0">
                        {isPending ? (
                          <>
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
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReviewApplication(app.id, app.status === 'ACCEPTED' ? 'REJECTED' : 'ACCEPTED')}
                              disabled={isActionLoading}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 underline"
                            >
                              Change Decision
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedAppForModal(app)}
                          className="w-full text-center px-3 py-1.5 rounded-xl font-semibold text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          View Full Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Sprint Task"
        subtitle="Add a task to the team workspace"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement GNN trajectory loss function..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide implementation details, reference endpoints, or PR acceptance criteria..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Task Weight (%) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                required
                value={taskWeight}
                onChange={(e) => setTaskWeight(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Allocated so far: {totalExplicitWeight}%. Available: {Math.max(0, 100 - totalExplicitWeight)}%.
              </p>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Initial Progress (%)
              </label>
              <select
                value={taskInitialProgress}
                onChange={(e) => setTaskInitialProgress(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
              >
                <option value={0}>0% (To Do)</option>
                <option value={25}>25%</option>
                <option value={50}>50% (In Progress)</option>
                <option value={75}>75% (In Review)</option>
                <option value={100}>100% (Done)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Assignee (Team Member)
            </label>
            <select
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {allTeamMembers.map((m: any) => (
                <option key={m.userId || m.id} value={m.userId || m.id}>
                  {m.name} ({m.college || m.collegeName || 'Member'}) — {m.roleTitle || (m.isCreator ? 'Owner' : 'Builder')}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* TASK DETAILS & COMMENTS MODAL */}
      <Modal
        isOpen={!!selectedTaskForDetail}
        onClose={() => setSelectedTaskForDetail(null)}
        title={selectedTaskForDetail?.title || 'Task Details'}
        subtitle={`Status: ${selectedTaskForDetail?.status}`}
      >
        {selectedTaskForDetail && (
          <div className="space-y-5 text-xs">
            {/* Status Switcher Toolbar */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400">Advance Workflow:</span>
              <div className="flex items-center gap-1.5">
                {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      handleUpdateTaskStatus(selectedTaskForDetail.id, st);
                      setSelectedTaskForDetail({ ...selectedTaskForDetail, status: st });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedTaskForDetail.status === st
                        ? 'bg-brand-500 text-slate-950 shadow-glow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {st === 'TODO' ? 'To Do' : st === 'IN_PROGRESS' ? 'In Progress' : st === 'IN_REVIEW' ? 'Review' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            {selectedTaskForDetail.description && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Description:</span>
                <p className="text-slate-200 leading-relaxed">{selectedTaskForDetail.description}</p>
              </div>
            )}

            {/* Comments Thread */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-brand-400" />
                Discussion Thread ({selectedTaskForDetail.comments?.length || 0})
              </span>

              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {(!selectedTaskForDetail.comments || selectedTaskForDetail.comments.length === 0) ? (
                  <p className="text-slate-500 italic py-2">No comments yet. Leave a note for the team below.</p>
                ) : (
                  selectedTaskForDetail.comments.map((cmt: any, cIdx: number) => (
                    <div key={cIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{cmt.authorName} ({cmt.authorCollege.split(' ')[0]})</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{cmt.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Post Comment Form */}
              <form onSubmit={handlePostTaskComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a comment to this task..."
                  value={taskCommentInput}
                  onChange={(e) => setTaskCommentInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !taskCommentInput.trim()}
                  className="px-4 py-2 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 text-xs inline-flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Post
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* FILE UPLOAD / RESOURCE LINK MODAL */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title="Share File or Resource Link"
        subtitle="Add documentation, dataset, design, or repo links"
      >
        <form onSubmit={handleAddFile} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Resource / File Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Model Architecture Diagram, Dataset Pipeline Notebook"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Resource URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/... or https://github.com/..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={fileCategory}
              onChange={(e) => setFileCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
            >
              <option value="DOC">Documentation / PDF Spec</option>
              <option value="CODE">Source Code / Repo</option>
              <option value="DATASET">Dataset / Data Pipeline</option>
              <option value="DESIGN">UI / Figma / Design Spec</option>
              <option value="OTHER">Other Resource</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFileModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim() || !fileUrl.trim()}
              className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              Add Resource
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE MILESTONE MODAL */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Set Delivery Milestone"
        subtitle="Add a project goal to the roadmap"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Milestone Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Phase 1: MAVLink Telemetry Bridge MVP"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Due Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={milestoneDueDate}
              onChange={(e) => setMilestoneDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Outline deliverables required to complete this milestone..."
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMilestoneModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!milestoneTitle.trim() || !milestoneDueDate}
              className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              Save Milestone
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN ROLE MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignTargetMember(null);
        }}
        title={`Assign Role to ${assignTargetMember?.name}`}
        subtitle="Update member responsibility and project role"
      >
        <form onSubmit={handleAssignRoleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Predefined Role or Custom Title
            </label>
            <select
              value={assignProjectRoleId}
              onChange={(e) => {
                setAssignProjectRoleId(e.target.value);
                const selected = (teamOverview?.roles || []).find((r: any) => r.id === e.target.value);
                if (selected) {
                  setAssignRoleTitle(selected.title);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-brand-500 mb-2"
            >
              <option value="">Custom Role Title (Type Below)</option>
              {(teamOverview?.roles || []).map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.isFilled ? '(Already Filled)' : '(Open Position)'}
                </option>
              ))}
            </select>

            <input
              type="text"
              required
              placeholder="e.g. Lead ML Engineer"
              value={assignRoleTitle}
              onChange={(e) => setAssignRoleTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAssignModalOpen(false);
                setAssignTargetMember(null);
              }}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigningRole || !assignRoleTitle.trim()}
              className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all"
            >
              {isAssigningRole ? 'Assigning...' : 'Save Role Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* INVITE CANDIDATE MODAL */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Student to Team"
        subtitle={`Project: ${project?.title}`}
      >
        <form onSubmit={handleSendInvitation} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Candidate University Email or User ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. student@mit.edu or user UUID"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Role Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ML Engineer"
              value={inviteRoleTitle}
              onChange={(e) => setInviteRoleTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Personalized Invitation Note (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="We saw your research in Computer Vision and would love for you to lead our ML pipeline..."
              value={inviteCustomMessage}
              onChange={(e) => setInviteCustomMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              Candidate receives an in-app notification & professional invite email. Your contact details remain confidential.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSendingInvite || (!inviteEmail.trim() && !inviteCandidateId)}
              className="px-5 py-2.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-glow disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
            >
              {isSendingInvite ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Invitation
                </>
              )}
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
