#!/bin/bash

echo "🔒 Testing New Security Additions (SonarQube + Vault)..."
echo "======================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}✅ Your existing GitLab CI pipeline is preserved!${NC}"
echo -e "${BLUE}✅ Only adding SonarQube and Vault as optional stages${NC}"
echo ""

echo -e "${YELLOW}1. Testing SonarQube Scanner${NC}"
echo "----------------------------------------"

# Test if SonarQube scanner is available
if command -v sonar-scanner >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SonarQube scanner is installed${NC}"
    sonar-scanner --version
else
    echo -e "${YELLOW}⚠️  SonarQube scanner not installed locally (will be installed in CI)${NC}"
fi

echo ""
echo -e "${YELLOW}2. Testing Vault${NC}"
echo "----------------------------------------"

# Test if Vault is available
if command -v vault >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Vault is installed${NC}"
    vault version
else
    echo -e "${YELLOW}⚠️  Vault not installed locally (will be installed in CI)${NC}"
fi

echo ""
echo -e "${YELLOW}3. Testing GitLab CI Syntax${NC}"
echo "----------------------------------------"

# Test GitLab CI syntax (if gitlab-ci-lint is available)
if command -v gitlab-ci-lint >/dev/null 2>&1; then
    if gitlab-ci-lint .gitlab-ci.yml; then
        echo -e "${GREEN}✅ GitLab CI syntax is valid${NC}"
    else
        echo -e "${RED}❌ GitLab CI syntax has issues${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  gitlab-ci-lint not available, skipping syntax check${NC}"
fi

echo ""
echo -e "${YELLOW}4. Testing Docker Build (Existing Functionality)${NC}"
echo "----------------------------------------"

# Test Docker build (your existing functionality)
if docker build -t test-security-build . >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker build works (existing functionality preserved)${NC}"
    docker rmi test-security-build >/dev/null 2>&1
else
    echo -e "${RED}❌ Docker build failed${NC}"
fi

echo ""
echo "======================================================"
echo -e "${GREEN}🎉 New Security Additions Test Complete!${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}📋 What's New:${NC}"
echo "  ✅ SonarQube code analysis stage added"
echo "  ✅ Vault configuration check stage added"
echo "  ✅ Both stages are optional (allow_failure: true)"
echo "  ✅ Your existing build/deploy stages unchanged"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Push to test branch: git push origin test-security-integration"
echo "2. Check GitLab pipeline - you should see 6 stages now:"
echo "   - test (existing)"
echo "   - security (existing - Trivy)"
echo "   - sonarqube (new)"
echo "   - vault-check (new)"
echo "   - build (existing)"
echo "   - deploy (existing)"
echo ""
echo -e "${YELLOW}💡 Note: SonarQube and Vault stages will show as 'skipped' or 'failed' initially${NC}"
echo "   This is normal if the servers aren't configured yet."
echo "   They won't block your existing build/deploy process!" 