# =============================================================================
# React Web Frontend Production Dockerfile (Multi-stage)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests & workspace configs
COPY package*.json ./
COPY packages/common ./packages/common
COPY apps/web ./apps/web

# Install & Build
RUN npm install
RUN npm --prefix packages/common run build
RUN npm --prefix apps/web run build

# =============================================================================
# Production Nginx Container
# =============================================================================
FROM nginx:alpine AS runner

# Copy Custom Nginx Config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Compiled Web Assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
