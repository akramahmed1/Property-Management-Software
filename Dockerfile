# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY src/backend/package*.json ./src/backend/
COPY src/frontend/package*.json ./src/frontend/
COPY tests/package*.json ./tests/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build backend
WORKDIR /app/src/backend
RUN npm run build

# Build frontend
WORKDIR /app/src/frontend
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/src/backend/dist ./dist
COPY --from=builder /app/src/backend/node_modules ./node_modules
COPY --from=builder /app/src/backend/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy frontend build
COPY --from=builder /app/src/frontend/dist ./public

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
