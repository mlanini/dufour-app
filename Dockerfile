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

# Copy custom nginx config (for Render.com - no upstream proxy)
COPY nginx/nginx-render.conf /etc/nginx/nginx.conf

# Copy built frontend from builder stage (Webpack outputs to prod/)
COPY --from=builder /app/prod /usr/share/nginx/html

# Create cache directory for nginx proxy cache
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx

# Add health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'wget -q --spider http://localhost/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
