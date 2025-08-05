# AutoFlow Kubernetes Deployment

This directory contains all the Kubernetes manifests needed to deploy the AutoFlow application on a Kubernetes cluster.

## Prerequisites

1. **Kubernetes Cluster**: A running Kubernetes cluster (minikube, kind, or cloud provider)
2. **kubectl**: Kubernetes command-line tool
3. **kustomize**: Kubernetes native configuration management tool
4. **Docker Images**: The following images should be available:
   - `sarra539/autoflow-backend:latest`
   - `sarra539/autoflow-frontend:latest`

## Quick Start

### 1. Deploy the Application

```bash
# Make scripts executable
chmod +x deploy.sh cleanup.sh

# Deploy the application
./deploy.sh
```

### 2. Check Deployment Status

```bash
# Check pods
kubectl get pods -n autoflow

# Check services
kubectl get services -n autoflow

# Check ingress
kubectl get ingress -n autoflow
```

### 3. Access the Application

The application will be available through:
- **Frontend**: http://<worker-node-ip>:<nodeport>
- **Backend API**: http://<worker-node-ip>:<nodeport>/api

## Manual Deployment

If you prefer to deploy manually:

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Apply secrets and config
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# Apply storage
kubectl apply -f storage.yaml

# Apply deployments
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Apply services
kubectl apply -f services.yaml

# Apply ingress
kubectl apply -f ingress.yaml

# Apply RBAC
kubectl apply -f rbac.yaml
```

## Using Kustomize

```bash
# Deploy using kustomize
kustomize build . | kubectl apply -f -

# Delete using kustomize
kustomize build . | kubectl delete -f -
```

## Configuration

### Environment Variables

The application uses the following environment variables (configured in `configmap.yaml`):

- `NODE_ENV`: Production environment
- `BACKUP_DIR`: Directory for backups
- `PYTHONPATH`: Python path
- `FLASK_API_URL`: Flask API URL
- `GENERATED_PLAYBOOKS_DIR`: Directory for generated playbooks
- `REACT_APP_API_URL`: Frontend API URL
- `REACT_APP_WS_URL`: WebSocket URL

### Secrets

The following secrets are required (configured in `secrets.yaml`):

- `mongo-secret`: MongoDB connection string
- `jwt-secret`: JWT authentication secret

### Storage

- `backup-pvc`: 10Gi persistent volume for backups
- `logs-pvc`: 5Gi persistent volume for logs

## Troubleshooting

### Check Pod Logs

```bash
# Backend logs
kubectl logs -f deployment/backend-deployment -n autoflow

# Frontend logs
kubectl logs -f deployment/frontend-deployment -n autoflow
```

### Check Pod Status

```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n autoflow

# Check pod events
kubectl get events -n autoflow --sort-by='.lastTimestamp'
```

### Common Issues

1. **Image Pull Errors**: Ensure Docker images are available and accessible
2. **Resource Limits**: Check if pods are hitting resource limits
3. **Storage Issues**: Verify PVCs are bound and accessible
4. **Network Issues**: Check service and ingress configuration

## Cleanup

To remove the entire deployment:

```bash
./cleanup.sh
```

Or manually:

```bash
kubectl delete namespace autoflow
```

## GitLab CI Integration

Update your `.gitlab-ci.yml` to use these manifests:

```yaml
deploy:
  stage: deploy
  tags:
    - production
  before_script:
    - echo "Running on production runner..."
    - kubectl version --client
  script:
    - echo "Deploying AutoFlow application..."
    - cd k8s
    - chmod +x deploy.sh
    - ./deploy.sh
  environment:
    name: production
    url: http://192.168.111.201:31560
  only:
    - main
```

## Security Considerations

1. **Secrets Management**: Use Kubernetes secrets or external secret management
2. **Network Policies**: Implement network policies for pod-to-pod communication
3. **RBAC**: Use the provided RBAC configuration for proper access control
4. **TLS**: Configure TLS for production deployments
5. **Resource Limits**: Monitor and adjust resource limits as needed 