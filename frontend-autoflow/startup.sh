#!/bin/sh

echo "Starting AutoFlow Frontend..."

# Check if running in Kubernetes
if [ "$KUBERNETES_SERVICE_HOST" ]; then
    echo "Running in Kubernetes - using k8s nginx config"
    cp /etc/nginx/nginx.k8s.conf /etc/nginx/nginx.conf
else
    echo "Running locally - using local nginx config"
    # Keep the default nginx.conf (already copied)
fi

echo "Nginx configuration:"
nginx -t

echo "Starting nginx..."
exec nginx -g "daemon off;" 