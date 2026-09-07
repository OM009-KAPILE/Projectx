import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Compass,
  ArrowRight,
  RotateCcw,
  Building2,
  Users,
  Clock,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';

const SKILL_OPTIONS = [
  'All Skills',
  'Python',
  'React',
  'TypeScript',
  'PyTorch',
  'Machine Learning',
  'Node.js',
  'Flutter',
  'C++',
  'Go',
  'Docker',
  'ROS2',
  'Solidity',
];

const CATEGORIES = [
  'All Categories',
  'Robotics & Applied AI',
  'Autonomous Drones',
  'Healthcare & AI',
  'FinTech & DeFi',
  'Climate & CleanTech',
  'Distributed Systems',
  'Web3 & Cryptography',
];

export const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [sentApplications, setSentApplications] = useState<any[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('query') || '');
  const [selectedSkill, setSelectedSkill] = useState<string>('All Skills');
  const [selectedCollege, setSelectedCollege] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('RECRUITING');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  const fetchColleges = async () => {
    try {
      const res = await api.get('/colleges');
      if (res.data.success) {
        setColleges(res.data.data || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchUserStatus = async () => {
    if (!user) return;
    try {
      const [appsRes, joinedRes] = await Promise.allSettled([
        api.get('/applications/sent'),
        api.get('/projects/user/joined'),
      ]);
      if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
        setSentApplications(appsRes.value.data.data || []);
      }
      if (joinedRes.status === 'fulfilled' && joinedRes.value.data.success) {
        setJoinedProjects(joinedRes.value.data.data || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (selectedSkill !== 'All Skills') params.skill = selectedSkill;
      if (selectedCollege !== 'ALL') params.collegeId = selectedCollege;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedCategory !== 'All Categories') params.domain = selectedCategory;

      const res = await api.get('/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
    fetchUserStatus();
    const socket = getSocket();
    const handleUpdate = () => {
      fetchUserStatus();
      fetchProjects();
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

  useEffect(() => {
    fetchProjects();
  }, [selectedSkill, selectedCollege, selectedStatus, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSkill('All Skills');
    setSelectedCollege('ALL');
    setSelectedStatus('RECRUITING');
    setSelectedCategory('All Categories');
    setSearchParams({});
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Explore Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Find a project to join.
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

      {/* 2. Search & Useful Filters */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, skill, or keyword..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-all"
          >
            Search
          </button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Skill Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Skill:</span>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {SKILL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* College Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">College:</span>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
              >
                <option value="ALL">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="RECRUITING">Recruiting</option>
                <option value="ALL">All Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3. Project Listings Feed */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse h-48"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
            <Compass className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No projects found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or filters to find available projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const isOwner = !!user && (p.creator?.id === user.id || p.creatorId === user.id);
              const isMember = isMemberOfProject(p.id);
              const hasApplied = isAppliedToProject(p.id);
              const currentMembers = p.memberCount || p.members?.length || 1;
              const maxMembers = p.teamSize || 4;
              const isFull = currentMembers >= maxMembers;

              // Collect unique skills
              const skillSet = new Set<string>();
              (p.openRoles || p.requiredRoles || []).forEach((r: any) => {
                (r.requiredSkills || []).forEach((s: any) => {
                  skillSet.add(s.skillName || s.skill?.name || s.name || s);
                });
              });
              const skillsList = Array.from(skillSet);

              return (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60">
                        {p.status || 'Recruiting'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentMembers} / {maxMembers} members</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {p.publicTeaser || p.problemStatement || 'Student engineering project.'}
                      </p>
                    </div>

                    {/* Required Skills */}
                    {skillsList.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Required Skills:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {skillsList.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {skillsList.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{skillsList.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Duration: {p.duration || '8 weeks'}</span>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{p.creator?.college || 'Campus'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Button */}
                  <div>
                    {isOwner ? (
                      <Link
                        to={`/my-projects?tab=lead&project=${p.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition-colors"
                      >
                        <span>Manage Project</span>
                      </Link>
                    ) : isMember ? (
                      <Link
                        to={`/workspace/${p.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Open Project</span>
                      </Link>
                    ) : hasApplied ? (
                      (() => {
                        const userApp = getApplicationForProject(p.id);
                        const st = userApp?.status || 'PENDING';
                        if (st === 'ACCEPTED') {
                          return (
                            <Link
                              to={`/workspace/${p.id}`}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accepted • Open Workspace</span>
                            </Link>
                          );
                        }
                        if (st === 'SHORTLISTED') {
                          return (
                            <Link
                              to={`/projects/${p.id}`}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Application Shortlisted</span>
                            </Link>
                          );
                        }
                        if (st === 'REJECTED') {
                          return (
                            <Link
                              to={`/projects/${p.id}`}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-colors"
                            >
                              <span>Application Rejected</span>
                            </Link>
                          );
                        }
                        return (
                          <Link
                            to={`/projects/${p.id}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Application Pending</span>
                          </Link>
                        );
                      })()
                    ) : isFull ? (
                      <div className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Team Full
                      </div>
                    ) : (
                      <Link
                        to={`/projects/${p.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
                      >
                        <span>View & Apply</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
