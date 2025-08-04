/**
 * Translation Configuration
 * 
 * This file centralizes all translation-related configuration including:
 * - Available languages
 * - Language metadata
 * - RTL support
 * - Fallback languages
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  fallback?: string;
  status: 'complete' | 'partial' | 'planned';
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
    status: 'complete',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    rtl: false,
    status: 'complete',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    rtl: false,
    status: 'complete',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    rtl: false,
    status: 'complete',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    rtl: false,
    status: 'complete',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    rtl: false,
    status: 'complete',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    rtl: false,
    status: 'complete',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    rtl: false,
    status: 'complete',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    rtl: false,
    status: 'complete',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    rtl: false,
    status: 'complete',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    status: 'complete',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    rtl: false,
    status: 'complete',
  },
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Get all available language codes
export const getAvailableLanguages = (): string[] => {
  return Object.keys(LANGUAGES);
};

// Get language config by code
export const getLanguageConfig = (code: string): LanguageConfig | undefined => {
  return LANGUAGES[code];
};

// Get language name by code
export const getLanguageName = (code: string): string => {
  return LANGUAGES[code]?.nativeName || code;
};

// Check if a language is RTL
export const isRTL = (language: string): boolean => {
  return LANGUAGES[language]?.rtl || false;
};

// Get RTL languages
export const getRTLanguages = (): string[] => {
  return Object.values(LANGUAGES)
    .filter(lang => lang.rtl)
    .map(lang => lang.code);
};

// Get complete languages
export const getCompleteLanguages = (): string[] => {
  return Object.values(LANGUAGES)
    .filter(lang => lang.status === 'complete')
    .map(lang => lang.code);
};

// Get language names mapping for components
export const languageNames: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGES).map(([code, config]) => [code, config.nativeName])
);

// RTL languages array for backward compatibility
export const rtlLanguages = getRTLanguages(); 