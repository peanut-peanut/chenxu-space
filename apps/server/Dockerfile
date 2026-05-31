FROM node:20-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/server ./apps/server
RUN pnpm --filter @chenxu/types run build
RUN pnpm --filter server exec prisma generate
RUN pnpm --filter server run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm i -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/prisma ./apps/server/prisma

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["sh", "-c", "../../node_modules/.bin/prisma migrate deploy && node dist/main"]
