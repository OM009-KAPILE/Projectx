import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Building2,
  Globe,
  Lock,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

const CATEGORIES = [
  'Robotics & Applied AI',
  'Autonomous Drones',
  'Healthcare & AI',
  'FinTech & DeFi',
  'Climate & CleanTech',
  'Distributed Systems',
  'Developer Tools & Compilers',
  'Web3 & Cryptography',
];

const SUGGESTED_SKILLS = [
  'Python',
  'PyTorch',
  'React',
  'TypeScript',
  'C++',
  'Go',
  'Docker',
  'ROS2',
  'FastAPI',
  'PostgreSQL',
  'GraphQL',
  'Solidity',
  'TensorFlow',
  'Figma',
];

export const ProjectCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState(CATEGORIES[0]);
  const [pitch, setPitch] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [duration, setDuration] = useState('8 weeks');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [visibility, setVisibility] = useState<'ALL_COLLEGES' | 'SAME_COLLEGE'>('ALL_COLLEGES');

  // Skills & Roles
  const [skills, setSkills] = useState<string[]>(['Python', 'React']);
  const [skillInput, setSkillInput] = useState('');
  const [roles, setRoles] = useState<{ title: string; requiredMembers: number }[]>([
    { title: 'Full-Stack Developer', requiredMembers: 1 },
    { title: 'AI / ML Engineer', requiredMembers: 1 },
  ]);
  const [roleInput, setRoleInput] = useState('');
  const [roleCountInput, setRoleCountInput] = useState(1);

  // AI & Submission Status
  const [isImprovingAI, setIsImprovingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || skillInput).trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddRole = () => {
    const r = roleInput.trim();
    if (r && !roles.some((role) => role.title.toLowerCase() === r.toLowerCase())) {
      setRoles([...roles, { title: r, requiredMembers: Math.max(1, Number(roleCountInput) || 1) }]);
      setRoleInput('');
      setRoleCountInput(1);
    }
  };

  const handleRemoveRole = (roleTitleToRemove: string) => {
    setRoles(roles.filter((r) => r.title !== roleTitleToRemove));
  };

  // Optional AI Pitch & Role Enhancer (Background assistant)
  const handleImproveWithAI = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a project title first before using AI improvement.');
      return;
    }

    setIsImprovingAI(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/projects/ai-analyze', {
        pitch: pitch || title,
        creatorCollegeDomain: user?.college?.domain || 'stanford.edu',
      });

      if (res.data.success && res.data.data) {
        const aiData = res.data.data;
        if (aiData.problemStatement && !pitch) {
          setPitch(aiData.problemStatement);
        }
        if (aiData.domain) {
          const matchCat = CATEGORIES.find((c) => c.toLowerCase().includes(aiData.domain.toLowerCase()));
          if (matchCat) setDomain(matchCat);
        }
        if (aiData.recommendedRoles && aiData.recommendedRoles.length > 0) {
          const newRoles = aiData.recommendedRoles.map((r: any) => ({
            title: r.title,
            requiredMembers: r.requiredMembers || 1,
          }));
          const existingTitles = new Set(roles.map((r) => r.title.toLowerCase()));
          const combined = [...roles];
          newRoles.forEach((nr: any) => {
            if (!existingTitles.has(nr.title.toLowerCase())) {
              combined.push(nr);
              existingTitles.add(nr.title.toLowerCase());
            }
          });
          setRoles(combined);

          const newSkills: string[] = [];
          aiData.recommendedRoles.forEach((r: any) => {
            r.skills?.forEach((s: any) => newSkills.push(s.skillName));
          });
          if (newSkills.length > 0) {
            setSkills(Array.from(new Set([...skills, ...newSkills])));
          }
        }
      }
    } catch (err: any) {
      console.warn('AI assistance fallback:', err);
    } finally {
      setIsImprovingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanPitch = pitch.trim();

    if (cleanTitle.length < 3) {
      setErrorMessage('Project title must be at least 3 characters long.');
      return;
    }

    if (cleanPitch.length < 10) {
      setErrorMessage('Please provide a pitch description of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Build structured roles with requiredSkills
      const activeSkills = skills.length > 0 ? skills : ['General Contributor'];
      const activeRoles = roles.length > 0 ? roles : [{ title: 'Core Contributor', requiredMembers: 1 }];

      const formattedRoles = activeRoles.map((role) => ({
        title: role.title,
        description: `Collaborate as ${role.title} on core milestones and deliverables.`,
        requiredMembers: role.requiredMembers || 1,
        requiredSkills: activeSkills.map((s) => ({
          skillName: s,
          minLevel: 3,
          category: 'Technical',
          isCritical: true,
        })),
      }));

      const payload = {
        title: cleanTitle,
        pitch: cleanPitch,
        publicTeaser: cleanPitch.length >= 10 ? cleanPitch.slice(0, 160) : `${cleanPitch} - Cross-college project opportunity.`,
        problemStatement: cleanPitch,
        domain,
        duration: duration || '8 weeks',
        difficulty: difficulty || 'INTERMEDIATE',
        teamSize: Number(teamSize) || 4,
        collegeVisibility: visibility,
        selectedColleges: [],
        roles: formattedRoles,
      };

      const res = await api.post('/projects', payload);
      if (res.data.success && res.data.data) {
        navigate(`/projects/${res.data.data.id}`);
      } else {
        navigate('/explore');
      }
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorDetails = err.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(' • ');
        setErrorMessage(`Validation error: ${errorDetails}`);
      } else {
        setErrorMessage(err.response?.data?.message || 'Error publishing project. Please check fields.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple 1-Minute Project Launcher</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Create a New Project
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Publish your project idea, specify the skills you need, and recruit student builders across universities.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Single-Page Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm space-y-6">
        {/* 1. Project Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Project Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Autonomous Drone Swarm Navigation in ROS2"
            className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
          />
        </div>

        {/* 2. Domain Category & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Domain Category *
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Expected Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="4 weeks">4 weeks (Fast Sprint)</option>
              <option value="8 weeks">8 weeks (Standard Build)</option>
              <option value="12 weeks">12 weeks (Deep Tech)</option>
              <option value="Semester">Semester (Capstone / Thesis)</option>
            </select>
          </div>
        </div>

        {/* 3. Short Pitch / Description with Optional AI Refiner */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Project Pitch & Opportunity *
            </label>
            <button
              type="button"
              onClick={handleImproveWithAI}
              disabled={isImprovingAI}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isImprovingAI ? 'AI Analyzing...' : '✨ Improve with AI'}</span>
            </button>
          </div>
          <textarea
            required
            rows={4}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder="Describe what you're building, the core problem it solves, and why students should join your team..."
            className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-normal leading-relaxed"
          />
        </div>

        {/* 4. Target Teammates & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Total Team Size
            </label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value={2}>2 Builders (Pair Project)</option>
              <option value={3}>3 Builders (Recommended)</option>
              <option value={4}>4 Builders (Standard Squad)</option>
              <option value={5}>5 Builders (Full Team)</option>
              <option value={6}>6 Builders (Large Team)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Technical Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="BEGINNER">Beginner (Learning friendly)</option>
              <option value="INTERMEDIATE">Intermediate (Prior framework skill)</option>
              <option value="ADVANCED">Advanced (High technical depth)</option>
              <option value="EXPERT">Expert (Research-grade)</option>
            </select>
          </div>
        </div>

        {/* 5. Required Skills (Interactive Chips) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Required Technical Skills
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add skill (e.g. PyTorch, React, ROS2)..."
              className="flex-1 px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Active Skills Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-800/60"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Suggested Quick Add Chips */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] text-slate-400">Quick add suggestions:</div>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                .slice(0, 8)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddSkill(s)}
                    className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 6. Open Roles Needed */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Open Roles Needed
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRole();
                }
              }}
              placeholder="e.g. Python Developer, UI/UX Designer..."
              className="flex-1 px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
                <span className="text-[11px] font-semibold text-slate-500">Needed:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={roleCountInput}
                  onChange={(e) => setRoleCountInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-xs font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddRole}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
              >
                Add Role
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {roles.map((r) => (
              <span
                key={r.title}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
              >
                <span>⚡ {r.title} ({r.requiredMembers} {r.requiredMembers === 1 ? 'member' : 'members'})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(r.title)}
                  className="hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 7. College Visibility Option */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Campus Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('ALL_COLLEGES')}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                visibility === 'ALL_COLLEGES'
                  ? 'bg-brand-50/70 border-brand-500 text-brand-900 dark:bg-brand-950/40 dark:border-brand-500 dark:text-brand-300 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold">All Partner Colleges (Recommended)</div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">
                  Recruit builders from Stanford, MIT, Berkeley, IIT Bombay & Harvard.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('SAME_COLLEGE')}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                visibility === 'SAME_COLLEGE'
                  ? 'bg-brand-50/70 border-brand-500 text-brand-900 dark:bg-brand-950/40 dark:border-brand-500 dark:text-brand-300 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold">{user?.college?.name || 'My College'} Only</div>
                <div className="text-[11px] font-normal opacity-80 mt-0.5">
                  Visible only to students verified at your university.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit & Publish CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <Link
            to="/explore"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Publishing Project...</span>
            ) : (
              <>
                <span>Publish Project</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
