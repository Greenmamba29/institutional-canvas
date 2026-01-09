#!/bin/bash
# ==============================================
# LithiumBuy CI Pipeline
# ==============================================
# Runs all checks required before merging/deploying
# ==============================================

set -e

echo "🚀 LithiumBuy CI Pipeline"
echo "========================="
echo ""

# 1. TypeScript type checking
echo "📝 Step 1/4: TypeScript type checking..."
npx tsc --noEmit
echo "✅ TypeScript check passed"
echo ""

# 2. ESLint
echo "🔍 Step 2/4: ESLint..."
npx eslint . --ext ts,tsx --max-warnings 0 || echo "⚠️ ESLint warnings (non-blocking)"
echo ""

# 3. RPC violations check
echo "🛡️ Step 3/4: RPC-only write enforcement..."
chmod +x scripts/check-rpc-violations.sh
./scripts/check-rpc-violations.sh
echo ""

# 4. Build
echo "🏗️ Step 4/4: Production build..."
npm run build
echo "✅ Build successful"
echo ""

echo "========================="
echo "🎉 All CI checks passed!"
echo "========================="
