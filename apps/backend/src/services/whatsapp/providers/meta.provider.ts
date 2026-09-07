import axios from 'axios';
import { IWhatsAppProvider, WhatsAppMessagePayload, WhatsAppSendResult } from '../types';
import { config } from '../../../config';

export interface MetaWhatsAppOptions {
  accessToken?: string;
  phoneNumberId?: string;
  apiUrl?: string;
}

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  public readonly name = 'meta';
  private accessToken: string;
  private phoneNumberId: string;
  private apiUrl: string;

  constructor(options?: MetaWhatsAppOptions) {
    this.accessToken = options?.accessToken || config.whatsapp.accessToken || '';
    this.phoneNumberId = options?.phoneNumberId || config.whatsapp.phoneNumberId || '';
    this.apiUrl = options?.apiUrl || config.whatsapp.apiUrl || 'https://graph.facebook.com/v20.0';
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  public async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        provider: this.name,
        error: 'Meta WhatsApp Business API credentials (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID) are not configured.',
      };
    }

    try {
      // Clean recipient phone number: Meta API requires numeric only (e.g. '919876543210' without '+' prefix)
      const cleanTo = payload.to.replace(/\D/g, '');
      if (!cleanTo || cleanTo.length < 7) {
        return {
          success: false,
          status: 'FAILED',
          provider: this.name,
          error: `Invalid destination phone number format: ${payload.to}`,
        };
      }

      const url = `${this.apiUrl.replace(/\/+$/, '')}/${this.phoneNumberId}/messages`;

      const requestBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: payload.bodyText,
        },
      };

      const response = await axios.post(url, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const messageId = response.data?.messages?.[0]?.id || 'meta-msg-' + Date.now();

      return {
        success: true,
        status: 'SENT',
        provider: this.name,
        messageId,
      };
    } catch (error: any) {
      // Extract error details safely without logging or exposing access tokens
      const apiErrorMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Unknown Meta WhatsApp API error';

      return {
        success: false,
        status: 'FAILED',
        provider: this.name,
        error: `Meta WhatsApp API error: ${apiErrorMsg}`,
      };
    }
  }
}
