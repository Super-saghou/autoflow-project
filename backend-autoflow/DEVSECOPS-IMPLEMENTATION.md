# AutoFlow DevSecOps Implementation Guide

This guide provides comprehensive steps to implement DevSecOps practices in your AutoFlow project by integrating SonarQube, Trivy, and HashiCorp Vault into your Kubernetes cluster.

## 🎯 Overview

We'll implement a complete DevSecOps pipeline that includes:
- **SonarQube**: Code quality and security analysis
- **Trivy**: Vulnerability scanning for containers and code
- **Vault**: Secrets management and encryption
- **Security policies**: Network policies, RBAC, and scanning
- **Secure image building**: Multi-stage Docker builds with security scanning

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AutoFlow VM  │    │  Control VM     │    │  Kubernetes    │
│                 │    │                 │    │    Cluster     │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Source   │ │    │ │   Helm      │ │    │ │ SonarQube  │ │
│ │   Code     │ │    │ │   Charts    │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Docker   │ │    │ │   kubectl   │ │    │ │    Trivy    │ │
│ │   Build    │ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Image    │ │    │ │   Vault     │ │    │ │    Vault    │ │
│ │  Registry  │ │    │ │   Config    │ │    │ │   Server    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Phase 1: Setup DevSecOps Tools on Kubernetes Cluster

### Prerequisites

On your **Control VM** (Kubernetes cluster), ensure you have:
- Kubernetes cluster running
- `kubectl` configured
- `helm` installed
- Access to internet for pulling images

### Step 1: Install SonarQube

```bash
# SSH to your control VM
ssh user@control-vm-ip

# Add SonarQube Helm repository
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
helm repo update

# Create namespace
kubectl create namespace sonarqube

# Install SonarQube
helm install sonarqube sonarqube/sonarqube \
  --namespace sonarqube \
  --set postgresql.enabled=true \
  --set postgresql.postgresqlPassword=sonar123 \
  --set postgresql.postgresqlDatabase=sonarDB \
  --set service.type=NodePort \
  --set persistence.enabled=true \
  --set persistence.size=10Gi

# Wait for deployment
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=sonarqube -n sonarqube --timeout=300s

# Get access information
kubectl get svc -n sonarqube
```

### Step 2: Install Trivy

```bash
# Add Trivy Helm repository
helm repo add trivy https://trivy.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace trivy-system

# Install Trivy operator
helm install trivy-operator trivy/trivy-operator \
  --namespace trivy-system \
  --wait --timeout=10m

# Install Trivy server
helm install trivy-server trivy/trivy-server \
  --namespace trivy-system \
  --set service.type=NodePort \
  --wait --timeout=10m
```

### Step 3: Install HashiCorp Vault

```bash
# Add HashiCorp Helm repository
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

# Create namespace
kubectl create namespace vault

# Install Vault (development mode for testing)
helm install vault hashicorp/vault \
  --namespace vault \
  --set server.dev.enabled=true \
  --set server.dev.devRootToken=root \
  --set server.dev.ha.enabled=false \
  --set service.type=NodePort \
  --wait --timeout=10m

# For production, use:
# helm install vault hashicorp/vault \
#   --namespace vault \
#   --set server.ha.enabled=true \
#   --set server.ha.replicas=3 \
#   --set server.ha.raft.enabled=true \
#   --set service.type=NodePort
```

### Step 4: Run the Complete Setup Script

```bash
# Copy the devsecops-setup.sh script to your control VM
# Then run:
chmod +x devsecops-setup.sh
./devsecops-setup.sh
```

## 🔒 Phase 2: Configure Security Policies

### Create Network Policies

```bash
# Apply network security policies
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
EOF
```

### Create Security RBAC

```bash
# Apply security RBAC
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: security-scanner
  namespace: autoflow
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: security-scanner
rules:
- apiGroups: [""]
  resources: ["pods", "services", "secrets"]
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
  namespace: autoflow
EOF
```

## 🐳 Phase 3: Build Secure AutoFlow Image

### On Your AutoFlow VM

```bash
# Make the build script executable
chmod +x build-secure-image.sh

# Build and deploy secure image
./build-secure-image.sh
```

### Manual Build Steps

```bash
# Build secure image
docker build -f Dockerfile.secure \
  -t sarra539/autoflow-backend:secure \
  .

# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest \
  image --severity HIGH,CRITICAL \
  sarra539/autoflow-backend:secure

# Push to registry
docker push sarra539/autoflow-backend:secure
```

## 🚀 Phase 4: Deploy Secure Image to Kubernetes

### Update Kubernetes Deployment

```bash
# On your control VM
kubectl set image deployment/backend-deployment \
  backend=sarra539/autoflow-backend:secure \
  -n autoflow

# Wait for rollout
kubectl rollout status deployment/backend-deployment -n autoflow

# Verify deployment
kubectl get pods -n autoflow
kubectl describe deployment backend-deployment -n autoflow
```

