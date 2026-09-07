import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import { AIService } from '../../services/ai.service';
import { EmailService } from '../../services/email.service';
import { WhatsAppService } from '../../services/whatsapp';
import { emitToUser, emitToProject } from '../../sockets';
import {
  SubmitApplicationInput,
  ReviewApplicationInput,
  ApplicationStatus,
} from '@projectx/common';

export class ApplicationsController {
  public static async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = req.user!.userId;
      const input: SubmitApplicationInput = req.body;

      // 1. Check if project and role exist
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          creator: { include: { college: true } },
          members: true,
          requiredRoles: {
            where: { id: input.projectRoleId },
            include: { requiredSkills: { include: { skill: true } } },
          },
        },
      });

      if (!project) {
        throw new AppError('Project not found.', 404);
      }

      if (project.requiredRoles.length === 0) {
        throw new AppError('Specified project role does not exist.', 404);
      }

      const targetRole = project.requiredRoles[0];

      // 2. Prevent duplicate application
      const existing = await prisma.application.findUnique({
        where: {
          projectId_applicantId_projectRoleId: {
            projectId: input.projectId,
            applicantId,
            projectRoleId: input.projectRoleId,
          },
        },
      });

      if (existing) {
        throw new AppError('You have already applied for this role on this project.', 400);
      }

      // 3. Fetch applicant profile for AI scoring
      const applicant = await prisma.user.findUnique({
        where: { id: applicantId },
        include: {
          college: true,
          skills: { include: { skill: true } },
        },
      });

      if (!applicant) {
        throw new AppError('Applicant not found.', 404);
      }

      // 4. Calculate AI Match Score
      const matchResults = await AIService.matchCandidates({
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
        candidates: [applicant],
      });

      const matchScore = matchResults.length > 0 ? matchResults[0].overallMatchScore : 75;
      const matchAnalysis = matchResults.length > 0 ? matchResults[0].matchExplanation : 'Compatible skill set.';

      // Combine relevant links including portfolio & github
      const allLinks = [...(input.relevantLinks || [])];
      if (input.githubUrl && !allLinks.includes(input.githubUrl)) allLinks.push(input.githubUrl);
      if (input.portfolioUrl && !allLinks.includes(input.portfolioUrl)) allLinks.push(input.portfolioUrl);

      // 5. Create Application in PostgreSQL
      const application = await prisma.application.create({
        data: {
          projectId: input.projectId,
          projectRoleId: input.projectRoleId,
          applicantId,
          pitch: input.pitch,
          relevantLinks: JSON.stringify(allLinks),
          status: 'PENDING',
          matchScore,
          matchAnalysis,
        },
      });

      // 6. Notify Project Owner in Application Dashboard
      const ownerNotif = await prisma.notification.create({
        data: {
          userId: project.creatorId,
          type: 'APPLICATION_RECEIVED',
          title: 'New Candidate Applied!',
          message: `${applicant.name} (${applicant.college.name}) applied for "${targetRole.title}" (${matchScore}% Match).`,
          link: `/workspace/${project.id}?tab=applications`,
        },
      });
      emitToUser(project.creatorId, 'notification_received', ownerNotif);

      // 7. Send Professional Email Notification to Owner's verified email
      await EmailService.sendApplicationReceived({
        creatorEmail: project.creator.email,
        creatorName: project.creator.name,
        applicantName: applicant.name,
        applicantCollege: applicant.college.name,
        applicantMajor: applicant.major,
        projectTitle: project.title,
        roleTitle: targetRole.title,
        matchScore,
        pitch: input.pitch,
        skills: input.relevantSkills?.length ? input.relevantSkills : applicant.skills.map((s) => s.skill.name),
        availability: input.availability || applicant.weeklyAvailability || '10-20 hours/week',
        experience: input.experience,
        portfolioUrl: input.portfolioUrl || applicant.portfolioUrl,
        githubUrl: input.githubUrl || applicant.githubUrl,
        dashboardLink: `http://localhost:5173/workspace/${project.id}`,
      });

      // 7.5 Send WhatsApp Notification to Project Lead (Non-blocking & Safe)
      try {
        await WhatsAppService.sendApplicationNotification({
          applicationId: application.id,
          projectId: project.id,
          projectTitle: project.title,
          projectCreatorId: project.creatorId,
          roleTitle: targetRole.title,
          applicant: {
            id: applicant.id,
            name: applicant.name,
            collegeName: applicant.college.name,
            course: applicant.course || applicant.major || 'Undergraduate Program',
            major: applicant.major,
            graduationYear: applicant.graduationYear,
          },
        });
      } catch (whatsappError: any) {
        // WhatsApp failure must NEVER cause application submission to fail
        console.error('⚠️ [WhatsApp Dispatch Safe Error]:', whatsappError?.message || whatsappError);
      }

      // 8. Notify Applicant (In-App & Email confirmation)
      const applicantNotif = await prisma.notification.create({
        data: {
          userId: applicantId,
          type: 'APPLICATION_SUBMITTED',
          title: 'Application Submitted!',
          message: `Your application for "${targetRole.title}" on "${project.title}" has been sent to the project lead.`,
          link: `/projects/${project.id}`,
        },
      });
      emitToUser(applicantId, 'notification_received', applicantNotif);
      emitToUser(applicantId, 'application_status_updated', {
        applicationId: application.id,
        projectId: project.id,
        status: 'PENDING',
        roleTitle: targetRole.title,
      });
      emitToUser(project.creatorId, 'application_status_updated', {
        applicationId: application.id,
        projectId: project.id,
        status: 'PENDING',
        roleTitle: targetRole.title,
      });
      emitToProject(project.id, 'application_status_updated', {
        applicationId: application.id,
        projectId: project.id,
        status: 'PENDING',
        roleTitle: targetRole.title,
      });

      await EmailService.sendApplicationConfirmationToApplicant({
        applicantEmail: applicant.email,
        applicantName: applicant.name,
        projectTitle: project.title,
        roleTitle: targetRole.title,
        matchScore,
        dashboardLink: `http://localhost:5173/projects/${project.id}`,
      });

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully. Both project lead and applicant notified.',
        data: {
          id: application.id,
          roleName: targetRole.title,
          applicantId,
          matchScore,
          matchAnalysis,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listReceived(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.query as { projectId?: string };

      const where: any = {
        project: {
          creatorId: userId,
        },
      };

      if (projectId) {
        where.projectId = projectId;
      }

      const applications = await prisma.application.findMany({
        where,
        include: {
          project: { select: { id: true, title: true, domain: true } },
          projectRole: true,
          applicant: {
            include: {
              college: true,
              department: true,
              courseRel: true,
              skills: { include: { skill: true } },
              experiences: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: applications.map((a) => {
          let links = [];
          try {
            links = JSON.parse(a.relevantLinks);
          } catch {
            links = [];
          }

          return {
            id: a.id,
            projectId: a.projectId,
            projectTitle: a.project.title,
            projectRoleId: a.projectRoleId,
            roleTitle: a.projectRole?.title || 'Team Member',
            roleName: a.projectRole?.title || 'Team Member',
            applicantId: a.applicant.id,
            applicant: {
              id: a.applicant.id,
              name: a.applicant.name,
              email: a.applicant.email,
              avatarUrl: a.applicant.avatarUrl,
              bio: a.applicant.bio,
              college: a.applicant.college.name,
              collegeName: a.applicant.college.name,
              course: a.applicant.course || a.applicant.courseRel?.name || a.applicant.major || 'Engineering',
              major: a.applicant.major,
              graduationYear: a.applicant.graduationYear,
              githubUrl: a.applicant.githubUrl,
              portfolioUrl: a.applicant.portfolioUrl,
              linkedinUrl: a.applicant.linkedinUrl,
              weeklyAvailability: a.applicant.weeklyAvailability,
              skills: a.applicant.skills.map((us) => ({
                skillName: us.skill.name,
                proficiency: us.proficiency,
                evidenceUrl: us.evidenceUrl,
                isVerified: us.isVerified,
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
            pitch: a.pitch,
            relevantLinks: links,
            status: a.status,
            matchScore: a.matchScore,
            matchAnalysis: a.matchAnalysis,
            createdAt: a.createdAt.toISOString(),
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listSent(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = req.user!.userId;

      const applications = await prisma.application.findMany({
        where: { applicantId },
        include: {
          project: {
            include: {
              creator: { include: { college: true } },
            },
          },
          projectRole: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: applications.map((a) => {
          let links = [];
          try {
            links = JSON.parse(a.relevantLinks);
          } catch {
            links = [];
          }

          return {
            id: a.id,
            projectId: a.projectId,
            projectTitle: a.project.title,
            projectDomain: a.project.domain,
            creatorName: a.project.creator.name,
            creatorCollege: a.project.creator.college.name,
            projectRoleId: a.projectRoleId,
            roleTitle: a.projectRole?.title || 'Team Member',
            pitch: a.pitch,
            relevantLinks: links,
            status: a.status,
            matchScore: a.matchScore,
            matchAnalysis: a.matchAnalysis,
            createdAt: a.createdAt.toISOString(),
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { status }: ReviewApplicationInput = req.body;

      // 1. Fetch application and verify creator ownership
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          project: { include: { creator: true } },
          projectRole: true,
          applicant: { include: { college: true } },
        },
      });

      if (!application) {
        throw new AppError('Application not found.', 404);
      }

      if (application.project.creatorId !== userId) {
        throw new AppError('Forbidden: Only the project creator can review applications.', 403);
      }

      // 2. Update Application Status
      const updated = await prisma.application.update({
        where: { id },
        data: { status },
      });

      const isAccepted = status === 'ACCEPTED';
      const isShortlisted = status === 'SHORTLISTED';

      if (isAccepted) {
        // 3. Add to Project Members
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: application.projectId,
              userId: application.applicantId,
            },
          },
          update: {
            roleTitle: application.projectRole.title,
          },
          create: {
            projectId: application.projectId,
            userId: application.applicantId,
            roleTitle: application.projectRole.title,
          },
        });

        // 4. Mark Project Role as filled only if accepted count meets or exceeds requiredMembers
        const acceptedForRole = await prisma.application.count({
          where: {
            projectRoleId: application.projectRoleId,
            status: 'ACCEPTED',
          },
        });
        const reqMembers = (application.projectRole as any).requiredMembers || 1;
        if (acceptedForRole >= reqMembers) {
          await prisma.projectRole.update({
            where: { id: application.projectRoleId },
            data: { isFilled: true },
          });
        }

        // 5. Post system message in project chat
        await prisma.chatMessage.create({
          data: {
            projectId: application.projectId,
            senderId: application.project.creatorId,
            content: `🎉 Welcomed ${application.applicant.name} (${application.applicant.college.name}) to the team as ${application.projectRole.title}!`,
          },
        });

        emitToProject(application.projectId, 'team_updated', {
          projectId: application.projectId,
          newMember: {
            name: application.applicant.name,
            roleTitle: application.projectRole.title,
          },
        });
      }

      // 6. Create Notification for Applicant
      const notif = await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: isAccepted
            ? 'APPLICATION_ACCEPTED'
            : isShortlisted
            ? 'APPLICATION_SHORTLISTED'
            : 'APPLICATION_REJECTED',
          title: isAccepted
            ? 'Application Accepted! 🎉'
            : isShortlisted
            ? 'Application Shortlisted! ⭐'
            : 'Application Update',
          message: isAccepted
            ? `You have been accepted for "${application.projectRole.title}" on "${application.project.title}"! Private workspace unlocked.`
            : isShortlisted
            ? `Your application for "${application.projectRole.title}" on "${application.project.title}" was shortlisted by the project lead.`
            : `Your application for "${application.projectRole.title}" on "${application.project.title}" was reviewed.`,
          link: isAccepted ? `/workspace/${application.projectId}` : `/projects/${application.projectId}`,
        },
      });

      emitToUser(application.applicantId, 'notification_received', notif);
      emitToUser(application.applicantId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status,
        roleTitle: application.projectRole.title,
      });
      emitToUser(application.project.creatorId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status,
        roleTitle: application.projectRole.title,
      });
      emitToProject(application.projectId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status,
        roleTitle: application.projectRole.title,
      });

      // 7. Send Professional Email Alert to Applicant
      await EmailService.sendApplicationDecision({
        applicantEmail: application.applicant.email,
        applicantName: application.applicant.name,
        projectTitle: application.project.title,
        roleTitle: application.projectRole.title,
        status,
        workspaceLink: `http://localhost:5173/workspace/${application.projectId}`,
      });

      return res.status(200).json({
        success: true,
        message: isAccepted
          ? 'Application accepted! Candidate added to team workspace.'
          : isShortlisted
          ? 'Application shortlisted.'
          : 'Application reviewed.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async withdrawApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const applicantId = req.user!.userId;
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!application) {
        throw new AppError('Application not found.', 404);
      }

      if (application.applicantId !== applicantId) {
        throw new AppError('Forbidden: You can only withdraw your own applications.', 403);
      }

      if (application.status === 'ACCEPTED') {
        throw new AppError('Cannot withdraw an accepted application. Please contact the project lead.', 400);
      }

      await prisma.application.delete({
        where: { id },
      });

      emitToUser(application.project.creatorId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status: 'WITHDRAWN',
      });
      emitToUser(applicantId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status: 'WITHDRAWN',
      });
      emitToProject(application.projectId, 'application_status_updated', {
        applicationId: application.id,
        projectId: application.projectId,
        status: 'WITHDRAWN',
      });

      return res.status(200).json({
        success: true,
        message: 'Application withdrawn successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
