# Sterling AI Agent Setup Guide

This guide explains how to set up the Sterling AI Executive Concierge powered by ElevenLabs for the LithiumBuy TeleBuy platform.

## Overview

Sterling is an AI-powered conversational agent that provides white-glove concierge service for lithium procurement on the LithiumBuy platform. Sterling can:

- Guide buyers and suppliers through the platform
- Facilitate high-value lithium transactions ($500K+)
- Educate clients on lithium specifications and pricing
- Promote TeleBuy™ and SPOT.ai™ features
- Build trust through natural conversation

## Setup Instructions

### 1. Create the ElevenLabs Agent (First Time Only)

If you haven't created the Sterling agent yet, run this command to create it:

```bash
curl -X POST "https://api.elevenlabs.io/v1/convai/agents/create" \
  -H "xi-api-key: YOUR_ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "conversation_config": {
    "agent": {
      "prompt": {
        "prompt": "# IDENTITY & PERSONA\n\nYou are Sterling, the Executive Concierge for LithiumBuy - the world's premier B2B lithium marketplace platform...",
        "llm": "claude-3-5-sonnet"
      },
      "first_message": "Good day. This is the LithiumBuy Executive Concierge service. My name is Sterling, and I'll be your personal advisor for all lithium procurement needs...",
      "language": "en"
    },
    "tts": {
      "voice_id": "pqHfZKP75CvOlQylNhV4",
      "model_id": "eleven_turbo_v2_5",
      "stability": 0.75,
      "similarity_boost": 0.85,
      "optimize_streaming_latency": 3
    }
  },
  "platform_settings": {
    "auth": {
      "required": false
    }
  }
}
EOF
```

The response will contain an `agent_id` - save this for the next step.

**Note:** The full agent configuration is defined in `src/services/elevenlabs.service.ts` in the `getSterlingAgentConfig()` function.

### 2. Configure Environment Variables

Create a `.env` file in the project root (or update your existing one) with:

```bash
# ElevenLabs Configuration
VITE_ELEVENLABS_API_KEY=sk_3b3d080cf5086d164266c0bb0046d3874779ba7225789239
VITE_ELEVENLABS_AGENT_ID=your_agent_id_from_step_1
```

**Security Note:** Never commit your actual API keys to version control. Use `.env.local` for local development and configure environment variables in your hosting platform (Vercel, Netlify, etc.) for production.

### 3. Verify Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the TeleBuy page: `http://localhost:5173/telebuy`

3. You should see the "Sterling - AI Executive Concierge" card in the grid

4. Click on the ElevenLabs widget to start a voice conversation with Sterling

## Architecture

### Files Created

- **`src/services/elevenlabs.service.ts`**: Core service for ElevenLabs API integration
  - Agent configuration
  - API communication
  - Configuration validation

- **`src/components/elevenlabs/SterlingAgent.tsx`**: React component that embeds the conversational AI widget
  - Widget initialization
  - Session management
  - UI presentation

- **`src/components/elevenlabs/index.ts`**: Component exports

### Integration Points

- **TeleBuy Page** (`src/pages/TeleBuy.tsx`): The Sterling agent card appears alongside TeleBuy sessions
- **Environment Variables** (`.env.example`): Template for required configuration

## Agent Capabilities

Sterling is configured to help with:

1. **Platform Navigation**: Guide users through LithiumBuy features
2. **Deal Facilitation**: Assist with high-value transactions over $500K
3. **Product Education**: Explain lithium specifications (carbonate, hydroxide, metal)
4. **Feature Promotion**: Introduce TeleBuy™ video negotiation and SPOT.ai™ market intelligence
5. **Objection Handling**: Address pricing and supplier concerns professionally

## Voice Configuration

- **Voice ID**: `pqHfZKP75CvOlQylNhV4` (Warm, confident baritone)
- **Model**: `eleven_turbo_v2_5` (Fast, high-quality responses)
- **Stability**: 0.75 (Consistent voice character)
- **Similarity Boost**: 0.85 (High voice clarity)
- **Streaming Latency**: 3 (Optimized for real-time conversation)

## Customization

To modify Sterling's behavior:

1. Edit the prompt in `src/services/elevenlabs.service.ts` → `getSterlingAgentConfig()`
2. Adjust voice settings in the same function
3. Redeploy or create a new agent with the updated configuration

## Troubleshooting

### Widget Not Appearing

- Check browser console for errors
- Verify environment variables are set correctly
- Ensure the ElevenLabs script loaded successfully

### "Sterling AI Agent Not Configured" Message

- Confirm `VITE_ELEVENLABS_API_KEY` is set in `.env`
- Confirm `VITE_ELEVENLABS_AGENT_ID` is set in `.env`
- Restart the development server after adding environment variables

### Voice Quality Issues

- Adjust `stability` and `similarity_boost` values in the TTS configuration
- Try a different voice ID from the ElevenLabs voice library

## Production Deployment

For production:

1. Set environment variables in your hosting platform
2. Use different agent IDs for staging vs production
3. Enable authentication (`auth.required: true`) if needed
4. Monitor API usage in the ElevenLabs dashboard

## Resources

- [ElevenLabs ConvAI Documentation](https://elevenlabs.io/docs/conversational-ai)
- [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
- [Agent API Reference](https://elevenlabs.io/docs/api-reference/agents)

## Support

For issues with the Sterling agent integration, contact the development team or file an issue in the project repository.
