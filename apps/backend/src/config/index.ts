import dotenv from 'dotenv';
import path from 'path';

// Prioritize environment-specific env file if specified, else root .env
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug'),

  databaseUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db',

  jwtSecret: process.env.JWT_SECRET || 'projectx_super_secret_jwt_access_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'projectx_super_secret_jwt_refresh_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    allowedOrigins,
  },
  corsOrigin: allowedOrigins[0] || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || allowedOrigins[0] || 'http://localhost:5173',

  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
    apiKey: process.env.AI_API_KEY || '',
  },
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'ProjectX <projectx.notifications06@gmail.com>',
  },

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    token: process.env.GITHUB_TOKEN || '',
  },

  support: {
    email: process.env.SUPPORT_EMAIL || 'support@projectx.edu',
    phone: process.env.SUPPORT_PHONE || '+1 (800) 555-0199',
  },

  storage: {
    driver: (process.env.STORAGE_DRIVER as 'local' | 's3') || 'local',
    uploadDir: path.resolve(process.cwd(), process.env.STORAGE_UPLOAD_DIR || 'uploads'),
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'projectx-uploads',
    },
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN || '',
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || (nodeEnv === 'test' ? 'mock' : 'none'),
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  },
};
