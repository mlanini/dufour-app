#!/bin/sh
set -e

# Substitute ONLY $PORT in the nginx config template
# All other $variables (nginx's $uri, $scheme, $remote_addr, etc.) are preserved
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Verify nginx config is valid
echo "==> Verifying nginx config..."
nginx -t 2>&1

# List served files for diagnostics
echo "==> Files in /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/ 2>&1 || echo "  (directory empty or missing)"
echo "==> Checking for index.html:"
ls -la /usr/share/nginx/html/index.html 2>&1 || echo "  index.html NOT FOUND!"

echo "==> Nginx starting on port ${PORT:-10000}"

exec nginx -g 'daemon off;'
