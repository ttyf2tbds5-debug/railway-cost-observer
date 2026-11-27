FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-fund
COPY . .
RUN npm run build
RUN npm prune --omit=dev --no-fund

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 DATABASE_URL=file:/data/cost-observer/data.db
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini gosu && rm -rf /var/lib/apt/lists/* && mkdir /data
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json /app/next.config.mjs /app/LICENSE ./
RUN chmod 755 scripts/container-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["tini","--","/app/scripts/container-entrypoint.sh"]


