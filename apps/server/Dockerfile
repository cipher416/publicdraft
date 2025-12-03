FROM oven/bun:1 AS build
WORKDIR /app

COPY bun.lock bunfig.toml package.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN bun run build:server

FROM oven/bun:1-slim AS runner
WORKDIR /app/apps/server
ENV NODE_ENV=production

COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/package.json ./package.json
COPY --from=build /app/apps/server/node_modules ./node_modules
COPY --from=build /app/node_modules /app/node_modules

EXPOSE 3000

CMD ["bun", "dist/index.js"]
