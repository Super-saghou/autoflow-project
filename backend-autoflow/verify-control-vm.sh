#!/bin/bash

echo "🖥️ Verifying Control VM Setup for AutoFlow..."
echo "=============================================="

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

echo -e "${YELLOW}1. Testing Control VM Connectivity${NC}"
echo "----------------------------------------"

# Test SSH connectivity to Control VM
echo -e "${BLUE}Testing SSH connection to Control VM...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes user@Control exit 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection to Control VM successful${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ SSH connection to Control VM failed${NC}"
    echo -e "${YELLOW}Please ensure:${NC}"
    echo "  - Control VM is running"
    echo "  - SSH key is configured"
    echo "  - Replace 'user@Control' with correct credentials"
    ((TESTS_FAILED++))
fi

echo -e "${YELLOW}2. Testing GitLab Runner on Control VM${NC}"
echo "----------------------------------------"

# Test GitLab runner status on Control VM
run_test "GitLab runner is running on Control VM" "ssh user@Control 'sudo gitlab-runner status'"

# Test GitLab runner has correct tag
run_test "GitLab runner has 'control-vm' tag" "ssh user@Control 'sudo gitlab-runner list | grep control-vm'"

echo -e "${YELLOW}3. Testing Kubernetes on Control VM${NC}"
echo "----------------------------------------"

# Test kubectl is available
run_test "kubectl is available on Control VM" "ssh user@Control 'kubectl version --client'"

# Test cluster connectivity
run_test "Kubernetes cluster is accessible" "ssh user@Control 'kubectl cluster-info'"

# Test nodes are available
run_test "Kubernetes nodes are ready" "ssh user@Control 'kubectl get nodes'"

echo -e "${YELLOW}4. Testing AutoFlow Namespace on Control VM${NC}"
echo "----------------------------------------"

# Test autoflow namespace exists
run_test "AutoFlow namespace exists" "ssh user@Control 'kubectl get namespace autoflow'"

# Test AutoFlow deployments
run_test "AutoFlow deployments exist" "ssh user@Control 'kubectl get deployments -n autoflow'"

# Test AutoFlow services
run_test "AutoFlow services exist" "ssh user@Control 'kubectl get services -n autoflow'"

echo -e "${YELLOW}5. Testing Security Policies on Control VM${NC}"
echo "----------------------------------------"

# Test security policies can be applied
run_test "Security policies can be applied" "ssh user@Control 'kubectl apply -f k8s-security-policy.yaml --dry-run=client'"

# Test network policies
run_test "Network policies are applied" "ssh user@Control 'kubectl get networkpolicy -n autoflow'"

echo -e "${YELLOW}6. Testing Application Access on Control VM${NC}"
echo "----------------------------------------"

# Test backend service
run_test "Backend service is accessible" "ssh user@Control 'curl -s http://localhost:5000/api/auth/status > /dev/null'"

# Test frontend service
run_test "Frontend service is accessible" "ssh user@Control 'curl -s http://localhost:3000 > /dev/null'"

# Test ingress
run_test "Ingress is accessible" "ssh user@Control 'curl -s http://192.168.111.201:31560 > /dev/null'"

echo ""
echo "=============================================="
echo -e "${GREEN}Control VM Verification Summary:${NC}"
echo "=============================================="
echo -e "${GREEN}Tests Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Tests Failed: ${TESTS_FAILED}${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Control VM is properly configured for AutoFlow deployment!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Manual Verification Steps:${NC}"
echo "1. SSH to Control VM: ssh user@Control"
echo "2. Check GitLab runner: sudo gitlab-runner status"
echo "3. Check Kubernetes: kubectl cluster-info"
echo "4. Check AutoFlow pods: kubectl get pods -n autoflow"
echo "5. Test application: curl http://192.168.111.201:31560"

echo ""
echo -e "${YELLOW}📋 GitLab Runner Setup on Control VM (if needed):${NC}"
echo "1. SSH to Control VM"
echo "2. Install GitLab runner:"
echo "   curl -L \"https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh\" | sudo bash"
echo "   sudo apt-get install gitlab-runner"
echo "3. Register runner with 'control-vm' tag:"
echo "   sudo gitlab-runner register --url \"https://gitlab.com/\" --registration-token \"YOUR_TOKEN\" --tag-list \"control-vm\" --executor \"shell\""

echo ""
echo -e "${GREEN}✅ Control VM verification completed!${NC}" 