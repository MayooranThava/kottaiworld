FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY packages/sav-parser/package.json packages/sav-parser/
COPY apps/collector/package.json apps/collector/
RUN pnpm install --filter @kottaiworld/collector... --frozen-lockfile=false

FROM deps AS build
COPY packages/sav-parser packages/sav-parser
COPY apps/collector apps/collector
RUN pnpm --filter @kottaiworld/sav-parser build \
 && pnpm --filter @kottaiworld/collector build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=build /app /app
WORKDIR /app/apps/collector
EXPOSE 4100
CMD ["node", "dist/index.js"]
