# 🚀 ProjectX Production Deployment & Operations Guide

This guide provides exhaustive, step-by-step instructions for provisioning, configuring, building, and deploying the **ProjectX** multi-tier platform across **Development**, **Staging**, and **Production** environments.

---

## 🏗️ 1. Architecture Topology & Service Specifications

```
                       ┌────────────────────────────────────────────────┐
                       │               Cloudflare / CloudFront          │
                       │               SSL / Edge CDN / DDoS            │
                       └───────────────────────┬────────────────────────┘
                                               │
                       ┌───────────────────────▼────────────────────────┐
                       │             NGINX Reverse Proxy / Ingress      │
                       └───────┬────────────────┬───────────────┬───────┘
                               │                │               │
                 HTTP / SPA    │                │ HTTP / WS     │ Internal HTTP
                 (:80 / :443)  │                │ (:4000)       │ (:8000)
                               ▼                ▼               ▼
                      ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
                      │   React Web    │ │  Node.js API │ │  Python AI   │
                      │  (Vite+Nginx)  │ │   Backend    │ │ Microservice │
                      └────────────────┘ └──────┬───────┘ └──────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │  PostgreSQL 16 (RDS / Cloud)   │
                               │  + AWS S3 Object Storage       │
                               └────────────────────────────────┘
```

### Core Services Matrix

| Service | Technology | Port | Production Runtime |
| :--- | :--- | :--- | :--- |
| **Backend API** | Node.js 20, TypeScript, Express, Socket.IO, Prisma | `4000` | Multi-stage Alpine container, dumb-init, non-root user |
| **Web Frontend** | React 18, Vite, Tailwind CSS, Lucide | `80` | Nginx Alpine, gzip compression, SPA fallback routing |
| **AI Microservice** | Python 3.11, FastAPI, Pydantic, Gunicorn | `8000` | Gunicorn with multi-worker Uvicorn workers |
| **Mobile App** | Flutter 3.x, Dart | Mobile OS | Release APK / Android App Bundle / iOS IPA |
| **Database** | PostgreSQL 16+ (or SQLite in dev) | `5432` | Managed DB instance with automated point-in-time recovery |
| **Object Storage** | Local filesystem or AWS S3 | `N/A` | S3 with pre-signed upload URLs and strict IAM policy |

---

## 🔐 2. Environment Variables Catalog

| Environment Variable | Description | Example (Dev) | Example (Prod) |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend HTTP port | `4000` | `4000` |
| `NODE_ENV` | Environment state | `development` | `production` |
| `LOG_LEVEL` | Log verbosity level | `debug` | `info` |
| `DATABASE_URL` | Prisma DB connection URL | `file:./prisma/dev.db` | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | 256-bit access token signing secret | `dev_access_secret` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | 256-bit refresh token signing secret | `dev_refresh_secret` | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Access token lifespan | `2h` | `2h` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` | `7d` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS domains | `http://localhost:5173` | `https://projectx.edu,https://app.projectx.edu` |
| `FRONTEND_URL` | Base URL for verification/reset links | `http://localhost:5173` | `https://app.projectx.edu` |
| `AI_SERVICE_URL` | Python AI service endpoint | `http://127.0.0.1:8000` | `http://ai-service:8000` |
| `AI_API_KEY` | Optional internal gateway token | `""` | `secure_internal_token` |
| `GEMINI_API_KEY` | Google Gemini API credentials | `AIzaSy...` | `AIzaSy...` |
| `OPENAI_API_KEY` | OpenAI API credentials | `sk-...` | `sk-...` |
| `SMTP_HOST` | Email provider SMTP host | `smtp.ethereal.email` | `smtp.sendgrid.net` |
| `SMTP_PORT` | Email provider port | `587` | `587` |
| `SMTP_USER` | SMTP authentication username | `""` | `apikey` |
| `SMTP_PASS` | SMTP authentication password | `""` | `SG.your_sendgrid_key` |
| `EMAIL_FROM` | Default outgoing sender email | `no-reply@projectx.local`| `notifications@projectx.edu` |
| `SUPPORT_EMAIL` | Official safety & support contact | `support@projectx.edu` | `support@projectx.edu` |
| `SUPPORT_PHONE` | Official support phone contact | `+1 (800) 555-0199` | `+1 (800) 555-0199` |
| `STORAGE_DRIVER` | File storage provider (`local` / `s3`) | `local` | `s3` |
| `AWS_S3_BUCKET` | AWS S3 Bucket Name | `""` | `projectx-prod-uploads` |
| `AWS_REGION` | AWS Region | `us-east-1` | `us-east-1` |
| `SENTRY_DSN` | Sentry Error Monitoring DSN | `""` | `https://key@sentry.io/12345` |

> [!IMPORTANT]
> **Zero Secrets in Source Control**: Never commit `.env`, `.env.staging`, or `.env.production` containing real credentials. Use AWS Secrets Manager, GCP Secret Manager, or CI/CD Environment Secrets.

---

## 🗄️ 3. Database Migration & Seed Workflow

### 1. Generating Prisma Client
```bash
npm run db:generate
```

### 2. Running Production Migrations
In production pipelines (CI/CD / Docker entrypoint), execute schema migrations safely:
```bash
npm run db:migrate
```

### 3. Development / Staging Schema Push & Seeding
To populate realistic colleges, departments, skills, sample student profiles, and multi-stage projects:
```bash
npm run db:seed
```

