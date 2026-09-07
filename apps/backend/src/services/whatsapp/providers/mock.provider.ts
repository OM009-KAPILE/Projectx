import { IWhatsAppProvider, WhatsAppMessagePayload, WhatsAppSendResult } from '../types';

export interface RecordedWhatsAppMessage {
  to: string;
  bodyText: string;
  messageId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  public readonly name = 'mock';
  public static sentMessages: RecordedWhatsAppMessage[] = [];
  public static simulateFailure = false;
  public static simulateFailureReason = 'Simulated WhatsApp network timeout';

  public isConfigured(): boolean {
    return true;
  }

  public static clear(): void {
    this.sentMessages = [];
    this.simulateFailure = false;
    this.simulateFailureReason = 'Simulated WhatsApp network timeout';
  }

  public static setSimulateFailure(fail: boolean, reason?: string): void {
    this.simulateFailure = fail;
    if (reason) this.simulateFailureReason = reason;
  }

  public static getSentMessages(): RecordedWhatsAppMessage[] {
    return [...this.sentMessages];
  }

  public static getLastMessage(): RecordedWhatsAppMessage | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  public async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    if (MockWhatsAppProvider.simulateFailure) {
      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        error: MockWhatsAppProvider.simulateFailureReason,
      };
    }

    const messageId = `mock-wa-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const recorded: RecordedWhatsAppMessage = {
      to: payload.to,
      bodyText: payload.bodyText,
      messageId,
      timestamp: new Date(),
      metadata: payload.metadata,
    };

    MockWhatsAppProvider.sentMessages.push(recorded);

    if (process.env.NODE_ENV !== 'test') {
      console.log(`\n💬 ========================================`);
      console.log(`💬 [WHATSAPP NOTIFICATION SENT TO ${payload.to}]:`);
      console.log(`💬 ----------------------------------------`);
      console.log(payload.bodyText);
      console.log(`💬 ========================================\n`);
    }

    return {
      success: true,
      status: 'SENT',
      provider: this.name,
      messageId,
    };
  }
}
