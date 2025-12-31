# Multi-Agent Deployment Guide

## Quick Start (One Command)

Once you've added your API keys, run:

```bash
./deploy-agents.sh
```

This will:
1. ✅ Verify environment configuration
2. 📚 Seed knowledge base with lithium market data
3. 🔄 Update existing Sterling-EN agent
4. 🌍 Create 22 new agents (11 languages × 2 roles)
5. 🔍 Verify all agents in database
6. 🧪 Test language detection
7. 🔀 Test agent routing

---

## Prerequisites

### 1. Add API Keys to `.env`

You need three API keys:

#### **ElevenLabs API Key**
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Create a new API key (or copy existing)
3. Update `.env`:
   ```bash
   VITE_ELEVENLABS_API_KEY="sk_your_actual_api_key_here"
   ```

#### **Airtable API Key** (for knowledge base)
1. Go to https://airtable.com/create/tokens
2. Create a personal access token with:
   - Scope: `data.records:read`
   - Access: Your lithium marketplace base
3. Update `.env`:
   ```bash
   VITE_AIRTABLE_API_KEY="patXXXXXXXXXXXXXXX"
   VITE_AIRTABLE_BASE_ID="appXXXXXXXXXXXXXXX"
   ```

### 2. Run Database Migration

```bash
cd /home/user/institutional-canvas
npx supabase db push
```

This creates all necessary tables:
- `elevenlabs_agent_configs`
- `telebuy_agent_sessions`
- `telebuy_agent_messages`
- `lithium_knowledge_base`

---

## What Gets Created

### **24 Agents Total**

| Language | Buyer Agent | Supplier Agent |
|----------|-------------|----------------|
| 🇺🇸 English (EN) | Sterling-EN | Maxwell-EN |
| 🇨🇳 Chinese Simplified (ZH) | Sterling-ZH | Maxwell-ZH |
| 🇹🇼 Chinese Traditional (ZH-TW) | Sterling-ZH-TW | Maxwell-ZH-TW |
| 🇯🇵 Japanese (JA) | Sterling-JA | Maxwell-JA |
| 🇫🇷 French (FR) | Sterling-FR | Maxwell-FR |
| 🇩🇪 German (DE) | Sterling-DE | Maxwell-DE |
| 🇷🇺 Russian (RU) | Sterling-RU | Maxwell-RU |
| 🇪🇸 Spanish (ES) | Sterling-ES | Maxwell-ES |
| 🇧🇷 Portuguese (PT) | Sterling-PT | Maxwell-PT |
| 🇰🇷 Korean (KO) | Sterling-KO | Maxwell-KO |
| 🇮🇹 Italian (IT) | Sterling-IT | Maxwell-IT |
| 🇿🇦 Afrikaans (AF) | Sterling-AF | Maxwell-AF |

### **Each Agent Gets:**
- ✅ Language-specific prompt (localized)
- ✅ Default voice ID (update manually if needed)
- ✅ Knowledge base integration (Airtable + PostgreSQL)
- ✅ Optimal voice settings (stability: 0.75, similarity: 0.85)
- ✅ First message in native language
- ✅ Database record with ElevenLabs agent ID

---

## Expected Output

```
🚀 LithiumBuy Multi-Agent Deployment

This will create 24 agents (12 languages × 2 roles)

📚 Step 1: Seeding knowledge base...
✅ Knowledge base seeded

🔄 Step 2: Updating existing Sterling-EN agent...
✅ Sterling-EN updated

🌍 Step 3: Creating agents for all languages...
Creating buyer agent for ZH...
Voice ID: XB0fDUnXU5powFXDhCwa
✅ Created: Sterling (ZH) (agent_abc123...)
💾 Saved Sterling - Buyer Agent (ZH) to database

Creating supplier agent for ZH...
Voice ID: onwK4e9ZLuTAKqWW03F9
✅ Created: Maxwell (ZH) (agent_def456...)
💾 Saved Maxwell - Supplier Agent (ZH) to database

... (repeats for all 24 agents)

📊 Creation Summary:
Total agents: 24
Successful: 24
Failed: 0

🔍 Step 4: Verifying agents in database...

✅ Found 24 agents in database:

AF:
  ✅ Sterling - Buyer Agent (AF)          agent_xxx...
  ✅ Maxwell - Supplier Agent (AF)        agent_yyy...

DE:
  ✅ Sterling - Buyer Agent (DE)          agent_zzz...
  ✅ Maxwell - Supplier Agent (DE)        agent_aaa...

... (all 12 languages)

🧪 Step 5: Testing language detection...

Language Detection Result:
  Detected: en
  Method: browser
  Confidence: 90%

🔀 Step 6: Testing agent routing...

EN:
  ✅ Buyer:    agent_5901kdnkfx6heq1rq2whpves1mn7
  ✅ Supplier: agent_xxx...

ES:
  ✅ Buyer:    agent_yyy...
  ✅ Supplier: agent_zzz...

ZH:
  ✅ Buyer:    agent_aaa...
  ✅ Supplier: agent_bbb...

RU:
  ✅ Buyer:    agent_ccc...
  ✅ Supplier: agent_ddd...

======================================================================
🎉 SUCCESS! Multi-agent system is fully deployed!
======================================================================

Next Steps:
1. Visit http://localhost:5173/telebuy
2. Widget will auto-detect your language
3. Select a language from dropdown
4. Click "Start Sterling" or "Start Maxwell"
5. Agent will speak in your selected language ✨

Supported Languages:
  - English (en)
  - 中文 (Simplified) (zh)
  - 中文 (Traditional) (zh-TW)
  - 日本語 (ja)
  - Français (fr)
  - Deutsch (de)
  - Русский (ru)
  - Español (es)
  - Português (pt)
  - 한국어 (ko)
  - Italiano (it)
  - Afrikaans (af)
```

