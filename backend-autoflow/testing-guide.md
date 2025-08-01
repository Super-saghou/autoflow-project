# AutoFlow Security and CI/CD Testing Guide

## 🔒 1. Security Tools Testing

### Quick Security Test
```bash
# Make the test script executable and run it
chmod +x test-security-tools.sh
./test-security-tools.sh
```

### Manual Security Verification

#### Test Trivy
```bash
# Test Trivy installation
trivy --version

# Test filesystem scan
trivy fs .

# Test container scan
trivy image alpine:latest

# Test secrets scan
trivy secret .

# Generate detailed report
trivy fs --format json --output security-report.json .
```

#### Test Vault
```bash
# Test Vault installation
vault version

# Start Vault server (if not running)
vault server -dev -dev-root-token-id=your-vault-token &

# Test Vault status
vault status

# Test Vault authentication
vault login -method=token your-vault-token

# Test Vault secrets storage
vault kv put autoflow/test key=value
vault kv get autoflow/test
```

#### Test SonarQube
```bash
# Test SonarQube scanner
sonar-scanner --version

# Run SonarQube analysis
sonar-scanner \
  -Dsonar.projectKey=autoflow \
  -Dsonar.projectName=AutoFlow \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=admin \
  -Dsonar.password=admin
```

#### Test Security API
```bash
# Test security dashboard endpoint
curl http://localhost:5000/api/security/dashboard/overview

# Test Trivy scan endpoint
curl http://localhost:5000/api/security/scan/trivy

# Test Vault audit endpoint
curl http://localhost:5000/api/security/vault/audit
```

## 🚀 2. GitLab CI Pipeline Testing

### Pre-Push Testing

#### 1. Test Local Docker Build
```bash
# Test backend Docker build
docker build -t backend-autoflow:test .

# Test frontend Docker build (from frontend directory)
cd ../frontend-autoflow
docker build -t frontend-autoflow:test .
cd ../backend-autoflow
```

#### 2. Test Kubernetes Manifests (Local Validation)
```bash
# Validate Kubernetes manifests locally
kubectl apply -f backend-deployment.yaml --dry-run=client
kubectl apply -f frontend-deployment.yaml --dry-run=client
kubectl apply -f ingress.yaml --dry-run=client
kubectl apply -f k8s-security-policy.yaml --dry-run=client
```

#### 3. Test Security Policies (Local Validation)
```bash
# Validate security policies locally
kubectl apply -f k8s-security-policy.yaml --dry-run=client

# Check if policies are valid
kubectl get networkpolicy -n autoflow
kubectl get podsecuritypolicy
```

### GitLab CI Commands

#### 1. Push to Test Branch
```bash
# Create and switch to test branch
git checkout -b test-security-integration

# Add all security files
git add .

# Commit changes
git commit -m "Add security integration: Trivy, Vault, SonarQube"

# Push to GitLab
git push origin test-security-integration
```

#### 2. Create Merge Request
```bash
# Go to GitLab web interface
# Navigate to: https://gitlab.com/your-username/autoflow-project
# Click "Create merge request" from test-security-integration to main
```

#### 3. Monitor Pipeline
```bash
# Check pipeline status via GitLab API
curl -H "PRIVATE-TOKEN: your-gitlab-token" \
  "https://gitlab.com/api/v4/projects/your-project-id/pipelines"
```

### Pipeline Stages Verification

#### Stage 1: Test
- ✅ Node.js dependencies install
- ✅ Unit tests pass
- ✅ Security dependencies available

#### Stage 2: Security
- ✅ Trivy vulnerability scan
- ✅ Trivy secrets scan
- ✅ Security reports generated

#### Stage 3: Build
- ✅ Backend Docker image builds
- ✅ Frontend Docker image builds
- ✅ Images pushed to registry

#### Stage 4: Deploy (Control VM)
- ✅ Kubernetes deployment updates on Control VM
- ✅ Pods rollout successfully
- ✅ Services accessible
- ✅ Security policies applied to Control VM cluster

## 🖥️ 3. Control VM Verification

### SSH to Control VM
```bash
# SSH to Control VM (adjust IP/credentials as needed)
ssh user@control-vm-ip

# Or if using VM name
ssh user@Control
```

