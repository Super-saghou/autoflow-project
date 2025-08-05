#!/bin/bash

# AutoFlow Kubernetes Deployment Script
set -e

echo "🚀 Starting AutoFlow Kubernetes Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if kustomize is installed
if ! command -v kustomize &> /dev/null; then
    print_warning "kustomize is not installed. Installing kustomize..."
    curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
    sudo mv kustomize /usr/local/bin/
fi

# Set variables
NAMESPACE="autoflow"
BACKEND_IMAGE="sarra539/autoflow-backend:latest"
FRONTEND_IMAGE="sarra539/autoflow-frontend:latest"

print_status "Deploying to namespace: $NAMESPACE"
print_status "Backend image: $BACKEND_IMAGE"
print_status "Frontend image: $FRONTEND_IMAGE"

# Check cluster connectivity
print_status "Checking cluster connectivity..."
kubectl cluster-info

# Create namespace if it doesn't exist
print_status "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply all resources using kustomize
print_status "Applying Kubernetes manifests..."
kustomize build . | kubectl apply -f -

# Wait for deployments to be ready
print_status "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n $NAMESPACE
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n $NAMESPACE

# Get service information
print_status "Getting service information..."
kubectl get services -n $NAMESPACE

# Get ingress information
print_status "Getting ingress information..."
kubectl get ingress -n $NAMESPACE

# Get pod status
print_status "Getting pod status..."
kubectl get pods -n $NAMESPACE

# Check if LoadBalancer service has external IP
print_status "Checking LoadBalancer status..."
kubectl get service frontend-service -n $NAMESPACE -o wide

echo ""
print_status "✅ AutoFlow deployment completed!"
echo ""
print_status "🔗 Access your application:"
echo "   Frontend: http://<worker-node-ip>:<nodeport>"
echo "   Backend API: http://<worker-node-ip>:<nodeport>/api"
echo ""
print_status "📋 Useful commands:"
echo "   kubectl get pods -n $NAMESPACE"
echo "   kubectl logs -f deployment/backend-deployment -n $NAMESPACE"
echo "   kubectl logs -f deployment/frontend-deployment -n $NAMESPACE"
echo "   kubectl describe pod <pod-name> -n $NAMESPACE"
echo ""
print_status "🔄 To update images:"
echo "   kubectl set image deployment/backend-deployment backend=$BACKEND_IMAGE -n $NAMESPACE"
echo "   kubectl set image deployment/frontend-deployment frontend=$FRONTEND_IMAGE -n $NAMESPACE" 