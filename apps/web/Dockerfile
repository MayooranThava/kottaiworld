FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --filter @kottaiworld/web... --frozen-lockfile=false

FROM deps AS build
COPY apps/web apps/web
ARG NEXT_PUBLIC_SERVER_NAME=KottaiServer
ARG NEXT_PUBLIC_WORLD_NAME=KottaiWorld
ENV NEXT_PUBLIC_SERVER_NAME=$NEXT_PUBLIC_SERVER_NAME
ENV NEXT_PUBLIC_WORLD_NAME=$NEXT_PUBLIC_WORLD_NAME
RUN pnpm --filter @kottaiworld/web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
