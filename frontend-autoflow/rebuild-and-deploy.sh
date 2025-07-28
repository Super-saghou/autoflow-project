#!/bin/bash

echo "🔧 Rebuilding and deploying AutoFlow Frontend with fixed nginx configuration..."

# Set variables
DOCKER_USERNAME="sarra539"
FRONTEND_IMAGE="autoflow-front"
VERSION="VersionTestKuber9"

# Build the new frontend image
echo "🐳 Building frontend image..."
docker build -t $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION .

# Push the image to DockerHub
echo "📤 Pushing image to DockerHub..."
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION

# Update the deployment to use the new image
echo "🚀 Updating Kubernetes deployment..."
kubectl set image deployment/frontend-deployment frontend=$DOCKER_USERNAME/$FRONTEND_IMAGE:$VERSION

# Wait for the rollout to complete
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/frontend-deployment

# Check the status
echo "📊 Checking deployment status..."
kubectl get pods

echo "✅ Frontend deployment updated successfully!"
echo ""
echo "🔗 Access your application at: http://192.168.111.201:31560"
echo ""
echo "📋 To check logs:"
echo "kubectl logs -f deployment/frontend-deployment" 