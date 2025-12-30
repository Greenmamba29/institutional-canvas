## Multi-Language Agent Architecture

## 🌍 The Challenge

**ElevenLabs agents are language-specific** - you cannot dynamically switch languages within a single agent. Each agent is locked to:
- One language at creation time
- One voice optimized for that language
- One set of prompts in that language

## ✅ The Solution

Create **separate agents for each language**, then route users to the correct agent based on language detection.

---

## 🏗️ Architecture Overview

### **Language-Specific Agents**

Instead of one Sterling agent, you'll have:

```
Sterling-EN (English)   → agent_abc123...
Sterling-ES (Español)   → agent_def456...
Sterling-PT (Português) → agent_ghi789...
Maxwell-EN (English)    → agent_jkl012...
Maxwell-ES (Español)    → agent_mno345...
...
```

### **Agent Routing Flow**

```
User joins TeleBuy session
       ↓
Detect language (browser settings, geolocation, or user selection)
       ↓
Query database for agent: SELECT * FROM elevenlabs_agent_configs
  WHERE agent_role = 'buyer' AND primary_language = 'es'
       ↓
Get elevenlabs_agent_id for that language
       ↓
Initialize ElevenLabs widget with language-specific agent
       ↓
User speaks in their native language ✅
```

---

## 🚀 Setup Instructions

### **Step 1: Create Language-Specific Agents**

Run the multi-language agent creator:

```typescript
import { createAllLanguageAgents, updateExistingSterlingAgent } from '@/scripts/create-multi-language-agents';

// Option A: Update your existing English agent
await updateExistingSterlingAgent();

// Option B: Create all language variants
await createAllLanguageAgents({
  languages: ['en', 'es', 'pt', 'zh', 'ja', 'ko', 'de', 'fr', 'it'],
  roles: ['buyer', 'supplier'],
});
```

This will:
1. ✅ Create 9 buyer agents (one per language)
2. ✅ Create 9 supplier agents (one per language)
3. ✅ Use language-optimized voices for each
4. ✅ Save all configurations to database
5. ✅ Enhance each with knowledge base data

### **Step 2: Configure Voice IDs**

Each language uses a different ElevenLabs voice. Update the voice IDs in `src/scripts/create-multi-language-agents.ts`:

```typescript
const LANGUAGE_VOICES: Record<AgentLanguage, { buyer: string; supplier: string }> = {
  en: {
    buyer: 'pqHfZKP75CvOlQylNhV4', // Your existing Sterling voice
    supplier: 'EXAVITQu4vr4xnSDxMaL',
  },
  es: {
    buyer: 'VR6AewLTigWG4xSOukaG', // Spanish male voice
    supplier: 'TX3LPaxmHKxFdv7VOQHJ',
  },
  // ... etc
};
```

**Finding Voice IDs:**
1. Go to https://elevenlabs.io/voice-library
2. Filter by language
3. Click "Use" on a voice
4. Copy the voice ID from the URL or API tab

### **Step 3: Use Language-Aware Widget**

Replace `MultiAgentWidget` with `LanguageAwareAgentWidget`:

```tsx
import { LanguageAwareAgentWidget } from '@/components/elevenlabs';

// In your TeleBuy component:
<LanguageAwareAgentWidget
  telebuySessionId="session-123"
  userRole="buyer"
  userId="user-456"
  orgId="org-789"
/>
```

This widget:
- ✅ Auto-detects language on mount
- ✅ Fetches the correct language-specific agent from database
- ✅ Allows manual language switching (creates new agent session)
- ✅ Saves language preference to localStorage
- ✅ Shows which language was detected vs selected

---

## 🔍 Language Detection

The system uses multiple detection methods in priority order:

### **1. Stored Preference (Highest Priority)**
```typescript
localStorage.getItem('lithiumbuy_language_preference')
```
User's previously selected language.

### **2. Browser Language**
```typescript
navigator.language // e.g., 'es-MX'
```
Mapped to supported languages: `es-MX` → `es`

### **3. Geolocation (Optional)**
```typescript
// User's country code
'MX' → 'es' (Spanish)
'BR' → 'pt' (Portuguese)
'CN' → 'zh' (Chinese)
```

