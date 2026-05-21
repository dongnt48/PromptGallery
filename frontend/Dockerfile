FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Pass build args as environment variables for Vite to use during build
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

ARG VITE_ENCRYPTION_KEY
ENV VITE_ENCRYPTION_KEY=$VITE_ENCRYPTION_KEY

# Build the React application
RUN npm run build

# --- Stage 2: Runner ---
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
