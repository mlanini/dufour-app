#!/bin/sh
set -e

# Substitute ONLY $PORT in the nginx config template
# All other $variables (nginx's $uri, $scheme, $remote_addr, etc.) are preserved
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "Nginx starting on port ${PORT:-10000}"

exec nginx -g 'daemon off;'