## 📊 Phase 5: Configure Security Monitoring

### Create Security Dashboard

```bash
# Create Grafana dashboard for security monitoring
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-dashboard
  namespace: autoflow
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
```

### Set up Security Alerts

```bash
# Create Prometheus rules for security alerts
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: security-alerts
  namespace: autoflow
spec:
  groups:
  - name: security.rules
    rules:
    - alert: CriticalVulnerabilityDetected
      expr: trivy_critical_vulnerabilities > 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Critical vulnerability detected in AutoFlow"
        description: "Critical security vulnerability detected in AutoFlow deployment"
EOF
```

## 🔄 Phase 6: Continuous Security Pipeline

### Create Security Scanning CronJob

```bash
# Create automated security scanning
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: security-scan
  namespace: autoflow
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
              trivy image --format json --output /tmp/scan-results.json sarra539/autoflow-backend:secure
              trivy image --format json --output /tmp/scan-results-frontend.json sarra539/autoflow-frontend:latest
              echo "Security scan completed"
            volumeMounts:
            - name: scan-results
              mountPath: /tmp
          volumes:
          - name: scan-results
            emptyDir: {}
          restartPolicy: OnFailure
EOF
```

## 📋 Access Information

After setup, you can access the tools at:

### SonarQube
- **URL**: `http://<worker-node-ip>:<sonarqube-nodeport>`
- **Credentials**: `admin/admin`
- **Purpose**: Code quality, security hotspots, code smells

### Vault
- **URL**: `http://<worker-node-ip>:<vault-nodeport>`
- **Token**: `root`
- **Purpose**: Secrets management, encryption, access control

### Trivy
- **URL**: `http://<worker-node-ip>:<trivy-nodeport>`
- **Purpose**: Vulnerability scanning, SBOM generation

## 🧪 Testing Your Setup

### Test SonarQube Integration

```bash
# On your AutoFlow VM, install sonar-scanner
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.7.0.2747-linux.zip
unzip sonar-scanner-cli-4.7.0.2747-linux.zip
export PATH=$PATH:./sonar-scanner-4.7.0.2747-linux/bin

# Run SonarQube analysis
sonar-scanner \
  -Dsonar.projectKey=autoflow \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://<sonarqube-ip>:<port> \
  -Dsonar.login=admin
```

### Test Trivy Scanning

```bash
# Scan your AutoFlow image
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest \
  image sarra539/autoflow-backend:secure

# Scan your codebase
docker run --rm -v $(pwd):/app \
  aquasec/trivy:latest \
  fs /app
```

### Test Vault Integration

```bash
# On your control VM
export VAULT_ADDR=http://<vault-ip>:<port>
export VAULT_TOKEN=root

# Test Vault
vault status
vault secrets list

# Create a secret
vault kv put secret/autoflow db_password=secure123
vault kv get secret/autoflow
```

## 🔧 Troubleshooting

### Common Issues

1. **SonarQube not starting**
   ```bash
   kubectl logs -f deployment/sonarqube -n sonarqube
   kubectl describe pod -l app.kubernetes.io/name=sonarqube -n sonarqube
   ```

2. **Trivy operator issues**
   ```bash
   kubectl logs -f deployment/trivy-operator -n trivy-system
   kubectl get events -n trivy-system
   ```

3. **Vault connection issues**
   ```bash
   kubectl logs -f deployment/vault -n vault
   kubectl port-forward svc/vault 8200:8200 -n vault
   ```

### Health Checks

```bash
# Check all pods
kubectl get pods --all-namespaces

# Check services
kubectl get svc --all-namespaces

# Check persistent volumes
kubectl get pv,pvc --all-namespaces
```

## 📈 Next Steps

1. **Integrate with CI/CD Pipeline**
   - Add security scanning to GitLab CI
   - Automate vulnerability checks
   - Implement security gates

2. **Advanced Security Features**
   - Implement OPA (Open Policy Agent)
   - Add Falco for runtime security
   - Configure security context constraints

3. **Monitoring and Alerting**
   - Set up Prometheus + Grafana
   - Configure security alerts
   - Create security dashboards

4. **Compliance and Auditing**
   - Implement audit logging
   - Generate compliance reports
   - Set up policy enforcement

## 🎉 Success Metrics

Your DevSecOps implementation is successful when:

- ✅ All security tools are running and accessible
- ✅ Automated security scanning is working
- ✅ Secure images are being built and deployed
- ✅ Security policies are enforced
- ✅ Vulnerabilities are detected and reported
- ✅ Secrets are properly managed
- ✅ Network policies are active

## 📚 Additional Resources

- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [DevSecOps Best Practices](https://www.devsecops.org/)

---

**Congratulations!** 🎉 You've successfully implemented DevSecOps practices in your AutoFlow project. Your Kubernetes cluster is now secured with industry-standard security tools, and your application images are built with security scanning and hardening. 