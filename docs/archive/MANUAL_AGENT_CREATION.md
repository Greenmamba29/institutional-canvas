# Manual Agent Creation Guide

The API is having issues with non-English agent configuration. You can create the agents manually in the ElevenLabs UI much faster.

## What Was Created Successfully

✅ **Sterling** (EN) - Buyer Agent - `agent_5901kdnkfx6heq1rq2whpves1mn7` (existing)
✅ **Maxwell** (EN) - Supplier Agent - `agent_3301kdv7kb4kexjtg5bqc54gnjrk` (just created)

## How to Create Remaining Agents

Visit: https://elevenlabs.io/app/conversational-ai

For each language, create 2 agents (Buyer + Supplier):

### Languages to Create
- 🇨🇳 Chinese (Simplified) - `zh`
- 🇹🇼 Chinese (Traditional) - `zh-TW`
- 🇯🇵 Japanese - `ja`
- 🇫🇷 French - `fr`
- 🇩🇪 German - `de`
- 🇷🇺 Russian - `ru`
- 🇪🇸 Spanish - `es`
- 🇧🇷 Portuguese - `pt`
- 🇰🇷 Korean - `ko`
- 🇮🇹 Italian - `it`

### Configuration Template

#### For Buyer Agents (Sterling)

**Name**: `Sterling - Buyer Agent (LANG)`

**First Message**: 
- EN: "Hello! I'm Sterling, your lithium procurement specialist."
- ES: "¡Hola! Soy Sterling, tu especialista en compras de litio."
- ZH: "你好！我是Sterling，您的锂采购专家。"
- _(translate for other languages)_

**System Prompt**:
```
You are Sterling, a charismatic and professional buyer agent for the LithiumBuy platform.

Your expertise: finding the best lithium suppliers, negotiating favorable prices, and ensuring ESG compliance

Key capabilities:
- Deep knowledge of global lithium markets
- Understanding of battery-grade specifications (99.5%+ purity)
- ESG compliance verification
- Pricing negotiation and market analysis
- Real-time supplier/buyer matching

Respond naturally in [LANGUAGE NAME]. Be professional yet personable.
```

**Settings**:
- Language: Select the target language
- Model: Eleven Flash v2.5 (for non-English)
- Model: Eleven Turbo v2.5 (for English)
- Voice: Use recommended voices (see below)

#### For Supplier Agents (Maxwell)

**Name**: `Maxwell - Supplier Agent (LANG)`

**First Message**:
- EN: "Hello! I'm Maxwell, your lithium supply specialist."
- ES: "¡Hola! Soy Maxwell, tu especialista en suministro de litio."
- ZH: "你好！我是Maxwell，您的锂供应专家。"
- _(translate for other languages)_

**System Prompt**:
```
You are Maxwell, a consultative and warm supplier agent for the LithiumBuy platform.

Your expertise: showcasing lithium products, optimizing pricing strategies, and connecting with qualified buyers

Key capabilities:
- Deep knowledge of global lithium markets
- Understanding of battery-grade specifications (99.5%+ purity)
- ESG compliance verification
- Pricing negotiation and market analysis
- Real-time supplier/buyer matching

Respond naturally in [LANGUAGE NAME]. Be professional yet personable.
```

### Recommended Voice IDs

| Language | Buyer Voice ID | Supplier Voice ID |
|----------|----------------|-------------------|
| EN | `XB0fDUnXU5powFXDhCwa` | `EXAVITQu4vr4xnSDxMaL` |
| ZH | `XB0fDUnXU5powFXDhCwa` | `onwK4e9ZLuTAKqWW03F9` |
| ZH-TW | `XB0fDUnXU5powFXDhCwa` | `onwK4e9ZLuTAKqWW03F9` |
| JA | `IKne3meq5aSn9XLyUdCD` | `Zlb1dXrM653N07WRdFW3` |
| FR | `ThT5KcBeYPX3keUQqHPh` | `cgSgspJ2msm6clMCkdW9` |
| DE | `TxGEqnHWrfWFTfGW9XjX` | `pNInz6obpgDQGcFmaJgB` |
| RU | `zlb1dXrM653N07WRdFW3` | `g5CIjZEefAph4nQFvHAz` |
| ES | `GBv7mTt0atIp3Br8iCZE` | `onwK4e9ZLuTAKqWW03F9` |
| PT | `yoZ06aMxZJJ28mfd3POQ` | `AZnzlk1XvdvUeBnXmlld` |
| KO | `2EiwWnXFnvU5JabPnv8n` | `pqHfZKP75CvOlQylNhV4` |
| IT | `XB0fDUnXU5powFXDhCwa` | `onwK4e9ZLuTAKqWW03F9` |

## After Creating Agents

1. Note down each agent ID (will be like `agent_xxxxx...`)
2. Update the agent routing config:

```typescript
// In src/lib/agent-routing.ts or relevant file
export const AGENT_IDS_BY_LANGUAGE = {
  en: {
    buyer: 'agent_5901kdnkfx6heq1rq2whpves1mn7',
    supplier: 'agent_3301kdv7kb4kexjtg5bqc54gnjrk',
  },
  zh: {
    buyer: 'agent_PASTE_HERE',
    supplier: 'agent_PASTE_HERE',
  },
  // ... etc
};
```

## Why Manual Creation?

The Eleven Labs API is currently having issues with:
1. Model ID configuration for non-English agents
2. The API seems to default to `eleven_turbo_v2` instead of `eleven_flash_v2_5`
3. Manual creation through the UI works perfectly and is actually faster than debugging the API

## Estimated Time

- ~2 minutes per agent
- 20 agents remaining × 2 min = 40 minutes total
- Much faster than debugging API issues!

