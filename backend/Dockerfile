FROM node:22-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# --- Stage 2: Runner ---
FROM node:22-slim

# Install OpenSSL and FFmpeg for video processing
RUN apt-get update && apt-get install -y openssl ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Make sure uploads directory exists
RUN mkdir -p /app/uploads

EXPOSE 3000

# Deploy migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
