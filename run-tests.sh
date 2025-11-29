#!/bin/bash

echo "🧪 Running Comprehensive Test Suite"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

echo "🔍 Running Unit Tests..."
echo "------------------------"
npm test -- tests/unit/ --verbose
UNIT_EXIT=$?
echo ""

echo "🔗 Running Integration Tests..."
echo "--------------------------------"
npm test -- tests/integration/ --verbose
INTEGRATION_EXIT=$?
echo ""

echo "📊 Generating Coverage Report..."
echo "---------------------------------"
npm test -- --coverage --coverageReporters=text --coverageReporters=html
COVERAGE_EXIT=$?
echo ""

# Summary
echo "===================================="
echo "📋 Test Summary"
echo "===================================="

if [ $UNIT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ $INTEGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
fi

if [ $COVERAGE_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Coverage Report: Generated${NC}"
    echo "   View at: coverage/index.html"
else
    echo -e "${RED}❌ Coverage Report: FAILED${NC}"
fi

echo ""

# Overall result
if [ $UNIT_EXIT -eq 0 ] && [ $INTEGRATION_EXIT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
