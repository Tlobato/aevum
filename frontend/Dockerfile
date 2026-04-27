# ============================================================
# Frontend Dockerfile — Multi-Stage Build
# Stage 1: Instala dependências e builda o Next.js
# Stage 2: Roda o servidor Next.js em Node mínimo
# ============================================================

# Stage 1 — Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2 — Build
FROM node:20-alpine AS builder
WORKDIR /app

# Argumentos de build (variáveis públicas do Next.js precisam ser injetadas em build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_ADMIN_EMAILS

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_ADMIN_EMAILS=$NEXT_PUBLIC_ADMIN_EMAILS

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3 — Runtime (standalone output do Next.js)
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S aevum && adduser -S aevum -G aevum

# Copia apenas os artefatos necessários para rodar
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER aevum

EXPOSE 3000

CMD ["node", "server.js"]
