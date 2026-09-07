# =============================================================================
# Node.js + Express Production Dockerfile (Multi-stage)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl python3 make g++

# Copy package manifests & source directories
COPY package*.json ./
COPY packages/common ./packages/common
COPY packages/db ./packages/db
COPY apps/backend ./apps/backend

# Install dependencies and build all packages in dependency order
RUN npm install
RUN npm --prefix packages/common run build
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm --prefix packages/db run build
RUN npm --prefix apps/backend run build

# =============================================================================
# Production Minimal Alpine Runner
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install production utilities and security requirements
RUN apk add --no-cache openssl wget dumb-init

# Copy built application & node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend

# Create runtime directories with non-root permissions
RUN mkdir -p /app/uploads && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=4000

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/healthz || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/backend/dist/server.js"]
