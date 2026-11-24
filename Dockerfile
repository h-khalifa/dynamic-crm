# Production image (multi-stage, Next.js standalone output).
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
# Prisma CLI (with its own dependencies) for `migrate deploy` at startup, pinned to the project's version.
COPY package.json ./package.json
RUN npm install -g "prisma@$(node -p "require('./package.json').devDependencies.prisma.replace(/^[^0-9]*/, '')")" \
  && npm cache clean --force
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/content ./content
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
RUN chown -R node:node /app/.next
USER node
EXPOSE 3000
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
