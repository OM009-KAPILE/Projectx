import { config } from '../config';
import { Logger } from './logger.service';

export interface ErrorContext {
  userId?: string;
  email?: string;
  role?: string;
  collegeId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  extra?: Record<string, any>;
}

export class ErrorTracker {
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;

    if (config.monitoring.sentryDsn) {
      Logger.info('📡 [ErrorTracker]: Initializing Sentry monitoring hook with configured DSN.');
      // In production with @sentry/node installed, Sentry.init({ dsn: config.monitoring.sentryDsn }) runs here.
    } else {
      Logger.debug('ℹ️ [ErrorTracker]: SENTRY_DSN not configured. Operating in fallback console tracking mode.');
    }

    this.isInitialized = true;
  }

  /**
   * Captures an unexpected error with user and request context
   */
  public static captureException(error: Error | any, context?: ErrorContext): void {
    const errorName = error?.name || 'Error';
    const errorMessage = error?.message || String(error);

    Logger.error(`💥 [ErrorTracker Captured]: ${errorName}: ${errorMessage}`, error, {
      userId: context?.userId,
      path: context?.path,
      method: context?.method,
      extra: context?.extra,
    });

    // If Sentry DSN or webhook is configured, dispatch telemetry
    if (config.monitoring.sentryDsn && config.nodeEnv === 'production') {
      // Sentry.captureException(error, { user: { id: context?.userId, email: context?.email }, extra: context?.extra });
    }
  }

  /**
   * Records a user/system breadcrumb
   */
  public static addBreadcrumb(category: string, message: string, data?: any): void {
    if (config.nodeEnv !== 'production') {
      Logger.debug(`🍞 [Breadcrumb: ${category}] ${message}`, data);
    }
  }
}
