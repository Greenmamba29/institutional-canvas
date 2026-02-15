// @ts-nocheck
/**
 * Language Detection Service
 * Detects user's preferred language for agent routing
 */

import { AgentLanguage } from './elevenlabs-multi-agent.service';

export interface LanguageDetectionResult {
  language: AgentLanguage;
  confidence: number;
  method: 'browser' | 'geolocation' | 'user_selection' | 'default';
}

/**
 * Map browser language codes to our supported languages
 */
const LANGUAGE_MAP: Record<string, AgentLanguage> = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-ZA': 'en',
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'pt': 'pt',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh-TW', // Taiwanese Mandarin (Traditional Chinese)
  'zh-HK': 'zh',
  'ja': 'ja',
  'ja-JP': 'ja',
  'ko': 'ko',
  'ko-KR': 'ko',
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'it': 'it',
  'it-IT': 'it',
  'ru': 'ru',
  'ru-RU': 'ru',
  'af': 'af',
  'af-ZA': 'af',
};

/**
 * Language to country mapping for geolocation fallback
 */
const COUNTRY_TO_LANGUAGE: Record<string, AgentLanguage> = {
  // English-speaking countries
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en', 'ZA': 'en',

  // Spanish-speaking countries (major lithium producers: Chile, Argentina)
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es', 'BO': 'es',

  // Portuguese-speaking countries (Brazil - major lithium reserves)
  'BR': 'pt', 'PT': 'pt',

  // Chinese-speaking regions (China - world's largest lithium processor)
  'CN': 'zh', 'HK': 'zh', 'SG': 'zh',
  'TW': 'zh-TW', // Taiwan uses Traditional Chinese

  // Japanese (major battery manufacturer)
  'JP': 'ja',

  // Korean (major battery/EV market)
  'KR': 'ko',

  // German-speaking countries (major EV market)
  'DE': 'de', 'AT': 'de', 'CH': 'de',

  // French-speaking countries (lithium mining in Quebec, Africa)
  'FR': 'fr', 'BE': 'fr', 'CA': 'fr', 'DZ': 'fr', 'MA': 'fr', 'CD': 'fr',

  // Italian
  'IT': 'it',

  // Russian (emerging lithium market)
  'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',

  // Afrikaans (South Africa - lithium mining)
  'ZA': 'af',
};

/**
 * Detect language from browser settings
 */
export function detectBrowserLanguage(): LanguageDetectionResult {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';

  // Try exact match first
  let language = LANGUAGE_MAP[browserLang];

  // Try language code only (e.g., 'en' from 'en-US')
  if (!language) {
    const langCode = browserLang.split('-')[0];
    language = LANGUAGE_MAP[langCode];
  }

  // Default to English
  if (!language) {
    language = 'en';
  }

  return {
    language,
    confidence: language === LANGUAGE_MAP[browserLang] ? 0.9 : 0.7,
    method: 'browser',
  };
}

/**
 * Detect language from geolocation (requires permission)
 */
export async function detectLanguageFromGeolocation(): Promise<LanguageDetectionResult | null> {
  try {
    // Get user's position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000, // Cache for 5 minutes
      });
    });

    // Use a geocoding service to get country code
    // For now, we'll use a simple IP-based geolocation API
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Geolocation API failed');

    const data = await response.json();
    const countryCode = data.country_code;

    const language = COUNTRY_TO_LANGUAGE[countryCode] || 'en';

    return {
      language,
      confidence: 0.8,
      method: 'geolocation',
    };
  } catch (error) {
    console.warn('Geolocation detection failed:', error);
    return null;
  }
}

/**
 * Get user's preferred language (stored in localStorage)
 */
export function getStoredLanguagePreference(): LanguageDetectionResult | null {
  const stored = localStorage.getItem('lithiumbuy_language_preference');
  if (!stored) return null;

  try {
    const language = stored as AgentLanguage;
    const supportedLanguages: AgentLanguage[] = ['en', 'es', 'pt', 'zh', 'ja', 'ko', 'de', 'fr', 'it'];

    if (supportedLanguages.includes(language)) {
      return {
        language,
        confidence: 1.0,
        method: 'user_selection',
      };
    }
  } catch (error) {
    console.warn('Failed to parse stored language:', error);
  }

  return null;
}

/**
 * Store user's language preference
 */
export function storeLanguagePreference(language: AgentLanguage): void {
  localStorage.setItem('lithiumbuy_language_preference', language);
}

/**
 * Detect user's preferred language (uses multiple methods)
 */
export async function detectUserLanguage(options?: {
  allowGeolocation?: boolean;
}): Promise<LanguageDetectionResult> {
  // Priority 1: User's stored preference
  const stored = getStoredLanguagePreference();
  if (stored) {
    return stored;
  }

  // Priority 2: Geolocation (if allowed)
  if (options?.allowGeolocation) {
    const geo = await detectLanguageFromGeolocation();
    if (geo) {
      return geo;
    }
  }

  // Priority 3: Browser language
  const browser = detectBrowserLanguage();
  return browser;
}

/**
 * Get language name for display
 */
export function getLanguageName(language: AgentLanguage): string {
  const names: Record<AgentLanguage, string> = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    zh: '中文 (Simplified)',
    'zh-TW': '中文 (Traditional)',
    ja: '日本語',
    ko: '한국어',
    de: 'Deutsch',
    fr: 'Français',
    it: 'Italiano',
    ru: 'Русский',
    af: 'Afrikaans',
  };
  return names[language];
}

/**
 * Get supported languages list
 */
export function getSupportedLanguages(): Array<{ code: AgentLanguage; name: string }> {
  const languages: AgentLanguage[] = [
    'en',  // English
    'zh',  // Chinese (Simplified)
    'zh-TW', // Chinese (Traditional) - Taiwan
    'ja',  // Japanese
    'fr',  // French
    'de',  // German
    'ru',  // Russian
    'es',  // Spanish
    'pt',  // Portuguese
    'ko',  // Korean
    'it',  // Italian
    'af',  // Afrikaans (South Africa)
  ];
  return languages.map((code) => ({
    code,
    name: getLanguageName(code),
  }));
}

/**
 * Detect language from text content (basic heuristic)
 */
export function detectLanguageFromText(text: string): AgentLanguage {
  const lowerText = text.toLowerCase();

  // Common words/patterns for each language
  const patterns: Record<AgentLanguage, RegExp[]> = {
    es: [/\b(hola|gracias|por favor|buenos días|cómo|español)\b/i],
    pt: [/\b(olá|obrigado|por favor|bom dia|como|português)\b/i],
    zh: [/[\u4e00-\u9fa5]/], // Chinese characters
    ja: [/[\u3040-\u309f\u30a0-\u30ff]/], // Hiragana/Katakana
    ko: [/[\uac00-\ud7af]/], // Hangul
    de: [/\b(hallo|danke|bitte|guten tag|deutsch|wie)\b/i],
    fr: [/\b(bonjour|merci|s'il vous plaît|français|comment)\b/i],
    it: [/\b(ciao|grazie|per favore|buongiorno|italiano|come)\b/i],
    en: [/\b(hello|thank you|please|good morning|how|english)\b/i],
  };

  // Check each language
  for (const [lang, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      if (regex.test(lowerText)) {
        return lang as AgentLanguage;
      }
    }
  }

  // Default to English
  return 'en';
}
