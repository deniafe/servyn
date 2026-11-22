FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.13 prune @servyn/realtime-server --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @servyn/realtime-server build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV REALTIME_PORT=4002
COPY --from=builder /app/apps/realtime/dist ./apps/realtime/dist
COPY --from=builder /app/apps/realtime/package.json ./apps/realtime/package.json
EXPOSE 4002
CMD ["node", "apps/realtime/dist/index.js"]
