#!/bin/bash

# LithiumBuy Multi-Agent Deployment Script
# This script creates all 24 agents (12 languages × 2 roles) and tests routing

echo "🚀 LithiumBuy Multi-Agent Deployment"
echo "===================================="
echo ""

# Check if API keys are configured
if grep -q "your_elevenlabs_api_key_here" .env; then
    echo "❌ ERROR: ElevenLabs API key not configured"
    echo ""
    echo "Please update your .env file with your actual API keys:"
    echo "1. Get your ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys"
    echo "2. Get your Airtable API key from: https://airtable.com/create/tokens"
    echo "3. Update the following in .env:"
    echo "   - VITE_ELEVENLABS_API_KEY"
    echo "   - VITE_AIRTABLE_API_KEY"
    echo "   - VITE_AIRTABLE_BASE_ID"
    echo ""
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Run database migration first
echo "📊 Step 1: Running database migration..."
echo ""

# Check if migration has been run
MIGRATION_EXISTS=$(npx supabase db diff --use-migra 2>&1 | grep -c "elevenlabs_agent_configs" || true)

if [ "$MIGRATION_EXISTS" -eq 0 ]; then
    echo "⚠️  Migration may not have been applied yet"
    echo "Run: npx supabase db push"
    echo ""
fi

# Run the deployment script
echo "🌍 Step 2: Creating all 24 agents..."
echo ""
npx tsx src/scripts/deploy-agents.ts

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Review the agent list above"
echo "2. Visit http://localhost:5173/telebuy to test"
echo "3. Update voice IDs in src/scripts/create-multi-language-agents.ts if needed"
echo ""
