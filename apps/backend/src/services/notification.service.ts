import { prisma } from '@projectx/db';
import { NotificationType } from '@projectx/common';
import { EmailService } from './email.service';
import { emitToUser } from '../sockets';

export interface DispatchNotificationParams {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  emailParams?: {
    subject?: string;
    actionLabel?: string;
    actionUrl?: string;
  };
}

export class NotificationService {
  /**
   * Dispatches a notification across In-App, Email, and Mobile Push channels,
   * respecting user preferences configured in Settings.
   */
  public static async dispatch(params: DispatchNotificationParams): Promise<{
    inAppSent: boolean;
    emailSent: boolean;
    pushSent: boolean;
    notificationId?: string;
  }> {
    const { userId, type, title, message, link, metadata, emailParams } = params;

    // 1. Fetch or initialize User Notification Preferences
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

    // 2. Check if this specific event type is enabled
    const isTypeEnabled = this.checkTypePreference(preferences, type);

    let inAppSent = false;
    let emailSent = false;
    let pushSent = false;
    let createdNotificationId: string | undefined;

    // 3. IN-APP NOTIFICATION CHANNEL
    if (preferences.inAppNotifications && isTypeEnabled) {
      try {
        const notif = await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link: link || undefined,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
          },
        });
        createdNotificationId = notif.id;
        inAppSent = true;

        // Emit real-time Socket.IO event to active client sessions
        emitToUser(userId, 'notification_received', {
          id: notif.id,
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: notif.link,
          metadata,
          isRead: false,
          createdAt: notif.createdAt.toISOString(),
        });
      } catch (err) {
        console.error('⚠️ [NotificationService InApp Error]:', err);
      }
    }

    // 4. EMAIL NOTIFICATION CHANNEL
    if (preferences.emailNotifications && isTypeEnabled) {
      try {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { college: true },
        });

        if (targetUser && targetUser.email) {
          const actionUrl = emailParams?.actionUrl || (link ? `https://projectx.edu${link}` : 'https://projectx.edu/home');
          const actionLabel = emailParams?.actionLabel || 'Open in ProjectX';
          const subject = emailParams?.subject || `[ProjectX] ${title}`;

          const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
              <div style="margin-bottom: 24px; text-align: center;">
                <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
                <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 20px; font-weight: 800;">${title}</h2>
                <p style="color: #94a3b8; margin: 0; font-size: 13px;">Hi ${targetUser.name}</p>
              </div>

              <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0;">${message}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${actionUrl}" style="display: inline-block; background: #22c55e; color: #0b0f19; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">${actionLabel} →</a>
              </div>

              <hr style="border: none; border-top: 1px solid #1f293d; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
                You received this email according to your ProjectX notification preferences. Manage preferences in Settings.
              </p>
            </div>
          `;

          await EmailService.sendEmail({
            to: targetUser.email,
            subject,
            html: emailHtml,
          });
          emailSent = true;
        }
      } catch (err) {
        console.error('⚠️ [NotificationService Email Error]:', err);
      }
    }

    // 5. MOBILE PUSH NOTIFICATION ARCHITECTURE (APNs / FCM)
    if (preferences.pushNotifications && isTypeEnabled) {
      try {
        const deviceTokens = await prisma.deviceToken.findMany({
          where: { userId },
        });

        if (deviceTokens.length > 0) {
          // Push payload architecture for iOS APNs & Android FCM
          const pushPayload = {
            notification: {
              title,
              body: message,
              sound: 'default',
              badge: 1,
            },
            data: {
              type,
              link: link || '/home',
              metadata: JSON.stringify(metadata || {}),
            },
          };

          // Mock push dispatcher
          if (process.env.NODE_ENV !== 'test') {
            console.log(`📱 [Mobile Push Dispatched to ${deviceTokens.length} devices]:`, pushPayload.notification.title);
          }
          pushSent = true;
        }
      } catch (err) {
        console.error('⚠️ [NotificationService Push Error]:', err);
      }
    }

    return {
      inAppSent,
      emailSent,
      pushSent,
      notificationId: createdNotificationId,
    };
  }

  private static checkTypePreference(pref: any, type: string): boolean {
    switch (type) {
      case NotificationType.NEW_APPLICATION:
        return pref.notifyNewApplication;
      case NotificationType.APPLICATION_ACCEPTED:
      case NotificationType.APPLICATION_REJECTED:
        return pref.notifyApplicationStatus;
      case NotificationType.TEAM_INVITATION:
        return pref.notifyTeamInvitation;
      case NotificationType.NEW_MESSAGE:
        return pref.notifyNewMessage;
      case NotificationType.TASK_ASSIGNED:
        return pref.notifyTaskAssigned;
      case NotificationType.TASK_DEADLINE_APPROACHING:
        return pref.notifyTaskDeadline;
      case NotificationType.PROJECT_HEALTH_WARNING:
        return pref.notifyHealthWarning;
      case NotificationType.SKILL_GAP_DETECTED:
        return pref.notifySkillGap;
      case NotificationType.MILESTONE_COMPLETED:
        return pref.notifyMilestoneCompleted;
      default:
        return true;
    }
  }
}
