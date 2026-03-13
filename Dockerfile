# Multi-stage production build – QWC2 frontend (Webpack)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json frontend/.babelrc.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ ./

# Build the application (Webpack production build → prod/)
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Remove default nginx config to avoid conflicts
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config template (with $PORT placeholder for Render.com)
# Stored outside /etc/nginx/templates/ to prevent nginx's built-in envsubst from processing it
COPY nginx/nginx-render.conf /etc/nginx/nginx.conf.template

# Copy entrypoint script (handles envsubst for $PORT only, preserving nginx variables)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built frontend from builder stage (Webpack outputs to prod/)
COPY --from=builder /app/prod /usr/share/nginx/html

# Create cache directory for nginx proxy cache
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Add health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'wget -q --spider http://localhost:${PORT:-10000}/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Render.com sets PORT env var (default 10000)
ENV PORT=10000
EXPOSE ${PORT}

# Use entrypoint script to correctly envsubst only $PORT and start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
