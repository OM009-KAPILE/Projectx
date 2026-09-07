import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import { AIService } from '../../services/ai.service';
import { EmailService } from '../../services/email.service';
import { emitToUser, emitToProject } from '../../sockets';
import {
  AnalyzeProjectInput,
  CreateProjectInput,
  ProjectStatus,
} from '@projectx/common';

export class ProjectsController {
  public static async analyzeIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const input: AnalyzeProjectInput = req.body;
      const analysis = await AIService.analyzeProject(input);
      return res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: CreateProjectInput = req.body;

      // 1. Create Project
      const project = await prisma.project.create({
        data: {
          title: input.title,
          pitch: input.pitch || input.publicTeaser,
          problemStatement: input.problemStatement || input.publicTeaser,
          publicTeaser: input.publicTeaser,
          domain: input.domain,
          difficulty: input.difficulty || 'INTERMEDIATE',
          duration: input.duration || '8 weeks',
          teamSize: input.teamSize || 4,
          collegeVisibility: input.collegeVisibility || 'ANY_COLLEGE',
          selectedColleges: JSON.stringify(input.selectedColleges || []),
          targetCompletionDate: input.targetCompletionDate ? new Date(input.targetCompletionDate) : null,
          privateRepoUrl: input.privateRepoUrl || null,
          privateNotes: input.privateNotes || null,
          architectureSpec: input.architectureSpec || null,
          technicalApproach: input.technicalApproach || null,
          datasetInfo: input.datasetInfo || null,
          detailedWorkflow: input.detailedWorkflow || null,
          documentLinks: input.documentLinks || null,
          creatorId: userId,
          status: 'RECRUITING',
          healthStatus: 'HEALTHY',
          healthScore: 90,
          healthSuggestions: JSON.stringify([
            'Project initialized. Next step: review candidate applications to fill open roles.',
          ]),
        },
      });

      // Link selected colleges for multi-college targeted visibility
      if (Array.isArray(input.selectedColleges) && input.selectedColleges.length > 0) {
        for (const cId of input.selectedColleges) {
          const col = await prisma.college.findFirst({
            where: {
              OR: [{ id: cId }, { domain: cId }, { name: cId }],
            },
          });
          if (col) {
            await prisma.projectSelectedCollege.upsert({
              where: {
                projectId_collegeId: {
                  projectId: project.id,
                  collegeId: col.id,
                },
              },
              update: {},
              create: {
                projectId: project.id,
                collegeId: col.id,
              },
            });
          }
        }
      }

