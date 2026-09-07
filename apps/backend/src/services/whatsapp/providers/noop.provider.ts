import { IWhatsAppProvider, WhatsAppMessagePayload, WhatsAppSendResult } from '../types';

export class NoopWhatsAppProvider implements IWhatsAppProvider {
  public readonly name = 'none';

  public isConfigured(): boolean {
    return false;
  }

  public async sendMessage(_payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      provider: this.name,
      error: 'WhatsApp provider is not configured. Set WHATSAPP_PROVIDER=meta and provide WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    };
  }
}
