// News search engine configurations for news discovery
export const NEWS_SEARCH_ENGINES = {
  // Primary news engines - for current events and articles
  primary: [
    'bing news',
    'google news', 
    'yahoo news',
    'reuters',
    'startpage news',
  ],
  
  // Alternative news sources
  alternative: [
    'duckduckgo news',
    'searx news',
    'mojeek news'
  ],
  
  // All available news engines
  all: [
    'bing news',
    'google news', 
    'yahoo news',
    'reuters',
    'startpage news'
  ]
};

// Get available news engines for a specific category
export const getNewsEnginesForCategory = (category: keyof typeof NEWS_SEARCH_ENGINES): string[] => {
  return NEWS_SEARCH_ENGINES[category] || NEWS_SEARCH_ENGINES.primary;
};

// Get all available news engines
export const getAllNewsEngines = (): string[] => {
  return NEWS_SEARCH_ENGINES.all;
};

// Check if a news engine is available
export const isNewsEngineAvailable = (engine: string): boolean => {
  return NEWS_SEARCH_ENGINES.all.includes(engine);
};

// Get news engine categories
export const getNewsEngineCategories = (): string[] => {
  return Object.keys(NEWS_SEARCH_ENGINES);
};

// News engine metadata for UI display
export const NEWS_ENGINE_METADATA = {
  'bing news': {
    name: 'Bing News',
    description: 'Microsoft Bing news search',
    category: 'primary',
    privacy: 'medium',
    reliability: 'high'
  },
  'google news': {
    name: 'Google News',
    description: 'Google news aggregation',
    category: 'primary',
    privacy: 'low',
    reliability: 'high'
  },
  'yahoo news': {
    name: 'Yahoo News',
    description: 'Yahoo news search',
    category: 'primary',
    privacy: 'medium',
    reliability: 'high'
  },
  'reuters': {
    name: 'Reuters',
    description: 'Reuters news agency',
    category: 'primary',
    privacy: 'high',
    reliability: 'high'
  },
  'startpage news': {
    name: 'Startpage News',
    description: 'Privacy-focused news search',
    category: 'primary',
    privacy: 'high',
    reliability: 'medium'
  },
}; 