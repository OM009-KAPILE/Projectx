import { z } from 'zod';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ANALYZED = 'ANALYZED',
  RECRUITING = 'RECRUITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  SHORTLISTED = 'SHORTLISTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum HealthStatus {
  EXCELLENT = 'EXCELLENT',
  HEALTHY = 'HEALTHY',
  AT_RISK = 'AT_RISK',
  CRITICAL = 'CRITICAL',
}

export enum SkillCategory {
  AI_ML = 'AI/ML',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  MOBILE = 'Mobile',
  DESIGN = 'UI/UX & Design',
  DEVOPS_CLOUD = 'DevOps & Cloud',
  DATA = 'Data Engineering',
  BLOCKCHAIN = 'Web3 & Blockchain',
  HARDWARE_IOT = 'Hardware & IoT',
  DOMAIN_RESEARCH = 'Domain & Research',
}

// ==========================================
// USER & AUTH SCHEMAS & TYPES
// ==========================================

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid university email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6).optional(),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  collegeDomain: z.string().min(3, 'Please select or enter your college domain'),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
  major: z.string().optional(),
  course: z.string().optional(),
  bio: z.string().max(500).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email('Please provide a valid email'),
});

export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter the email associated with your account'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter your email'),
  token: z.string().min(1, 'Reset code or token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email('Please provide a valid new university email address'),
  currentPassword: z.string().min(1, 'Current password is required to verify identity'),
});

export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm password must match'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdatePrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['PUBLIC', 'REGISTERED_ONLY', 'PRIVATE']).default('PUBLIC'),
  collegeVisibility: z.boolean().default(true),
  portfolioVisibility: z.boolean().default(true),
  defaultProjectPrivacy: z.enum(['PUBLIC', 'PROGRESSIVE', 'PRIVATE']).default('PROGRESSIVE'),
});

export type UpdatePrivacySettingsInput = z.infer<typeof UpdatePrivacySettingsSchema>;

export const UpdateAppearanceSchema = z.object({
  themePreference: z.enum(['DARK', 'LIGHT', 'SYSTEM']).default('DARK'),
});

export type UpdateAppearanceInput = z.infer<typeof UpdateAppearanceSchema>;

