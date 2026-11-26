# APP_ENV picks which API the admin talks to:
#   dev  -> .env.dev  (https://dev.api.kbscosmetics.com)
#   prod -> .env.prod (https://api.kbscosmetics.com)
ARG APP_ENV=prod

# ---------- 1. Install dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. Build ----------
FROM node:22-alpine AS build
ARG APP_ENV
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are baked in at build time
RUN cp ".env.${APP_ENV}" .env.production.local && npm run build

# ---------- 3. Runtime (standalone server) ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN npm install -g pm2@6 && npm cache clean --force

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# Expiry-date reader: engine and models
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node ecosystem.config.js ./

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login > /dev/null || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]
