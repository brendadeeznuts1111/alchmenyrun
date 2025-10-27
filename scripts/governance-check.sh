#!/usr/bin/env bash

# Governance Validation Script
# Runs comprehensive governance checks for RFC-004 compliance

set -euo pipefail

echo "🛡️ Running Governance Validation Checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  local status=$1
  local message=$2
  case $status in
    "PASS")
      echo -e "${GREEN}✅ ${message}${NC}"
      ;;
    "WARN")
      echo -e "${YELLOW}⚠️  ${message}${NC}"
      ;;
    "FAIL")
      echo -e "${RED}❌ ${message}${NC}"
      ;;
  esac
}

# Check 1: RFC-004 Document Structure
echo "📋 Checking RFC-004 document structure..."
if [ ! -f "docs/ALC-RFC-004-advanced-governance.md" ]; then
  print_status "FAIL" "RFC-004 document missing"
  exit 1
fi

if grep -q "## Status" docs/ALC-RFC-004-advanced-governance.md &&
   grep -q "## Technical Implementation" docs/ALC-RFC-004-advanced-governance.md; then
  print_status "PASS" "RFC-004 document structure is valid"
else
  print_status "FAIL" "RFC-004 missing required sections"
  exit 1
fi

# Check 2: Documentation Rules Compliance
echo "📚 Checking documentation rules compliance..."
if find . -name "*SUMMARY.md" -o -name "*_SUMMARY.md" | grep -v node_modules | grep -q .; then
  print_status "FAIL" "Found summary documents violating documentation rules:"
  find . -name "*SUMMARY.md" -o -name "*_SUMMARY.md" | grep -v node_modules
  exit 1
else
  print_status "PASS" "No summary documents found"
fi

# Check 3: TypeScript Compilation
echo "🔧 Checking TypeScript compilation..."
if bun run build >/dev/null 2>&1; then
  print_status "PASS" "TypeScript compilation successful"
else
  print_status "FAIL" "TypeScript compilation failed"
  exit 1
fi

# Check 4: Code Quality Checks
echo "🧹 Running code quality checks..."
if bun run check >/dev/null 2>&1; then
  print_status "PASS" "Code quality checks passed"
else
  print_status "WARN" "Some code quality issues found (non-blocking)"
fi

# Check 5: Governance References
echo "🔍 Checking for governance implementation references..."
if grep -q "governance" alchemy.run.ts; then
  print_status "PASS" "Governance references found in main application"
else
  print_status "WARN" "No governance references in main application (expected before Phase 1)"
fi

# Check 6: AI Service Configuration
echo "🤖 Checking AI service configuration..."
if [ -n "${AI_SERVICE_KEY:-}" ]; then
  print_status "PASS" "AI service key configured"
else
  print_status "WARN" "AI service key not configured (expected in CI with secrets)"
fi

echo ""
echo "🎯 Governance validation completed successfully!"
echo ""
echo "📋 Next Steps for RFC-004:"
echo "   1. Phase 1: Implement AI categorization MVP"
echo "   2. Phase 2: Add predictive capacity planning"
echo "   3. Phase 3: Enable cross-stream relationships"
echo "   4. Phase 4: Deploy advanced analytics dashboard"
echo ""
echo "🔗 RFC-004: docs/ALC-RFC-004-advanced-governance.md"
