# Multi-stage so the runtime image carries no toolchain and no source.
FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY server/package.json server/
COPY packages/shared/package.json packages/shared/
COPY packages/data/package.json packages/data/
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages packages
COPY server server
RUN npm run build -w @aranya/shared \
  && npm run build -w @aranya/data \
  && npm run build -w server \
  && npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S aranya && adduser -S aranya -G aranya
COPY --from=build --chown=aranya:aranya /app/node_modules ./node_modules
COPY --from=build --chown=aranya:aranya /app/packages ./packages
COPY --from=build --chown=aranya:aranya /app/server/dist ./server/dist
COPY --from=build --chown=aranya:aranya /app/server/package.json ./server/package.json
COPY --from=build --chown=aranya:aranya /app/server/drizzle ./server/drizzle
USER aranya
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/dist/index.js"]
