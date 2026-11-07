# LithiumBuy Multi-Agent Architecture

## Overview

The LithiumBuy platform features a sophisticated multi-agent AI system powered by ElevenLabs conversational AI, designed specifically for B2B lithium procurement through the TeleBuy™ platform.

### Key Features

- **Dual Agent System**: Separate agents for buyers (Sterling) and suppliers (Maxwell)
- **Multi-Language Support**: 9 languages (EN, ES, PT, ZH, JA, KO, DE, FR, IT) with automatic detection
- **Knowledge Base Integration**: Real-time access to pricing, specifications, and market intelligence
- **Airtable Integration**: Dynamic FAQ and marketplace data
- **Conversation Persistence**: Full transcript storage with sentiment analysis
- **Session Coordination**: Agents work simultaneously in TeleBuy sessions

---

## Architecture Components

### 1. Database Layer

#### Tables

**`lithium_knowledge_base`**
- Stores market intelligence, pricing data, specifications, compliance info
- Full-text search with PostgreSQL `tsvector`
- Multilingual support
- Time-based validity (valid_from/valid_until)

**`telebuy_agent_sessions`**
- Tracks individual agent sessions within TeleBuy calls
- Links to ElevenLabs conversation IDs
- Stores agent state and context for persistence
- One agent per role per TeleBuy session

**`telebuy_agent_messages`**
- Complete conversation history
- Sentiment analysis and intent detection
- Audio metadata (URL, duration, confidence scores)
- Entity extraction (products, prices, dates)

**`elevenlabs_agent_configs`**
- Agent persona configurations (buyer, supplier, neutral)
- Multi-language prompt templates
- Voice settings per agent role
- Knowledge base category assignments

#### Database Functions

- `get_agent_config(role, language)` - Returns optimal agent config
- `search_knowledge_base(query, categories, language)` - Full-text search
- Auto-updated timestamps via triggers

---

### 2. Service Layer

#### `elevenlabs-multi-agent.service.ts`

Core multi-agent management:

```typescript
// Agent roles
type AgentRole = 'buyer' | 'supplier' | 'neutral';

// Supported languages
type AgentLanguage = 'en' | 'es' | 'pt' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'it';

// Create agent session
await createAgentSession({
  telebuy_session_id,
  agent_role: 'buyer',
  language: 'en',
  user_id,
  org_id,
});

// Log conversation messages
await logAgentMessage({
  agent_session_id,
  message_type: 'user_speech',
  speaker_role: 'user',
  content: 'What is the current price for lithium carbonate?',
  language: 'en',
});
```

**Pre-configured Agent Personas:**

- **Sterling (Buyer Agent)**: Focuses on securing best prices, supplier vetting, quality assurance
- **Maxwell (Supplier Agent)**: Emphasizes product quality, competitive positioning, value-based selling

Each agent has tailored prompts in 9 languages with role-specific guidance.

#### `knowledge-base.service.ts`

Manages lithium market intelligence:

```typescript
// Search knowledge base
await searchKnowledgeBase('lithium carbonate pricing', {
  categories: ['pricing', 'market_intelligence'],
  language: 'en',
  limit: 10,
});

// Get current pricing
await getCurrentPricing('lithium_carbonate');

// Get product specifications
await getProductSpecifications('battery_grade', 'en');

// Seed initial knowledge
await seedKnowledgeBase(); // Adds pricing, specs, compliance data
```

#### `airtable.service.ts`

Integrates with Airtable for FAQs and marketplace:

```typescript
// Get FAQs from Airtable
const faqs = await getFAQs({
  category: 'pricing',
  language: 'en',
  limit: 20,
});

// Search FAQs
const results = await searchFAQs('What is TeleBuy?', 'en');

// Get marketplace products
const products = await getMarketplaceProducts({
  type: 'carbonate',
  esgCompliant: true,
  limit: 15,
});

// Get formatted agent knowledge
const knowledge = await getAgentKnowledge('en');
// Returns formatted FAQs + products for agent prompt injection
```

---

### 3. Component Layer

#### `MultiAgentWidget.tsx`

Primary UI component for agent interaction:

**Features:**
- Language selector (9 languages)
- Role-based styling (buyer = blue, supplier = green)
- Agent state management (idle, active, paused)
- ElevenLabs widget embedding
- Real-time conversation logging

**Usage:**
```tsx
<MultiAgentWidget
  telebuySessionId="session-123"
  userRole="buyer"
  userId="user-456"
  orgId="org-789"
  onAgentStateChange={(state) => console.log(state)}
/>
```

