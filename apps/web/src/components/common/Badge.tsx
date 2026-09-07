import React from 'react';

export const DomainBadge: React.FC<{ domain: string }> = ({ domain }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
      {domain}
    </span>
  );
};

export const SkillBadge: React.FC<{
  name: string;
  isCritical?: boolean;
  minLevel?: number;
  hasEvidence?: boolean;
}> = ({ name, isCritical, minLevel, hasEvidence }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
        isCritical
          ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
          : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60'
      }`}
    >
      <span>{name}</span>
      {minLevel && <span className="opacity-60 text-[10px]">Lvl {minLevel}+</span>}
      {hasEvidence && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500" title="Verified Evidence Attached" />
      )}
    </span>
  );
};

export const HealthBadge: React.FC<{ status: string; score?: number }> = ({ status, score }) => {
  const getStyle = () => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'HEALTHY':
        return 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/30';
      case 'AT_RISK':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyle()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span>{status}</span>
      {score !== undefined && <span className="opacity-80">({score}%)</span>}
    </span>
  );
};

export const PrivacyIndicatorBadge: React.FC<{
  level?: 1 | 2 | 3 | 4;
  label?: string;
  isEncrypted?: boolean;
}> = ({ level = 1, label, isEncrypted = true }) => {
  const getBadgeConfig = () => {
    switch (level) {
      case 4:
        return {
          title: label || 'LEVEL 4: PROJECT OWNER',
          style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
          icon: '👑',
        };
      case 3:
        return {
          title: label || 'LEVEL 3: ACCEPTED MEMBER',
          style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
          icon: '🔓',
        };
      case 2:
        return {
          title: label || 'LEVEL 2: APPLICANT VIEW',
          style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
          icon: '🔒',
        };
      case 1:
      default:
        return {
          title: label || 'LEVEL 1: PUBLIC SAFE LISTING',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
          icon: '🛡️',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${config.style}`}
      title={isEncrypted ? 'Proprietary IP and source code encrypted' : 'Full workspace access granted'}
    >
      <span>{config.icon}</span>
      <span>{config.title}</span>
      {isEncrypted && (
        <span className="text-[10px] font-mono opacity-75 lowercase">(encrypted ip)</span>
      )}
    </div>
  );
};

export const MatchScorePill: React.FC<{ score: number }> = ({ score }) => {
  const getBg = () => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/40';
    if (score >= 70) return 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-400 dark:border-brand-500/40';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/40';
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40';
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getBg()}`}>
      <span>⚡ {score}% Match</span>
    </div>
  );
};
