# Setting Up Multi-Language Agents: What You Need to Do

## 🎯 Quick Answer

**The ElevenLabs API can:**
- ✅ Create agents automatically
- ✅ Assign voices to agents
- ✅ Update prompts and configurations

**You need to:**
- ❌ **Find and provide voice IDs** for each language (cannot be done via API)
- ❌ **Choose which voices sound best** for your brand
- ❌ **Test voices** to ensure native-speaker quality

---

## 🌍 Lithium Market Languages - Complete List

Based on global lithium supply chain:

| Language | Code | Region | Why Important |
|----------|------|---------|---------------|
| **Chinese (Simplified)** | `zh` | China | World's largest lithium processor (60%+ market share) |
| **Chinese (Traditional)** | `zh-TW` | Taiwan | Advanced battery manufacturing |
| **Japanese** | `ja` | Japan | Major battery manufacturer (Panasonic, TDK) |
| **French** | `fr` | France, Quebec, Africa | Lithium mining in Quebec, African mines |
| **German** | `de` | Germany, Austria | Major EV market (BMW, Mercedes, VW) |
| **Russian** | `ru` | Russia, Kazakhstan | Emerging lithium producer, battery market |
| **English** | `en` | USA, Australia, UK | Global business language, major markets |
| **Spanish** | `es` | Chile, Argentina | Lithium Triangle (50%+ global reserves) |
| **Portuguese** | `pt` | Brazil | Major lithium reserves |
| **Korean** | `ko` | South Korea | Major battery manufacturers (LG, Samsung) |
| **Italian** | `it` | Italy | EV market |
| **Afrikaans** | `af` | South Africa | Lithium mining operations |

**Total: 12 languages** (was 9, now 12)

---

## 🎙️ Voice Selection: What You Must Do

### **Step 1: Go to ElevenLabs Voice Library**

Visit: https://elevenlabs.io/voice-library

### **Step 2: Filter by Language**

For each language, you need to find 2 voices:
- **1 Buyer Agent Voice** (Sterling) - Professional, confident, advisory tone
- **1 Supplier Agent Voice** (Maxwell) - Consultative, value-focused tone

### **Step 3: Test Voices**

ElevenLabs lets you preview voices. Test with sample text:

**Buyer Agent (Sterling) - Test Script:**
```
Hello, I'm Sterling, your executive concierge for lithium procurement.
I can help you find the right suppliers, negotiate pricing, and ensure
compliance with international standards. What brings you to LithiumBuy today?
```

**Supplier Agent (Maxwell) - Test Script:**
```
Hello, I'm Maxwell, your partner in showcasing your lithium products.
I can help you position your offerings, optimize pricing strategies,
and connect with qualified buyers. How can I assist you today?
```

### **Step 4: Copy Voice IDs**

When you find a voice you like:
1. Click "Use"
2. Look for the voice ID in the URL or API tab
3. Format: `pqHfZKP75CvOlQylNhV4` (22-character ID)
4. Copy to your configuration file

---

## 📝 Voice ID Configuration File

Update this file: `src/scripts/create-multi-language-agents.ts`

Find the `LANGUAGE_VOICES` mapping and add your voice IDs:

