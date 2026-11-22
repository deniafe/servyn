FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.13 prune @servyn/web --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @servyn/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
EXPOSE 3000
CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "apps/web", "-p", "3000"]
