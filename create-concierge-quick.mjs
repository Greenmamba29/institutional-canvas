#!/usr/bin/env node
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.VITE_ELEVENLABS_API_KEY;

const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
  method: 'POST',
  headers: {
    'xi-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Sterling Executive - Premium Concierge',
    conversation_config: {
      agent: {
        prompt: {
          prompt: 'You are Sterling Executive, the premium concierge for LithiumBuy serving ultra-high-net-worth clients. You provide white-glove service for multi-million dollar lithium transactions with deep market expertise, real-time intelligence, and strategic consultation. Be sophisticated, knowledgeable, and anticipatory.',
        },
        first_message: "Good day. This is Sterling Executive, your personal concierge for LithiumBuy's Premier Client Services. I have your account profile and market intelligence ready. How may I provide exceptional service today?",
        language: 'en',
      },
    },
    platform_settings: {
      widget: { variant: 'full' },
    },
    tts_config: {
      voice_id: 'pNInz6obpgDQGcFmaJgB',
      model_id: 'eleven_turbo_v2_5',
    },
  }),
});

const data = await response.json();
console.log('Agent ID:', data.agent_id);
console.log('Full response:', JSON.stringify(data, null, 2));
