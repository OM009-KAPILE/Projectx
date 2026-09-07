import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import {
  UpdateProfileInput,
  UserSkillCreateInput,
  StudentExperienceInput,
  StudentHackathonInput,
  StudentPastProjectInput,
  calculateProfileCompletion,
  calculateSkillConfidence,
  ConnectGitHubInput,
} from '@projectx/common';
import { GitHubService } from '../../services/github.service';

export class UsersController {
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          college: true,
          skills: {
            include: { skill: true },
            orderBy: { proficiency: 'desc' },
          },
          experiences: {
            orderBy: { createdAt: 'desc' },
          },
          hackathons: {
            orderBy: { createdAt: 'desc' },
          },
          pastProjects: {
            orderBy: { createdAt: 'desc' },
          },
          createdProjects: {
            select: {
              id: true,
              title: true,
              domain: true,
              status: true,
              publicTeaser: true,
              difficulty: true,
              duration: true,
              teamSize: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          memberships: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  domain: true,
                  status: true,
                  publicTeaser: true,
                  difficulty: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AppError('Student profile not found.', 404);
      }

      const formattedSkills = user.skills.map((us) => {
        const hasEvidence = !!(us.evidenceUrl || us.evidenceType || us.evidenceTitle || us.evidenceSummary);
        const verificationStatus = us.verificationStatus || (us.isVerified ? 'VERIFIED' : (hasEvidence ? 'EVIDENCE_SUPPORTED' : 'SELF_DECLARED'));
        return {
          id: us.id,
          skillId: us.skillId,
          skillName: us.skill.name,
          category: us.skill.category || 'General',
          proficiency: us.proficiency,
          verificationStatus,
          evidenceType: us.evidenceType || null,
          evidenceTitle: us.evidenceTitle || null,
          evidenceUrl: us.evidenceUrl || null,
          evidenceSummary: us.evidenceSummary || null,
          isVerified: us.isVerified || verificationStatus === 'VERIFIED',
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          college: user.college,
          graduationYear: user.graduationYear,
          major: user.major,
          course: user.course || user.major,
          weeklyAvailability: user.weeklyAvailability || '5-10h',
          interests: user.interests,
          githubUrl: user.githubUrl,
          portfolioUrl: user.portfolioUrl,
          linkedinUrl: user.linkedinUrl,
          isVerified: user.isVerified,
          skills: formattedSkills,
          experiences: user.experiences,
          hackathons: user.hackathons,
          pastProjects: user.pastProjects,
          createdProjects: user.createdProjects,
          activeProjects: user.memberships.map((m) => ({
            projectId: m.projectId,
            roleTitle: m.roleTitle,
            joinedAt: m.joinedAt,
            project: m.project,
          })),
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: UpdateProfileInput = req.body;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          bio: input.bio,
          graduationYear: input.graduationYear,
          major: input.major,
          course: input.course || input.major,
          weeklyAvailability: input.weeklyAvailability,
          interests: input.interests,
          githubUrl: input.githubUrl || null,
          portfolioUrl: input.portfolioUrl || null,
          linkedinUrl: input.linkedinUrl || null,
          avatarUrl: input.avatarUrl || null,
          ...(input.whatsappPhoneNumber !== undefined
            ? {
                whatsappPhoneNumber: input.whatsappPhoneNumber ? input.whatsappPhoneNumber.trim() : null,
                whatsappVerified: Boolean(input.whatsappPhoneNumber && input.whatsappPhoneNumber.trim().length >= 8),
              }
            : {}),
        },
        include: {
          college: true,
          skills: { include: { skill: true } },
          experiences: true,
          hackathons: true,
          pastProjects: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SKILLS & EVIDENCE MANAGEMENT
  // ==========================================

  public static async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: UserSkillCreateInput = req.body;

      // Find or create skill in catalog
      let skill = await prisma.skill.findUnique({
        where: { name: input.skillName },
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: input.skillName,
            category: input.category || 'General',
          },
        });
      }

      // Compute verification status & evidence confidence
      const hasEvidence = !!(input.evidenceUrl || input.evidenceTitle || input.evidenceSummary || input.evidenceType);
      
      let cachedRepos: any[] = [];
      const userRec = await prisma.user.findUnique({
        where: { id: userId },
        select: { githubDataCache: true },
      });
      if (userRec?.githubDataCache) {
        try {
          const parsed = JSON.parse(userRec.githubDataCache);
          if (Array.isArray(parsed.repositories)) cachedRepos = parsed.repositories;
        } catch {
          // ignore
        }
      }

      const confResult = calculateSkillConfidence(
        {
          skillName: input.skillName,
          proficiency: input.proficiency,
          verificationStatus: input.verificationStatus,
          evidenceType: input.evidenceType,
          evidenceUrl: input.evidenceUrl,
          evidenceSummary: input.evidenceSummary,
          isVerified: input.verificationStatus === 'VERIFIED' && hasEvidence,
        },
        cachedRepos
      );

      const verificationStatus = confResult.verificationStatus;
      const isVerified = confResult.isVerified;

      // Upsert UserSkill
      const userSkill = await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId,
            skillId: skill.id,
          },
        },
        update: {
          proficiency: input.proficiency,
          verificationStatus,
          evidenceType: input.evidenceType || null,
          evidenceTitle: input.evidenceTitle || null,
          evidenceUrl: input.evidenceUrl || null,
          evidenceSummary: input.evidenceSummary || null,
          evidenceConfidence: confResult.confidenceScore,
          evidenceConfidenceLevel: confResult.confidenceLevel,
          isVerified,
        },
        create: {
          userId,
          skillId: skill.id,
          proficiency: input.proficiency,
          verificationStatus,
          evidenceType: input.evidenceType || null,
          evidenceTitle: input.evidenceTitle || null,
          evidenceUrl: input.evidenceUrl || null,
          evidenceSummary: input.evidenceSummary || null,
          evidenceConfidence: confResult.confidenceScore,
          evidenceConfidenceLevel: confResult.confidenceLevel,
          isVerified,
        },
        include: { skill: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Skill saved with evidence.',
        data: {
          id: userSkill.id,
          skillId: userSkill.skillId,
          skillName: userSkill.skill.name,
          category: userSkill.skill.category,
          proficiency: userSkill.proficiency,
          verificationStatus: userSkill.verificationStatus,
          evidenceType: userSkill.evidenceType,
          evidenceTitle: userSkill.evidenceTitle,
          evidenceUrl: userSkill.evidenceUrl,
          evidenceSummary: userSkill.evidenceSummary,
          isVerified: userSkill.isVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { skillId } = req.params;
      const input = req.body;

      const existing = await prisma.userSkill.findFirst({
        where: { userId, skillId },
      });

      if (!existing) {
        throw new AppError('User skill not found.', 404);
      }

      const hasEvidence = !!(input.evidenceUrl || input.evidenceType || input.evidenceTitle || input.evidenceSummary || existing.evidenceUrl);
      let verificationStatus = input.verificationStatus || existing.verificationStatus;
      if (input.verificationStatus === 'VERIFIED' || existing.isVerified) {
        verificationStatus = 'VERIFIED';
      } else if (hasEvidence) {
        verificationStatus = 'EVIDENCE_SUPPORTED';
      } else {
        verificationStatus = 'SELF_DECLARED';
      }

      const updated = await prisma.userSkill.update({
        where: { id: existing.id },
        data: {
          proficiency: input.proficiency !== undefined ? Number(input.proficiency) : existing.proficiency,
          verificationStatus,
          evidenceType: input.evidenceType !== undefined ? input.evidenceType : existing.evidenceType,
          evidenceTitle: input.evidenceTitle !== undefined ? input.evidenceTitle : existing.evidenceTitle,
          evidenceUrl: input.evidenceUrl !== undefined ? input.evidenceUrl : existing.evidenceUrl,
          evidenceSummary: input.evidenceSummary !== undefined ? input.evidenceSummary : existing.evidenceSummary,
          isVerified: verificationStatus === 'VERIFIED',
        },
        include: { skill: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Skill updated.',
        data: {
          id: updated.id,
          skillId: updated.skillId,
          skillName: updated.skill.name,
          category: updated.skill.category,
          proficiency: updated.proficiency,
          verificationStatus: updated.verificationStatus,
          evidenceType: updated.evidenceType,
          evidenceTitle: updated.evidenceTitle,
          evidenceUrl: updated.evidenceUrl,
          evidenceSummary: updated.evidenceSummary,
          isVerified: updated.isVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async removeSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { skillId } = req.params;

      await prisma.userSkill.deleteMany({
        where: {
          userId,
          skillId,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Skill removed from profile.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // EXPERIENCES MANAGEMENT
  // ==========================================

  public static async addExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: StudentExperienceInput = req.body;

      const experience = await prisma.studentExperience.create({
        data: {
          userId,
          title: input.title,
          company: input.company,
          location: input.location || null,
          startDate: input.startDate,
          endDate: input.endDate || (input.isCurrent ? 'Present' : null),
          isCurrent: input.isCurrent || false,
          description: input.description || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Experience added successfully.',
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input = req.body;

      const existing = await prisma.studentExperience.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new AppError('Experience entry not found.', 404);
      }

      const updated = await prisma.studentExperience.update({
        where: { id },
        data: {
          title: input.title || existing.title,
          company: input.company || existing.company,
          location: input.location !== undefined ? input.location : existing.location,
          startDate: input.startDate || existing.startDate,
          endDate: input.endDate !== undefined ? input.endDate : existing.endDate,
          isCurrent: input.isCurrent !== undefined ? input.isCurrent : existing.isCurrent,
          description: input.description !== undefined ? input.description : existing.description,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Experience updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.studentExperience.deleteMany({
        where: { id, userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Experience removed.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // HACKATHONS MANAGEMENT
  // ==========================================

  public static async addHackathon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: StudentHackathonInput = req.body;

      const hackathon = await prisma.studentHackathon.create({
        data: {
          userId,
          title: input.title,
          projectName: input.projectName || null,
          award: input.award || null,
          date: input.date,
          description: input.description || null,
          projectUrl: input.projectUrl || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Hackathon added successfully.',
        data: hackathon,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateHackathon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input = req.body;

      const existing = await prisma.studentHackathon.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new AppError('Hackathon entry not found.', 404);
      }

      const updated = await prisma.studentHackathon.update({
        where: { id },
        data: {
          title: input.title || existing.title,
          projectName: input.projectName !== undefined ? input.projectName : existing.projectName,
          award: input.award !== undefined ? input.award : existing.award,
          date: input.date || existing.date,
          description: input.description !== undefined ? input.description : existing.description,
          projectUrl: input.projectUrl !== undefined ? input.projectUrl : existing.projectUrl,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Hackathon updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteHackathon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.studentHackathon.deleteMany({
        where: { id, userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Hackathon removed.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PAST PROJECTS MANAGEMENT
  // ==========================================

  public static async addPastProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: StudentPastProjectInput = req.body;

      const project = await prisma.studentPastProject.create({
        data: {
          userId,
          title: input.title,
          role: input.role || null,
          description: input.description,
          technologies: input.technologies,
          projectUrl: input.projectUrl || null,
          githubUrl: input.githubUrl || null,
          isFeatured: input.isFeatured || false,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Portfolio project added successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePastProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const input = req.body;

      const existing = await prisma.studentPastProject.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new AppError('Project not found.', 404);
      }

      const updated = await prisma.studentPastProject.update({
        where: { id },
        data: {
          title: input.title || existing.title,
          role: input.role !== undefined ? input.role : existing.role,
          description: input.description || existing.description,
          technologies: input.technologies || existing.technologies,
          projectUrl: input.projectUrl !== undefined ? input.projectUrl : existing.projectUrl,
          githubUrl: input.githubUrl !== undefined ? input.githubUrl : existing.githubUrl,
          isFeatured: input.isFeatured !== undefined ? input.isFeatured : existing.isFeatured,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Project updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deletePastProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.studentPastProject.deleteMany({
        where: { id, userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Project removed.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SEARCH & ONBOARDING
  // ==========================================

  public static async searchStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, collegeId, skill } = req.query as {
        query?: string;
        collegeId?: string;
        skill?: string;
      };

      const where: any = { role: 'STUDENT' };

      if (collegeId) {
        where.collegeId = collegeId;
      }

      if (query) {
        where.OR = [
          { name: { contains: query } },
          { bio: { contains: query } },
          { major: { contains: query } },
        ];
      }

      if (skill) {
        where.skills = {
          some: {
            skill: {
              name: { contains: skill },
            },
          },
        };
      }

      const students = await prisma.user.findMany({
        where,
        include: {
          college: true,
          skills: { include: { skill: true } },
          pastProjects: { take: 3 },
          experiences: { take: 2 },
          hackathons: { take: 2 },
        },
        take: 30,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: students.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          avatarUrl: s.avatarUrl,
          bio: s.bio,
          college: s.college,
          major: s.major,
          course: s.course || s.major,
          graduationYear: s.graduationYear,
          weeklyAvailability: s.weeklyAvailability,
          interests: s.interests,
          githubUrl: s.githubUrl,
          portfolioUrl: s.portfolioUrl,
          skills: s.skills.map((us) => ({
            skillId: us.skillId,
            skillName: us.skill.name,
            category: us.skill.category,
            proficiency: us.proficiency,
            verificationStatus: us.verificationStatus,
            evidenceType: us.evidenceType,
            evidenceUrl: us.evidenceUrl,
            evidenceSummary: us.evidenceSummary,
            isVerified: us.isVerified,
          })),
          pastProjectsCount: s.pastProjects.length,
          experiencesCount: s.experiences.length,
          hackathonsCount: s.hackathons.length,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async completeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input = req.body;

      // 1. Update basic user profile
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          avatarUrl: input.avatarUrl || null,
          course: input.course || null,
          major: input.major || input.course || null,
          graduationYear: input.graduationYear ? Number(input.graduationYear) : null,
          weeklyAvailability: input.weeklyAvailability || '5-10h',
          interests: Array.isArray(input.interests) ? input.interests.join(', ') : input.interests || null,
          githubUrl: input.githubUrl || null,
          portfolioUrl: input.portfolioUrl || null,
          linkedinUrl: input.linkedinUrl || null,
          bio: input.bio || null,
          onboardingCompleted: true,
        },
        include: {
          college: true,
          skills: { include: { skill: true } },
        },
      });

      // 2. Process and upsert skills
      if (Array.isArray(input.skills) && input.skills.length > 0) {
        for (const s of input.skills) {
          if (!s.skillName || !s.skillName.trim()) continue;
          const cleanName = s.skillName.trim();

          // Find or create skill
          let skill = await prisma.skill.findUnique({ where: { name: cleanName } });
          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: cleanName,
                category: s.category || 'General',
              },
            });
          }

          const hasEvidence = !!(s.evidenceUrl || s.evidenceType || s.evidenceTitle);
          const verificationStatus = hasEvidence ? 'EVIDENCE_SUPPORTED' : 'SELF_DECLARED';

          // Check if user already has skill
          const existingUserSkill = await prisma.userSkill.findFirst({
            where: { userId: user.id, skillId: skill.id },
          });

          if (existingUserSkill) {
            await prisma.userSkill.update({
              where: { id: existingUserSkill.id },
              data: {
                proficiency: Math.min(5, Math.max(1, Number(s.proficiency) || 3)),
                evidenceType: s.evidenceType || existingUserSkill.evidenceType,
                evidenceUrl: s.evidenceUrl || existingUserSkill.evidenceUrl,
                verificationStatus: hasEvidence ? 'EVIDENCE_SUPPORTED' : existingUserSkill.verificationStatus,
              },
            });
          } else {
            await prisma.userSkill.create({
              data: {
                userId: user.id,
                skillId: skill.id,
                proficiency: Math.min(5, Math.max(1, Number(s.proficiency) || 3)),
                verificationStatus,
                evidenceType: s.evidenceType || null,
                evidenceUrl: s.evidenceUrl || null,
                isVerified: false,
              },
            });
          }
        }
      }

      // Fetch fresh user with all skills
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          college: true,
          skills: { include: { skill: true } },
          experiences: true,
          hackathons: true,
          pastProjects: true,
        },
      });

      const completion = calculateProfileCompletion(updatedUser);

      return res.status(200).json({
        success: true,
        message: 'Onboarding completed successfully! Your profile is ready.',
        data: {
          user: {
            id: updatedUser!.id,
            name: updatedUser!.name,
            email: updatedUser!.email,
            avatarUrl: updatedUser!.avatarUrl,
            college: updatedUser!.college,
            course: updatedUser!.course,
            major: updatedUser!.major,
            graduationYear: updatedUser!.graduationYear,
            weeklyAvailability: updatedUser!.weeklyAvailability,
            interests: updatedUser!.interests,
            githubUrl: updatedUser!.githubUrl,
            portfolioUrl: updatedUser!.portfolioUrl,
            linkedinUrl: updatedUser!.linkedinUrl,
            onboardingCompleted: updatedUser!.onboardingCompleted,
            skills: updatedUser!.skills.map((us) => ({
              id: us.id,
              skillId: us.skillId,
              skillName: us.skill.name,
              category: us.skill.category,
              proficiency: us.proficiency,
              verificationStatus: us.verificationStatus,
              evidenceType: us.evidenceType,
              evidenceUrl: us.evidenceUrl,
              evidenceSummary: us.evidenceSummary,
              isVerified: us.isVerified,
            })),
            experiences: updatedUser!.experiences,
            hackathons: updatedUser!.hackathons,
            pastProjects: updatedUser!.pastProjects,
          },
          completion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProfileCompletion(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          college: true,
          skills: { include: { skill: true } },
          experiences: true,
          hackathons: true,
          pastProjects: true,
        },
      });

      if (!user) {
        throw new AppError('User not found.', 404);
      }

      const completion = calculateProfileCompletion(user);

      return res.status(200).json({
        success: true,
        data: completion,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PRIVACY, APPEARANCE & ACCOUNT SETTINGS
  // ==========================================

  public static async getPrivacySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          profileVisibility: true,
          collegeVisibility: true,
          portfolioVisibility: true,
          defaultProjectPrivacy: true,
          themePreference: true,
        },
      });
      if (!user) throw new AppError('User not found.', 404);

      return res.status(200).json({
        success: true,
        data: {
          profileVisibility: user.profileVisibility || 'PUBLIC',
          collegeVisibility: user.collegeVisibility ?? true,
          portfolioVisibility: user.portfolioVisibility ?? true,
          defaultProjectPrivacy: user.defaultProjectPrivacy || 'PROGRESSIVE',
          themePreference: user.themePreference || 'DARK',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePrivacySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profileVisibility: input.profileVisibility,
          collegeVisibility: input.collegeVisibility,
          portfolioVisibility: input.portfolioVisibility,
          defaultProjectPrivacy: input.defaultProjectPrivacy,
        },
        select: {
          profileVisibility: true,
          collegeVisibility: true,
          portfolioVisibility: true,
          defaultProjectPrivacy: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Privacy settings updated successfully.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAppearance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          themePreference: input.themePreference,
        },
        select: {
          themePreference: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Appearance preference saved.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      // Delete user cascading records
      await prisma.user.delete({
        where: { id: userId },
      });

      return res.status(200).json({
        success: true,
        message: 'Account permanently deleted.',
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // GITHUB INTEGRATION & EVIDENCE-CONFIDENCE ENGINE
  // =========================================================================

  public static async connectGitHub(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: ConnectGitHubInput = req.body;

      // 1. Fetch user declared skills
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
      });

      const skillList = userSkills.map((us) => ({
        name: us.skill.name,
        proficiency: us.proficiency,
      }));

      // 2. Fetch live data from GitHub API with graceful profile URL fallback
      const githubData = await GitHubService.fetchGitHubProfileData(input.githubUrlOrUsername, skillList);

      // 3. Update User profile with GitHub details and cache
      await prisma.user.update({
        where: { id: userId },
        data: {
          githubUrl: githubData.profileUrl,
          githubUsername: githubData.username || null,
          githubConnectedAt: new Date(),
          githubDataCache: JSON.stringify(githubData),
        },
      });

      // 4. Re-calculate evidence confidence across all declared skills
      // Strict rule: "Do not automatically label someone 'verified' simply because they have GitHub"
      for (const us of userSkills) {
        const conf = calculateSkillConfidence(
          {
            skillName: us.skill.name,
            proficiency: us.proficiency,
            verificationStatus: us.verificationStatus,
            evidenceType: us.evidenceType,
            evidenceUrl: us.evidenceUrl,
            evidenceSummary: us.evidenceSummary,
            isVerified: us.isVerified,
          },
          githubData.repositories
        );

        await prisma.userSkill.update({
          where: { id: us.id },
          data: {
            evidenceConfidence: conf.confidenceScore,
            evidenceConfidenceLevel: conf.confidenceLevel,
            verificationStatus: conf.verificationStatus,
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: githubData.isLiveSync
          ? 'GitHub profile connected and synchronized as skill evidence.'
          : 'GitHub profile URL saved with graceful fallback.',
        data: githubData,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getGitHubData(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          skills: { include: { skill: true } },
        },
      });

      if (!user) {
        throw new AppError('User not found.', 404);
      }

      if (!user.githubUrl && !user.githubUsername) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'User has not connected a GitHub profile.',
        });
      }

      // Check if cache exists
      let cachedData = null;
      if (user.githubDataCache) {
        try {
          cachedData = JSON.parse(user.githubDataCache);
        } catch {
          cachedData = null;
        }
      }

      if (cachedData) {
        return res.status(200).json({
          success: true,
          data: cachedData,
        });
      }

      // If no cache, fetch fresh data
      const skillList = user.skills.map((us) => ({
        name: us.skill.name,
        proficiency: us.proficiency,
      }));

      const freshData = await GitHubService.fetchGitHubProfileData(
        user.githubUrl || user.githubUsername || '',
        skillList
      );

      // Save cache
      await prisma.user.update({
        where: { id },
        data: { githubDataCache: JSON.stringify(freshData) },
      });

      return res.status(200).json({
        success: true,
        data: freshData,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async disconnectGitHub(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      await prisma.user.update({
        where: { id: userId },
        data: {
          githubUsername: null,
          githubConnectedAt: null,
          githubDataCache: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'GitHub integration disconnected.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getEvidenceConfidenceBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          skills: { include: { skill: true } },
        },
      });

      if (!user) {
        throw new AppError('User not found.', 404);
      }

      let cachedRepos: any[] = [];
      if (user.githubDataCache) {
        try {
          const parsed = JSON.parse(user.githubDataCache);
          if (Array.isArray(parsed.repositories)) cachedRepos = parsed.repositories;
        } catch {}
      }

      const items = user.skills.map((us) => {
        const conf = calculateSkillConfidence(
          {
            skillName: us.skill.name,
            proficiency: us.proficiency,
            verificationStatus: us.verificationStatus,
            evidenceType: us.evidenceType,
            evidenceUrl: us.evidenceUrl,
            evidenceSummary: us.evidenceSummary,
            isVerified: us.isVerified,
          },
          cachedRepos
        );

        return {
          skillId: us.skillId,
          skillName: us.skill.name,
          category: us.skill.category,
          proficiency: us.proficiency,
          verificationStatus: conf.verificationStatus,
          evidenceConfidence: conf.confidenceScore,
          evidenceConfidenceLevel: conf.confidenceLevel,
          evidenceType: us.evidenceType,
          evidenceTitle: us.evidenceTitle,
          evidenceUrl: us.evidenceUrl,
          evidenceSummary: us.evidenceSummary,
          matchedRepositories: conf.matchedRepositories,
          confidenceRationale: conf.confidenceRationale,
          isVerified: conf.isVerified,
        };
      });

      return res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
}
