#!/bin/bash

echo "🧪 Testing Grammar Parser Implementation"
echo "========================================"

# Test parsing
echo "1️⃣ Testing grammar parsing..."
echo "Parsing: support.customer.issue.high.p2.web@cloudflare.com"
bun tgk/bin/tgk.js grammar parse "support.customer.issue.high.p2.web@cloudflare.com"

echo ""
echo "Parsing: ops.internal.incident.critical.p0.abc123@cloudflare.com"
bun tgk/bin/tgk.js grammar parse "ops.internal.incident.critical.p0.abc123@cloudflare.com"

# Test generation
echo ""
echo "2️⃣ Testing grammar generation..."
echo "Generating: --domain support --scope customer --type issue --hierarchy high --meta p1"
bun tgk/bin/tgk.js grammar generate --domain support --scope customer --type issue --hierarchy high --meta p1

# Test validation
echo ""
echo "3️⃣ Testing grammar validation..."
echo "Validating: --domain ops --scope internal --type incident --hierarchy critical --meta p0"
bun tgk/bin/tgk.js grammar validate --domain ops --scope internal --type incident --hierarchy critical --meta p0

# Test invalid validation
echo ""
echo "4️⃣ Testing invalid grammar validation..."
echo "Validating: --domain invalid --scope wrong --type bad"
bun tgk/bin/tgk.js grammar validate --domain invalid --scope wrong --type bad

# Test rules display
echo ""
echo "5️⃣ Testing rules display..."
bun tgk/bin/tgk.js grammar rules

echo ""
echo "✅ Grammar parser tests completed!"
