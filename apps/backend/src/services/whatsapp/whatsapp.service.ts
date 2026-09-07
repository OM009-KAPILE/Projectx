import { prisma } from '@projectx/db';
import {
  IWhatsAppProvider,
  SendApplicationNotificationParams,
  WhatsAppSendResult,
  WhatsAppStatus,
} from './types';
import { WhatsAppProviderFactory } from './providers/factory';

export class WhatsAppService {
  /**
   * Helper to format student graduation year into a human-readable academic year (e.g. 3rd Year)
   */
  public static formatAcademicYear(graduationYear?: number | null): string {
    if (!graduationYear) return 'Student';
    const currentYear = new Date().getFullYear();
    const diff = graduationYear - currentYear;

    if (diff === 0) return 'Final Year';
    if (diff === 1) return '3rd Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '1st Year';
    if (diff < 0) return 'Graduate';
    return `${graduationYear} Batch`;
  }

  /**
   * Formats the standardized, privacy-preserving WhatsApp application message.
   * Only includes basic candidate information; does NOT expose private project secrets.
   */
  public static formatApplicationMessage(params: {
    applicantName: string;
    projectTitle: string;
    roleTitle: string;
    collegeName: string;
    course: string;
    year: string;
  }): string {
    return [
      'New Project Application',
      '',
      `${params.applicantName} has applied to your project:`,
      params.projectTitle,
      '',
      `Role: ${params.roleTitle}`,
      `College: ${params.collegeName}`,
      `Course: ${params.course}`,
      `Year: ${params.year}`,
      '',
      'Open ProjectX to view the complete application.',
    ].join('\n');
  }

  /**
   * Dispatches a WhatsApp notification to the Project Lead when an application is submitted.
   *
   * Guarantees:
   * 1. Safe & Non-blocking: Errors are caught, recorded, and NEVER bubble up to fail application submission.
   * 2. Idempotent: Does not send duplicate WhatsApp messages if an application was already notified.
   * 3. Secure: Only looks up and sends to the verified project owner (never arbitrary numbers).
   */
  public static async sendApplicationNotification(
    params: SendApplicationNotificationParams
  ): Promise<WhatsAppSendResult> {
    try {
      const { applicationId, projectId, projectTitle, projectCreatorId, roleTitle, applicant } = params;

      // 1. Idempotency Check: Avoid duplicate WhatsApp alerts for the same application ID
      const existingLog = await prisma.whatsAppNotificationLog.findUnique({
        where: { applicationId },
      });

      if (existingLog && existingLog.status === 'SENT') {
        return {
          success: true,
          status: 'ALREADY_SENT',
          provider: existingLog.provider,
          messageId: existingLog.providerMessageId || undefined,
        };
      }

      // 2. Identify and Fetch Project Lead from Database
      const lead = await prisma.user.findUnique({
        where: { id: projectCreatorId },
        select: {
          id: true,
          name: true,
          whatsappPhoneNumber: true,
          whatsappVerified: true,
        },
      });

      if (!lead) {
        const errorMsg = `Project lead ${projectCreatorId} not found.`;
        console.warn(`⚠️ [WhatsAppService]: ${errorMsg}`);
        return {
          success: false,
          status: 'FAILED',
          provider: 'none',
          error: errorMsg,
        };
      }

      // 3. Format basic application message
      const academicYear = this.formatAcademicYear(applicant.graduationYear);
      const courseDisplay = applicant.course || applicant.major || 'Undergraduate Degree';

      const messageContent = this.formatApplicationMessage({
        applicantName: applicant.name,
        projectTitle,
        roleTitle,
        collegeName: applicant.collegeName,
        course: courseDisplay,
        year: academicYear,
      });

      // 4. Check if Project Lead has a WhatsApp phone number configured
      if (!lead.whatsappPhoneNumber || !lead.whatsappPhoneNumber.trim()) {
        const noPhoneStatus: WhatsAppStatus = 'NO_PHONE';
        await prisma.whatsAppNotificationLog.upsert({
          where: { applicationId },
          create: {
            recipientId: lead.id,
            applicationId,
            projectId,
            phoneNumber: 'NONE',
            messageContent,
            status: noPhoneStatus,
            provider: 'none',
            errorMessage: 'Project Lead has no WhatsApp phone number configured in profile.',
          },
          update: {
            status: noPhoneStatus,
            errorMessage: 'Project Lead has no WhatsApp phone number configured in profile.',
          },
        });

        if (process.env.NODE_ENV !== 'test') {
          console.log(`ℹ️ [WhatsAppService]: Project Lead ${lead.name} has no WhatsApp number configured. Skipped.`);
        }

        return {
          success: false,
          status: noPhoneStatus,
          provider: 'none',
          error: 'Project lead has no WhatsApp phone number configured.',
        };
      }

      // 5. Select Provider via Provider Abstraction / Factory
      const provider: IWhatsAppProvider = WhatsAppProviderFactory.getProvider();

      if (!provider.isConfigured()) {
        const notConfiguredStatus: WhatsAppStatus = 'NOT_CONFIGURED';
        await prisma.whatsAppNotificationLog.upsert({
          where: { applicationId },
          create: {
            recipientId: lead.id,
            applicationId,
            projectId,
            phoneNumber: lead.whatsappPhoneNumber,
            messageContent,
            status: notConfiguredStatus,
            provider: provider.name,
            errorMessage: 'WhatsApp provider credentials are not configured.',
          },
          update: {
            status: notConfiguredStatus,
            errorMessage: 'WhatsApp provider credentials are not configured.',
          },
        });

        if (process.env.NODE_ENV !== 'test') {
          console.log(`ℹ️ [WhatsAppService]: WhatsApp provider "${provider.name}" is not configured. Skipped.`);
        }

        return {
          success: false,
          status: notConfiguredStatus,
          provider: provider.name,
          error: 'WhatsApp provider is not configured.',
        };
      }

      // 6. Send WhatsApp Notification via Provider
      const sendResult = await provider.sendMessage({
        to: lead.whatsappPhoneNumber,
        bodyText: messageContent,
        metadata: {
          applicationId,
          projectId,
          roleTitle,
          applicantId: applicant.id,
        },
      });

      // 7. Record Delivery Audit in WhatsAppNotificationLog
      await prisma.whatsAppNotificationLog.upsert({
        where: { applicationId },
        create: {
          recipientId: lead.id,
          applicationId,
          projectId,
          phoneNumber: lead.whatsappPhoneNumber,
          messageContent,
          status: sendResult.status,
          provider: sendResult.provider,
          providerMessageId: sendResult.messageId || null,
          errorMessage: sendResult.error || null,
        },
        update: {
          status: sendResult.status,
          provider: sendResult.provider,
          providerMessageId: sendResult.messageId || null,
          errorMessage: sendResult.error || null,
        },
      });

      if (sendResult.success) {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`✅ [WhatsAppService]: WhatsApp alert sent to Lead (${lead.whatsappPhoneNumber}) for project "${projectTitle}".`);
        }
      } else {
        console.warn(`⚠️ [WhatsAppService]: WhatsApp alert failed: ${sendResult.error}`);
      }

      return sendResult;
    } catch (err: any) {
      console.error('❌ [WhatsAppService Error]:', err?.message || err);
      return {
        success: false,
        status: 'FAILED',
        provider: 'none',
        error: err?.message || 'Unexpected WhatsApp service failure',
      };
    }
  }
}
