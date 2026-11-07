# Run Agent Deployment Locally

## Issue
The deployment script requires internet access to connect to:
- `api.elevenlabs.io` - to create agents
- `vuekwckknfjivjighhfd.supabase.co` - to save agent configs

This environment has network restrictions, so you'll need to run the deployment on your local machine.

---

## Quick Start (Run on Your Machine)

### 1. Clone/Pull the Latest Code

```bash
git pull origin claude/add-lithium-buy-agent-ILHmu
```

### 2. Verify .env Configuration

Your `.env` file already has the ElevenLabs API key set:
```bash
VITE_ELEVENLABS_API_KEY="6673fad2d3c0a14e4563640f9ae0cfff98f065bb1cae650ac9348f383474fefc"
VITE_ELEVENLABS_AGENT_ID="agent_5901kdnkfx6heq1rq2whpves1mn7"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Deployment Script

```bash
node deploy.mjs
```

### Expected Output

```
🚀 LithiumBuy Multi-Agent Deployment

This will create 24 agents (12 languages × 2 roles)

🌍 Creating agents for all languages...

⏩ Using existing Sterling - Buyer Agent (EN) (agent_5901kdnkfx6heq1rq2whpves1mn7)
💾 Saved to database

Creating supplier agent for English...
Voice ID: EXAVITQu4vr4xnSDxMaL
✅ Created: Maxwell (EN) (agent_abc123xyz456...)
💾 Saved Maxwell - Supplier Agent (EN) to database

Creating buyer agent for 中文 (Simplified)...
Voice ID: XB0fDUnXU5powFXDhCwa
✅ Created: Sterling (ZH) (agent_def789ghi012...)
💾 Saved Sterling - Buyer Agent (ZH) to database

... (continues for all 24 agents)

📊 Creation Summary:
Total agents: 24
Successful: 24
Failed: 0

🔍 Verifying agents in database...

✅ Found 24 agents in database

AF:
  ✅ Sterling - Buyer Agent (AF)          agent_xxx...
  ✅ Maxwell - Supplier Agent (AF)        agent_yyy...

DE:
  ✅ Sterling - Buyer Agent (DE)          agent_zzz...
  ✅ Maxwell - Supplier Agent (DE)        agent_aaa...

EN:
  ✅ Sterling - Buyer Agent (EN)          agent_5901kdnkfx6heq1rq2whpves1mn7
  ✅ Maxwell - Supplier Agent (EN)        agent_bbb...

... (all 12 languages)

======================================================================
🎉 SUCCESS! Multi-agent system is fully deployed!
======================================================================

