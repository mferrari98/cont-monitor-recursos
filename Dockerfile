# Multi-stage build for monitor-recursos
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Production with nginx + backend
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

WORKDIR /app

# Copy package files for backend
COPY package.json package-lock.json ./

# Install only production dependencies for backend
RUN npm ci --only=production

# Copy backend source
COPY server.js ./

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default configs and clean conf.d
RUN rm -f /etc/nginx/conf.d/default.conf && \
    rm -f /etc/nginx/nginx.conf && \
    mkdir -p /etc/nginx/conf.d

# Copy our nginx main config
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for nginx pid
RUN mkdir -p /run/nginx

# Expose port 80
EXPOSE 80

# Start both nginx and the backend server
# Run nginx in background, then node in foreground so container stays alive
CMD sh -c 'nginx -g "daemon off;" & node server.js'
