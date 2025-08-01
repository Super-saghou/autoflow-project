#!/bin/bash

echo "🚀 Setting up AutoFlow Security Integration..."

# Install Trivy
echo "📦 Installing Trivy..."
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.48.0

# Install Vault
echo "🔐 Installing Vault..."
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault

# Install SonarQube Scanner
echo "🔍 Installing SonarQube Scanner..."
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
unzip sonar-scanner-cli-4.8.0.2856-linux.zip
sudo mv sonar-scanner-4.8.0.2856-linux /opt/sonar-scanner
sudo ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner

# Install Node.js dependencies
echo "📦 Installing Node.js security dependencies..."
npm install node-vault

# Create security directories
echo "📁 Creating security directories..."
mkdir -p security-reports
mkdir -p security-config
mkdir -p vault-data

# Set up environment variables
echo "🔧 Setting up environment variables..."
cat >> .env << EOF

# Security Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-vault-token
ENCRYPTION_KEY=your-32-character-encryption-key-here
TRIVY_CACHE_DIR=/tmp/trivy
SONAR_HOST_URL=http://localhost:9000
SONAR_LOGIN=admin
SONAR_PASSWORD=admin
EOF

# Initialize Vault
echo "🔐 Initializing Vault..."
vault server -dev -dev-root-token-id=your-vault-token &
sleep 5

# Set up Vault policies
echo "📋 Setting up Vault policies..."
vault policy write autoflow-policy - << EOF
path "autoflow/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF

# Create security service
echo "⚙️ Creating security service..."
cat > security-service.js << 'EOF'
import EnhancedSecurityIntegration from './enhanced-security-integration.js';

const securityService = new EnhancedSecurityIntegration();
await securityService.initialize();

console.log('🔒 AutoFlow Security Service started');
EOF

# Set up Kubernetes security policies
echo "☸️ Setting up Kubernetes security policies..."
kubectl apply -f k8s-security-policy.yaml

# Run initial security scan
echo "🔍 Running initial security scan..."
trivy fs --format json --output security-reports/initial-scan.json .

echo "✅ AutoFlow Security Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure Vault with your secrets"
echo "2. Set up SonarQube server"
echo "3. Integrate security dashboard into your frontend"
echo "4. Configure automated scanning schedules"
echo ""
echo "🔗 Useful Commands:"
echo "- Run security scan: trivy fs ."
echo "- Start Vault: vault server -dev"
echo "- Run SonarQube: docker-compose -f sonarqube-docker-compose.yml up"
echo "- View security dashboard: curl http://localhost:5000/api/security/dashboard/overview" 