#### `ConversationHistory.tsx`

Displays conversation transcripts:

**Features:**
- Real-time message updates
- Sentiment indicators (positive/neutral/negative)
- Intent and entity display
- Confidence scores
- Auto-refresh option
- Scrollable history (400px)

**Usage:**
```tsx
<ConversationHistory
  agentSessionId="agent-session-123"
  autoRefresh={true}
  refreshInterval={5000}
/>
```

---

## Agent Capabilities

### Knowledge Sources

Agents have access to:

1. **Lithium Knowledge Base** (PostgreSQL)
   - Current pricing data (updated quarterly)
   - Product specifications (battery grade, technical grade)
   - Market intelligence (supply/demand, forecasts)
   - Compliance requirements (EU Battery Passport, US IRA)

2. **Airtable FAQs**
   - Platform usage questions
   - Procurement best practices
   - TeleBuy™ and SPOT.ai™ feature explanations

3. **Airtable Marketplace**
   - Available products
   - Supplier information
   - Real-time inventory
   - ESG certifications

### Multi-Language Support

#### Supported Languages

| Code | Language | Agent Coverage |
|------|----------|----------------|
| `en` | English | Sterling, Maxwell |
| `es` | Español | Sterling, Maxwell |
| `pt` | Português | Sterling, Maxwell |
| `zh` | 中文 | Sterling, Maxwell |
| `ja` | 日本語 | Sterling, Maxwell |
| `ko` | 한국어 | Sterling, Maxwell |
| `de` | Deutsch | Sterling, Maxwell |
| `fr` | Français | Sterling, Maxwell |
| `it` | Italiano | Sterling, Maxwell |

Each language has:
- Localized agent prompts
- Translated knowledge base entries
- Native voice characteristics

---

## Setup Instructions

### 1. Environment Configuration

Create `.env` file with:

```bash
# ElevenLabs
VITE_ELEVENLABS_API_KEY=your_api_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id

# Airtable
VITE_AIRTABLE_API_KEY=your_airtable_token
VITE_AIRTABLE_BASE_ID=your_base_id
```

### 2. Database Migration

Run the migration to create agent tables:

```bash
# Apply the migration
psql -d your_database < supabase/migrations/20251230000000_elevenlabs_multi_agent_architecture.sql
```

### 3. Seed Knowledge Base

```typescript
import { seedKnowledgeBase } from '@/services/knowledge-base.service';

// Adds initial pricing, specifications, and compliance data
await seedKnowledgeBase();
```

### 4. Configure Airtable

Create an Airtable base with these tables:

**FAQs Table**
- Question (single line text)
- Answer (long text)
- Category (single select: General, Pricing, TeleBuy, SPOT.ai, Technical)
- Language (single select: en, es, pt, zh, ja, ko, de, fr, it)
- Tags (multiple select)
- Priority (number)

**Products Table**
- Name (single line text)
- Type (single select: carbonate, hydroxide, metal, spodumene)
- Grade (single line text)
- Specifications (long text)
- Supplier (single line text)
- Price_Range (single line text)
- Availability (single select: In Stock, Limited, Out of Stock)
- Certifications (multiple select)
- ESG_Compliant (checkbox)

### 5. Create Agent Configurations

For buyer agent:
```typescript
import { getBuyerAgentConfig, createElevenLabsAgent, saveAgentConfig } from '@/services/elevenlabs-multi-agent.service';

const buyerConfig = getBuyerAgentConfig('en');
const { agent_id } = await createElevenLabsAgent(buyerConfig);

await saveAgentConfig({
  ...buyerConfig,
  elevenlabs_agent_id: agent_id,
});
```

Repeat for supplier agent and other languages.

---

## Usage Examples

### Basic TeleBuy Session with Agents

```typescript
// 1. Create TeleBuy session
const { data: session } = await createTelebuySession({
  supplier_id: 'supplier-123',
  scheduled_at: '2025-01-15T14:00:00Z',
  meeting_url: 'https://meet.lithiumbuy.com/session-456',
  agents_enabled: true,
  primary_language: 'en',
});

// 2. Buyer joins with Sterling agent
<MultiAgentWidget
  telebuySessionId={session.id}
  userRole="buyer"
  language="en"
/>

// 3. Supplier joins with Maxwell agent
<MultiAgentWidget
  telebuySessionId={session.id}
  userRole="supplier"
  language="en"
/>

// 4. View conversation history
<ConversationHistory
  agentSessionId={buyerAgentSessionId}
  autoRefresh={true}
/>
```

