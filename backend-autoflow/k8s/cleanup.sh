#!/bin/bash

# AutoFlow Kubernetes Cleanup Script
set -e

echo "🧹 Starting AutoFlow Kubernetes Cleanup..."

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

# Set variables
NAMESPACE="autoflow"

print_status "Cleaning up namespace: $NAMESPACE"

# Check if namespace exists
if kubectl get namespace $NAMESPACE &> /dev/null; then
    print_status "Namespace $NAMESPACE exists. Proceeding with cleanup..."
    
    # Delete all resources in the namespace
    print_status "Deleting all resources in namespace $NAMESPACE..."
    kubectl delete all --all -n $NAMESPACE
    
    # Delete ingress
    print_status "Deleting ingress..."
    kubectl delete ingress --all -n $NAMESPACE 2>/dev/null || true
    
    # Delete persistent volume claims
    print_status "Deleting persistent volume claims..."
    kubectl delete pvc --all -n $NAMESPACE 2>/dev/null || true
    
    # Delete secrets
    print_status "Deleting secrets..."
    kubectl delete secret --all -n $NAMESPACE 2>/dev/null || true
    
    # Delete configmaps
    print_status "Deleting configmaps..."
    kubectl delete configmap --all -n $NAMESPACE 2>/dev/null || true
    
    # Delete RBAC resources
    print_status "Deleting RBAC resources..."
    kubectl delete rolebinding --all -n $NAMESPACE 2>/dev/null || true
    kubectl delete role --all -n $NAMESPACE 2>/dev/null || true
    kubectl delete serviceaccount --all -n $NAMESPACE 2>/dev/null || true
    
    # Delete namespace
    print_status "Deleting namespace $NAMESPACE..."
    kubectl delete namespace $NAMESPACE
    
    print_status "✅ Cleanup completed successfully!"
else
    print_warning "Namespace $NAMESPACE does not exist. Nothing to clean up."
fi 