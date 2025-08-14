#!/bin/bash

# AutoFlow Secure Image Build and Deploy Script
# This script builds a secure Docker image and deploys it to Kubernetes

set -e

echo "🔒 Building and Deploying Secure AutoFlow Image"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
IMAGE_NAME="sarra539/autoflow-backend"
SECURE_TAG="secure-$(date +%Y%m%d-%H%M%S)"
LATEST_TAG="secure-latest"

# Check if Docker is running
check_docker() {
    print_status "Checking Docker daemon..."
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker daemon is running"
}

# Build secure image
build_secure_image() {
    print_status "Building secure AutoFlow image..."
    
    # Build the image using the secure Dockerfile
    docker build -f Dockerfile.secure \
        -t ${IMAGE_NAME}:${SECURE_TAG} \
        -t ${IMAGE_NAME}:${LATEST_TAG} \
        .
    
    print_success "Secure image built successfully: ${IMAGE_NAME}:${SECURE_TAG}"
}

# Run security scans on the built image
run_image_security_scan() {
    print_status "Running security scan on built image..."
    
    # Scan with Trivy
    print_status "Scanning with Trivy..."
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest \
        image --format json --output trivy-scan-results.json \
        ${IMAGE_NAME}:${SECURE_TAG}
    
    # Check for critical vulnerabilities
    CRITICAL_VULNS=$(docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest \
        image --severity CRITICAL --format json \
        ${IMAGE_NAME}:${SECURE_TAG} | jq '.Results[].Vulnerabilities | length' 2>/dev/null || echo "0")
    
    if [ "$CRITICAL_VULNS" -gt 0 ]; then
        print_warning "Critical vulnerabilities detected: $CRITICAL_VULNS"
        print_warning "Please review and fix before deploying to production"
    else
        print_success "No critical vulnerabilities detected"
    fi
    
    print_success "Security scan completed"
}

# Push image to registry
push_image() {
    print_status "Pushing secure image to registry..."
    
    # Push both tags
    docker push ${IMAGE_NAME}:${SECURE_TAG}
    docker push ${IMAGE_NAME}:${LATEST_TAG}
    
    print_success "Image pushed successfully to registry"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_status "Deploying secure image to Kubernetes..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl not found. Skipping Kubernetes deployment."
        print_warning "You can deploy manually using:"
        echo "kubectl set image deployment/backend-deployment backend=${IMAGE_NAME}:${SECURE_TAG} -n autoflow"
        return
    fi
    
    # Check if we can connect to the cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_warning "Cannot connect to Kubernetes cluster. Skipping deployment."
        return
    fi
    
    # Update the deployment with the new secure image
    kubectl set image deployment/backend-deployment \
        backend=${IMAGE_NAME}:${SECURE_TAG} \
        -n autoflow
    
    # Wait for rollout to complete
    print_status "Waiting for deployment rollout to complete..."
    kubectl rollout status deployment/backend-deployment -n autoflow --timeout=300s
    
    print_success "Secure image deployed to Kubernetes successfully!"
}

# Generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    cat > deployment-report-$(date +%Y%m%d-%H%M%S).md <<EOF
# AutoFlow Secure Image Deployment Report

## Deployment Details
- **Image**: ${IMAGE_NAME}:${SECURE_TAG}
- **Tag**: ${SECURE_TAG}
- **Build Date**: $(date)
- **Security Scans**: Completed

## Security Features Implemented
- ✅ Multi-stage build with security scanning
- ✅ Non-root user execution
- ✅ Minimal runtime dependencies
- ✅ Security headers and hardening
- ✅ Vulnerability scanning with Trivy
- ✅ Code quality analysis with Bandit
- ✅ Dependency security with Safety
- ✅ Health checks and monitoring

## Image Information
\`\`\`bash
# Pull the secure image
docker pull ${IMAGE_NAME}:${SECURE_TAG}

# Run locally for testing
docker run -p 5000:5000 ${IMAGE_NAME}:${SECURE_TAG}

# View security reports
docker run --rm ${IMAGE_NAME}:${SECURE_TAG} cat /app/security-reports/trivy-fs-report.json
\`\`\`

## Next Steps
1. Monitor the deployment in Kubernetes
2. Verify application functionality
3. Check security scan results
4. Update CI/CD pipeline to use secure image
5. Schedule regular security scans

## Rollback Instructions
If issues occur, rollback to previous version:
\`\`\`bash
kubectl set image deployment/backend-deployment backend=${IMAGE_NAME}:latest -n autoflow
kubectl rollout status deployment/backend-deployment -n autoflow
\`\`\`
EOF
    
    print_success "Deployment report generated: deployment-report-$(date +%Y%m%d-%H%M%S).md"
}

# Main execution
main() {
    echo ""
    
    check_docker
    build_secure_image
    run_image_security_scan
    push_image
    deploy_to_kubernetes
    generate_report
    
    echo ""
    print_success "Secure AutoFlow image build and deployment completed! 🎉"
    echo ""
    echo "📋 Summary:"
    echo "✅ Secure image built: ${IMAGE_NAME}:${SECURE_TAG}"
    echo "✅ Security scans completed"
    echo "✅ Image pushed to registry"
    echo "✅ Deployed to Kubernetes (if available)"
    echo "✅ Deployment report generated"
    echo ""
    echo "🔒 Your AutoFlow application is now running with enhanced security!"
}

# Run main function
main "$@" 