### Enhancing Agent with Dynamic Knowledge

```typescript
import { enhancePromptWithKnowledge } from '@/services/elevenlabs-multi-agent.service';
import { getAgentKnowledge } from '@/services/airtable.service';

// Get current Airtable knowledge
const airtableKnowledge = await getAgentKnowledge('en');

// Enhance base prompt
const enhancedPrompt = await enhancePromptWithKnowledge(
  basePrompt,
  'lithium hydroxide pricing trends',
  ['pricing', 'market_intelligence']
);

// Enhanced prompt now includes latest pricing data + Airtable FAQs/products
```

---

## Agent Coordination

### Dual Agent Workflow

In a typical TeleBuy session:

1. **Buyer** (Sterling):
   - Focuses on securing best price
   - Verifies supplier credentials
   - Requests ESG certifications
   - Compares market pricing via SPOT.ai™

2. **Supplier** (Maxwell):
   - Highlights product quality
   - Emphasizes competitive advantages
   - Provides certification documentation
   - Recommends optimal pricing based on market conditions

3. **System**:
   - Both agents log messages to database
   - Sentiment analysis tracks negotiation tone
   - Intent detection identifies key discussion points
   - Entity extraction captures mentioned products, prices, quantities

### Conversation Analytics

Post-session analysis available via:

```typescript
// Get all messages from buyer's agent session
const { data: buyerMessages } = await getConversationHistory(buyerAgentSessionId);

// Analyze sentiment distribution
const sentiments = buyerMessages.reduce((acc, msg) => {
  acc[msg.sentiment || 'neutral']++;
  return acc;
}, {});

// Extract mentioned products
const products = buyerMessages
  .filter(msg => msg.entities?.products)
  .flatMap(msg => msg.entities.products);
```

---

## Performance Considerations

### Caching Strategy

- **Knowledge Base**: Cache search results (5 min TTL)
- **Airtable Data**: Cache FAQs/products (15 min TTL)
- **Agent Configs**: Cache per session (no expiry)

### Rate Limiting

- **ElevenLabs API**: Max 20 concurrent conversations
- **Airtable API**: 5 requests/second per base
- **Knowledge Base**: No limits (local PostgreSQL)

### Optimization Tips

1. Pre-load knowledge base for common queries
2. Batch Airtable requests
3. Use webhook triggers for real-time Airtable updates
4. Implement message compression for long transcripts

---

## Security & Privacy

### Data Protection

- All conversation data encrypted at rest (Supabase)
- Row-level security (RLS) enforces org boundaries
- Users can only access their own agent sessions
- Audio recordings stored with expiry policies

### Compliance

- GDPR-compliant data retention policies
- Right to deletion (cascade deletes on agent sessions)
- Audit logging for all agent interactions
- No PII stored in agent prompts

---

## Troubleshooting

### Agent Not Starting

1. Check ElevenLabs API key: `console.log(import.meta.env.VITE_ELEVENLABS_API_KEY)`
2. Verify agent config exists: `SELECT * FROM elevenlabs_agent_configs WHERE agent_role = 'buyer'`
3. Check browser console for ElevenLabs widget errors

### Knowledge Base Empty

1. Run seed script: `await seedKnowledgeBase()`
2. Verify Airtable connection: `await getFAQs()`
3. Check RLS policies: `SELECT * FROM lithium_knowledge_base LIMIT 1`

### Language Not Working

1. Ensure language is supported: `'en' | 'es' | 'pt' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'it'`
2. Verify agent config for language: `SELECT * FROM elevenlabs_agent_configs WHERE primary_language = 'es'`
3. Check Airtable has content for language

---

## Roadmap

### Planned Features

- [ ] Real-time agent-to-agent coordination
- [ ] Sentiment-based escalation triggers
- [ ] Auto-translation between buyer/supplier languages
- [ ] Voice biometrics for authentication
- [ ] Agent performance dashboards
- [ ] Custom agent training via fine-tuning
- [ ] Integration with SPOT.ai™ for real-time pricing updates

---

## Support

For issues or questions:

1. Check logs: Agent sessions table + conversation messages
2. Review documentation: `ELEVENLABS_SETUP.md`
3. Test with mock data: Use seeded knowledge base
4. Contact: development team or file GitHub issue

---

## Credits

- **ElevenLabs**: Conversational AI platform
- **Airtable**: Dynamic knowledge base
- **Supabase**: Database and auth
- **Claude 3.5 Sonnet**: Agent reasoning model