export const CreateSupportTicketSchema = z.object({
  category: z.enum([
    'TECHNICAL_ISSUE',
    'USER_REPORT',
    'PROJECT_REPORT',
    'PRIVACY_CONCERN',
    'INAPPROPRIATE_CONTENT',
    'OTHER',
    'PROBLEM',
    'GENERAL_SUPPORT',
  ]),
  targetId: z.string().optional().nullable(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  description: z.string().min(10, 'Please describe the issue or report in detail (min 10 characters)'),
  attachmentUrl: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export type CreateSupportTicketInput = z.infer<typeof CreateSupportTicketSchema>;

export const UpdateSupportTicketAdminSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  adminResponse: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export type UpdateSupportTicketAdminInput = z.infer<typeof UpdateSupportTicketAdminSchema>;

export const GoogleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  collegeDomain: z.string().optional(),
  idToken: z.string().optional(),
});

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export type SkillVerificationStatus = 'SELF_DECLARED' | 'EVIDENCE_SUPPORTED' | 'VERIFIED';
export type SkillEvidenceType = 'GITHUB_PROJECT' | 'PORTFOLIO' | 'CERTIFICATE' | 'COMPLETED_PROJECT';

export const UserSkillCreateSchema = z.object({
  skillName: z.string().min(1),
  category: z.string().default('General'),
  proficiency: z.number().int().min(1).max(5).default(3),
  verificationStatus: z.enum(['SELF_DECLARED', 'EVIDENCE_SUPPORTED', 'VERIFIED']).default('SELF_DECLARED'),
  evidenceType: z.enum(['GITHUB_PROJECT', 'PORTFOLIO', 'CERTIFICATE', 'COMPLETED_PROJECT']).optional().nullable(),
  evidenceTitle: z.string().max(120).optional().nullable(),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable(),
  evidenceSummary: z.string().max(400).optional().nullable(),
});

export type UserSkillCreateInput = z.infer<typeof UserSkillCreateSchema>;

export const StudentExperienceSchema = z.object({
  title: z.string().min(2, 'Job/Role title is required'),
  company: z.string().min(2, 'Company/Organization is required'),
  location: z.string().optional().nullable(),
  startDate: z.string().min(2, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(800).optional().nullable(),
});

export type StudentExperienceInput = z.infer<typeof StudentExperienceSchema>;

export const StudentHackathonSchema = z.object({
  title: z.string().min(2, 'Hackathon name is required'),
  projectName: z.string().optional().nullable(),
  award: z.string().optional().nullable(),
  date: z.string().min(2, 'Date is required'),
  description: z.string().max(800).optional().nullable(),
  projectUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export type StudentHackathonInput = z.infer<typeof StudentHackathonSchema>;

export const StudentPastProjectSchema = z.object({
  title: z.string().min(2, 'Project title is required'),
  role: z.string().optional().nullable(),
  description: z.string().min(5, 'Project description is required'),
  technologies: z.string().min(1, 'Technologies used is required'),
  projectUrl: z.string().url().optional().or(z.literal('')).nullable(),
  githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
  isFeatured: z.boolean().default(false),
});

export type StudentPastProjectInput = z.infer<typeof StudentPastProjectSchema>;

export const OnboardingSkillSchema = z.object({
  skillName: z.string().min(1),
  proficiency: z.number().int().min(1).max(5).default(3),
  category: z.string().optional().default('General'),
  evidenceType: z.enum(['GITHUB_PROJECT', 'PORTFOLIO', 'CERTIFICATE', 'COMPLETED_PROJECT']).optional().nullable(),
  evidenceUrl: z.string().url().optional().or(z.literal('')).nullable(),
  evidenceTitle: z.string().optional().nullable(),
});

export const OnboardingSchema = z.object({
  avatarUrl: z.string().optional().or(z.literal('')),
  name: z.string().min(2, 'Name is required'),
  collegeDomain: z.string().optional(),
  course: z.string().optional(),
  major: z.string().optional(),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
  skills: z.array(OnboardingSkillSchema).default([]),
  interests: z.array(z.string()).default([]),
  weeklyAvailability: z.enum(['0-5h', '5-10h', '10-20h', '20+h']).optional().default('5-10h'),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export interface ProfileCompletionResult {
  score: number; // 0 to 100
  percentage: number;
  completedItems: string[];
  missingItems: string[];
  recommendations: string[];
}

export function calculateProfileCompletion(user: any): ProfileCompletionResult {
  let score = 0;
  const completedItems: string[] = [];
  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // 1. Basic Identity (Name + Email + College) - 25%
  if (user.name && user.email) {
    score += 15;
    completedItems.push('Basic Identity');
  } else {
    missingItems.push('Name & Email');
  }

  if (user.college || user.collegeId) {
    score += 10;
    completedItems.push('University Affiliation');
  } else {
    missingItems.push('University Affiliation');
  }

  // 2. Avatar Photo - 10%
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) {
    score += 10;
    completedItems.push('Profile Photo');
  } else {
    missingItems.push('Profile Photo');
    recommendations.push('Add an avatar or photo so team leads recognize you');
  }

  // 3. Course / Major / Grad Year - 15%
  if (user.course || user.major) {
    score += 10;
    completedItems.push('Degree / Course');
  } else {
    missingItems.push('Degree / Course');
  }

  if (user.graduationYear) {
    score += 5;
    completedItems.push('Graduation Year');
  }

  // 4. Skills & Proficiencies - 25%
  const skillsCount = Array.isArray(user.skills) ? user.skills.length : 0;
  if (skillsCount >= 3) {
    score += 25;
    completedItems.push(`${skillsCount} Verified Skills`);
  } else if (skillsCount > 0) {
    score += 15;
    completedItems.push(`${skillsCount} Skills`);
    recommendations.push('Add at least 3 skills to maximize AI match rates');
  } else {
    missingItems.push('Skills & Proficiencies');
    recommendations.push('Add your technical skills to get recommended for project roles');
  }

  // 5. Weekly Availability - 10%
  if (user.weeklyAvailability) {
    score += 10;
    completedItems.push(`Availability: ${user.weeklyAvailability}`);
  } else {
    missingItems.push('Weekly Availability');
  }

  // 6. External Proof of Work (GitHub / Portfolio) - 15%
  if (user.githubUrl && user.githubUrl.trim().length > 0) {
    score += 10;
    completedItems.push('GitHub Connected');
  } else {
    missingItems.push('GitHub Profile');
    recommendations.push('Link your GitHub for automated code proof verification');
  }

  if (user.portfolioUrl || user.linkedinUrl) {
    score += 5;
    completedItems.push('Portfolio / LinkedIn');
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    percentage: finalScore,
    completedItems,
    missingItems,
    recommendations,
  };
}

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
  major: z.string().optional(),
  course: z.string().optional(),
  weeklyAvailability: z.enum(['0-5h', '5-10h', '10-20h', '20+h']).optional(),
  interests: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  whatsappPhoneNumber: z.string().optional().or(z.literal('')),
  skills: z.array(UserSkillCreateSchema).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSkillItem {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  proficiency: number;
  verificationStatus: SkillVerificationStatus;
  evidenceType?: SkillEvidenceType | null;
  evidenceTitle?: string | null;
  evidenceUrl?: string | null;
  evidenceSummary?: string | null;
  isVerified: boolean;
}

export interface StudentExperienceItem {
  id: string;
  userId: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
  createdAt: string;
}

export interface StudentHackathonItem {
  id: string;
  userId: string;
  title: string;
  projectName?: string | null;
  award?: string | null;
  date: string;
  description?: string | null;
  projectUrl?: string | null;
  createdAt: string;
}

export interface StudentPastProjectItem {
  id: string;
  userId: string;
  title: string;
  role?: string | null;
  description: string;
  technologies: string;
  projectUrl?: string | null;
  githubUrl?: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  graduationYear?: number | null;
  major?: string | null;
  course?: string | null;
  weeklyAvailability?: string | null;
  interests?: string | null;
  onboardingCompleted?: boolean;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  isVerified: boolean;
  profileVisibility?: 'PUBLIC' | 'REGISTERED_ONLY' | 'PRIVATE';
  collegeVisibility?: boolean;
  portfolioVisibility?: boolean;
  defaultProjectPrivacy?: 'PUBLIC' | 'PROGRESSIVE' | 'PRIVATE';
  themePreference?: 'DARK' | 'LIGHT' | 'SYSTEM';
  college: {
    id: string;
    name: string;
    domain: string;
    city: string;
    country: string;
    logoUrl?: string | null;
  };
  skills: UserSkillItem[];
  experiences?: StudentExperienceItem[];
  hackathons?: StudentHackathonItem[];
  pastProjects?: StudentPastProjectItem[];
  createdProjects?: any[];
  memberships?: any[];
  createdAt: string;
}

export interface SkillVerificationBadge {
  status: SkillVerificationStatus;
  label: 'Self-declared' | 'Evidence-supported' | 'Verified';
  color: string;
  badgeClass: string;
  description: string;
  hasEvidence: boolean;
}

export function getSkillVerificationBadge(skill: {
  isVerified?: boolean;
  verificationStatus?: string | null;
  evidenceUrl?: string | null;
  evidenceType?: string | null;
  evidenceSummary?: string | null;
}): SkillVerificationBadge {
  // 1. Officially Verified (backed by platform verification or validated credential)
  if (skill.isVerified || skill.verificationStatus === 'VERIFIED') {
    return {
      status: 'VERIFIED',
      label: 'Verified',
      color: '#10b981',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Officially verified via platform project completion or verified credentials.',
      hasEvidence: true,
    };
  }

  // 2. Evidence-Supported (has GitHub project, portfolio link, certificate or summary)
  if (
    skill.verificationStatus === 'EVIDENCE_SUPPORTED' ||
    (skill.evidenceUrl && skill.evidenceUrl.trim().length > 0) ||
    skill.evidenceType
  ) {
    return {
      status: 'EVIDENCE_SUPPORTED',
      label: 'Evidence-supported',
      color: '#06b6d4',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      description: 'Supported by GitHub repositories, live portfolio link, or certificate evidence.',
      hasEvidence: true,
    };
  }

  // 3. Self-Declared (no external evidence uploaded)
  return {
    status: 'SELF_DECLARED',
    label: 'Self-declared',
    color: '#94a3b8',
    badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
    description: 'Self-assessed capability without external verified evidence.',
    hasEvidence: false,
  };
}

// ==========================================
// AI DECOMPOSITION & SKILL GAP TYPES
// ==========================================

export const AnalyzeProjectSchema = z.object({
  title: z.string().min(3),
  pitch: z.string().min(10),
  domain: z.string().optional(),
  existingSkills: z.array(z.string()).optional(),
  targetTimelineWeeks: z.number().int().positive().optional().default(12),
});

export type AnalyzeProjectInput = z.infer<typeof AnalyzeProjectSchema>;

export interface AIRoleRequirement {
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  requiredSkills: {
    skillName: string;
    category: string;
    minLevel: number; // 1-5
    isCritical: boolean;
  }[];
}

export interface AIProjectAnalysisResult {
  title: string;
  problemStatement: string;
  domain: string;
  publicTeaser: string; // Sanitized teaser for safe listing (Progressive Disclosure)
  complexityScore: number; // 1-10
  estimatedWeeks: number;
  extractedRoles: AIRoleRequirement[];
  recommendedMilestones: {
    title: string;
    description: string;
    targetWeek: number;
  }[];
  potentialRisks: string[];
}

export interface SkillGapAnalysisResult {
  skillCoveragePercentage: number; // 0-100
  missingCriticalCount: number;
  summaryMessage: string;
  requiredSkills: {
    skillName: string;
    category: string;
    minLevel: number;
    isCritical: boolean;
    roleTitle: string;
  }[];
  coveredSkills: {
    skillName: string;
    category: string;
    coveredBy: string;
    memberCollege: string;
    proficiency: number;
  }[];
  missingSkills: {
    skillName: string;
    category: string;
    minLevel: number;
    peopleNeeded: number;
    roleTitle: string;
    isCritical: boolean;
  }[];
  overlappingSkills: {
    skillName: string;
    count: number;
    coveredByMembers: string[];
  }[];
  filledRoles: {
    roleTitle: string;
    assignedUser: {
      id: string;
      name: string;
      college: string;
    };
    matchScore: number;
    matchingSkills: string[];
  }[];
  openGaps: {
    roleTitle: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    missingCriticalSkills: string[];
    missingNiceToHaveSkills: string[];
    urgencyReason: string;
  }[];
  teamCoverageScore: number; // 0-100
  collegeDiversityIndex: number; // number of distinct colleges
}

// ==========================================
// MATCHING & RECOMMENDATIONS
// ==========================================

export interface MatchingWeightsConfig {
  skillMatch: number; // default: 0.40 (40%)
  experience: number; // default: 0.15 (15%)
  availability: number; // default: 0.15 (15%)
  interestAlignment: number; // default: 0.10 (10%)
  projectStageSuitability: number; // default: 0.10 (10%)
  teamCompatibility: number; // default: 0.10 (10%)
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeightsConfig = {
  skillMatch: 0.40,
  experience: 0.15,
  availability: 0.15,
  interestAlignment: 0.10,
  projectStageSuitability: 0.10,
  teamCompatibility: 0.10,
};

export interface CandidateMatchBreakdown {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string | null;
  collegeName: string;
  collegeDomain: string;
  major?: string | null;
  graduationYear?: number | null;
  overallMatchScore: number; // 0 - 100
  scoreBreakdown: {
    skillMatchScore: number; // 0 - 100
    experienceScore: number; // 0 - 100
    availabilityScore: number; // 0 - 100
    interestAlignmentScore: number; // 0 - 100
    projectStageScore: number; // 0 - 100
    teamCompatibilityScore: number; // 0 - 100
  };
  matchedSkills: {
    name: string;
    proficiency: number;
    hasEvidence: boolean;
    evidenceUrl?: string | null;
  }[];
  missingSkillsForRole: string[];
  experienceSummary: string;
  availability: string;
  interests: string[];
  previousProjectsCount: number;
  previousProjects: {
    title: string;
    domain?: string;
    roleTitle?: string;
  }[];
  whyReasons: string[]; // e.g. ["✓ Has required Flutter skill", "✓ Has Computer Vision experience", ...]
  matchExplanation: string;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

export interface SafeProjectCard {
  id: string;
  title: string;
  domain: string;
  category: string;
  publicTeaser: string;
  difficulty: string;
  duration: string;
  teamSize: number;
  currentMemberCount: number;
  currentMembers: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    college: string;
  }[];
  requiredSkills: {
    id: string;
    skillName: string;
    category: string;
    minLevel: number;
    isCritical: boolean;
  }[];
  matchPercentage?: number;
  matchRationale?: string;
  healthStatus: HealthStatus;
  healthScore: number;
  isMember: boolean;
}

export interface HomeFeedResponse {
  recommendedProjects: SafeProjectCard[];
  skillMatchingProjects: SafeProjectCard[];
  activeProjects: any[];
  skillGapAlerts: {
    projectId: string;
    projectTitle: string;
    gapRole: string;
    criticalSkills: string[];
  }[];
  healthAlerts: {
    projectId: string;
    projectTitle: string;
    healthStatus: string;
    healthScore: number;
    reason: string;
  }[];
  profileCompletion: ProfileCompletionResult;
}

// ==========================================
// PROGRESSIVE PROJECT DISCLOSURE & ACCESS LEVELS
// ==========================================

export enum DisclosureLevel {
  LEVEL_1_PUBLIC = 'LEVEL_1_PUBLIC',
  LEVEL_2_APPLICANT = 'LEVEL_2_APPLICANT',
  LEVEL_3_MEMBER = 'LEVEL_3_MEMBER',
  LEVEL_4_OWNER = 'LEVEL_4_OWNER',
}

export interface PrivacyIndicatorInfo {
  level: 1 | 2 | 3 | 4;
  code: DisclosureLevel;
  label: string;
  badgeColor: string;
  description: string;
  isEncrypted: boolean;
}

export const UpdateProjectVisibilitySchema = z.object({
  isPublic: z.boolean().optional(),
  collegeVisibility: z.enum(['MY_COLLEGE', 'SELECTED_COLLEGES', 'ANY_COLLEGE']).optional(),
  selectedColleges: z.array(z.string()).optional(),
});
export type UpdateProjectVisibilityInput = z.infer<typeof UpdateProjectVisibilitySchema>;

export const AssignMemberRoleSchema = z.object({
  roleTitle: z.string().min(2, 'Role title is required'),
  projectRoleId: z.string().uuid().optional(),
});
export type AssignMemberRoleInput = z.infer<typeof AssignMemberRoleSchema>;

export const InviteStudentSchema = z.object({
  candidateId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  projectRoleId: z.string().uuid().optional(),
  roleTitle: z.string().optional(),
  customMessage: z.string().optional(),
});
export type InviteStudentInput = z.infer<typeof InviteStudentSchema>;

// ==========================================
// PROJECT SCHEMAS & TYPES
// ==========================================

export const CreateProjectSchema = z.object({
  title: z.string().min(3),
  pitch: z.string().min(10).optional().or(z.literal('')),
  problemStatement: z.string().min(10).optional().or(z.literal('')),
  publicTeaser: z.string().min(10),
  domain: z.string().min(2),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
  duration: z.string().default('8 weeks'),
  teamSize: z.number().int().min(2).max(12).default(4),
  collegeVisibility: z.enum(['SAME_COLLEGE', 'SELECTED_COLLEGES', 'ANY_COLLEGE', 'ALL_COLLEGES', 'MY_COLLEGE']).default('ANY_COLLEGE'),
  selectedColleges: z.array(z.string()).optional().default([]),
  targetCompletionDate: z.string().optional().nullable(),
  
  // Private Workspace IP
  privateRepoUrl: z.string().url().optional().or(z.literal('')),
  privateNotes: z.string().optional(),
  architectureSpec: z.string().optional(),
  technicalApproach: z.string().optional(),
  datasetInfo: z.string().optional(),
  detailedWorkflow: z.string().optional(),
  documentLinks: z.string().optional(),
  
  roles: z.array(
    z.object({
      title: z.string().min(2),
      description: z.string().min(5),
      requiredMembers: z.number().int().min(1).default(1).optional(),
      requiredSkills: z.array(
        z.object({
          skillName: z.string().min(1),
          category: z.string().default('General'),
          minLevel: z.number().int().min(1).max(5).default(3),
          isCritical: z.boolean().default(true),
        })
      ),
    })
  ).min(1),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// Public Safe View (Progressive Disclosure - hides internal repo, private notes, architecture details)
export interface PublicProjectListing {
  id: string;
  title: string;
  publicTeaser: string;
  domain: string;
  problemStatement: string;
  status: ProjectStatus;
  healthStatus: HealthStatus;
  healthScore: number;
  difficulty?: string;
  duration?: string;
  workMode?: string;
  creator: {
    id: string;
    name: string;
    college: string;
    avatarUrl?: string | null;
  };
  memberCount: number;
  collegeCount: number;
  participatingColleges: string[];
  openRoles: {
    id: string;
    title: string;
    description: string;
    isFilled: boolean;
    requiredMembers?: number;
    applicationCount?: number;
    applicationsCount?: number;
    acceptedCount?: number;
    requiredSkills: {
      id: string;
      skillName: string;
      category: string;
      minLevel: number;
      isCritical: boolean;
    }[];
  }[];
  requiredRoles?: {
    id: string;
    title: string;
    description: string;
    isFilled: boolean;
    requiredMembers?: number;
    applicationCount?: number;
    applicationsCount?: number;
    acceptedCount?: number;
    requiredSkills: {
      id: string;
      skillName: string;
      category: string;
      minLevel: number;
      isCritical: boolean;
    }[];
  }[];
  createdAt: string;
  isMember: boolean;
  hasApplied: boolean;
}

// Private Full Project (Unlocked exclusively for approved team members)
export interface PrivateProjectDetails extends PublicProjectListing {
  pitch: string;
  privateRepoUrl?: string | null;
  privateNotes?: string | null;
  architectureSpec?: string | null;
  healthSuggestions: string[];
  members: {
    id: string;
    userId: string;
    name: string;
    email: string;
    college: string;
    avatarUrl?: string | null;
    roleTitle: string;
    joinedAt: string;
    skills: string[];
  }[];
  milestones: {
    id: string;
    title: string;
    description?: string | null;
    dueDate: string;
    isCompleted: boolean;
    totalTasks: number;
    completedTasks: number;
  }[];
}

// ==========================================
// APPLICATION SCHEMAS & TYPES
// ==========================================

export const SubmitApplicationSchema = z.object({
  projectId: z.string().uuid(),
  projectRoleId: z.string().uuid(),
  pitch: z.string().min(10, 'Short message must be at least 10 characters'),
  relevantSkills: z.array(z.string()).optional().default([]),
  availability: z.string().optional().default('10-20 hours/week'),
  experience: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal('')).nullable(),
  githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
  relevantLinks: z.array(z.string()).optional().default([]),
});

export type SubmitApplicationInput = z.infer<typeof SubmitApplicationSchema>;

export const ReviewApplicationSchema = z.object({
  status: z.enum([
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.UNDER_REVIEW,
  ]),
  feedback: z.string().optional(),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;

export interface ApplicationView {
  id: string;
  projectId: string;
  projectTitle: string;
  projectRoleId: string;
  roleTitle: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    college: string;
    major?: string | null;
    graduationYear?: number | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    skills: {
      skillName: string;
      proficiency: number;
      evidenceUrl?: string | null;
      isVerified: boolean;
    }[];
  };
  pitch: string;
  relevantLinks: string[];
  status: ApplicationStatus;
  matchScore: number;
  matchAnalysis?: string | null;
  createdAt: string;
}

// ==========================================
// WORKSPACE: KANBAN TASKS & CHAT
// ==========================================

export const CreateTaskSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  weight: z.number().min(0).max(100).optional().default(0),
  progress: z.number().int().min(0).max(100).optional().default(0),
  assigneeId: z.string().uuid().optional().nullable(),
  milestoneId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  weight: z.number().min(0).max(100).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  orderIndex: z.number().int().optional(),
});

export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
  progress: number;
  weightedContribution?: number;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    college: string;
  } | null;
  milestoneId?: string | null;
  milestoneTitle?: string | null;
  dueDate?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export const SendChatMessageSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>;

export interface ChatMessageView {
  id: string;
  projectId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    college: string;
  };
  content: string;
  createdAt: string;
}

// ==========================================
// PROJECT HEALTH INTELLIGENCE
// ==========================================

export type HealthRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface HealthMetricBreakdown {
  label: string;
  score: number; // 0 - 100
  weightPercentage: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'AT_RISK' | 'CRITICAL';
  details: string;
}

export interface HealthRecommendation {
  id: string;
  type: 'TASK' | 'TEAM' | 'SKILL' | 'MILESTONE' | 'WORKLOAD' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface ProjectHealthMetrics {
  healthStatus: HealthStatus;
  healthScore: number; // 0-100
  riskLevel: HealthRiskLevel;
  teamCompleteness: HealthMetricBreakdown;
  taskProgress: HealthMetricBreakdown;
  deadlineRisk: HealthMetricBreakdown;
  skillCoverage: HealthMetricBreakdown;
  milestoneProgress: HealthMetricBreakdown;
  workloadDistribution: HealthMetricBreakdown;
  momentumScore: number; // 0-100 based on recent tasks done
  collaborationIndex: number; // message cadence & member active distribution
  blockerAlerts: string[];
  actionableSuggestions: string[];
  recommendations: HealthRecommendation[];
  summary: string;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    overdue: number;
    completionPercentage: number;
  };
  teamDiversity: {
    totalMembers: number;
    distinctColleges: number;
    collegeNames: string[];
  };
}

// ==========================================
// REAL-TIME MESSAGING, REPORTING & BLOCKING
// ==========================================

export enum ConversationType {
  DIRECT = 'DIRECT',
  PROJECT_TEAM = 'PROJECT_TEAM',
}

export enum ReportReason {
  HARASSMENT = 'HARASSMENT',
  SPAM = 'SPAM',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  IP_LEAK = 'IP_LEAK',
  OTHER = 'OTHER',
}

export const CreateDirectConversationSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  projectId: z.string().uuid().optional(),
  initialMessage: z.string().min(1).max(2000).optional(),
});
export type CreateDirectConversationInput = z.infer<typeof CreateDirectConversationSchema>;

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const BlockUserSchema = z.object({
  blockedId: z.string().uuid('Invalid user ID to block'),
  reason: z.string().max(300).optional(),
});
export type BlockUserInput = z.infer<typeof BlockUserSchema>;

export const ReportUserOrMessageSchema = z.object({
  reportedUserId: z.string().uuid('Invalid user ID'),
  messageId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  reason: z.nativeEnum(ReportReason),
  details: z.string().max(1000).optional(),
});
export type ReportUserOrMessageInput = z.infer<typeof ReportUserOrMessageSchema>;

export interface ParticipantProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  collegeName: string;
  collegeDomain: string;
  roleTitle?: string | null;
  isOnline?: boolean;
}

export interface DirectMessageView {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderCollege: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  type: ConversationType | string;
  title?: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  participants: ParticipantProfile[];
  otherParticipant?: ParticipantProfile | null; // For 1:1 direct chats
  latestMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

// ==========================================
// NOTIFICATION SYSTEM & PREFERENCES
// ==========================================

export enum NotificationType {
  NEW_APPLICATION = 'NEW_APPLICATION',
  APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  TEAM_INVITATION = 'TEAM_INVITATION',
  NEW_MESSAGE = 'NEW_MESSAGE',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DEADLINE_APPROACHING = 'TASK_DEADLINE_APPROACHING',
  PROJECT_HEALTH_WARNING = 'PROJECT_HEALTH_WARNING',
  SKILL_GAP_DETECTED = 'SKILL_GAP_DETECTED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  WHATSAPP_APPLICATION = 'WHATSAPP_APPLICATION',
}

export enum WhatsAppDeliveryStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  NO_PHONE = 'NO_PHONE',
  ALREADY_SENT = 'ALREADY_SENT',
}

export interface WhatsAppNotificationLogItem {
  id: string;
  recipientId: string;
  applicationId: string;
  projectId: string;
  phoneNumber: string;
  messageContent: string;
  status: WhatsAppDeliveryStatus | string;
  provider: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export const UpdateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  notifyNewApplication: z.boolean().optional(),
  notifyApplicationStatus: z.boolean().optional(),
  notifyTeamInvitation: z.boolean().optional(),
  notifyNewMessage: z.boolean().optional(),
  notifyTaskAssigned: z.boolean().optional(),
  notifyTaskDeadline: z.boolean().optional(),
  notifyHealthWarning: z.boolean().optional(),
  notifySkillGap: z.boolean().optional(),
  notifyMilestoneCompleted: z.boolean().optional(),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;

export const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(10, 'Invalid device token'),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']).default('IOS'),
});
export type RegisterDeviceTokenInput = z.infer<typeof RegisterDeviceTokenSchema>;

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferenceItem {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyNewApplication: boolean;
  notifyApplicationStatus: boolean;
  notifyTeamInvitation: boolean;
  notifyNewMessage: boolean;
  notifyTaskAssigned: boolean;
  notifyTaskDeadline: boolean;
  notifyHealthWarning: boolean;
  notifySkillGap: boolean;
  notifyMilestoneCompleted: boolean;
}

