export type WhatsAppStatus = 'SENT' | 'FAILED' | 'NOT_CONFIGURED' | 'NO_PHONE' | 'ALREADY_SENT';

export interface WhatsAppMessagePayload {
  to: string; // E.164 phone number, e.g. +919876543210
  bodyText: string;
  templateName?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppSendResult {
  success: boolean;
  status: WhatsAppStatus;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface IWhatsAppProvider {
  name: string;
  isConfigured(): boolean;
  sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult>;
}

export interface SendApplicationNotificationParams {
  applicationId: string;
  projectId: string;
  projectTitle: string;
  projectCreatorId: string;
  roleTitle: string;
  applicant: {
    id: string;
    name: string;
    collegeName: string;
    course?: string | null;
    major?: string | null;
    graduationYear?: number | null;
  };
}