```typescript
const LANGUAGE_VOICES: Record<AgentLanguage, { buyer: string; supplier: string }> = {
  en: {
    buyer: 'pqHfZKP75CvOlQylNhV4', // YOUR existing Sterling voice ✓
    supplier: 'EXAVITQu4vr4xnSDxMaL', // Professional male
  },

  // CHINESE (SIMPLIFIED) - China market
  zh: {
    buyer: 'PASTE_VOICE_ID_HERE', // Find native Mandarin male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Mandarin voice
  },

  // CHINESE (TRADITIONAL) - Taiwan market
  'zh-TW': {
    buyer: 'PASTE_VOICE_ID_HERE', // Traditional Chinese male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Traditional Chinese
  },

  // JAPANESE - Japan battery manufacturers
  ja: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Japanese male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Japanese voice
  },

  // FRENCH - Quebec, France, Africa
  fr: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native French male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional French voice
  },

  // GERMAN - Germany, Austria EV market
  de: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native German male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional German voice
  },

  // RUSSIAN - Russia, Kazakhstan
  ru: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Russian male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Russian voice
  },

  // SPANISH - Chile, Argentina (Lithium Triangle)
  es: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Spanish male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Spanish voice
  },

  // PORTUGUESE - Brazil
  pt: {
    buyer: 'PASTE_VOICE_ID_HERE', // Brazilian Portuguese male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Portuguese voice
  },

  // KOREAN - LG, Samsung battery manufacturers
  ko: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Korean male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Korean voice
  },

  // ITALIAN - Italy EV market
  it: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Italian male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Italian voice
  },

  // AFRIKAANS - South Africa lithium mining
  af: {
    buyer: 'PASTE_VOICE_ID_HERE', // Native Afrikaans male voice
    supplier: 'PASTE_VOICE_ID_HERE', // Professional Afrikaans voice
  },
};
```

---

## 🤖 What the API Will Do Automatically

Once you provide the voice IDs, the script will **automatically**:

### **1. Create 24 Agents in ElevenLabs**
```
12 languages × 2 roles (buyer + supplier) = 24 agents
```

### **2. Configure Each Agent With:**
- ✅ Language-specific prompt (localized)
- ✅ Your chosen voice ID
- ✅ Enhanced knowledge base prompts
- ✅ Optimal voice settings (stability, similarity)
- ✅ First message in native language

### **3. Save to Database:**
```sql
INSERT INTO elevenlabs_agent_configs (
  agent_name,
  agent_role,
  primary_language,
  elevenlabs_agent_id,
  voice_id,
  prompt_template
);
```

### **4. Link Knowledge Base:**
- Attach FAQs for each language
- Include pricing data
- Add compliance requirements

---

## 🚀 Running the Setup

### **Step 1: Update Voice IDs** (You do this manually)

Edit: `src/scripts/create-multi-language-agents.ts`

Replace all `PASTE_VOICE_ID_HERE` with actual IDs from ElevenLabs.

### **Step 2: Run the Script** (API does this automatically)

```typescript
import { createAllLanguageAgents } from '@/scripts/create-multi-language-agents';

// Create all 24 agents (12 languages × 2 roles)
await createAllLanguageAgents({
  languages: [
    'en', 'zh', 'zh-TW', 'ja', 'fr', 'de',
    'ru', 'es', 'pt', 'ko', 'it', 'af'
  ],
  roles: ['buyer', 'supplier'],
});
```

**What happens:**
```
Creating buyer agent for ZH...
  ✅ Created: Sterling (ZH) (agent_abc123...)
  💾 Saved Sterling - Buyer Agent (ZH) to database

Creating supplier agent for ZH...
  ✅ Created: Maxwell (ZH) (agent_def456...)
  💾 Saved Maxwell - Supplier Agent (ZH) to database

... (repeats for all 24 agents)

📊 Creation Summary:
Total agents: 24
Successful: 24
Failed: 0
```

### **Step 3: Verify in Database**

```sql
SELECT
  agent_name,
  agent_role,
  primary_language,
  elevenlabs_agent_id
FROM elevenlabs_agent_configs
ORDER BY primary_language, agent_role;
```

Expected output:
```
Sterling - Buyer Agent (AF)      | buyer    | af    | agent_xxx...
Maxwell - Supplier Agent (AF)    | supplier | af    | agent_yyy...
Sterling - Buyer Agent (DE)      | buyer    | de    | agent_zzz...
...
(24 rows total)
```

---

## 🎨 Voice Selection Tips

### **For Buyer Agents (Sterling):**
Look for voices with these characteristics:
- 🎯 **Professional but warm**
- 🎯 **Mid-range pitch** (not too high or low)
- 🎯 **Clear enunciation**
- 🎯 **Confident tone**
- 🎯 **Native speaker quality**