### 4. Database Schema Inspection (Prisma Studio)
```bash
npm run db:studio
```

---

## 🐳 4. Single-Command Docker Compose Deployment

The fastest way to deploy the entire stack to a single VM or staging server:

```bash
# 1. Clone repository
git clone https://github.com/your-org/projectx.git /opt/projectx
cd /opt/projectx

# 2. Configure environment
cp .env.example .env
nano .env # Configure production secrets

# 3. Build and launch all services in detached mode
docker-compose -f docker-compose.yml up -d --build

# 4. Run database migrations inside the backend container
docker-compose exec backend npm run db:migrate

# 5. Check container health status
docker-compose ps
```

---

## ☁️ 5. Cloud Platform Deployment Protocols

### A. AWS Deployment (ECS Fargate + RDS + S3 + CloudFront)

1. **Database (RDS PostgreSQL)**:
   - Create a PostgreSQL 16 Multi-AZ instance on RDS.
   - Configure security groups to allow inbound port 5432 from ECS Tasks only.
2. **Object Storage (AWS S3)**:
   - Create S3 Bucket `projectx-storage-prod`.
   - Enable Block Public Access and configure CORS for `https://app.projectx.edu`.
3. **Backend API (ECS Fargate)**:
   - Build and push `apps/backend/Dockerfile` to AWS ECR.
   - Deploy as an ECS Service behind an Application Load Balancer (ALB).
   - Configure health check path `/api/healthz`.
4. **AI Microservice (ECS Fargate)**:
   - Build and push `apps/ai-service/Dockerfile` to AWS ECR.
   - Deploy as an internal ECS service with service discovery `ai-service.projectx.local:8000`.
5. **Web Frontend (S3 + CloudFront)**:
   - Build React static bundle: `npm run build:web`.
   - Sync `apps/web/dist` to S3 hosting bucket:
     ```bash
     aws s3 sync apps/web/dist s3://projectx-web-prod --delete
     ```
   - Point CloudFront distribution with Custom SSL Certificate to S3 with custom error response routing `404 -> /index.html` (200 OK).

---

### B. GCP Deployment (Cloud Run + Cloud SQL)

1. **Cloud SQL**: Create PostgreSQL 16 instance.
2. **Backend & AI Service**:
   ```bash
   # Build & Deploy Backend
   gcloud builds submit --tag gcr.io/projectx-prod/backend -f apps/backend/Dockerfile
   gcloud run deploy projectx-backend --image gcr.io/projectx-prod/backend --platform managed --set-env-vars NODE_ENV=production
   
   # Build & Deploy AI Service
   gcloud builds submit --tag gcr.io/projectx-prod/ai-service -f apps/ai-service/Dockerfile
   gcloud run deploy projectx-ai --image gcr.io/projectx-prod/ai-service --platform managed
   ```

---

## 📱 6. Flutter Mobile Production Builds

### Android Release Build (APK & App Bundle)

```bash
cd apps/mobile

# Build Android App Bundle (for Google Play Store)
flutter build appbundle --release \
  --dart-define=ENV=production \
  --dart-define=API_BASE_URL=https://api.projectx.edu/api/v1

# Build Standalone Release APK
flutter build apk --release \
  --dart-define=ENV=production \
  --dart-define=API_BASE_URL=https://api.projectx.edu/api/v1
```
*Output*: `apps/mobile/build/app/outputs/bundle/release/app-release.aab`

### iOS Release Build (IPA)

```bash
cd apps/mobile

# Build iOS Release Bundle (Requires macOS & Xcode command-line tools)
flutter build ipa --release \
  --dart-define=ENV=production \
  --dart-define=API_BASE_URL=https://api.projectx.edu/api/v1 \
  --export-options-plist=ios/ExportOptions.plist
```
*Output*: `apps/mobile/build/ios/archive/Runner.xcarchive`

---

## 🩺 7. Health Checks, Logging & Monitoring

### Deep Health-Check Endpoints
* **Public Liveness / Readiness Probe**: `GET /healthz` or `GET /api/healthz`
* **Internal System Diagnostics**: `GET /api/v1/health/system`

#### Sample Response:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "uptimeSeconds": 14280,
  "timestamp": "2026-09-02T08:30:00.000Z",
  "responseTimeMs": 3,
  "services": {
    "database": {
      "status": "healthy",
      "latencyMs": 2
    }
  },
  "system": {
    "memoryHeapUsedMB": 48,
    "memoryHeapTotalMB": 72,
    "memoryRssMB": 96,
    "nodeVersion": "v20.12.2"
  }
}
```

### Production Structured Logging
In production (`NODE_ENV=production`), logs are emitted in JSON format for ingestion by Datadog, AWS CloudWatch, or ELK Stack:
```json
{"timestamp":"2026-09-02T08:30:00.000Z","level":"INFO","environment":"production","message":"HTTP POST /api/v1/projects 201 - 42ms","metadata":{"method":"POST","path":"/api/v1/projects","statusCode":201,"durationMs":42}}
```

### Error Tracking
Sentry hook is initialized via `ErrorTracker.init()` whenever `SENTRY_DSN` is populated.
Unhandled 500 exceptions automatically dispatch error breadcrumbs, route context, and sanitized telemetry without exposing database schemas or stack traces to end-users.
