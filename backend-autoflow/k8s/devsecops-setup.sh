#!/bin/bash

# AutoFlow DevSecOps Setup Script
# This script installs and configures security tools on your Kubernetes cluster

set -e

echo "🚀 Starting AutoFlow DevSecOps Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed. Please install helm first."
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Install SonarQube
install_sonarqube() {
    print_status "Installing SonarQube..."
    
    # Add SonarQube Helm repository
    helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
    helm repo update
    
    # Create namespace
    kubectl create namespace sonarqube --dry-run=client -o yaml | kubectl apply -f -
    
    # Install SonarQube
    helm install sonarqube sonarqube/sonarqube \
        --namespace sonarqube \
        --set postgresql.enabled=true \
        --set postgresql.postgresqlPassword=sonar123 \
        --set postgresql.postgresqlDatabase=sonarDB \
        --set service.type=NodePort \
        --set persistence.enabled=true \
        --set persistence.size=10Gi \
        --wait --timeout=10m
    
    print_success "SonarQube installed successfully!"
    
    # Get access information
    SONAR_NODEPORT=$(kubectl get svc -n sonarqube sonarqube-sonarqube -o jsonpath='{.spec.ports[0].nodePort}')
    WORKER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    print_status "SonarQube is accessible at: http://${WORKER_IP}:${SONAR_NODEPORT}"
    print_status "Default credentials: admin/admin"
}

# Install Trivy
install_trivy() {
    print_status "Installing Trivy vulnerability scanner..."
    
    # Add Trivy Helm repository
    helm repo add trivy https://trivy.github.io/helm-charts
    helm repo update
    
    # Create namespace
    kubectl create namespace trivy-system --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Trivy operator
    helm install trivy-operator trivy/trivy-operator \
        --namespace trivy-system \
        --wait --timeout=10m
    
    # Install Trivy server
    helm install trivy-server trivy/trivy-server \
        --namespace trivy-system \
        --set service.type=NodePort \
        --wait --timeout=10m
    
    print_success "Trivy installed successfully!"
}

# Install Vault
install_vault() {
    print_status "Installing HashiCorp Vault..."
    
    # Add HashiCorp Helm repository
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    
    # Create namespace
    kubectl create namespace vault --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Vault in development mode
    helm install vault hashicorp/vault \
        --namespace vault \
        --set server.dev.enabled=true \
        --set server.dev.devRootToken=root \
        --set server.dev.ha.enabled=false \
        --set service.type=NodePort \
        --wait --timeout=10m
    
    print_success "Vault installed successfully!"
    
    # Get access information
    VAULT_NODEPORT=$(kubectl get svc -n vault vault -o jsonpath='{.spec.ports[0].nodePort}')
    WORKER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    print_status "Vault is accessible at: http://${WORKER_IP}:${VAULT_NODEPORT}"
    print_status "Root token: root"
}

# Create security policies
create_security_policies() {
    print_status "Creating security policies and RBAC..."
    
    # Create security namespace
    kubectl create namespace security --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply security RBAC
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: security-scanner
  namespace: security
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: security-scanner
rules:
- apiGroups: [""]
  resources: ["pods", "services", "secrets"]
  verbs: ["get", "list"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: security-scanner
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: security-scanner
subjects:
- kind: ServiceAccount
  name: security-scanner
  namespace: security
EOF
    
    print_success "Security policies created successfully!"
}

# Create security scanning job
create_security_scanning() {
    print_status "Creating security scanning infrastructure..."
    
    # Create security scanning cronjob
    kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-scan
  namespace: security
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: security-scanner
          containers:
          - name: trivy-scanner
            image: aquasec/trivy:latest
            command:
            - /bin/sh
            - -c
            - |
              echo "Starting security scan..."
              trivy image --format json --output /tmp/scan-results.json sarra539/autoflow-backend:latest || echo "Backend scan failed"
              trivy image --format json --output /tmp/scan-results-frontend.json sarra539/autoflow-frontend:latest || echo "Frontend scan failed"
              echo "Security scan completed"
            volumeMounts:
            - name: scan-results
              mountPath: /tmp
          volumes:
          - name: scan-results
            emptyDir: {}
          restartPolicy: OnFailure
EOF
    
    print_success "Security scanning infrastructure created!"
}

# Create network policies
create_network_policies() {
    print_status "Creating network security policies..."
    
    # Create network policy for autoflow namespace
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: autoflow-network-policy
  namespace: autoflow
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: security
    ports:
    - protocol: TCP
      port: 8080
EOF
    
    print_success "Network security policies created!"
}

# Create security monitoring
create_security_monitoring() {
    print_status "Setting up security monitoring..."
    
    # Create security dashboard configmap
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-dashboard
  namespace: security
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "AutoFlow Security Dashboard",
        "panels": [
          {
            "title": "Vulnerability Scan Results",
            "type": "stat",
            "targets": [
              {
                "expr": "trivy_vulnerabilities_total"
              }
            ]
          }
        ]
      }
    }
EOF
    
    print_success "Security monitoring configured!"
}

# Display access information
display_access_info() {
    print_status "Retrieving access information..."
    
    echo ""
    echo "🔐 DevSecOps Tools Access Information:"
    echo "======================================"
    
    # Get worker node IP
    WORKER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    # SonarQube
    if kubectl get svc -n sonarqube sonarqube-sonarqube &> /dev/null; then
        SONAR_NODEPORT=$(kubectl get svc -n sonarqube sonarqube-sonarqube -o jsonpath='{.spec.ports[0].nodePort}')
        echo "📊 SonarQube: http://${WORKER_IP}:${SONAR_NODEPORT}"
        echo "   Credentials: admin/admin"
    fi
    
    # Vault
    if kubectl get svc -n vault vault &> /dev/null; then
        VAULT_NODEPORT=$(kubectl get svc -n vault vault -o jsonpath='{.spec.ports[0].nodePort}')
        echo "🔒 Vault: http://${WORKER_IP}:${VAULT_NODEPORT}"
        echo "   Root Token: root"
    fi
    
    # Trivy
    if kubectl get svc -n trivy-system trivy-server &> /dev/null; then
        TRIVY_NODEPORT=$(kubectl get svc -n trivy-system trivy-server -o jsonpath='{.spec.ports[0].nodePort}')
        echo "🛡️  Trivy Server: http://${WORKER_IP}:${TRIVY_NODEPORT}"
    fi
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Access SonarQube and change default password"
    echo "2. Configure Vault with proper authentication"
    echo "3. Set up Trivy scanning policies"
    echo "4. Integrate security scanning into your CI/CD pipeline"
    echo "5. Build and deploy secure AutoFlow images"
}

# Main execution
main() {
    echo "🔒 AutoFlow DevSecOps Setup"
    echo "============================"
    echo ""
    
    check_prerequisites
    
    install_sonarqube
    install_trivy
    install_vault
    
    create_security_policies
    create_security_scanning
    create_network_policies
    create_security_monitoring
    
    display_access_info
    
    echo ""
    print_success "DevSecOps setup completed successfully! 🎉"
    echo ""
    echo "Your Kubernetes cluster is now secured with:"
    echo "✅ SonarQube - Code quality and security analysis"
    echo "✅ Trivy - Vulnerability scanning"
    echo "✅ Vault - Secrets management"
    echo "✅ Network policies - Pod communication security"
    echo "✅ Security scanning - Automated vulnerability detection"
}

# Run main function
main "$@" 