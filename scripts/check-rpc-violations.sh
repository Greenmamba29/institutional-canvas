#!/bin/bash
# ==============================================
# RPC-Only Write Enforcement Check
# ==============================================
# This script fails if direct Supabase mutations are found
# outside of approved service files.
#
# ALLOWED: src/services/*.service.ts
# FORBIDDEN: src/components/*, src/pages/*, src/hooks/*
# ==============================================

set -e

echo "🔍 Checking for RPC violations..."

# Search for direct mutations in forbidden directories
VIOLATIONS=$(grep -rn "\.insert\(\\|\.update\(\\|\.delete\(\\|\.upsert\(" \
  --include="*.tsx" --include="*.ts" \
  src/components src/pages src/hooks 2>/dev/null || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ RPC VIOLATION DETECTED!"
  echo ""
  echo "Direct database mutations found in protected directories:"
  echo "$VIOLATIONS"
  echo ""
  echo "All writes MUST go through RPC functions in src/services/*.service.ts"
  echo "Use callRpc() from @/lib/supabase/rpc.ts"
  exit 1
fi

echo "✅ No RPC violations found!"
exit 0
