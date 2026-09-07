import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateDirectConversationInput,
  SendMessageInput,
  BlockUserInput,
  ReportUserOrMessageInput,
  ConversationType,
  ReportReason,
} from '@projectx/common';
import { emitToProject, emitToUser, getIO } from '../../sockets';

export class MessagesController {
  /**
   * Validates if User A is authorized to message User B based on platform privacy rules:
   * 1. They are co-members in an accepted project team.
   * 2. OR one is a project owner and the other is an active applicant / member.
   * 3. AND neither user has blocked the other.
   */
  public static async canUsersCommunicate(
    userAId: string,
    userBId: string,
    projectId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (userAId === userBId) {
      return { allowed: true };
    }

    // 1. Check Blocking Status
    const blockRecord = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });

    if (blockRecord) {
      return {
        allowed: false,
        reason: 'Communication is blocked between these users.',
      };
    }

    // 2. Check Co-membership across any project
    const sharedProject = await prisma.project.findFirst({
      where: {
        OR: [
          // User A is creator, User B is accepted member
          {
            creatorId: userAId,
            members: { some: { userId: userBId } },
          },
          // User B is creator, User A is accepted member
          {
            creatorId: userBId,
            members: { some: { userId: userAId } },
          },
          // Both are accepted members
          {
            members: {
              some: { userId: userAId },
            },
            AND: {
              members: {
                some: { userId: userBId },
              },
            },
          },
        ],
      },
    });

    if (sharedProject) {
      return { allowed: true };
    }

    // 3. Check Active Application Relationship (Owner <-> Applicant)
    const applicationRelationship = await prisma.application.findFirst({
      where: {
        OR: [
          // User A is project creator, User B is applicant
          {
            applicantId: userBId,
            project: { creatorId: userAId },
            status: { in: ['PENDING', 'SHORTLISTED', 'UNDER_REVIEW', 'ACCEPTED'] },
          },
          // User B is project creator, User A is applicant
          {
            applicantId: userAId,
            project: { creatorId: userBId },
            status: { in: ['PENDING', 'SHORTLISTED', 'UNDER_REVIEW', 'ACCEPTED'] },
          },
        ],
      },
    });

    if (applicationRelationship) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Messaging is restricted to project owners, applicants, and accepted team members.',
    };
  }

  /**
   * Lists all conversations for the authenticated user (both 1:1 direct and project team chats).
   */
  public static async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const participantRecords = await prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              project: true,
              participants: {
                include: {
                  user: {
                    include: { college: true },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: true,
                },
              },
            },
          },
        },
        orderBy: {
          conversation: {
            updatedAt: 'desc',
          },
        },
      });

      const formattedConversations = await Promise.all(
        participantRecords.map(async (record) => {
          const conv = record.conversation;
          const otherParticipants = conv.participants
            .filter((p) => p.userId !== userId)
            .map((p) => ({
              id: p.user.id,
              name: p.user.name,
              avatarUrl: p.user.avatarUrl,
              collegeName: p.user.college?.name || 'University',
              collegeDomain: p.user.college?.domain || '',
            }));

          const latestMsg = conv.messages[0] || null;

          // Count unread messages
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: { gt: record.lastReadAt },
            },
          });

          return {
            id: conv.id,
            type: conv.type,
            title: conv.title || (conv.type === 'PROJECT_TEAM' ? `${conv.project?.title || 'Project'} Team Chat` : otherParticipants[0]?.name || 'Direct Chat'),
            projectId: conv.projectId,
            projectTitle: conv.project?.title || null,
            participants: conv.participants.map((p) => ({
              id: p.user.id,
              name: p.user.name,
              avatarUrl: p.user.avatarUrl,
              collegeName: p.user.college?.name || 'University',
              collegeDomain: p.user.college?.domain || '',
            })),
            otherParticipant: otherParticipants[0] || null,
            latestMessage: latestMsg
              ? {
                  id: latestMsg.id,
                  content: latestMsg.content,
                  senderId: latestMsg.senderId,
                  senderName: latestMsg.sender.name,
                  createdAt: latestMsg.createdAt.toISOString(),
                  isRead: latestMsg.isRead || latestMsg.createdAt <= record.lastReadAt,
                }
              : null,
            unreadCount,
            updatedAt: conv.updatedAt.toISOString(),
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: formattedConversations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Starts or retrieves a 1:1 direct conversation with an authorized user.
   */
  public static async getOrCreateDirectConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { recipientId, projectId, initialMessage }: CreateDirectConversationInput = req.body;

      if (!recipientId) {
        throw new AppError('Recipient ID is required.', 400);
      }

      if (recipientId === userId) {
        throw new AppError('Cannot start a direct conversation with yourself.', 400);
      }

      // Enforce Communication Authorization & Privacy
      const authCheck = await MessagesController.canUsersCommunicate(userId, recipientId, projectId);
      if (!authCheck.allowed) {
        throw new AppError(authCheck.reason || 'Forbidden: You are not authorized to message this user.', 403);
      }

      // Check if 1:1 conversation already exists between these 2 users
      const existingConv = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          ...(projectId ? { projectId } : {}),
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: recipientId } } },
          ],
        },
        include: {
          project: true,
          participants: {
            include: {
              user: { include: { college: true } },
            },
          },
        },
      });

      if (existingConv) {
        return res.status(200).json({
          success: true,
          data: {
            id: existingConv.id,
            type: existingConv.type,
            projectId: existingConv.projectId,
            projectTitle: existingConv.project?.title || null,
            participants: existingConv.participants.map((p) => ({
              id: p.user.id,
              name: p.user.name,
              avatarUrl: p.user.avatarUrl,
              collegeName: p.user.college?.name || 'University',
              collegeDomain: p.user.college?.domain || '',
            })),
            isExisting: true,
          },
        });
      }

      // Create new direct conversation
      const conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          projectId: projectId || undefined,
          participants: {
            create: [
              { userId, lastReadAt: new Date() },
              { userId: recipientId, lastReadAt: new Date(0) },
            ],
          },
        },
        include: {
          project: true,
          participants: {
            include: {
              user: { include: { college: true } },
            },
          },
        },
      });

      // If initial message supplied, create message
      if (initialMessage && initialMessage.trim()) {
        const msg = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: initialMessage.trim(),
          },
        });

        // Notify recipient
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          include: { college: true },
        });

        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'NEW_MESSAGE',
            title: `New message from ${sender?.name || 'Student'}`,
            message: initialMessage.slice(0, 100),
            link: `/messages?conv=${conversation.id}`,
          },
        });

        emitToUser(recipientId, 'notification_received', {
          type: 'NEW_MESSAGE',
          title: `New message from ${sender?.name || 'Student'}`,
          message: initialMessage.slice(0, 100),
          link: `/messages?conv=${conversation.id}`,
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: conversation.id,
          type: conversation.type,
          projectId: conversation.projectId,
          projectTitle: conversation.project?.title || null,
          participants: conversation.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
            collegeName: p.user.college?.name || 'University',
            collegeDomain: p.user.college?.domain || '',
          })),
          isExisting: false,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves messages for a specific conversation.
   */
  public static async getConversationMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;

      // Verify participant membership
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        throw new AppError('Forbidden: You are not a participant in this conversation.', 403);
      }

      // Mark participant's lastReadAt as now
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date() },
      });

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            include: { college: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 150,
      });

      return res.status(200).json({
        success: true,
        data: messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.sender.name,
          senderAvatar: m.sender.avatarUrl,
          senderCollege: m.sender.college?.name || 'University',
          content: m.content,
          isRead: m.isRead,
          readAt: m.readAt ? m.readAt.toISOString() : null,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends a message in a conversation.
   */
  public static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;
      const { content }: SendMessageInput = req.body;

      if (!content || !content.trim()) {
        throw new AppError('Message content cannot be empty.', 400);
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: { include: { college: true } },
            },
          },
        },
      });

      if (!conversation) {
        throw new AppError('Conversation not found.', 404);
      }

      const isParticipant = conversation.participants.some((p) => p.userId === userId);
      if (!isParticipant) {
        throw new AppError('Forbidden: You are not a participant in this conversation.', 403);
      }

      // Check blocking if it's a direct conversation
      if (conversation.type === 'DIRECT') {
        const otherParticipant = conversation.participants.find((p) => p.userId !== userId);
        if (otherParticipant) {
          const authCheck = await MessagesController.canUsersCommunicate(userId, otherParticipant.userId, conversation.projectId || undefined);
          if (!authCheck.allowed) {
            throw new AppError(authCheck.reason || 'Forbidden: Cannot send message to this user.', 403);
          }
        }
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content.trim(),
        },
        include: {
          sender: {
            include: { college: true },
          },
        },
      });

      // Update conversation updatedAt & sender lastReadAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      const formatted = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        senderCollege: message.sender.college?.name || 'University',
        content: message.content,
        isRead: false,
        readAt: null,
        createdAt: message.createdAt.toISOString(),
      };

      // Real-time Socket.IO Broadcast to conversation room
      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('new_message', formatted);
      } catch {
        // Socket may not be initialized in test runner
      }

      // Notify other participants
      const otherParticipants = conversation.participants.filter((p) => p.userId !== userId);
      for (const p of otherParticipants) {
        emitToUser(p.userId, 'message_received', {
          conversationId,
          message: formatted,
        });

        await prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'NEW_MESSAGE',
            title: `New message from ${message.sender.name}`,
            message: message.content.slice(0, 100),
            link: `/messages?conv=${conversationId}`,
          },
        });

        emitToUser(p.userId, 'notification_received', {
          type: 'NEW_MESSAGE',
          title: `New message from ${message.sender.name}`,
          message: message.content.slice(0, 100),
          link: `/messages?conv=${conversationId}`,
        });
      }

      return res.status(201).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks all messages in a conversation as read.
   */
  public static async markConversationAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        throw new AppError('Forbidden: Not a participant.', 403);
      }

      const now = new Date();
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: now },
      });

      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          readAt: now.toISOString(),
        });
      } catch {
        // ignore
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation marked as read.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Blocks a user to prevent harassment or unwanted communication.
   */
  public static async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { blockedId, reason }: BlockUserInput = req.body;

      if (!blockedId) {
        throw new AppError('User ID to block is required.', 400);
      }

      if (blockedId === userId) {
        throw new AppError('You cannot block yourself.', 400);
      }

      const target = await prisma.user.findUnique({ where: { id: blockedId } });
      if (!target) {
        throw new AppError('User not found.', 404);
      }

      const blockedRecord = await prisma.blockedUser.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId,
          },
        },
        update: {
          reason: reason || undefined,
        },
        create: {
          blockerId: userId,
          blockedId,
          reason: reason || undefined,
        },
      });

      return res.status(200).json({
        success: true,
        message: `User ${target.name} has been blocked.`,
        data: blockedRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unblocks a previously blocked user.
   */
  public static async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { blockedId } = req.body;

      if (!blockedId) {
        throw new AppError('User ID to unblock is required.', 400);
      }

      await prisma.blockedUser.deleteMany({
        where: {
          blockerId: userId,
          blockedId,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'User unblocked successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists all users blocked by the authenticated user.
   */
  public static async getBlockedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const blocked = await prisma.blockedUser.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            include: { college: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({
        success: true,
        data: blocked.map((b) => ({
          id: b.id,
          blockedUserId: b.blocked.id,
          name: b.blocked.name,
          collegeName: b.blocked.college.name,
          reason: b.reason,
          blockedAt: b.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reports a user or message for moderation (harassment, spam, IP leak, etc.).
   */
  public static async reportUserOrMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { reportedUserId, messageId, projectId, reason, details }: ReportUserOrMessageInput = req.body;

      if (!reportedUserId) {
        throw new AppError('Reported user ID is required.', 400);
      }

      if (reportedUserId === userId) {
        throw new AppError('You cannot report yourself.', 400);
      }

      const report = await prisma.report.create({
        data: {
          reporterId: userId,
          reportedUserId,
          messageId: messageId || undefined,
          projectId: projectId || undefined,
          reason: reason || ReportReason.OTHER,
          details: details?.trim() || undefined,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully. Our trust & safety team will review it.',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