### **4. Text Analysis**
Detects language from initial user message:
```typescript
"Hola, necesito litio" → 'es'
"Olá, preciso de lítio" → 'pt'
```

---

## 📊 Database Structure

### **Agent Configurations Table**

```sql
SELECT * FROM elevenlabs_agent_configs;

┌────────────┬─────────────┬──────────────────┬──────────────────────┐
│ agent_name │ agent_role  │ primary_language │ elevenlabs_agent_id  │
├────────────┼─────────────┼──────────────────┼──────────────────────┤
│ Sterling-EN│ buyer       │ en               │ agent_abc123...      │
│ Sterling-ES│ buyer       │ es               │ agent_def456...      │
│ Sterling-PT│ buyer       │ pt               │ agent_ghi789...      │
│ Maxwell-EN │ supplier    │ en               │ agent_jkl012...      │
│ Maxwell-ES │ supplier    │ es               │ agent_mno345...      │
└────────────┴─────────────┴──────────────────┴──────────────────────┘
```

### **Agent Session Routing**

When a user starts an agent:

```sql
-- 1. Get agent config for their language
SELECT elevenlabs_agent_id
FROM elevenlabs_agent_configs
WHERE agent_role = 'buyer'
  AND primary_language = 'es'
  AND is_active = true
LIMIT 1;

-- 2. Create agent session
INSERT INTO telebuy_agent_sessions (
  telebuy_session_id,
  agent_role,
  agent_id,
  language,
  user_id
) VALUES (
  'session-123',
  'buyer',
  'agent_def456...', -- Spanish agent
  'es',
  'user-456'
);
```

---

## 🎨 Voice Optimization by Language

Each language requires a different voice:

| Language | Buyer Voice | Supplier Voice | Voice Characteristics |
|----------|-------------|----------------|----------------------|
| English  | pqHfZKP75CvOlQylNhV4 | EXAVITQu4vr4xnSDxMaL | Warm, confident |
| Spanish  | VR6AewLTigWG4xSOukaG | TX3LPaxmHKxFdv7VOQHJ | Native Spanish speaker |
| Portuguese | yoZ06aMxZJJ28mfd3POQ | flq6f7yk4E4fJM5XTYuZ | Brazilian accent |
| Chinese  | XB0fDUnXU5powFXDhCwa | onwK4e9ZLuTAKqWW03F9 | Mandarin |
| Japanese | IKne3meq5aSn9XLyUdCD | bVMeCyTHy58xNoL34h3p | Native Japanese |
| Korean   | pFZP5JQG7iQjIQuC4Bku | piTKgcLEGmPE4e6mEKli | Native Korean |
| German   | TxGEqnHWrfWFTfGW9XjX | pNInz6obpgDQGcFmaJgB | Native German |
| French   | ThT5KcBeYPX3keUQqHPh | 21m00Tcm4TlvDq8ikWAM | Native French |
| Italian  | XrExE9yKIg1WjnnlVkGX | MF3mGyEYCl7XYWbV9V6O | Native Italian |

**Note:** Update these voice IDs based on your ElevenLabs account and preferences.

---

## 🔄 Language Switching

### **During Active Session**

Users **cannot** switch languages while agent is active. They must:
1. End current agent session
2. Select new language
3. Start new agent session (routes to different language-specific agent)

```tsx
// UI shows this alert:
"Stop the agent to change language. Each language uses a different
 agent optimized for that language."
```

### **Why No Mid-Session Switching?**

- ElevenLabs agents are immutable after creation
- Different agents = different conversation contexts
- Cleaner session management and logging
- Better voice quality (native speakers for each language)

---

## 📱 User Experience

### **First-Time User**

1. Opens TeleBuy
2. Widget auto-detects browser language: **Spanish** (from `navigator.language`)
3. Widget shows: "Detected: Español" badge
4. User can accept or change to another language
5. Clicks "Start Sterling (ES)"
6. Sterling speaks in Spanish with native voice

### **Returning User**

1. Opens TeleBuy
2. Widget loads saved preference: **Spanish** (from `localStorage`)
3. Immediately initializes Spanish agent
4. No detection needed - seamless experience

