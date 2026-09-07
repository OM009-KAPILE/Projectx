import { config } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private static currentLevel: LogLevel = (config.logLevel as LogLevel) || 'info';

  private static shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.currentLevel];
  }

  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const isProduction = config.nodeEnv === 'production';

    if (isProduction) {
      // Structured JSON logging for Datadog / CloudWatch / ELK Stack
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        environment: config.nodeEnv,
        message,
        ...(meta ? { metadata: meta } : {}),
      });
    }

    // Colorized human-readable log for development
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${colors[level]}${level.toUpperCase()}${reset}] ${message}${metaStr}`;
  }

  public static debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  public static info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  public static warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  public static error(message: string, error?: any, meta?: any): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: config.nodeEnv !== 'production' ? error.stack : undefined,
          }
        : error;

      console.error(this.formatMessage('error', message, { ...meta, error: errorDetails }));
    }
  }

  public static http(method: string, path: string, status: number, durationMs: number): void {
    if (this.shouldLog('info')) {
      this.info(`HTTP ${method} ${path} ${status} - ${durationMs}ms`, {
        method,
        path,
        statusCode: status,
        durationMs,
      });
    }
  }
}
