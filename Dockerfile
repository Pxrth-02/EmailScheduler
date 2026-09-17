# Builds the React app and the API into one image. The same image runs the API
# (default command) and the worker (override the command with `node dist/worker.js`).

# --- frontend -----------------------------------------------------------------
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- backend ------------------------------------------------------------------
FROM node:22-slim AS backend
# Prisma's migration engine wants OpenSSL and CA certificates present.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
# prisma generate needs no database; the client is compiled into dist/ by tsc.
RUN npx prisma generate && npm run build

# --- runtime ------------------------------------------------------------------
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app/backend

COPY --from=backend /app/backend/package.json /app/backend/package-lock.json ./
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/prisma ./prisma
COPY --from=backend /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=frontend /app/frontend/dist /app/frontend/dist

# The API serves the built frontend from here so everything is one origin.
ENV STATIC_DIR=/app/frontend/dist
ENV PORT=4000
EXPOSE 4000

# Run `npx prisma migrate deploy` as the platform's pre-deploy / release step.
CMD ["node", "dist/server.js"]