### **Manual Override**

User can always change language via dropdown:
- Dropdown disabled while agent is active
- Stop agent → change language → start again with new agent

---

## 🛠️ Implementation Checklist

- [ ] **1. Run database migration**
  ```bash
  psql < supabase/migrations/20251230000000_elevenlabs_multi_agent_architecture.sql
  ```

- [ ] **2. Update voice IDs** in `create-multi-language-agents.ts`

- [ ] **3. Create agents** for each language
  ```typescript
  await createAllLanguageAgents();
  ```

- [ ] **4. Verify in database**
  ```sql
  SELECT agent_name, primary_language, elevenlabs_agent_id
  FROM elevenlabs_agent_configs;
  ```

- [ ] **5. Update UI** to use `LanguageAwareAgentWidget`

- [ ] **6. Test language detection**
  - Change browser language
  - Clear localStorage
  - Refresh page
  - Verify correct agent loads

- [ ] **7. Test language switching**
  - Start agent in English
  - Stop agent
  - Switch to Spanish
  - Start agent again
  - Verify different agent ID

---

## 🔍 Debugging

### **Agent Not Found for Language**

```
Error: No agent found for buyer role in ES
```

**Solution:**
```sql
-- Check if agent exists for that language
SELECT * FROM elevenlabs_agent_configs
WHERE agent_role = 'buyer' AND primary_language = 'es';

-- If missing, create it:
-- Run createAllLanguageAgents({ languages: ['es'], roles: ['buyer'] })
```

### **Wrong Voice for Language**

**Problem:** Spanish agent sounds like English speaker

**Solution:**
1. Check voice ID in database
2. Update in `LANGUAGE_VOICES` mapping
3. Re-create agent with correct voice

### **Language Detection Not Working**

```typescript
// Debug language detection:
import { detectUserLanguage } from '@/services/language-detection.service';

const result = await detectUserLanguage();
console.log('Detected:', result.language, 'Method:', result.method, 'Confidence:', result.confidence);
```

---

## 📊 Analytics

Track language usage:

```sql
-- Most used languages
SELECT language, COUNT(*) as sessions
FROM telebuy_agent_sessions
GROUP BY language
ORDER BY sessions DESC;

-- Language distribution by role
SELECT agent_role, language, COUNT(*) as sessions
FROM telebuy_agent_sessions
GROUP BY agent_role, language;

-- Average session duration by language
SELECT
  language,
  AVG(duration_seconds) as avg_duration,
  COUNT(*) as total_sessions
FROM telebuy_agent_sessions
WHERE duration_seconds IS NOT NULL
GROUP BY language;
```

---

## 🎯 Best Practices

### **1. Language-Specific Content**

Create Airtable FAQs for each language:

```
FAQs Table:
- Question: "¿Qué es TeleBuy?" (Language: es)
- Question: "O que é TeleBuy?" (Language: pt)
- Question: "What is TeleBuy?" (Language: en)
```

### **2. Knowledge Base Translation**

Seed knowledge base in multiple languages:

```typescript
await addKnowledgeEntry({
  category: 'pricing',
  title: 'Precio de Carbonato de Litio Q1 2025',
  content: 'El carbonato de litio grado batería se cotiza entre...',
  language: 'es',
});
```

### **3. Voice Selection**

Test voices with native speakers:
- Have Spanish speaker test `Sterling-ES`
- Adjust stability/similarity for better pronunciation
- Update voice ID if quality isn't native-level

### **4. Fallback Strategy**

Always have English as fallback:

```typescript
// If Spanish agent fails, fallback to English
const { data: config } = await getAgentConfig('buyer', 'es');
if (!config) {
  const fallback = await getAgentConfig('buyer', 'en');
  // Use English agent as fallback
}
```

---

## 🚀 Summary

**Problem:** ElevenLabs doesn't support dynamic language switching
**Solution:** Create separate agents per language + smart routing

**Your current agent:** `agent_5901kdnkfx6heq1rq2whpves1mn7` (English)
**Next step:** Create Spanish and Portuguese variants
**Component to use:** `LanguageAwareAgentWidget`

Run the setup, test with different browser languages, and your multi-language agent system will be live! 🌍
