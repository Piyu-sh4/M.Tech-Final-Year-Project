FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache chromium font-dejavu
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node backend/ ./backend/
COPY --chown=node:node frontend/ ./frontend/
RUN mkdir -p /app/backend/uploads /app/backend/state && chown -R node:node /app/backend/uploads /app/backend/state
USER node
EXPOSE 5000
CMD ["node", "backend/server.js"]

FROM runtime AS test
USER root
COPY package*.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci --include=dev
COPY tests/ ./tests/
USER node
CMD ["npm", "test", "--", "--runInBand"]

FROM runtime AS production
