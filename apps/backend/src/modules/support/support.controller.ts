import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import { EmailService } from '../../services/email.service';
import { config } from '../../config';
import { CreateSupportTicketInput, UpdateSupportTicketAdminInput } from '@projectx/common';

export class SupportController {
  // ==========================================
  // PUBLIC & STUDENT ACTIONS
  // ==========================================

  public static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const input: CreateSupportTicketInput = req.body;

      const user = userId ? await prisma.user.findUnique({ where: { id: userId }, include: { college: true } }) : null;
      const contactEmail = input.email || user?.email || config.support.email;

      // 1. Store ticket in database
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: userId || null,
          category: input.category,
          targetId: input.targetId || null,
          subject: input.subject,
          description: input.description,
          attachmentUrl: input.attachmentUrl || null,
          email: contactEmail,
          status: 'OPEN',
          priority: input.category === 'PRIVACY_CONCERN' || input.category === 'INAPPROPRIATE_CONTENT' ? 'HIGH' : 'MEDIUM',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, college: true },
          },
        },
      });

      // 2. If user report, also record in moderation Report table
      if (input.category === 'USER_REPORT' && input.targetId && userId) {
        await prisma.report.create({
          data: {
            reporterId: userId,
            reportedUserId: input.targetId,
            reason: input.subject,
            details: input.description,
            status: 'PENDING',
          },
        });
      }

      // 3. If project report, record in Report table
      if (input.category === 'PROJECT_REPORT' && input.targetId && userId) {
        const project = await prisma.project.findUnique({ where: { id: input.targetId } });
        if (project) {
          await prisma.report.create({
            data: {
              reporterId: userId,
              reportedUserId: project.creatorId,
              projectId: project.id,
              reason: input.subject,
              details: input.description,
              status: 'PENDING',
            },
          });
        }
      }

      // 4. Send email notification to configured SUPPORT_EMAIL
      await EmailService.sendSupportTicketAlert({
        ticketId: ticket.id,
        category: ticket.category,
        subject: ticket.subject,
        description: ticket.description,
        userEmail: contactEmail,
        userName: user?.name,
        attachmentUrl: ticket.attachmentUrl || undefined,
      });

      return res.status(201).json({
        success: true,
        message: `Support ticket #${ticket.id.slice(0, 8)} created successfully. Our safety team has been notified at ${config.support.email}.`,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFaqs(req: Request, res: Response, next: NextFunction) {
    try {
      const faqs = [
        {
          id: 'faq-1',
          category: 'Technical Issue',
          question: 'What should I do if real-time chat or workspace fails to sync?',
          answer: 'Ensure your WebSocket connection is active. You can test your connection in Settings > Notifications > Live Notification Test Dispatcher, or contact support if the issue persists.',
        },
        {
          id: 'faq-2',
          category: 'Privacy Concern',
          question: 'How does ProjectX protect my code and intellectual property?',
          answer: 'ProjectX enforces 4-tier Progressive Project Disclosure. Sensitive algorithms, dataset links, and private GitHub repos are strictly restricted to accepted team members only.',
        },
        {
          id: 'faq-3',
          category: 'User & Safety',
          question: 'How do I report an abusive user or inappropriate content?',
          answer: 'You can report users directly through their chat thread or by submitting a ticket under the "User" or "Inappropriate content" category in Support & Safety.',
        },
        {
          id: 'faq-4',
          category: 'Project Reporting',
          question: 'What constitutes a project violation?',
          answer: 'Projects advertising fake roles, scraping protected academic repos, or attempting to distribute malware will be immediately flagged, reviewed by admins, and suspended.',
        },
        {
          id: 'faq-5',
          category: 'Contact Support',
          question: 'What is the standard response time for support inquiries?',
          answer: `Our safety & support staff reviews all tickets within 24 hours. Urgent privacy or security incidents are prioritized immediately via ${config.support.email}.`,
        },
      ];

      return res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listMyTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN & SUPPORT STAFF MANAGEMENT
  // ==========================================

  public static async listAllTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, search } = req.query as {
        status?: string;
        category?: string;
        search?: string;
      };

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }
      if (category && category !== 'ALL') {
        where.category = category;
      }
      if (search) {
        where.OR = [
          { subject: { contains: search } },
          { description: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const tickets = await prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, college: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      return res.status(200).json({
        success: true,
        data: tickets,
        meta: {
          total: tickets.length,
          openCount: tickets.filter((t) => t.status === 'OPEN').length,
          inProgressCount: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
          resolvedCount: tickets.filter((t) => t.status === 'RESOLVED').length,
          closedCount: tickets.filter((t) => t.status === 'CLOSED').length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, college: true },
          },
        },
      });

      if (!ticket) {
        throw new AppError('Support ticket not found.', 404);
      }

      return res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTicketAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateSupportTicketAdminInput = req.body;
      const adminUser = req.user!;

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!ticket) {
        throw new AppError('Support ticket not found.', 404);
      }

      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          status: input.status || ticket.status,
          adminResponse: input.adminResponse !== undefined ? input.adminResponse : ticket.adminResponse,
          priority: input.priority || ticket.priority,
          respondedAt: input.adminResponse ? new Date() : ticket.respondedAt,
          respondedBy: input.adminResponse ? adminUser.email || 'Admin Staff' : ticket.respondedBy,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, college: true },
          },
        },
      });

      // If response was added or status updated, send notification email to student
      const recipientEmail = updated.email || updated.user?.email;
      if (recipientEmail && (input.adminResponse || input.status)) {
        await EmailService.sendSupportTicketResponseEmail({
          recipientEmail,
          ticketId: updated.id,
          subject: updated.subject,
          adminResponse: updated.adminResponse || 'Your ticket status has been updated by our support team.',
          status: updated.status,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Ticket updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.supportTicket.update({
        where: { id },
        data: { status: 'CLOSED' },
      });

      return res.status(200).json({
        success: true,
        message: 'Ticket closed successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
