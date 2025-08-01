#!/bin/bash

echo "🔒 Testing AutoFlow Security Tools..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: ${test_name}${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${YELLOW}1. Testing Trivy Installation and Functionality${NC}"
echo "----------------------------------------"

# Test Trivy installation
run_test "Trivy is installed" "command_exists trivy" "trivy command should be available"

# Test Trivy version
if command_exists trivy; then
    echo -e "${BLUE}Trivy version:${NC}"
    trivy --version
fi

# Test Trivy filesystem scan
run_test "Trivy filesystem scan" "trivy fs --format json --output /tmp/trivy-test.json ." "Trivy should scan filesystem"

# Test Trivy container scan (if Docker is available)
if command_exists docker; then
    run_test "Trivy container scan" "trivy image --format json --output /tmp/trivy-container-test.json alpine:latest" "Trivy should scan container image"
fi

echo -e "${YELLOW}2. Testing Vault Installation and Functionality${NC}"
echo "----------------------------------------"

# Test Vault installation
run_test "Vault is installed" "command_exists vault" "vault command should be available"

# Test Vault version
if command_exists vault; then
    echo -e "${BLUE}Vault version:${NC}"
    vault version
fi

# Test Vault server (if running)
run_test "Vault server is accessible" "curl -s http://localhost:8200/v1/sys/health > /dev/null" "Vault server should be running"

# Test Vault authentication
if curl -s http://localhost:8200/v1/sys/health > /dev/null; then
    run_test "Vault authentication" "vault login -method=token your-vault-token > /dev/null 2>&1" "Vault should authenticate with token"
fi

echo -e "${YELLOW}3. Testing SonarQube Scanner${NC}"
echo "----------------------------------------"

# Test SonarQube scanner installation
run_test "SonarQube scanner is installed" "command_exists sonar-scanner" "sonar-scanner command should be available"

# Test SonarQube scanner version
if command_exists sonar-scanner; then
    echo -e "${BLUE}SonarQube scanner version:${NC}"
    sonar-scanner --version
fi

# Test SonarQube server (if running)
run_test "SonarQube server is accessible" "curl -s http://localhost:9000/api/system/status > /dev/null" "SonarQube server should be running"

echo -e "${YELLOW}4. Testing Node.js Security Dependencies${NC}"
echo "----------------------------------------"

# Test if node-vault is installed
run_test "node-vault package is installed" "npm list node-vault > /dev/null 2>&1" "node-vault should be in package.json"

# Test Node.js security service
run_test "Security service can be imported" "node -e \"import('./enhanced-security-integration.js').then(() => console.log('Import successful')).catch(e => process.exit(1))\"" "Security service should be importable"

echo -e "${YELLOW}5. Testing Kubernetes Security Policies${NC}"
echo "----------------------------------------"

# Test if kubectl is available
run_test "kubectl is available" "command_exists kubectl" "kubectl should be available"

# Test Kubernetes security policies
if command_exists kubectl; then
    run_test "Kubernetes security policies can be applied" "kubectl apply -f k8s-security-policy.yaml --dry-run=client > /dev/null" "Security policies should be valid"
fi

echo -e "${YELLOW}6. Testing Security API Endpoints${NC}"
echo "----------------------------------------"

# Test if the backend server is running
run_test "Backend server is running" "curl -s http://localhost:5000/api/auth/status > /dev/null" "Backend server should be running"

# Test security dashboard endpoint (if server is running)
if curl -s http://localhost:5000/api/auth/status > /dev/null; then
    run_test "Security dashboard endpoint" "curl -s http://localhost:5000/api/security/dashboard/overview > /dev/null" "Security dashboard should be accessible"
fi

echo -e "${YELLOW}7. Testing Environment Variables${NC}"
echo "----------------------------------------"

# Test if .env file exists
run_test ".env file exists" "test -f .env" ".env file should exist"

# Test if security environment variables are set
if test -f .env; then
    run_test "VAULT_ADDR is set" "grep -q 'VAULT_ADDR' .env" "VAULT_ADDR should be in .env"
    run_test "ENCRYPTION_KEY is set" "grep -q 'ENCRYPTION_KEY' .env" "ENCRYPTION_KEY should be in .env"
fi

echo -e "${YELLOW}8. Testing Security Reports${NC}"
echo "----------------------------------------"

# Test if security reports directory exists
run_test "Security reports directory exists" "test -d security-reports" "security-reports directory should exist"

# Test if initial scan report exists
run_test "Initial Trivy scan report exists" "test -f security-reports/initial-scan.json" "Initial scan report should exist"

echo ""
echo "======================================"
echo -e "${GREEN}Security Testing Summary:${NC}"
echo "======================================"
echo -e "${GREEN}Tests Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Tests Failed: ${TESTS_FAILED}${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All security tests passed! Your AutoFlow security setup is working correctly.${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the failed tests above.${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Manual Security Verification Steps:${NC}"
echo "1. Run: trivy fs . (should show vulnerabilities if any)"
echo "2. Run: vault status (should show Vault server status)"
echo "3. Run: sonar-scanner -Dsonar.host.url=http://localhost:9000 (should start code analysis)"
echo "4. Check: http://localhost:9000 (SonarQube dashboard)"
echo "5. Check: http://localhost:5000/api/security/dashboard/overview (Security dashboard)"

# Clean up test files
rm -f /tmp/trivy-test.json /tmp/trivy-container-test.json

echo ""
echo -e "${GREEN}✅ Security testing completed!${NC}" 