      // 2. Add creator as Lead member
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          roleTitle: 'Project Lead',
        },
      });

      // 3. Create Required Roles and Skills
      for (const role of input.roles) {
        const createdRole = await prisma.projectRole.create({
          data: {
            projectId: project.id,
            title: role.title,
            description: role.description,
            requiredMembers: role.requiredMembers || 1,
            isFilled: false,
          },
        });

        for (const reqSkill of role.requiredSkills) {
          // Find or create skill in catalog
          let skill = await prisma.skill.findUnique({
            where: { name: reqSkill.skillName },
          });
          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: reqSkill.skillName,
                category: reqSkill.category || 'General',
              },
            });
          }

          await prisma.projectRequiredSkill.create({
            data: {
              projectRoleId: createdRole.id,
              skillId: skill.id,
              minLevel: reqSkill.minLevel || 3,
              isCritical: reqSkill.isCritical !== undefined ? reqSkill.isCritical : true,
            },
          });
        }
      }

      // 4. Create Default Milestone
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: 'Phase 1: Team Formation & Architecture Alignment',
          description: 'Recruit cross-college teammates and align on initial interfaces.',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21), // 3 weeks
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Project created with AI role specifications and progressive disclosure.',
        data: { id: project.id },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { domain, skill, query, status, difficulty, duration, college, collegeId, workMode, hasOpenGaps } = req.query as {
        domain?: string;
        skill?: string;
        query?: string;
        status?: string;
        difficulty?: string;
        duration?: string;
        college?: string;
        collegeId?: string;
        workMode?: string;
        hasOpenGaps?: string;
      };

      const currentUserId = req.user?.userId;

      const andConditions: any[] = [{ isPublic: true }];

      // Exclude projects owned/created by the currently authenticated user
      if (currentUserId) {
        andConditions.push({
          creatorId: { not: currentUserId },
        });
      }

      if (domain && domain !== 'All' && domain !== 'All Categories') {
        andConditions.push({ domain: { contains: domain } });
      }

      if (difficulty && difficulty !== 'All') {
        andConditions.push({ difficulty });
      }

      if (duration && duration !== 'All') {
        andConditions.push({ duration: { contains: duration } });
      }

      if (workMode && workMode !== 'All') {
        andConditions.push({ workMode });
      }

      if (collegeId && collegeId !== 'ALL' && collegeId !== 'All') {
        andConditions.push({
          OR: [
            { creator: { collegeId } },
            { members: { some: { user: { collegeId } } } },
          ],
        });
      } else if (college && college !== 'All' && college !== 'ALL') {
        andConditions.push({
          OR: [
            { creator: { college: { name: { contains: college } } } },
            { members: { some: { user: { college: { name: { contains: college } } } } } },
          ],
        });
      }

      if (status) {
        andConditions.push({ status });
      }

      if (query) {
        andConditions.push({
          OR: [
            { title: { contains: query } },
            { publicTeaser: { contains: query } },
            { problemStatement: { contains: query } },
          ],
        });
      }

      if (skill && skill !== 'All') {
        andConditions.push({
          requiredRoles: {
            some: {
              requiredSkills: {
                some: {
                  skill: {
                    name: { contains: skill },
                  },
                },
              },
            },
          },
        });
      }

      if (hasOpenGaps === 'true') {
        andConditions.push({
          requiredRoles: {
            some: {
              isFilled: false,
            },
          },
        });
      }

      const projects = await prisma.project.findMany({
        where: { AND: andConditions },
        include: {
          creator: {
            include: { college: true },
          },
          members: {
            include: {
              user: {
                include: { college: true },
              },
            },
          },
          allowedColleges: true,
          requiredRoles: {
            include: {
              requiredSkills: {
                include: { skill: true },
              },
              applications: {
                where: {
                  status: { notIn: ['WITHDRAWN', 'REJECTED'] },
                },
                select: { id: true, status: true },
              },
            },
          },
          applications: currentUserId
            ? {
                where: { applicantId: currentUserId },
                select: { id: true, status: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
      });

      const userCollegeId = req.user?.collegeId;
      const userCollegeDomain = req.user?.collegeDomain;

      // Filter projects by Multi-College Visibility
      const visibleProjects = projects.filter((p) => {
        // If removed by moderation, hide from public feed
        if (p.isRemoved) return false;

        // Creator projects MUST NOT appear in Explore Projects
        if (currentUserId && p.creatorId === currentUserId) {
          return false;
        }

        // Accepted/existing members can always see non-owned projects they joined
        if (currentUserId && p.members.some((m) => m.userId === currentUserId)) {
          return true;
        }

        // 1. All Colleges (Open to all verified students)
        if (p.collegeVisibility === 'ANY_COLLEGE' || p.collegeVisibility === 'ALL_COLLEGES') {
          return true;
        }

        // 2. Same College Only
        if (p.collegeVisibility === 'SAME_COLLEGE' || p.collegeVisibility === 'MY_COLLEGE') {
          return userCollegeId && p.creator.collegeId === userCollegeId;
        }

        // 3. Selected Colleges Only
        if (p.collegeVisibility === 'SELECTED_COLLEGES') {
          if (!userCollegeId) return false;
          if (p.allowedColleges && p.allowedColleges.some((c) => c.collegeId === userCollegeId)) {
            return true;
          }
          let parsed: string[] = [];
          try {
            parsed = JSON.parse(p.selectedColleges || '[]');
          } catch {
            parsed = [];
          }
          return (
            parsed.includes(userCollegeId) ||
            (userCollegeDomain && parsed.includes(userCollegeDomain)) ||
            (p.creator.college.domain && parsed.includes(p.creator.college.domain))
          );
        }

        return true;
      });

      // Transform to Public Safe Listing (Progressive Disclosure - IP Protected)
      const listings = visibleProjects.map((p) => {
        const participatingColleges = Array.from(
          new Set([
            p.creator.college.name,
            ...p.members.map((m) => m.user.college.name),
          ])
        );

        const isMember = currentUserId
          ? p.members.some((m) => m.userId === currentUserId) || p.creatorId === currentUserId
          : false;

        const hasApplied = currentUserId
          ? Array.isArray(p.applications) && p.applications.length > 0
          : false;

        return {
          id: p.id,
          title: p.title,
          publicTeaser: p.publicTeaser,
          domain: p.domain,
          problemStatement: p.problemStatement,
          difficulty: p.difficulty || 'INTERMEDIATE',
          duration: p.duration || '8 weeks',
          workMode: p.workMode || 'REMOTE',
          status: p.status,
          healthStatus: p.healthStatus,
          healthScore: p.healthScore,
          creator: {
            id: p.creator.id,
            name: p.creator.name,
            college: p.creator.college.name,
            avatarUrl: p.creator.avatarUrl,
          },
          memberCount: p.members.length,
          collegeCount: participatingColleges.length,
          participatingColleges,
          openRoles: p.requiredRoles
            .filter((r) => !r.isFilled)
            .map((r) => {
              const activeApps = (r as any).applications || [];
              const acceptedApps = activeApps.filter((a: any) => a.status === 'ACCEPTED');
              const reqMembers = (r as any).requiredMembers || 1;
              return {
                id: r.id,
                title: r.title,
                description: r.description,
                isFilled: r.isFilled,
                requiredMembers: reqMembers,
                applicationCount: activeApps.length,
                applicationsCount: activeApps.length,
                acceptedCount: acceptedApps.length,
                requiredSkills: r.requiredSkills.map((rs) => ({
                  id: rs.id,
                  skillName: rs.skill.name,
                  category: rs.skill.category,
                  minLevel: rs.minLevel,
                  isCritical: rs.isCritical,
                })),
              };
            }),
          createdAt: p.createdAt.toISOString(),
          isMember,
          hasApplied,
        };
      });

      return res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyCreatedProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.userId;
      let projects = await prisma.project.findMany({
        where: { creatorId },
        include: {
          creator: { include: { college: true } },
          members: {
            include: {
              user: {
                include: {
                  college: true,
                  skills: { include: { skill: true } },
                },
              },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
          applications: {
            include: {
              applicant: {
                include: {
                  college: true,
                  department: true,
                  courseRel: true,
                  skills: { include: { skill: true } },
                  experiences: true,
                },
              },
              projectRole: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If user has no created projects yet, auto-provision 2 starter lead projects
      if (projects.length === 0) {
        const starterProjectsDef = [
          {
            title: 'AI Campus Study Buddy & Flashcard Engine',
            domain: 'Artificial Intelligence',
            pitch: 'Adaptive AI flashcard and quiz generator that ingests lecture PDFs and schedules spaced-repetition study sessions for student teams.',
            publicTeaser: 'Spaced repetition flashcard app with automated lecture slide extraction and multi-agent quiz generation.',
            problemStatement: 'Students waste hours creating manual flashcards from dense lecture slides and struggle to maintain active recall habits before exams.',
            difficulty: 'INTERMEDIATE',
            duration: '8 weeks',
            teamSize: 4,
            workMode: 'REMOTE',
            collegeVisibility: 'ANY_COLLEGE',
            healthStatus: 'HEALTHY',
            healthScore: 92,
            healthSuggestions: JSON.stringify(['PDF parsing pipeline validated with PyMuPDF.', 'Actively recruiting Python Developer, UI/UX Designer, and React Developer.']),
            roles: [
              { title: 'Python & NLP Developer', description: 'Build text extraction and question generation pipeline with FastAPI and LangChain.', requiredMembers: 2, skills: ['Python'] },
              { title: 'UI/UX Designer', description: 'Design clean mobile-first flashcard review UI and spaced-repetition progress widgets.', requiredMembers: 1, skills: ['UI/UX Design & Figma'] },
              { title: 'React Frontend Developer', description: 'Build interactive student dashboard with study group rooms and live quiz battles.', requiredMembers: 1, skills: ['React'] },
            ],
            tasks: [
              { title: 'Setup PDF Text Extraction Worker', description: 'Extract slides, diagrams, and headings into structured JSON.', status: 'IN_PROGRESS', priority: 'HIGH' },
              { title: 'Design Spaced Repetition Algorithm', description: 'Implement SM-2 memory retention interval calculations.', status: 'TODO', priority: 'HIGH' },
            ],
          },
          {
            title: 'Smart Hackathon Team Matcher',
            domain: 'Web Development',
            pitch: 'Cross-college hackathon team formation portal matching student developers, designers, and pitch presenters based on complementary skill matrices.',
            publicTeaser: 'Algorithmic hackathon teammate matcher assessing skill coverage, availability, and past project experience.',
            problemStatement: 'Solo participants at collegiate hackathons struggle to find balanced teammates with complementary skills before ideation deadlines.',
            difficulty: 'INTERMEDIATE',
            duration: '6 weeks',
            teamSize: 4,
            workMode: 'HYBRID',
            collegeVisibility: 'ANY_COLLEGE',
            healthStatus: 'HEALTHY',
            healthScore: 90,
            healthSuggestions: JSON.stringify(['Skill matrix compatibility scoring model ready for integration.']),
            roles: [
              { title: 'Full-Stack React Developer', description: 'Build real-time teammate swipe and invite interface with WebSocket presence.', requiredMembers: 2, skills: ['React', 'TypeScript'] },
              { title: 'Backend Node.js Engineer', description: 'Develop matching algorithms and team composition gap analyzer.', requiredMembers: 1, skills: ['Node.js'] },
              { title: 'UI/UX Designer', description: 'Design engaging participant profile cards and team completeness indicators.', requiredMembers: 1, skills: ['UI/UX Design & Figma'] },
            ],
            tasks: [
              { title: 'Design Teammate Discovery Card', description: 'Figma prototypes showcasing skills, college, and hackathon awards.', status: 'DONE', priority: 'MEDIUM' },
              { title: 'Implement Skill Gap Matcher Algorithm', description: 'Calculate team synergy score based on missing role competencies.', status: 'IN_PROGRESS', priority: 'HIGH' },
            ],
          },
        ];

        for (const sp of starterProjectsDef) {
          const newProj = await prisma.project.create({
            data: {
              title: sp.title,
              pitch: sp.pitch,
              publicTeaser: sp.publicTeaser,
              problemStatement: sp.problemStatement,
              domain: sp.domain,
              status: 'RECRUITING',
              healthStatus: sp.healthStatus,
              healthScore: sp.healthScore,
              healthSuggestions: sp.healthSuggestions,
              difficulty: sp.difficulty as any,
              duration: sp.duration,
              teamSize: sp.teamSize,
              workMode: sp.workMode as any,
              collegeVisibility: sp.collegeVisibility as any,
              creatorId,
              isPublic: true,
              targetCompletionDate: new Date(Date.now() + 86400000 * 60),
              privateRepoUrl: `https://github.com/projectx-starter/${sp.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              privateNotes: 'Project lead workspace initialized. Open for student applications.',
              architectureSpec: 'FastAPI Backend + React Frontend + PostgreSQL Database.',
            },
          });

          await prisma.projectMember.create({
            data: {
              projectId: newProj.id,
              userId: creatorId,
              roleTitle: 'Project Lead',
            },
          });

          for (const r of sp.roles) {
            const roleRec = await prisma.projectRole.create({
              data: {
                projectId: newProj.id,
                title: r.title,
                description: r.description,
                requiredMembers: r.requiredMembers,
                isFilled: false,
              },
            });

            for (const skillName of r.skills) {
              let sRec = await prisma.skill.findFirst({ where: { name: skillName } });
              if (!sRec) {
                sRec = await prisma.skill.create({ data: { name: skillName, category: 'General' } });
              }
              await prisma.projectRequiredSkill.create({
                data: {
                  projectRoleId: roleRec.id,
                  skillId: sRec.id,
                  minLevel: 3,
                  isCritical: true,
                },
              });
            }
          }

          for (let i = 0; i < sp.tasks.length; i++) {
            const taskDef = sp.tasks[i];
            await prisma.task.create({
              data: {
                projectId: newProj.id,
                title: taskDef.title,
                description: taskDef.description,
                status: taskDef.status as any,
                priority: taskDef.priority as any,
                assigneeId: creatorId,
                orderIndex: i,
              },
            });
          }
        }

        // Re-fetch created projects
        projects = await prisma.project.findMany({
          where: { creatorId },
          include: {
            creator: { include: { college: true } },
            members: {
              include: {
                user: {
                  include: {
                    college: true,
                    skills: { include: { skill: true } },
                  },
                },
              },
            },
            requiredRoles: {
              include: {
                requiredSkills: { include: { skill: true } },
              },
            },
            applications: {
              include: {
                applicant: {
                  include: {
                    college: true,
                    department: true,
                    courseRel: true,
                    skills: { include: { skill: true } },
                    experiences: true,
                  },
                },
                projectRole: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const mappedProjects = projects.map((p) => {
        let links: string[] = [];
        const pendingApps = (p.applications || []).filter(
          (a: any) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
        );
        const latestPendingAppAt = pendingApps.length > 0
          ? Math.max(...pendingApps.map((a: any) => new Date(a.createdAt).getTime()))
          : 0;

        return {
          id: p.id,
          title: p.title,
          domain: p.domain,
          publicTeaser: p.publicTeaser,
          problemStatement: p.problemStatement,
          difficulty: p.difficulty,
          duration: p.duration,
          status: p.status,
          healthStatus: p.healthStatus,
          healthScore: p.healthScore,
          createdAt: p.createdAt,
          pendingApplicationsCount: pendingApps.length,
          latestPendingApplicationAt: latestPendingAppAt > 0 ? new Date(latestPendingAppAt).toISOString() : null,
          _latestPendingTimestamp: latestPendingAppAt,
          members: p.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            roleTitle: m.roleTitle,
            joinedAt: m.joinedAt,
            user: {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              avatarUrl: m.user.avatarUrl,
              collegeName: m.user.college?.name || 'Sanjivani University',
              major: m.user.major,
              skills: m.user.skills.map((s) => s.skill.name),
            },
          })),
          requiredRoles: p.requiredRoles.map((r) => {
            const activeApps = (p.applications || []).filter(
              (a: any) => a.projectRoleId === r.id && a.status !== 'WITHDRAWN' && a.status !== 'REJECTED'
            );
            const acceptedApps = (p.applications || []).filter(
              (a: any) => a.projectRoleId === r.id && a.status === 'ACCEPTED'
            );
            const reqMembers = (r as any).requiredMembers || 1;
            return {
              id: r.id,
              title: r.title,
              description: r.description,
              isFilled: r.isFilled,
              requiredMembers: reqMembers,
              applicationCount: activeApps.length,
              applicationsCount: activeApps.length,
              acceptedCount: acceptedApps.length,
              requiredSkills: r.requiredSkills.map((s) => ({
                id: s.id,
                skillName: s.skill.name,
                minLevel: s.minLevel,
                isCritical: s.isCritical,
              })),
            };
          }),
          applications: p.applications.map((a) => {
            let appLinks: string[] = [];
            try {
              appLinks = JSON.parse(a.relevantLinks);
            } catch {
              appLinks = [];
            }
            return {
              id: a.id,
              projectId: a.projectId,
              projectRoleId: a.projectRoleId,
              roleTitle: a.projectRole?.title || 'Team Member',
              status: a.status,
              pitch: a.pitch,
              matchScore: a.matchScore,
              matchAnalysis: a.matchAnalysis,
              createdAt: a.createdAt,
              relevantLinks: appLinks,
              applicant: {
                id: a.applicant.id,
                name: a.applicant.name,
                email: a.applicant.email,
                avatarUrl: a.applicant.avatarUrl,
                bio: a.applicant.bio,
                collegeName: a.applicant.college?.name || 'Sanjivani University',
                course: a.applicant.course || a.applicant.courseRel?.name || a.applicant.major || 'Engineering',
                major: a.applicant.major,
                graduationYear: a.applicant.graduationYear,
                githubUrl: a.applicant.githubUrl,
                portfolioUrl: a.applicant.portfolioUrl,
                linkedinUrl: a.applicant.linkedinUrl,
                weeklyAvailability: a.applicant.weeklyAvailability,
                skills: a.applicant.skills.map((s) => ({
                  skillName: s.skill.name,
                  proficiency: s.proficiency,
                  isVerified: s.isVerified,
                })),
                experiences: (a.applicant as any).experiences?.map((e: any) => ({
                  id: e.id,
                  title: e.title,
                  company: e.company,
                  location: e.location,
                  startDate: e.startDate,
                  endDate: e.endDate,
                  isCurrent: e.isCurrent,
                  description: e.description,
                })) || [],
              },
            };
          }),
        };
      });

      // Sort projects: pending applications at TOP (newest pending first), then by createdAt desc
      mappedProjects.sort((a, b) => {
        if (a.pendingApplicationsCount > 0 && b.pendingApplicationsCount > 0) {
          return b._latestPendingTimestamp - a._latestPendingTimestamp;
        }
        if (a.pendingApplicationsCount > 0) return -1;
        if (b.pendingApplicationsCount > 0) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return res.status(200).json({
        success: true,
        data: mappedProjects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyJoinedProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.userId;
      const memberships = await prisma.projectMember.findMany({
        where: {
          userId: currentUserId,
          project: {
            creatorId: { not: currentUserId },
          },
        },
        include: {
          project: {
            include: {
              creator: { include: { college: true } },
              members: {
                include: {
                  user: {
                    include: {
                      college: true,
                      skills: { include: { skill: true } },
                    },
                  },
                },
              },
              requiredRoles: {
                include: {
                  requiredSkills: { include: { skill: true } },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      const data = memberships.map((m) => {
        const p = m.project;
        return {
          id: p.id,
          title: p.title,
          domain: p.domain,
          publicTeaser: p.publicTeaser,
          problemStatement: p.problemStatement,
          difficulty: p.difficulty,
          duration: p.duration,
          status: p.status,
          healthStatus: p.healthStatus,
          healthScore: p.healthScore,
          createdAt: p.createdAt,
          myRole: m.roleTitle,
          joinedAt: m.joinedAt,
          creator: {
            id: p.creator.id,
            name: p.creator.name,
            collegeName: p.creator.college?.name || 'Partner College',
            avatarUrl: p.creator.avatarUrl,
          },
          memberCount: p.members.length,
          members: p.members.map((mem) => ({
            id: mem.id,
            userId: mem.userId,
            roleTitle: mem.roleTitle,
            joinedAt: mem.joinedAt,
            user: {
              id: mem.user.id,
              name: mem.user.name,
              collegeName: mem.user.college?.name || 'Partner College',
              avatarUrl: mem.user.avatarUrl,
            },
          })),
          requiredRoles: p.requiredRoles.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            isFilled: r.isFilled,
            requiredSkills: r.requiredSkills.map((s) => ({
              id: s.id,
              skillName: s.skill.name,
              minLevel: s.minLevel,
            })),
          })),
        };
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            include: { college: true, skills: { include: { skill: true } } },
          },
          members: {
            include: {
              user: {
                include: { college: true, skills: { include: { skill: true } } },
              },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: {
                include: { skill: true },
              },
            },
          },
          milestones: {
            include: { tasks: true },
            orderBy: { dueDate: 'asc' },
          },
          applications: {
            include: {
              applicant: { include: { college: true } },
              projectRole: true,
            },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      const participatingColleges = Array.from(
        new Set([
          project.creator.college.name,
          ...project.members.map((m) => m.user.college.name),
        ])
      );

      // Determine Progressive Disclosure Access Level (1, 2, 3, or 4)
      const isOwner = !!currentUserId && project.creatorId === currentUserId;
      const isMember = isOwner || (!!currentUserId && project.members.some((m) => m.userId === currentUserId));
      
      const userApp = currentUserId
        ? project.applications.find((a) => a.applicantId === currentUserId && a.status !== 'REJECTED')
        : null;
      const isApplicant = !isMember && !!userApp;

      let disclosureLevel = 1; // 1 = Public, 2 = Applicant, 3 = Accepted Member, 4 = Owner
      let privacyIndicator = {
        level: 1,
        code: 'LEVEL_1_PUBLIC',
        label: 'LEVEL 1: PUBLIC SAFE LISTING',
        badgeColor: 'emerald',
        description: 'Safe public preview. Proprietary algorithms, datasets, and source code are securely encrypted.',
        isEncrypted: true,
      };

      if (isOwner) {
        disclosureLevel = 4;
        privacyIndicator = {
          level: 4,
          code: 'LEVEL_4_OWNER',
          label: 'LEVEL 4: PROJECT OWNER',
          badgeColor: 'purple',
          description: 'Full administrative access, access revocation control, and private creator notes.',
          isEncrypted: false,
        };
      } else if (isMember) {
        disclosureLevel = 3;
        privacyIndicator = {
          level: 3,
          code: 'LEVEL_3_MEMBER',
          label: 'LEVEL 3: ACCEPTED MEMBER',
          badgeColor: 'blue',
          description: 'Full team workspace unlocked: technical specifications, repository, datasets, and tasks.',
          isEncrypted: false,
        };
      } else if (isApplicant) {
        disclosureLevel = 2;
        privacyIndicator = {
          level: 2,
          code: 'LEVEL_2_APPLICANT',
          label: 'LEVEL 2: APPLICANT ACCESS',
          badgeColor: 'amber',
          description: 'Problem statement & milestones visible. Technical architecture and code remain encrypted until acceptance.',
          isEncrypted: true,
        };
      }

      // LEVEL 1: PUBLIC DATA
      const publicData = {
        id: project.id,
        title: project.title,
        creatorId: project.creatorId,
        publicTeaser: project.publicTeaser,
        domain: project.domain,
        category: project.domain,
        difficulty: project.difficulty || 'INTERMEDIATE',
        duration: project.duration || '8 weeks',
        teamSize: project.teamSize || 4,
        workMode: project.workMode || 'REMOTE',
        collegeVisibility: project.collegeVisibility || 'ANY_COLLEGE',
        status: project.status,
        memberCount: project.members.length,
        collegeCount: participatingColleges.length,
        participatingColleges,
        creator: {
          id: project.creator.id,
          name: project.creator.name,
          college: project.creator.college.name,
          avatarUrl: project.creator.avatarUrl,
        },
        openRoles: project.requiredRoles
          .filter((r) => !r.isFilled)
          .map((r) => {
            const activeApps = (project.applications || []).filter(
              (a: any) => a.projectRoleId === r.id && a.status !== 'WITHDRAWN' && a.status !== 'REJECTED'
            );
            const acceptedApps = (project.applications || []).filter(
              (a: any) => a.projectRoleId === r.id && a.status === 'ACCEPTED'
            );
            const reqMembers = (r as any).requiredMembers || 1;
            return {
              id: r.id,
              title: r.title,
              description: r.description,
              isFilled: r.isFilled,
              requiredMembers: reqMembers,
              appliedCount: activeApps.length,
              applicationCount: activeApps.length,
              applicationsCount: activeApps.length,
              acceptedCount: acceptedApps.length,
              requiredSkills: r.requiredSkills.map((rs) => ({
                id: rs.id,
                skillName: rs.skill.name,
                category: rs.skill.category,
                minLevel: rs.minLevel,
                isCritical: rs.isCritical,
              })),
            };
          }),
        requiredRoles: project.requiredRoles.map((r) => {
          const activeApps = (project.applications || []).filter(
            (a: any) => a.projectRoleId === r.id && a.status !== 'WITHDRAWN' && a.status !== 'REJECTED'
          );
          const acceptedApps = (project.applications || []).filter(
            (a: any) => a.projectRoleId === r.id && a.status === 'ACCEPTED'
          );
          const reqMembers = (r as any).requiredMembers || 1;
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            isFilled: r.isFilled,
            requiredMembers: reqMembers,
            appliedCount: activeApps.length,
            applicationCount: activeApps.length,
            applicationsCount: activeApps.length,
            acceptedCount: acceptedApps.length,
            requiredSkills: r.requiredSkills.map((rs) => ({
              id: rs.id,
              skillName: rs.skill.name,
              category: rs.skill.category,
              minLevel: rs.minLevel,
              isCritical: rs.isCritical,
            })),
          };
        }),
        createdAt: project.createdAt.toISOString(),
        disclosureLevel,
        privacyIndicator,
        isMember,
        isOwner,
        isApplicant,
        isProgressiveDisclosureLocked: disclosureLevel < 3,
      };

      // LEVEL 1 Response
      if (disclosureLevel === 1) {
        return res.status(200).json({
          success: true,
          data: publicData,
        });
      }

      // LEVEL 2: APPLICANT DATA (Evaluation Info)
      const applicantData = {
        ...publicData,
        problemStatement: project.problemStatement,
        expectedMilestones: project.milestones.map((ms) => ({
          id: ms.id,
          title: ms.title,
          targetWeek: ms.dueDate ? Math.ceil((ms.dueDate.getTime() - project.createdAt.getTime()) / (7 * 24 * 3600 * 1000)) : 4,
        })),
        teamMembers: project.members.map((m) => ({
          name: m.user.name,
          college: m.user.college.name,
          roleTitle: m.roleTitle,
        })),
        userApplication: userApp
          ? {
              id: userApp.id,
              status: userApp.status,
              appliedAt: userApp.createdAt.toISOString(),
              roleTitle: userApp.projectRole?.title || 'Applicant',
            }
          : null,
      };

      if (disclosureLevel === 2) {
        return res.status(200).json({
          success: true,
          data: applicantData,
        });
      }

      // LEVEL 3: ACCEPTED MEMBER DATA (Approved Project IP)
      let parsedSuggestions = [];
      try {
        parsedSuggestions = JSON.parse(project.healthSuggestions);
      } catch {
        parsedSuggestions = [];
      }

      const memberData = {
        ...applicantData,
        pitch: project.pitch,
        technicalApproach: project.technicalApproach,
        architectureSpec: project.architectureSpec,
        datasetInfo: project.datasetInfo,
        detailedWorkflow: project.detailedWorkflow,
        documentLinks: project.documentLinks,
        privateRepoUrl: project.privateRepoUrl,
        healthStatus: project.healthStatus,
        healthScore: project.healthScore,
        healthSuggestions: parsedSuggestions,
        members: project.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          college: m.user.college.name,
          avatarUrl: m.user.avatarUrl,
          roleTitle: m.roleTitle,
          joinedAt: m.joinedAt.toISOString(),
          skills: m.user.skills.map((s) => s.skill.name),
        })),
        milestones: project.milestones.map((ms) => ({
          id: ms.id,
          title: ms.title,
          description: ms.description,
          dueDate: ms.dueDate.toISOString(),
          isCompleted: ms.isCompleted,
          totalTasks: ms.tasks.length,
          completedTasks: ms.tasks.filter((t) => t.status === 'DONE').length,
        })),
      };

      if (disclosureLevel === 3) {
        return res.status(200).json({
          success: true,
          data: memberData,
        });
      }

      // LEVEL 4: PRIVATE TEAM / OWNER DATA
      const ownerData = {
        ...memberData,
        privateNotes: project.privateNotes,
        canRevokeAccess: true,
        applicationsCount: project.applications.length,
        allApplications: project.applications.map((a) => ({
          id: a.id,
          applicantName: a.applicant.name,
          applicantCollege: a.applicant.college.name,
          roleTitle: a.projectRole?.title || 'Builder',
          status: a.status,
          appliedAt: a.createdAt.toISOString(),
        })),
      };

      return res.status(200).json({
        success: true,
        data: ownerData,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async revokeMemberAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: projectId, memberId } = req.params;
      const currentUserId = req.user!.userId;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      if (project.creatorId !== currentUserId) {
        throw new AppError('Forbidden: Only the project owner can revoke member access.', 403);
      }

      const member = await prisma.projectMember.findFirst({
        where: {
          id: memberId,
          projectId,
        },
      });

      if (!member) {
        throw new AppError('Member not found in project.', 404);
      }

      if (member.userId === project.creatorId) {
        throw new AppError('Bad Request: Project owner access cannot be revoked.', 400);
      }

      // Remove from team
      await prisma.projectMember.delete({
        where: { id: member.id },
      });

      return res.status(200).json({
        success: true,
        message: `Access revoked for member ${member.roleTitle}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateVisibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const currentUserId = req.user!.userId;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      if (project.creatorId !== currentUserId) {
        throw new AppError('Forbidden: Only the project owner can update access controls.', 403);
      }

      const { isPublic, collegeVisibility, selectedColleges } = req.body;

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...(isPublic !== undefined && { isPublic }),
          ...(collegeVisibility && { collegeVisibility }),
          ...(selectedColleges && { selectedColleges: JSON.stringify(selectedColleges) }),
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          id: updated.id,
          isPublic: updated.isPublic,
          collegeVisibility: updated.collegeVisibility,
          selectedColleges: updated.selectedColleges,
        },
        message: 'Project access controls updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: {
            include: {
              college: true,
              skills: { include: { skill: true } },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
          members: {
            include: {
              user: {
                include: {
                  college: true,
                  skills: { include: { skill: true } },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      // Aggregate all active team members (including creator)
      const teamList = [...project.members];
      const hasCreator = teamList.some((m) => m.userId === project.creatorId);
      if (!hasCreator && project.creator) {
        teamList.push({
          id: 'creator-lead',
          projectId: project.id,
          userId: project.creator.id,
          roleTitle: 'Project Lead',
          joinedAt: project.createdAt,
          user: project.creator,
        } as any);
      }

      const result = await AIService.detectSkillGaps({
        projectTitle: project.title,
        projectRoles: project.requiredRoles.map((r) => ({
          title: r.title,
          description: r.description,
          requiredSkills: r.requiredSkills.map((rs) => ({
            skillName: rs.skill.name,
            category: rs.skill.category,
            minLevel: rs.minLevel,
            isCritical: rs.isCritical,
          })),
        })),
        currentTeam: teamList.map((m) => ({
          id: m.userId,
          name: m.user.name,
          college: m.user.college?.name || 'University',
          roleTitle: m.roleTitle,
          skills: m.user.skills.map((us) => ({
            skillName: us.skill.name,
            proficiency: us.proficiency,
          })),
        })),
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjectMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { roleId } = req.query as { roleId?: string };

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: { include: { college: true } },
          members: true,
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      // Choose target role
      const targetRole = roleId
        ? project.requiredRoles.find((r) => r.id === roleId)
        : project.requiredRoles.find((r) => !r.isFilled) || project.requiredRoles[0];

      if (!targetRole) {
        return res.status(200).json({ success: true, data: [] });
      }

      // Fetch candidates excluding current members
      const existingMemberUserIds = project.members.map((m) => m.userId);

      const candidates = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          id: { notIn: existingMemberUserIds },
        },
        include: {
          college: true,
          skills: {
            include: { skill: true },
          },
        },
        take: 20,
      });

      const matches = await AIService.matchCandidates({
        targetRole: {
          title: targetRole.title,
          description: targetRole.description,
          requiredSkills: targetRole.requiredSkills.map((rs) => ({
            skillName: rs.skill.name,
            category: rs.skill.category,
            minLevel: rs.minLevel,
            isCritical: rs.isCritical,
          })),
        },
        creatorCollegeDomain: project.creator.college.domain,
        candidates,
      });

      return res.status(200).json({
        success: true,
        data: {
          role: {
            id: targetRole.id,
            title: targetRole.title,
            description: targetRole.description,
          },
          matches,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getHomeFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      let currentUser: any = null;
      if (userId) {
        currentUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            college: true,
            skills: { include: { skill: true } },
          },
        });
      }

      // Fetch all public projects
      const allProjects = await prisma.project.findMany({
        where: { isPublic: true },
        include: {
          creator: { include: { college: true } },
          members: {
            include: {
              user: { include: { college: true } },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
          tasks: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const userSkillNames = new Set(
        (currentUser?.skills || []).map((s: any) => s.skill.name.toLowerCase())
      );

      const formatSafeCard = (p: any, matchScore?: number, rationale?: string) => {
        const allRequiredSkills = p.requiredRoles.flatMap((r: any) =>
          r.requiredSkills.map((rs: any) => ({
            id: rs.id,
            skillName: rs.skill.name,
            category: rs.skill.category,
            minLevel: rs.minLevel,
            isCritical: rs.isCritical,
          }))
        );

        const uniqueSkills = Array.from(
          new Map(allRequiredSkills.map((s: any) => [s.skillName, s])).values()
        );

        const isMember = userId
          ? p.creatorId === userId || p.members.some((m: any) => m.userId === userId)
          : false;

        return {
          id: p.id,
          title: p.title,
          domain: p.domain,
          category: p.domain,
          publicTeaser: p.publicTeaser,
          difficulty: p.difficulty || 'INTERMEDIATE',
          duration: p.duration || '8 weeks',
          teamSize: p.requiredRoles.length + 1,
          currentMemberCount: p.members.length,
          currentMembers: p.members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name,
            avatarUrl: m.user.avatarUrl,
            college: m.user.college?.name || 'University',
          })),
          requiredSkills: uniqueSkills,
          matchPercentage: matchScore,
          matchRationale: rationale,
          healthStatus: p.healthStatus,
          healthScore: p.healthScore,
          isMember,
        };
      };

      // Active Projects
      const activeProjects = allProjects
        .filter((p) => userId && (p.creatorId === userId || p.members.some((m) => m.userId === userId)))
        .map((p) => ({
          ...formatSafeCard(p),
          tasksSummary: {
            total: p.tasks.length,
            done: p.tasks.filter((t) => t.status === 'DONE').length,
            inProgress: p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
          },
        }));

      // Skill Gap Alerts
      const skillGapAlerts: any[] = [];
      if (userId) {
        const myCreatedProjects = allProjects.filter((p) => p.creatorId === userId);
        for (const p of myCreatedProjects) {
          const openCriticalRoles = p.requiredRoles.filter((r) => !r.isFilled);
          for (const role of openCriticalRoles) {
            skillGapAlerts.push({
              projectId: p.id,
              projectTitle: p.title,
              gapRole: role.title,
              criticalSkills: role.requiredSkills.map((s) => s.skill.name),
            });
          }
        }
      }

      // Project Health Alerts
      const healthAlerts: any[] = [];
      for (const p of activeProjects) {
        if (p.healthStatus === 'AT_RISK' || p.healthStatus === 'CRITICAL' || p.healthScore < 80) {
          healthAlerts.push({
            projectId: p.id,
            projectTitle: p.title,
            healthStatus: p.healthStatus,
            healthScore: p.healthScore,
            reason: 'Velocity slowed down or tasks pending review. Tap to check project health.',
          });
        }
      }

      // Other projects (for recommendations)
      const otherProjects = allProjects.filter(
        (p) => !userId || (p.creatorId !== userId && !p.members.some((m) => m.userId === userId))
      );

      // Projects looking for your skills
      const skillMatchingProjects = otherProjects
        .filter((p) => {
          return p.requiredRoles.some((r) =>
            r.requiredSkills.some((rs) => userSkillNames.has(rs.skill.name.toLowerCase()))
          );
        })
        .map((p) => {
          const matched = p.requiredRoles
            .flatMap((r) => r.requiredSkills)
            .filter((rs) => userSkillNames.has(rs.skill.name.toLowerCase()))
            .map((rs) => rs.skill.name);

          return formatSafeCard(
            p,
            Math.min(98, 85 + matched.length * 4),
            `Actively seeking your ${matched.slice(0, 2).join(' & ')} skill set`
          );
        });

      // Recommended Projects
      const recommendedProjects = otherProjects.map((p) => {
        let score = 82;
        let rationale = 'Cross-college innovation project';

        if (currentUser) {
          const matched = p.requiredRoles
            .flatMap((r) => r.requiredSkills)
            .filter((rs) => userSkillNames.has(rs.skill.name.toLowerCase()));

          if (matched.length > 0) {
            score = Math.min(96, 84 + matched.length * 5);
            rationale = `${score}% Match based on your technical profile`;
          }
        }

        return formatSafeCard(p, score, rationale);
      });

      const { calculateProfileCompletion } = await import('@projectx/common');
      const profileCompletion = currentUser
        ? calculateProfileCompletion(currentUser)
        : { score: 0, percentage: 0, completedItems: [], missingItems: [], recommendations: [] };

      return res.status(200).json({
        success: true,
        data: {
          recommendedProjects,
          skillMatchingProjects,
          activeProjects,
          skillGapAlerts,
          healthAlerts,
          profileCompletion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTeamOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const currentUserId = req.user?.userId;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          creator: {
            include: {
              college: true,
              skills: { include: { skill: true } },
            },
          },
          members: {
            include: {
              user: {
                include: {
                  college: true,
                  skills: { include: { skill: true } },
                },
              },
            },
          },
          requiredRoles: {
            include: {
              requiredSkills: { include: { skill: true } },
            },
          },
          applications: {
            where: { status: 'PENDING' },
            include: {
              applicant: {
                include: { college: true, skills: { include: { skill: true } } },
              },
              projectRole: true,
            },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      const isOwner = project.creatorId === currentUserId;

      // 1. Gather all team skills (Creator + Members)
      const teamSkillMap = new Map<string, { level: number; user: string }>();
      
      // Creator skills
      project.creator.skills.forEach((s) => {
        teamSkillMap.set(s.skill.name.toLowerCase(), {
          level: s.proficiency,
          user: project.creator.name,
        });
      });

      // Member skills
      project.members.forEach((m) => {
        m.user.skills.forEach((s) => {
          const key = s.skill.name.toLowerCase();
          const existing = teamSkillMap.get(key);
          if (!existing || s.proficiency > existing.level) {
            teamSkillMap.set(key, { level: s.proficiency, user: m.user.name });
          }
        });
      });

      // 2. Compute Category Coverage & Skill Gaps
      const categoryMap = new Map<string, { total: number; covered: number; skills: string[]; missing: string[] }>();
      const remainingGaps: Array<{
        skillName: string;
        category: string;
        minLevel: number;
        isCritical: boolean;
        roleTitle: string;
        peopleNeeded: number;
      }> = [];

      let totalRequired = 0;
      let totalCovered = 0;

      project.requiredRoles.forEach((role) => {
        role.requiredSkills.forEach((rs) => {
          totalRequired++;
          const skillKey = rs.skill.name.toLowerCase();
          const category = rs.skill.category || 'General';
          const teamHasSkill = teamSkillMap.has(skillKey);
          const hasAdequateLevel = teamHasSkill && (teamSkillMap.get(skillKey)!.level >= rs.minLevel);

          if (!categoryMap.has(category)) {
            categoryMap.set(category, { total: 0, covered: 0, skills: [], missing: [] });
          }

          const catData = categoryMap.get(category)!;
          catData.total++;
          if (!catData.skills.includes(rs.skill.name)) {
            catData.skills.push(rs.skill.name);
          }

          if (hasAdequateLevel) {
            totalCovered++;
            catData.covered++;
          } else {
            if (!catData.missing.includes(rs.skill.name)) {
              catData.missing.push(rs.skill.name);
            }
            remainingGaps.push({
              skillName: rs.skill.name,
              category,
              minLevel: rs.minLevel,
              isCritical: rs.isCritical,
              roleTitle: role.title,
              peopleNeeded: role.isFilled ? 0 : 1,
            });
          }
        });
      });

      // Format visual coverage breakdown
      const visualCoverage = Array.from(categoryMap.entries()).map(([category, data]) => {
        const percentage = data.total > 0 ? Math.round((data.covered / data.total) * 100) : 100;
        const hasWarning = percentage < 100;
        return {
          category,
          percentage,
          status: percentage === 100 ? 'COVERED' : percentage >= 50 ? 'AT_RISK' : 'CRITICAL_GAP',
          hasWarning,
          warningText: hasWarning ? `⚠️ Missing ${data.missing.join(', ')}` : '✓ 100% Fully Covered',
          skills: data.skills,
          missingSkills: data.missing,
        };
      });

      const overallSkillCoverage = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 100;

      // 3. Format Team Roster
      const roster = [
        {
          id: 'creator',
          memberId: 'creator',
          userId: project.creator.id,
          name: project.creator.name,
          avatarUrl: project.creator.avatarUrl,
          college: project.creator.college.name,
          roleTitle: 'Project Lead (Creator)',
          isCreator: true,
          joinedAt: project.createdAt.toISOString(),
          skills: project.creator.skills.map((s) => ({
            skillName: s.skill.name,
            category: s.skill.category,
            proficiency: s.proficiency,
            isVerified: s.isVerified,
          })),
        },
        ...project.members.map((m) => ({
          id: m.id,
          memberId: m.id,
          userId: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          college: m.user.college.name,
          roleTitle: m.roleTitle,
          isCreator: m.userId === project.creatorId,
          joinedAt: m.joinedAt.toISOString(),
          skills: m.user.skills.map((s) => ({
            skillName: s.skill.name,
            category: s.skill.category,
            proficiency: s.proficiency,
            isVerified: s.isVerified,
          })),
        })),
      ];

      return res.status(200).json({
        success: true,
        data: {
          projectId: project.id,
          projectTitle: project.title,
          isOwner,
          overallSkillCoverage,
          visualCoverage,
          remainingGaps,
          members: roster,
          roles: project.requiredRoles.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            isFilled: r.isFilled,
            requiredSkills: r.requiredSkills.map((rs) => ({
              skillName: rs.skill.name,
              category: rs.skill.category,
              minLevel: rs.minLevel,
              isCritical: rs.isCritical,
            })),
          })),
          pendingApplicantsCount: project.applications.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async assignMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: projectId, memberId } = req.params;
      const currentUserId = req.user!.userId;
      const { roleTitle, projectRoleId } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      if (project.creatorId !== currentUserId) {
        throw new AppError('Forbidden: Only the project owner can assign member roles.', 403);
      }

      const member = await prisma.projectMember.findFirst({
        where: { id: memberId, projectId },
        include: { user: true },
      });

      if (!member) {
        throw new AppError('Member not found in project.', 404);
      }

      // Update member role
      const updatedMember = await prisma.projectMember.update({
        where: { id: memberId },
        data: { roleTitle },
      });

      // If specific projectRoleId was assigned, mark that role filled
      if (projectRoleId) {
        await prisma.projectRole.update({
          where: { id: projectRoleId },
          data: { isFilled: true },
        });
      }

      // Notify member
      const notif = await prisma.notification.create({
        data: {
          userId: member.userId,
          type: 'ROLE_ASSIGNED',
          title: 'New Role Assigned!',
          message: `You have been assigned the role "${roleTitle}" on "${project.title}".`,
          link: `/workspace/${projectId}`,
        },
      });
      emitToUser(member.userId, 'notification_received', notif);
      emitToProject(projectId, 'team_updated', { memberId, roleTitle });

      return res.status(200).json({
        success: true,
        message: `Role "${roleTitle}" successfully assigned to ${member.user.name}.`,
        data: updatedMember,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async inviteCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: projectId } = req.params;
      const currentUserId = req.user!.userId;
      const { candidateId, email, roleTitle, customMessage } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { creator: { include: { college: true } } },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      if (project.creatorId !== currentUserId) {
        throw new AppError('Forbidden: Only the project owner can invite candidates.', 403);
      }

      let candidate: any = null;
      if (candidateId) {
        candidate = await prisma.user.findUnique({
          where: { id: candidateId },
          include: { college: true },
        });
      } else if (email) {
        candidate = await prisma.user.findUnique({
          where: { email },
          include: { college: true },
        });
      }

      if (!candidate) {
        throw new AppError('Candidate not found.', 404);
      }

      const role = roleTitle || 'Builder';

      // 1. Create In-App Notification
      const notif = await prisma.notification.create({
        data: {
          userId: candidate.id,
          type: 'PROJECT_INVITATION',
          title: 'Project Team Invitation! 🎉',
          message: `${project.creator.name} (${project.creator.college.name}) invited you to join "${project.title}" as ${role}.`,
          link: `/projects/${projectId}`,
        },
      });
      emitToUser(candidate.id, 'notification_received', notif);

      // 2. Dispatch Professional Invitation Email
      await EmailService.sendTeamInvitationEmail({
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        ownerName: project.creator.name,
        ownerCollege: project.creator.college.name,
        projectTitle: project.title,
        roleTitle: role,
        customMessage,
        projectLink: `http://localhost:5173/projects/${projectId}`,
      });

      return res.status(200).json({
        success: true,
        message: `Invitation successfully sent to ${candidate.name} (${candidate.college.name}).`,
      });
    } catch (error) {
      next(error);
    }
  }
}