// ==========================================
// MULTI-COLLEGE HIERARCHY SCHEMAS & TYPES
// ==========================================

export const CreateUniversitySchema = z.object({
  name: z.string().min(2, 'University name is required'),
  shortName: z.string().optional().nullable(),
  website: z.string().url().optional().or(z.literal('')).nullable(),
  country: z.string().default('United States'),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
});
export type CreateUniversityInput = z.infer<typeof CreateUniversitySchema>;

export const UpdateUniversitySchema = CreateUniversitySchema.partial();
export type UpdateUniversityInput = z.infer<typeof UpdateUniversitySchema>;

export const CreateCollegeSchema = z.object({
  name: z.string().min(2, 'College name is required'),
  domain: z.string().min(3, 'Domain is required (e.g. stanford.edu)'),
  city: z.string().min(1, 'City is required'),
  country: z.string().default('United States'),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  universityId: z.string().uuid().optional().nullable(),
});
export type CreateCollegeInput = z.infer<typeof CreateCollegeSchema>;

export const UpdateCollegeSchema = CreateCollegeSchema.partial();
export type UpdateCollegeInput = z.infer<typeof UpdateCollegeSchema>;

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().optional().nullable(),
  collegeId: z.string().uuid('Valid collegeId is required'),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

export const CreateCourseSchema = z.object({
  name: z.string().min(2, 'Course/Program name is required'),
  code: z.string().optional().nullable(),
  degreeLevel: z.enum(['UNDERGRADUATE', 'GRADUATE', 'DOCTORATE', 'DIPLOMA']).default('UNDERGRADUATE'),
  departmentId: z.string().uuid('Valid departmentId is required'),
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

export interface UniversityView {
  id: string;
  name: string;
  shortName?: string | null;
  website?: string | null;
  country: string;
  logoUrl?: string | null;
  collegesCount?: number;
  createdAt: string;
}

export interface CollegeView {
  id: string;
  name: string;
  domain: string;
  city: string;
  country: string;
  logoUrl?: string | null;
  universityId?: string | null;
  universityName?: string | null;
  departmentsCount?: number;
  studentsCount?: number;
  projectsCount?: number;
  createdAt: string;
}

export interface DepartmentView {
  id: string;
  name: string;
  code?: string | null;
  collegeId: string;
  collegeName?: string | null;
  coursesCount?: number;
  studentsCount?: number;
  createdAt: string;
}

export interface CourseView {
  id: string;
  name: string;
  code?: string | null;
  degreeLevel: string;
  departmentId: string;
  departmentName?: string | null;
  studentsCount?: number;
  createdAt: string;
}

// ==========================================
// GITHUB INTEGRATION & EVIDENCE-CONFIDENCE
// ==========================================

export const ConnectGitHubSchema = z.object({
  githubUrlOrUsername: z.string().min(1, 'GitHub username or profile URL is required'),
});
export type ConnectGitHubInput = z.infer<typeof ConnectGitHubSchema>;

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
}

export interface GitHubLanguageShare {
  name: string;
  percentage: number;
  color?: string;
}

export interface GitHubProfileData {
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  publicReposCount: number;
  followers?: number;
  languages: GitHubLanguageShare[];
  repositories: GitHubRepositoryItem[];
  relevantRepositories: {
    skillName: string;
    repositories: GitHubRepositoryItem[];
  }[];
  isLiveSync: boolean;
  lastSyncedAt: string;
  fallbackMessage?: string;
}

export type EvidenceConfidenceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'STRONG';

export interface SkillEvidenceConfidenceItem {
  skillId: string;
  skillName: string;
  category: string;
  proficiency: number;
  verificationStatus: SkillVerificationStatus;
  evidenceConfidence: number; // 0-100%
  evidenceConfidenceLevel: EvidenceConfidenceLevel;
  evidenceType?: SkillEvidenceType | null;
  evidenceTitle?: string | null;
  evidenceUrl?: string | null;
  evidenceSummary?: string | null;
  matchedRepositories: Array<{
    name: string;
    url: string;
    language: string | null;
    stars: number;
  }>;
  confidenceRationale: string;
  isVerified: boolean;
}

/**
 * Calculates Evidence Confidence score (0-100%) and Level for a declared skill
 * Note: Having GitHub / Repositories provides EVIDENCE_SUPPORTED status,
 * NEVER automatic official VERIFIED status.
 */
export function calculateSkillConfidence(
  skill: {
    skillName: string;
    proficiency: number;
    verificationStatus?: string;
    evidenceType?: string | null;
    evidenceUrl?: string | null;
    evidenceSummary?: string | null;
    isVerified?: boolean;
  },
  githubRepos?: GitHubRepositoryItem[]
): {
  confidenceScore: number;
  confidenceLevel: EvidenceConfidenceLevel;
  verificationStatus: SkillVerificationStatus;
  matchedRepositories: Array<{ name: string; url: string; language: string | null; stars: number }>;
  confidenceRationale: string;
  isVerified: boolean;
} {
  const normSkill = skill.skillName.toLowerCase().trim();
  const matchedRepos: Array<{ name: string; url: string; language: string | null; stars: number }> = [];

  // Find matching repos by language or repo name or topics
  if (Array.isArray(githubRepos) && githubRepos.length > 0) {
    for (const r of githubRepos) {
      const matchLang = r.language && normSkill.includes(r.language.toLowerCase());
      const matchName = r.name.toLowerCase().includes(normSkill) || normSkill.includes(r.name.toLowerCase());
      const matchTopics = r.topics && r.topics.some((t) => normSkill.includes(t.toLowerCase()) || t.toLowerCase().includes(normSkill));

      if (matchLang || matchName || matchTopics) {
        matchedRepos.push({
          name: r.name,
          url: r.url,
          language: r.language,
          stars: r.stars,
        });
      }
    }
  }

  // 1. Officially Verified (via certified institutional capstone or platform-verified project)
  if (skill.isVerified === true && skill.verificationStatus === 'VERIFIED') {
    return {
      confidenceScore: 95,
      confidenceLevel: 'STRONG',
      verificationStatus: 'VERIFIED',
      matchedRepositories: matchedRepos,
      confidenceRationale: 'Officially verified via platform project completion or academic institution audit.',
      isVerified: true,
    };
  }

  // 2. GitHub Evidence or External Evidence provided
  const hasDirectEvidenceUrl = !!(skill.evidenceUrl && skill.evidenceUrl.trim().length > 0);
  const repoMatchesCount = matchedRepos.length;
  const totalStars = matchedRepos.reduce((acc, r) => acc + r.stars, 0);

  if (repoMatchesCount >= 2 || (repoMatchesCount >= 1 && totalStars >= 3)) {
    return {
      confidenceScore: Math.min(88, 70 + repoMatchesCount * 5 + Math.min(totalStars * 2, 10)),
      confidenceLevel: 'HIGH',
      verificationStatus: 'EVIDENCE_SUPPORTED',
      matchedRepositories: matchedRepos,
      confidenceRationale: `High evidence confidence: backed by ${repoMatchesCount} relevant GitHub repository (${totalStars} stars).`,
      isVerified: false, // Never auto-verified
    };
  }

  if (repoMatchesCount === 1 || hasDirectEvidenceUrl || skill.evidenceType === 'GITHUB_PROJECT') {
    return {
      confidenceScore: 65,
      confidenceLevel: 'MEDIUM',
      verificationStatus: 'EVIDENCE_SUPPORTED',
      matchedRepositories: matchedRepos,
      confidenceRationale: hasDirectEvidenceUrl
        ? 'Medium evidence confidence: supported by external link or project repository.'
        : `Medium evidence confidence: backed by relevant GitHub repository "${matchedRepos[0]?.name}".`,
      isVerified: false, // Never auto-verified
    };
  }

  if (hasDirectEvidenceUrl || skill.evidenceSummary) {
    return {
      confidenceScore: 45,
      confidenceLevel: 'LOW',
      verificationStatus: 'EVIDENCE_SUPPORTED',
      matchedRepositories: [],
      confidenceRationale: 'Low evidence confidence: brief evidence summary or URL provided without deep repo linkage.',
      isVerified: false,
    };
  }

  // 3. Self-Declared
  return {
    confidenceScore: 15,
    confidenceLevel: 'NONE',
    verificationStatus: 'SELF_DECLARED',
    matchedRepositories: [],
    confidenceRationale: 'Self-declared by student without external GitHub code evidence or proof.',
    isVerified: false,
  };
}



