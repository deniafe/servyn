FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.13 prune @servyn/worker --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @servyn/worker build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV WORKER_PORT=4001
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
EXPOSE 4001
CMD ["node", "apps/worker/dist/index.js"]
