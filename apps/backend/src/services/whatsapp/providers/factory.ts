import { IWhatsAppProvider } from '../types';
import { MetaWhatsAppProvider } from './meta.provider';
import { MockWhatsAppProvider } from './mock.provider';
import { NoopWhatsAppProvider } from './noop.provider';
import { config } from '../../../config';

export class WhatsAppProviderFactory {
  private static customProvider: IWhatsAppProvider | null = null;

  /**
   * Set a custom provider instance (primarily useful for tests)
   */
  public static setCustomProvider(provider: IWhatsAppProvider | null): void {
    this.customProvider = provider;
  }

  /**
   * Returns the appropriate WhatsApp provider based on configuration
   */
  public static getProvider(): IWhatsAppProvider {
    if (this.customProvider) {
      return this.customProvider;
    }

    const providerType = (config.whatsapp.provider || '').toLowerCase().trim();

    if (providerType === 'meta' || providerType === 'cloud_api') {
      return new MetaWhatsAppProvider();
    }

    if (providerType === 'mock' || config.nodeEnv === 'test') {
      return new MockWhatsAppProvider();
    }

    if (providerType === 'none' || !providerType) {
      return new NoopWhatsAppProvider();
    }

    // Default fallback to mock in non-prod, or noop
    return config.nodeEnv === 'production' ? new NoopWhatsAppProvider() : new MockWhatsAppProvider();
  }
}
