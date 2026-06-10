# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /server
COPY hf-server/package.json hf-server/package-lock.json* ./
RUN npm ci --only=production
COPY hf-server/ ./

# Stage 3: Runtime — Express serves API + static frontend + Supabase
FROM node:20-alpine
WORKDIR /app

COPY --from=backend-builder /server /app/server
COPY --from=frontend-builder /app/dist /app/server/public

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1

ENV NODE_ENV=production
ENV PORT=7860
ENV SUPABASE_URL=https://npasitielsksoksctqbv.supabase.co
ENV SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYXNpdGllbHNrc29rc2N0cWJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA1NTAwMSwiZXhwIjoyMDk2NjMxMDAxfQ.yLd9NAEEx6LZprt2sKo-naAAtqkntbWH436v7oRuUhI

CMD ["node", "/app/server/server.js"]