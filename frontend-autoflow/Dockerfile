# Build stage
FROM node:18-alpine as build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV REACT_APP_API_URL=http://backend-service:5000
ENV NODE_ENV=production

# Add cache-busting timestamp to force rebuild
ARG BUILD_DATE
ARG BUILD_TIME
RUN echo "Build date: ${BUILD_DATE:-$(date)}" > /app/build-info.txt
RUN echo "Build time: ${BUILD_TIME:-$(date +%s)}" >> /app/build-info.txt

# Build the app for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set environment variables for Kubernetes backend services
ENV BACKEND_API_HOST=backend-service
ENV BACKEND_API_PORT=5000
ENV FLASK_API_HOST=backend-service
ENV FLASK_API_PORT=5001
ENV AI_AGENTS_API_HOST=backend-service
ENV AI_AGENTS_API_PORT=5003
ENV WEBSOCKET_HOST=backend-service
ENV WEBSOCKET_PORT=5010

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy both nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.k8s.conf /etc/nginx/nginx.k8s.conf

# Copy startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost/ || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Start nginx
CMD ["/startup.sh"]

