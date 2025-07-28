#!/bin/bash

# AutoFlow Kubernetes Deployment Script
echo "🚀 Starting AutoFlow Kubernetes Deployment..."

# Set variables
BACKEND_IMAGE="sarra539/autoflow-backend:latest"
FRONTEND_IMAGE="sarra539/autoflow-frontend:latest"
NAMESPACE="autoflow"

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f secrets.yaml -n $NAMESPACE

# Apply persistent volume claim
echo "💾 Creating persistent volume claim..."
kubectl apply -f backup-pvc.yaml -n $NAMESPACE

# Apply backend deployment
echo "🔧 Deploying backend..."
kubectl apply -f backend-deployment.yaml -n $NAMESPACE

# Apply frontend deployment
echo "🎨 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml -n $NAMESPACE

# Apply ingress (optional)
echo "🌐 Applying ingress..."
kubectl apply -f ingress.yaml -n $NAMESPACE

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n $NAMESPACE
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n $NAMESPACE

# Get service information
echo "📊 Getting service information..."
kubectl get services -n $NAMESPACE

# Get ingress information
echo "🌐 Getting ingress information..."
kubectl get ingress -n $NAMESPACE

echo "✅ AutoFlow deployment completed!"
echo ""
echo "🔗 Access your application:"
echo "Frontend: http://<worker-node-ip>:<nodeport>"
echo "Backend API: http://<worker-node-ip>:<nodeport>/api"
echo ""
echo "📋 Useful commands:"
echo "kubectl get pods -n $NAMESPACE"
echo "kubectl logs -f deployment/backend-deployment -n $NAMESPACE"
echo "kubectl logs -f deployment/frontend-deployment -n $NAMESPACE" 