### **For Supplier Agents (Maxwell):**
Look for voices with these characteristics:
- 🎯 **Consultative and friendly**
- 🎯 **Slightly warmer** than buyer agent
- 🎯 **Value-focused tone**
- 🎯 **Professional expertise**
- 🎯 **Native speaker quality**

### **Testing Checklist:**
- [ ] Sounds like a native speaker
- [ ] Pronounces technical terms correctly (lithium, carbonate, hydroxide)
- [ ] Good for extended conversations (not tiring to listen to)
- [ ] Matches your brand voice
- [ ] Clear at different speaking speeds

---

## 🔍 Finding Voices for Specific Languages

### **Chinese (Simplified) - China**
- Search: "Mandarin Male" or "Chinese Male"
- Test pronunciation of: "碳酸锂" (lithium carbonate)

### **Chinese (Traditional) - Taiwan**
- Search: "Taiwanese Mandarin" or "Traditional Chinese"
- Test pronunciation of: "碳酸鋰" (traditional characters)

### **Japanese**
- Search: "Japanese Male"
- Test pronunciation of: "炭酸リチウム" (lithium carbonate)

### **French**
- Search: "French Male" (specify Canadian French if targeting Quebec)
- Test pronunciation of: "carbonate de lithium"

### **German**
- Search: "German Male"
- Test pronunciation of: "Lithiumcarbonat"

### **Russian**
- Search: "Russian Male"
- Test pronunciation of: "карбонат лития" (lithium carbonate)

### **Afrikaans**
- Search: "Afrikaans Male"
- Test pronunciation of: "litiumkarbonaat"

---

## ⚠️ Important Notes

### **Voice Availability:**
- Not all languages may have voices in ElevenLabs
- If a language isn't available, you can:
  1. **Clone a voice** (requires voice samples)
  2. **Use English** as fallback for that market
  3. **Contact ElevenLabs** to request language support

### **Fallback Strategy:**
If a voice isn't available for a language:

```typescript
// In create-multi-language-agents.ts
zh: {
  buyer: 'FALLBACK_TO_ENGLISH_VOICE_IF_NEEDED',
  supplier: 'FALLBACK_TO_ENGLISH_VOICE_IF_NEEDED',
},
```

### **Voice Cloning (Advanced):**
For languages without good voices:
1. Record 5-10 minutes of native speaker audio
2. Upload to ElevenLabs voice cloning
3. Use cloned voice ID in configuration

---

## 📊 Cost Estimate

**ElevenLabs Pricing:**
- Creating agents: **FREE** (no charge for agent creation)
- Voice usage: **Charged per character** during conversations
- Estimated cost: ~$0.30 per 1,000 characters

**Your setup: 24 agents**
- Creation cost: **$0**
- Usage cost: **Pay per conversation**

---

## ✅ Setup Checklist

- [ ] **1. Go to ElevenLabs voice library**
- [ ] **2. Find 2 voices per language** (24 voices total)
- [ ] **3. Test voices** with sample scripts
- [ ] **4. Copy voice IDs** to `LANGUAGE_VOICES` mapping
- [ ] **5. Run database migration** (if not done yet)
- [ ] **6. Run `createAllLanguageAgents()`** script
- [ ] **7. Verify agents** in database
- [ ] **8. Test language detection** in UI
- [ ] **9. Test agent routing** for each language

---

## 🎯 Summary

**What I can do automatically (via API):**
- ✅ Create 24 agents
- ✅ Configure prompts, settings
- ✅ Save to database
- ✅ Link knowledge base

**What YOU must do manually:**
- ❌ Find voice IDs (22-character codes)
- ❌ Test voice quality
- ❌ Update configuration file
- ❌ Run the setup script

**Total time:** ~2-3 hours to find and test 24 voices

All the infrastructure is ready - you just need to provide the voice IDs! 🎙️
