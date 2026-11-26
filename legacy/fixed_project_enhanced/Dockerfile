# ═══════════════════════════════════════════════════════════════════════
# Dockerfile — Workforce Intelligence Platform v7.0 (4th Semester)
# Multi-stage build for a lean, production-ready image.
# Build : docker build -t wip:v7 .
# Run   : docker-compose up -d  (preferred)
# ═══════════════════════════════════════════════════════════════════════

# ── Stage 1: install production deps ────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: production image ────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY backend/  ./backend/
COPY frontend/ ./frontend/
COPY .env.example .env.example

# Create non-root user for container security
RUN addgroup -S wip && adduser -S wip -G wip \
    && mkdir -p /app/backend/uploads \
    && chown -R wip:wip /app

USER wip

EXPOSE 5000

# Health check — ensures container reports unhealthy if API is down
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["node", "backend/server.js"]
