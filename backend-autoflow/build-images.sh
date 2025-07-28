#!/bin/bash

# AutoFlow Docker Image Build and Push Script
echo "🐳 Building and pushing AutoFlow Docker images..."

# Set variables
DOCKER_USERNAME="sarra539"
BACKEND_IMAGE="autoflow-backend"
FRONTEND_IMAGE="autoflow-frontend"
VERSION="latest"

# Login to DockerHub (you'll be prompted for credentials)
echo "🔐 Logging into DockerHub..."
docker login

# Build and push backend image
echo "🔧 Building backend image..."
cd backend-autoflow
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION .
docker push $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION
cd ..

# Build and push frontend image
echo "🎨 Building frontend image..."
cd frontend-autoflow
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION .
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION
cd ..

echo "✅ Docker images built and pushed successfully!"
echo ""
echo "📋 Image details:"
echo "Backend: $DOCKER_USERNAME/$BACKEND_IMAGE:$VERSION"
echo "Frontend: $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION"
echo ""
echo "🚀 Ready to deploy to Kubernetes!" 