### Verify Kubernetes on Control VM
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check AutoFlow deployments
kubectl get pods -n autoflow
kubectl get services -n autoflow
kubectl get deployments -n autoflow

# Check security policies
kubectl get networkpolicy -n autoflow
kubectl get podsecuritypolicy

# Check logs
kubectl logs -n autoflow deployment/backend-deployment
kubectl logs -n autoflow deployment/frontend-deployment
```

### Test Application on Control VM
```bash
# Test backend service
curl http://localhost:5000/api/auth/status

# Test frontend service
curl http://localhost:3000

# Test ingress
curl http://192.168.111.201:31560
```

## 🔧 4. Troubleshooting Commands

### Security Issues
```bash
# Check Trivy database
trivy image --download-db-only

# Reset Vault
vault operator unseal

# Check SonarQube logs
docker logs autoflow-sonarqube

# Test security service
node -e "import('./enhanced-security-integration.js')"
```

### CI/CD Issues
```bash
# Check Docker login
docker login -u sarra539

# Test Docker build locally
docker build --no-cache -t test-image .

# Check Kubernetes connectivity (if kubectl is configured)
kubectl cluster-info
kubectl get nodes
```

### Control VM Issues
```bash
# SSH to Control VM and check
ssh user@Control

# Check GitLab runner on Control VM
sudo gitlab-runner status
sudo gitlab-runner list

# Check kubectl configuration
kubectl config current-context
kubectl config view

# Check if runner has correct tags
sudo gitlab-runner list | grep control-vm
```

### Environment Issues
```bash
# Check environment variables
env | grep -E "(VAULT|TRIVY|SONAR|DOCKER)"

# Test .env file
source .env && echo "Environment loaded"

# Check file permissions
ls -la test-security-tools.sh
ls -la security-setup.sh
```

## 📊 5. Success Criteria

### Security Tools ✅
- [ ] Trivy scans complete without errors
- [ ] Vault server accessible and authenticated
- [ ] SonarQube analysis generates reports
- [ ] Security dashboard API responds
- [ ] No critical vulnerabilities found
- [ ] Secrets properly encrypted

### GitLab CI ✅
- [ ] All pipeline stages pass
- [ ] Docker images build successfully
- [ ] Images pushed to registry
- [ ] Kubernetes deployment updates on Control VM
- [ ] Security scan reports generated
- [ ] No pipeline failures

### Control VM Verification ✅
- [ ] GitLab runner with tag 'control-vm' is registered
- [ ] kubectl can access Kubernetes cluster
- [ ] AutoFlow pods are running
- [ ] Services are accessible
- [ ] Security policies are applied
- [ ] Application responds correctly

### Manual Verification ✅
- [ ] Backend server responds from Control VM
- [ ] Frontend application loads from Control VM
- [ ] Security dashboard accessible
- [ ] Network policies applied
- [ ] Pod security policies enforced

## 🚨 6. Emergency Rollback

If something goes wrong:

```bash
# SSH to Control VM and rollback deployment
ssh user@Control
kubectl rollout undo deployment/backend-deployment
kubectl rollout undo deployment/frontend-deployment

# Revert GitLab CI
git checkout main
git revert HEAD
git push origin main

# Disable security tools temporarily
# Comment out security stage in .gitlab-ci.yml
```

## 📞 7. Support Commands

```bash
# Get system information
uname -a
docker --version
node --version
npm --version

# Check disk space
df -h

# Check memory usage
free -h

# Check network connectivity
ping gitlab.com
curl -I https://gitlab.com

# Check Control VM connectivity
ping control-vm-ip
ssh user@Control "kubectl cluster-info"
```

## 🔑 8. GitLab Runner Configuration for Control VM

Make sure your Control VM has a GitLab runner with the correct tag:

```bash
# On Control VM, register runner with tag
sudo gitlab-runner register \
  --url "https://gitlab.com/" \
  --registration-token "your-registration-token" \
  --description "Control VM Kubernetes Runner" \
  --tag-list "control-vm" \
  --executor "shell" \
  --shell "bash"
```

---

**Remember**: 
- Always test on a branch first before merging to main!
- The deploy stage runs on the Control VM, not your local machine
- Make sure the Control VM runner has the 'control-vm' tag 