---

## Updating Voice IDs (Optional)

The script uses **default voices** for all languages. To update with better voices:

1. **Go to ElevenLabs Voice Library:**
   https://elevenlabs.io/voice-library

2. **Find voices for each language:**
   - Filter by language
   - Test with sample text
   - Copy voice ID (22-character code)

3. **Update the configuration:**
   Edit `src/scripts/create-multi-language-agents.ts`:
   ```typescript
   const LANGUAGE_VOICES: Record<AgentLanguage, { buyer: string; supplier: string }> = {
     zh: {
       buyer: 'YOUR_NEW_VOICE_ID_HERE',
       supplier: 'YOUR_NEW_VOICE_ID_HERE',
     },
     // ... update others
   };
   ```

4. **Re-run deployment:**
   ```bash
   ./deploy-agents.sh
   ```

See `VOICE_SETUP_GUIDE.md` for detailed voice selection tips.

---

## Troubleshooting

### Error: "VITE_ELEVENLABS_API_KEY not configured"
- Make sure you updated `.env` with your actual API key
- API key format: `sk_` followed by ~40 characters

### Error: "Failed to create agent"
- Check ElevenLabs API quota (you need 24 agent creations)
- Verify API key has agent creation permissions
- Check rate limiting (script waits 2s between creations)

### Error: Database connection failed
- Run database migration: `npx supabase db push`
- Check Supabase credentials in `.env`

### Agent created but not showing in database
- Check database connection
- Verify `elevenlabs_agent_configs` table exists
- Check RLS policies allow inserts

---

## Architecture Reference

See these files for complete system documentation:
- `AGENT_ARCHITECTURE.md` - Complete system design with Mermaid diagrams
- `VOICE_SETUP_GUIDE.md` - Voice selection guide
- `MULTI_LANGUAGE_AGENTS.md` - Language detection and routing

---

## Manual Testing

After deployment, test the system:

### 1. Test Language Detection
```typescript
import { detectUserLanguage } from '@/services/language-detection.service';

const result = await detectUserLanguage();
console.log('Detected:', result.language);
console.log('Method:', result.method);
console.log('Confidence:', result.confidence);
```

### 2. Test Agent Routing
```typescript
import { getAgentConfig } from '@/services/elevenlabs-multi-agent.service';

const { data: agent } = await getAgentConfig('buyer', 'es');
console.log('Spanish buyer agent:', agent?.elevenlabs_agent_id);
```

### 3. Test in UI
1. Visit http://localhost:5173/telebuy
2. Open browser console
3. Check detected language
4. Select different languages from dropdown
5. Start agent conversation
6. Verify agent speaks in selected language

---

## Cost Estimate

**Agent Creation:** FREE (no charge)
**Voice Usage:** ~$0.30 per 1,000 characters during conversations

Your 24 agents have zero creation cost. You only pay for actual conversation usage.

---

## Next Steps After Deployment

1. ✅ Verify all 24 agents created successfully
2. ✅ Test language detection in browser
3. ✅ Test agent routing for multiple languages
4. 🔄 Update voice IDs with better voices (optional)
5. 🔄 Implement Workflows (conversation flows)
6. 🔄 Implement Tools (custom functions)
7. 🔄 Add more knowledge base content
8. 🔄 Set up analytics and monitoring

---

## Support

For issues or questions:
1. Check `AGENT_ARCHITECTURE.md` for system design
2. Review ElevenLabs documentation: https://elevenlabs.io/docs
3. Check database schema in migration file

---

**Ready to deploy? Add your API keys and run:**
```bash
./deploy-agents.sh
```
