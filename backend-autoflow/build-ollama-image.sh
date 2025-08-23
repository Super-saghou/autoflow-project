#!/bin/bash

# Build and push Ollama image to Docker Hub
# This script builds the Ollama image separately from the backend

set -e

echo "🐳 Building Ollama Docker image..."

# Build the Ollama image
docker build -f Dockerfile.ollama -t sarra539/autoflow-ollama:latest .

echo "✅ Ollama image built successfully"

# Tag with latest and current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker tag sarra539/autoflow-ollama:latest sarra539/autoflow-ollama:$TIMESTAMP

echo "🏷️  Image tagged as: sarra539/autoflow-ollama:$TIMESTAMP"

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push sarra539/autoflow-ollama:latest
docker push sarra539/autoflow-ollama:$TIMESTAMP

echo "✅ Ollama image pushed successfully to Docker Hub"
echo "📋 Image: sarra539/autoflow-ollama:latest"
echo "📋 Tagged: sarra539/autoflow-ollama:$TIMESTAMP"

echo ""
echo "🚀 Next steps:"
echo "1. Copy the new k8s manifests to your control VM:"
echo "   - k8s/ollama-deployment.yaml"
echo "   - k8s/ollama-service.yaml"
echo "   - k8s/ollama-pvc.yaml"
echo ""
echo "2. Deploy from your control VM:"
echo "   kubectl apply -f ollama-pvc.yaml"
echo "   kubectl apply -f ollama-deployment.yaml"
echo "   kubectl apply -f ollama-service.yaml" 