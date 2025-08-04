// Export all translation files
export { default as en } from './en.json';
export { default as es } from './es.json';
export { default as fr } from './fr.json';
export { default as de } from './de.json';
export { default as it } from './it.json';
export { default as pt } from './pt.json';
export { default as ru } from './ru.json';
export { default as ja } from './ja.json';
export { default as ko } from './ko.json';
export { default as zh } from './zh.json';
export { default as ar } from './ar.json';
export { default as hi } from './hi.json';

// Type for translation messages
export type TranslationMessages = typeof en;

// Available languages mapping
export const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
};

// RTL languages
export const rtlLanguages = ['ar'];

// Check if a language is RTL
export const isRTL = (language: string): boolean => {
  return rtlLanguages.includes(language);
};

// Get all available language codes
export const getAvailableLanguages = (): string[] => {
  return Object.keys(languageNames);
};

// Get language name by code
export const getLanguageName = (code: string): string => {
  return languageNames[code] || code;
}; 