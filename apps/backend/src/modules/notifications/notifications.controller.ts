import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import {
  UpdateNotificationPreferencesInput,
  RegisterDeviceTokenInput,
  NotificationType,
} from '@projectx/common';
import { NotificationService } from '../../services/notification.service';

export class NotificationsController {
  /**
   * Retrieves paginated notifications for the authenticated user.
   */
  public static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const skip = (page - 1) * limit;

      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return res.status(200).json({
        success: true,
        data: notifications.map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          metadata: n.metadata ? JSON.parse(n.metadata) : null,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks a specific notification as read.
   */
  public static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        throw new AppError('Notification not found.', 404);
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks all notifications as read for the authenticated user.
   */
  public static async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves notification settings and preferences for the user.
   */
  public static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            emailNotifications: true,
            pushNotifications: true,
            inAppNotifications: true,
            notifyNewApplication: true,
            notifyApplicationStatus: true,
            notifyTeamInvitation: true,
            notifyNewMessage: true,
            notifyTaskAssigned: true,
            notifyTaskDeadline: true,
            notifyHealthWarning: true,
            notifySkillGap: true,
            notifyMilestoneCompleted: true,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates notification preferences in Settings.
   */
  public static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const updates: UpdateNotificationPreferencesInput = req.body;

      const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully.',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers a mobile device token for push notification architecture.
   */
  public static async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { token, platform }: RegisterDeviceTokenInput = req.body;

      const device = await prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          platform: platform || 'IOS',
        },
        create: {
          userId,
          token,
          platform: platform || 'IOS',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Device registered for push notifications.',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unregisters a device token.
   */
  public static async unregisterDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      await prisma.deviceToken.deleteMany({
        where: { token },
      });

      return res.status(200).json({
        success: true,
        message: 'Device token unregistered.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper endpoint to test dispatching notifications of all 10 types across channels.
   */
  public static async testDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { type, title, message, link } = req.body;

      const result = await NotificationService.dispatch({
        userId,
        type: type || NotificationType.PROJECT_HEALTH_WARNING,
        title: title || 'Project Health Alert',
        message: message || 'Sprint velocity has dropped below threshold. Action recommended.',
        link: link || '/workspace/1',
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
