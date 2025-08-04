'use client';

import { useState, useEffect } from 'react';

// Type for translation messages
export interface TranslationMessages {
  navigation: {
    home: string;
    discover: string;
    library: string;
    settings: string;
  };
  chat: {
    typeMessage: string;
    sendMessage: string;
    newChat: string;
    thinking: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    clear: string;
    refresh: string;
    copy: string;
    copied: string;
    settings: string;
    home: string;
    discover: string;
    library: string;
  };
  settings: {
    title: string;
    appearance: string;
    language: string;
    theme: string;
    autoImageSearch: string;
    autoVideoSearch: string;
    chatModel: string;
    embeddingModel: string;
    model: string;
    automaticSearch: string;
    systemInstructions: string;
    modelSettings: string;
    apiKeys: string;
    modelName: string;
    customOpenaiApiKey: string;
    customOpenaiBaseUrl: string;
    openaiApiKey: string;
    ollamaApiUrl: string;
    groqApiKey: string;
    openrouterApiKey: string;
    anthropicApiKey: string;
    geminiApiKey: string;
    noModelsAvailable: string;
    invalidProvider: string;
    autoImageSearchDescription: string;
    autoVideoSearchDescription: string;
    systemInstructionsPlaceholder: string;
  };
  discover: {
    topic: string;
    website: string;
    search: string;
    sortBy: string;
    viewMode: string;
    customTopic: string;
    enterCustomTopic: string;
    searchArticles: string;
    allWebsites: string;
    relevance: string;
    newest: string;
    oldest: string;
    websiteAZ: string;
    pagination: string;
    infiniteScroll: string;
    showingResults: string;
    noArticlesFound: string;
    loadingMore: string;
    noMoreArticles: string;
    prev: string;
    next: string;
    errorFetchingData: string;
    errorFetchingMore: string;
  };
  emptyChat: {
    title: string;
    askAnything: string;
  };
}

// Import configuration
import {
  languageNames,
  isRTL,
  getAvailableLanguages,
  getLanguageName,
  DEFAULT_LANGUAGE,
  getCompleteLanguages,
} from '@/lib/translations/config';

// Dynamic import function for translations
const loadTranslation = async (language: string): Promise<TranslationMessages> => {
  try {
    const module = await import(`@/lib/translations/${language}.json`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load translation for ${language}, falling back to English`);
            // Fallback to default language
        const defaultModule = await import(`@/lib/translations/${DEFAULT_LANGUAGE}.json`);
        return defaultModule.default;
  }
};

// Cache for loaded translations
const translationCache: Record<string, TranslationMessages> = {};

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [messages, setMessages] = useState<Record<string, TranslationMessages>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage') || DEFAULT_LANGUAGE;
    setCurrentLanguage(savedLanguage);

    // Load initial translations
    const loadInitialTranslations = async () => {
      setIsLoading(true);
      
      // Load default language first (fallback)
      if (!translationCache[DEFAULT_LANGUAGE]) {
        translationCache[DEFAULT_LANGUAGE] = await loadTranslation(DEFAULT_LANGUAGE);
      }
      
      // Load current language
      if (!translationCache[savedLanguage]) {
        translationCache[savedLanguage] = await loadTranslation(savedLanguage);
      }
      
      setMessages(translationCache);
      setIsLoading(false);
    };

    loadInitialTranslations();

    // Listen for language changes
    const handleLanguageChange = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const newLanguage = customEvent.detail.language;
      setCurrentLanguage(newLanguage);
      
      // Load new language if not cached
      if (!translationCache[newLanguage]) {
        translationCache[newLanguage] = await loadTranslation(newLanguage);
        setMessages({ ...translationCache });
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const t = (key: string, params?: Record<string, any>) => {
    if (isLoading) {
      return key; // Return key while loading
    }

    const keys = key.split('.');
    let value: any = messages[currentLanguage as keyof typeof messages];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to default language if translation not found
        value = messages[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return the key if translation not found even in default language
          }
        }
        return typeof value === 'string' ? value : key;
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Handle interpolation if params are provided
    if (params && typeof result === 'string') {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        result = result.replace(regex, String(params[paramKey]));
      });
    }
    
    return result;
  };

  return { t, currentLanguage, isLoading };
} 