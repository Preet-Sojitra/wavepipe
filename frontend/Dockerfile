# Stage 1: Dependencies & Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies needed for node-gyp / native modules on alpine
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

# Copy package manifests, workspace config & prisma schema
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* prisma.config.ts ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm run db:generate

# Copy source code and build Next.js
COPY . .

# Set dummy DATABASE_URL for build-time static evaluation
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm run build

# Stage 2: Minimal Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets & static files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma schema + migrations for migrate deploy at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy startup script
COPY --chown=nextjs:nodejs startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Ensure uploads directory exists with correct permissions
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

# startup.sh runs `prisma migrate deploy` then starts Next.js
CMD ["./startup.sh"]
