import nodemailer from 'nodemailer';
import { config } from '../config';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  public static sentInbox: EmailPayload[] = []; // In-memory inbox for test inspection

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (process.env.NODE_ENV === 'test' || config.nodeEnv === 'test') {
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      } else if (config.smtp.user && config.smtp.pass) {
        if (config.smtp.host.includes('gmail')) {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: config.smtp.user,
              pass: config.smtp.pass,
            },
          });
        } else {
          this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: {
              user: config.smtp.user,
              pass: config.smtp.pass,
            },
          });
        }
      } else {
        // Dev json transport fallback
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }
    return this.transporter;
  }

  public static async sendEmail(payload: EmailPayload): Promise<boolean> {
    try {
      this.sentInbox.push(payload);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`📨 [Email Sent to ${payload.to}]: ${payload.subject}`);
      }

      const transporter = this.getTransporter();

      // Ensure that in development/demo mode, test emails to demo university domains
      // are delivered directly to the real developer email (kapileom27@gmail.com)
      let destination = payload.to;
      const demoDomains = ['.edu', '.ac.in', 'test.com', 'example.com', 'demo.com'];
      const isDemoDomain = demoDomains.some((d) => payload.to.toLowerCase().includes(d));

      if (process.env.NODE_ENV !== 'production' && isDemoDomain) {
        destination = 'kapileom27@gmail.com';
      }

      await transporter.sendMail({
        from: config.smtp.from,
        to: destination,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.subject,
      });

      return true;
    } catch (error) {
      console.error('❌ [EmailService Error]:', error);
      return false;
    }
  }

  public static async sendVerificationCodeEmail(params: {
    email: string;
    name: string;
    code: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">Verify your university email</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Welcome to ProjectX, ${params.name}</p>
        </div>
        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; font-weight: 700;">Your 6-Digit Verification Code</p>
          <div style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4ade80; margin: 8px 0;">${params.code}</div>
          <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">This code expires in 15 minutes.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">Enter this code on the verification screen to activate your account, unlock cross-college matching, and start forming project teams.</p>
        <hr style="border: none; border-top: 1px solid #1f293d; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ProjectX — AI-Powered Cross-College Student Team Formation</p>
      </div>
    `;

    return this.sendEmail({
      to: params.email,
      subject: `[ProjectX] ${params.code} is your email verification code`,
      html,
    });
  }

  public static async sendPasswordResetEmail(params: {
    email: string;
    name: string;
    resetToken: string;
    resetLink: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">Reset your password</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Hello ${params.name}</p>
        </div>
        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">We received a request to reset your ProjectX password. Use the reset code below or click the button:</p>
        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 0 0 8px 0; font-weight: 700;">Password Reset Code</p>
          <div style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #38bdf8;">${params.resetToken}</div>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.resetLink}" style="display: inline-block; background: #22c55e; color: #0b0f19; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">If you did not request this password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #1f293d; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ProjectX — AI-Powered Cross-College Student Team Formation</p>
      </div>
    `;

    return this.sendEmail({
      to: params.email,
      subject: `[ProjectX] Reset your password`,
      html,
    });
  }

  public static async sendApplicationReceived(params: {
    creatorEmail: string;
    creatorName: string;
    applicantName: string;
    applicantCollege: string;
    applicantMajor?: string | null;
    projectTitle: string;
    roleTitle: string;
    matchScore: number;
    pitch: string;
    skills?: string[];
    availability?: string;
    experience?: string;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    dashboardLink: string;
  }) {
    const skillsHtml = params.skills && params.skills.length > 0
      ? `<div style="margin-top: 8px;">
          <strong style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Relevant Skills:</strong>
          <div style="margin-top: 4px;">${params.skills.map((s) => `<span style="display: inline-block; background: #1e293b; color: #e2e8f0; font-size: 11px; padding: 3px 8px; border-radius: 6px; margin-right: 4px; margin-bottom: 4px;">${s}</span>`).join('')}</div>
         </div>`
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">New Project Application Received</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Project: <strong style="color: #f8fafc;">${params.projectTitle}</strong></p>
        </div>

        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div>
              <h3 style="color: #f8fafc; margin: 0; font-size: 16px; font-weight: 700;">${params.applicantName}</h3>
              <p style="color: #4ade80; margin: 2px 0 0 0; font-size: 12px; font-weight: 600;">${params.applicantCollege}${params.applicantMajor ? ` • ${params.applicantMajor}` : ''}</p>
            </div>
            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 20px;">
              ⚡ ${params.matchScore}% Match
            </div>
          </div>

          <div style="border-top: 1px solid #1f293d; padding-top: 12px; margin-top: 12px;">
            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Role Applied:</p>
            <p style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0 0 12px 0;">${params.roleTitle}</p>

            <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Applicant Message:</p>
            <p style="color: #cbd5e1; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0; background: #0b0f19; padding: 12px; border-radius: 8px; border: 1px solid #1f293d;">${params.pitch}</p>

            ${params.availability ? `<p style="color: #94a3b8; font-size: 12px; margin: 4px 0;"><strong>Availability:</strong> <span style="color: #f8fafc;">${params.availability}</span></p>` : ''}
            ${params.experience ? `<p style="color: #94a3b8; font-size: 12px; margin: 4px 0;"><strong>Experience:</strong> <span style="color: #f8fafc;">${params.experience}</span></p>` : ''}
            ${skillsHtml}
          </div>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${params.dashboardLink}" style="display: inline-block; background: #22c55e; color: #0b0f19; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">Review Application in Workspace</a>
        </div>

        <p style="color: #64748b; font-size: 11px; text-align: center; line-height: 1.5; margin: 0;">
          ProjectX protects member privacy: your personal contact details are never exposed to applicants.<br />
          All actions and communication are managed securely through the ProjectX platform.
        </p>
        <hr style="border: none; border-top: 1px solid #1f293d; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ProjectX — AI-Powered Cross-College Student Team Formation</p>
      </div>
    `;

    return this.sendEmail({
      to: params.creatorEmail,
      subject: `[ProjectX] New ${params.matchScore}% Match Application from ${params.applicantName} for ${params.projectTitle}`,
      html,
    });
  }

  public static async sendApplicationConfirmationToApplicant(params: {
    applicantEmail: string;
    applicantName: string;
    projectTitle: string;
    roleTitle: string;
    matchScore: number;
    dashboardLink: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">Application Successfully Submitted</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Hello ${params.applicantName}</p>
        </div>

        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0 0 12px 0;">
            Your application for <strong>${params.roleTitle}</strong> on <strong>${params.projectTitle}</strong> has been transmitted to the project lead.
          </p>
          <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 12px; margin-top: 8px;">
            <span style="color: #4ade80; font-size: 12px; font-weight: 700;">Preliminary AI Compatibility Score: ${params.matchScore}% Match</span>
          </div>
        </div>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
          You will receive an automated notification as soon as the project owner accepts, shortlists, or updates your application status.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.dashboardLink}" style="display: inline-block; background: #1e293b; color: #f8fafc; font-weight: 700; font-size: 12px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">View Project Details</a>
        </div>

        <hr style="border: none; border-top: 1px solid #1f293d; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ProjectX — AI-Powered Cross-College Student Team Formation</p>
      </div>
    `;

    return this.sendEmail({
      to: params.applicantEmail,
      subject: `[ProjectX] Application Submitted for ${params.projectTitle} (${params.roleTitle})`,
      html,
    });
  }

  public static async sendApplicationDecision(params: {
    applicantEmail: string;
    applicantName: string;
    projectTitle: string;
    roleTitle: string;
    status: 'ACCEPTED' | 'SHORTLISTED' | 'REJECTED' | string;
    workspaceLink?: string;
  }) {
    const isAccepted = params.status === 'ACCEPTED';
    const isShortlisted = params.status === 'SHORTLISTED';

    let headerTitle = 'Project Application Update';
    let bannerHtml = '';

    if (isAccepted) {
      headerTitle = '🎉 Welcome to the Team!';
      bannerHtml = `
        <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #4ade80; font-weight: 800; font-size: 14px; margin: 0 0 4px 0;">Level 3 Workspace Access Unlocked</p>
          <p style="color: #cbd5e1; font-size: 12px; margin: 0; line-height: 1.5;">You have been accepted into the project! You now have full access to the internal repository, sprint tasks, and team chat room.</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.workspaceLink}" style="display: inline-block; background: #22c55e; color: #0b0f19; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">Enter Project Workspace</a>
        </div>
      `;
    } else if (isShortlisted) {
      headerTitle = '⭐ Your Application is Shortlisted!';
      bannerHtml = `
        <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #fbbf24; font-weight: 800; font-size: 14px; margin: 0 0 4px 0;">Application Shortlisted</p>
          <p style="color: #cbd5e1; font-size: 12px; margin: 0; line-height: 1.5;">The project lead has shortlisted your profile for <strong>${params.roleTitle}</strong> and will finalize the team roster shortly.</p>
        </div>
      `;
    } else {
      bannerHtml = `
        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
            Thank you for applying. While this specific role was not matched at this time, other cross-college projects seeking your skills are available in the Discover feed.
          </p>
        </div>
      `;
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">${headerTitle}</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Project: <strong style="color: #f8fafc;">${params.projectTitle}</strong> • Role: <strong style="color: #f8fafc;">${params.roleTitle}</strong></p>
        </div>

        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">Hello ${params.applicantName},</p>
        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
          Your application for <strong>${params.roleTitle}</strong> on <strong>${params.projectTitle}</strong> has been updated to <strong>${params.status}</strong>.
        </p>

        ${bannerHtml}

        <hr style="border: none; border-top: 1px solid #1f293d; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ProjectX — AI-Powered Cross-College Student Team Formation</p>
      </div>
    `;

    return this.sendEmail({
      to: params.applicantEmail,
      subject: isAccepted
        ? `[ProjectX] Accepted! Welcome to ${params.projectTitle}`
        : isShortlisted
        ? `[ProjectX] Application Shortlisted for ${params.projectTitle}`
        : `[ProjectX] Application Update for ${params.projectTitle}`,
      html,
    });
  }

  public static async sendTeamInvitationEmail(params: {
    candidateEmail: string;
    candidateName: string;
    ownerName: string;
    ownerCollege: string;
    projectTitle: string;
    roleTitle: string;
    customMessage?: string;
    projectLink: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: #22c55e; color: #0b0f19; font-weight: 900; font-size: 18px; font-family: monospace;">PX</div>
          <h2 style="color: #f8fafc; margin: 16px 0 4px 0; font-size: 22px; font-weight: 800;">You've Been Invited to Join a Team! 🎉</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Project: <strong style="color: #f8fafc;">${params.projectTitle}</strong></p>
        </div>

        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">Hello ${params.candidateName},</p>
        <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
          <strong>${params.ownerName}</strong> from <strong>${params.ownerCollege}</strong> has invited you to join their project team as a <strong>${params.roleTitle}</strong> on ProjectX.
        </p>

        ${
          params.customMessage
            ? `<div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 12px; color: #94a3b8; font-style: italic;">
                "${params.customMessage}"
               </div>`
            : ''
        }

        <div style="text-align: center; margin: 24px 0;">
          <a href="${params.projectLink}" style="display: inline-block; background: #22c55e; color: #0b0f19; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);">View Project & Accept Invitation</a>
        </div>

        <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px;">
          Note: Project creator contact details are securely protected via the ProjectX platform.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.candidateEmail,
      subject: `[ProjectX] Invitation from ${params.ownerName}: Join ${params.projectTitle} as ${params.roleTitle}`,
      html,
    });
  }

  public static async sendSupportTicketAlert(params: {
    ticketId: string;
    category: string;
    subject: string;
    description: string;
    userEmail?: string;
    userName?: string;
    attachmentUrl?: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px;">
          <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.3);">
            SUPPORT & SAFETY DISPATCH
          </span>
          <h2 style="color: #f8fafc; margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">New Support Ticket / Report Filed</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">Ticket ID: <code style="color: #38bdf8;">${params.ticketId}</code></p>
        </div>

        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 12px;">
          <p style="margin: 0 0 8px 0;"><strong>Category:</strong> <span style="color: #22c55e;">${params.category}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${params.subject}</p>
          <p style="margin: 0 0 8px 0;"><strong>Submitted by:</strong> ${params.userName || 'Student'} (${params.userEmail || 'Anonymous'})</p>
          ${params.attachmentUrl ? `<p style="margin: 0 0 8px 0;"><strong>Attachment:</strong> <a href="${params.attachmentUrl}" style="color: #38bdf8;">View File / Screenshot</a></p>` : ''}
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #1f293d; color: #cbd5e1; line-height: 1.5;">
            <strong>Details:</strong><br/>
            ${params.description}
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: config.support.email,
      subject: `[Support & Safety Alert] [${params.category}] ${params.subject}`,
      html,
    });
  }

  public static async sendSupportTicketResponseEmail(params: {
    recipientEmail: string;
    ticketId: string;
    subject: string;
    adminResponse: string;
    status: string;
  }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1f293d;">
        <div style="margin-bottom: 24px;">
          <h2 style="color: #f8fafc; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">Support Ticket Update</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 12px;">Ticket: <strong>${params.subject}</strong> (ID: <code>${params.ticketId}</code>)</p>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Current Status: <strong style="color: #22c55e;">${params.status}</strong></p>
        </div>

        <div style="background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          <strong>Official Support Staff Response:</strong>
          <p style="margin: 8px 0 0 0; color: #f8fafc;">${params.adminResponse}</p>
        </div>

        <p style="color: #64748b; font-size: 11px; text-align: center; margin-top: 24px;">
          ProjectX Safety & Support Team • ${config.support.email} • ${config.support.phone}
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.recipientEmail,
      subject: `[ProjectX Support Update] Re: ${params.subject} (Ticket ${params.ticketId.slice(0, 8)})`,
      html,
    });
  }
}