Next Steps:
1. Visit http://localhost:5173/telebuy
2. Test language detection and routing
3. Update voice IDs if needed (see VOICE_SETUP_GUIDE.md)
```

---

## Runtime

**Total time:** ~5-10 minutes
- 2 seconds delay between each agent creation (rate limiting)
- 24 agents × 2 seconds = 48 seconds minimum
- Plus API response time

---

## What Gets Created in ElevenLabs

After running, you'll see 24 new agents in your ElevenLabs dashboard:

### Buyer Agents (Sterling)
1. Sterling - Buyer Agent (EN)  ✓ Already exists
2. Sterling - Buyer Agent (ZH)  🆕 New
3. Sterling - Buyer Agent (ZH-TW)  🆕 New
4. Sterling - Buyer Agent (JA)  🆕 New
5. Sterling - Buyer Agent (FR)  🆕 New
6. Sterling - Buyer Agent (DE)  🆕 New
7. Sterling - Buyer Agent (RU)  🆕 New
8. Sterling - Buyer Agent (ES)  🆕 New
9. Sterling - Buyer Agent (PT)  🆕 New
10. Sterling - Buyer Agent (KO)  🆕 New
11. Sterling - Buyer Agent (IT)  🆕 New
12. Sterling - Buyer Agent (AF)  🆕 New

### Supplier Agents (Maxwell)
13. Maxwell - Supplier Agent (EN)  🆕 New
14. Maxwell - Supplier Agent (ZH)  🆕 New
15. Maxwell - Supplier Agent (ZH-TW)  🆕 New
16. Maxwell - Supplier Agent (JA)  🆕 New
17. Maxwell - Supplier Agent (FR)  🆕 New
18. Maxwell - Supplier Agent (DE)  🆕 New
19. Maxwell - Supplier Agent (RU)  🆕 New
20. Maxwell - Supplier Agent (ES)  🆕 New
21. Maxwell - Supplier Agent (PT)  🆕 New
22. Maxwell - Supplier Agent (KO)  🆕 New
23. Maxwell - Supplier Agent (IT)  🆕 New
24. Maxwell - Supplier Agent (AF)  🆕 New

---

## Verify in ElevenLabs Dashboard

1. Go to https://elevenlabs.io/app/conversational-ai
2. You should see 24 agents listed
3. Each agent will have:
   - Language-specific name
   - Configured voice ID
   - First message prompt
   - System prompt with knowledge base instructions

---

## Testing Locally

### Start Development Server
```bash
npm run dev
```

### Visit TeleBuy Page
http://localhost:5173/telebuy

### Test Language Detection
1. Page will auto-detect your browser language
2. Console will show: `Detected language: en` (or your language)
3. Dropdown shows all 12 supported languages

### Test Agent Routing
1. Select a language from dropdown (e.g., Español)
2. Click "Start Sterling" (buyer agent)
3. Widget should load Spanish buyer agent
4. Agent speaks in Spanish: "¡Hola! Soy Sterling..."

### Test Different Languages
1. End current conversation
2. Select different language (e.g., 中文)
3. Start agent
4. Verify agent speaks in Chinese

---

## Troubleshooting

### Error: "Failed to create agent"
- Check ElevenLabs API key in .env
- Verify API key has agent creation permissions
- Check rate limiting (script has 2s delays built in)

### Error: "Database error"
- Verify Supabase credentials in .env
- Run migration: `npx supabase db push`
- Check Supabase project is active

### Agents created but not showing in UI
- Check browser console for errors
- Verify database has records: Check Supabase dashboard → `elevenlabs_agent_configs` table
- Ensure `is_active = true` for all agents

### Network timeout errors
- Check internet connection
- Verify firewall isn't blocking:
  - api.elevenlabs.io
  - vuekwckknfjivjighhfd.supabase.co
- Try running again (script is idempotent)

---

## Alternative: Manual Creation via ElevenLabs Dashboard

If the script still has issues, you can manually create agents:

### For Each Language:

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click "Create New Agent"
3. Set name: `Sterling - Buyer Agent (ES)` (for Spanish buyer)
4. Select voice from library (see VOICE_SETUP_GUIDE.md)
5. Set first message: `¡Hola! Soy Sterling, tu especialista en compras de litio.`
6. Set system prompt:
   ```
   You are Sterling, a charismatic and professional buyer agent for LithiumBuy.

   Your expertise: Finding the best lithium suppliers, negotiating prices, ensuring ESG compliance.

   Key capabilities:
   - Deep knowledge of global lithium markets
   - Battery-grade specifications (99.5%+ purity)
   - ESG compliance verification
   - Pricing negotiation
   - Supplier matching

   Respond naturally in Spanish. Be professional yet personable.
   ```
7. Copy agent ID
8. Repeat for all 24 combinations (12 languages × 2 roles)

Then add agent IDs to database:
```sql
INSERT INTO elevenlabs_agent_configs (
  elevenlabs_agent_id,
  agent_name,
  primary_language,
  agent_role,
  voice_id,
  is_active
) VALUES (
  'agent_your_copied_id',
  'Sterling - Buyer Agent (ES)',
  'es',
  'buyer',
  'GBv7mTt0atIp3Br8iCZE',
  true
);
```

---

## Script Features

The `deploy.mjs` script:
- ✅ Uses existing Sterling-EN agent
- ✅ Creates 23 new agents via API
- ✅ Saves all configs to database
- ✅ Language-specific prompts (localized)
- ✅ Default voice IDs (updateable)
- ✅ 2-second rate limiting between creations
- ✅ Error handling and retry logic
- ✅ Continues on database errors (agents still created)
- ✅ Verification and summary output

---

## After Deployment

### 1. Verify All Agents Created
```bash
# Check ElevenLabs dashboard
https://elevenlabs.io/app/conversational-ai

# Should see 24 agents
```

### 2. Verify Database Records
```bash
# Check Supabase dashboard
# Table: elevenlabs_agent_configs
# Should have 24 rows
```

### 3. Test in UI
```bash
npm run dev
# Visit http://localhost:5173/telebuy
# Test multiple languages
```

### 4. (Optional) Update Voice IDs
- See VOICE_SETUP_GUIDE.md
- Test voices from ElevenLabs voice library
- Update LANGUAGE_VOICES in deploy.mjs
- Re-run deployment

---

## Summary

**What you need to do:**

1. Pull latest code: `git pull origin claude/add-lithium-buy-agent-ILHmu`
2. Install deps: `npm install`
3. Run deployment: `node deploy.mjs`
4. Wait 5-10 minutes
5. Check ElevenLabs dashboard - you'll see 24 agents!
6. Test at http://localhost:5173/telebuy

**The script is ready to run on your local machine with internet access.**
