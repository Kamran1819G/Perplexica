import { OrchestratorConfig, SearchOrchestrator } from './orchestrator';

export const searchConfigs: Record<string, OrchestratorConfig> = {
  quickSearch: {
    mode: 'quick',
    maxSources: 8, // Tight, focused source set for immediate answers
    maxImages: 12, // Reasonable image set for quick visual results
    maxVideos: 8, // Focused video set for immediate media results
    rerankingConfig: {
      threshold: 0.5, // High threshold for only most relevant sources
      maxDocuments: 12, // Minimal set for speed
      diversityBoost: false, // Focus on relevance over diversity
      semanticWeight: 0.8, // Prioritize semantic relevance for precision
      keywordWeight: 0.2
    },
    fusionConfig: {
      maxChunkSize: 800, // Concise chunks for quick synthesis
      overlapSize: 80,
      maxChunks: 3, // Minimal chunks for tight answers
      semanticGrouping: false, // Skip for immediate response
      deduplication: true
    },
    searchConfig: {
      maxQueries: 1, // Single focused query for speed
      parallelSearches: true,
      fallbackEnabled: false,
      expertSourcing: false,
      intelligentIntent: true // Enable for better intent detection
    }
  },
  
  proSearch: {
    mode: 'pro',
    maxSources: 15, // Broader coverage for research depth
    maxImages: 20, // More images for comprehensive visual research
    maxVideos: 15, // More videos for multi-perspective media content
    rerankingConfig: {
      threshold: 0.25, // Lower threshold for wider source inclusion
      maxDocuments: 30, // More documents for comprehensive coverage
      diversityBoost: true, // Enable diversity for broader perspectives
      semanticWeight: 0.6, // Balanced semantic and keyword matching
      keywordWeight: 0.4
    },
    fusionConfig: {
      maxChunkSize: 1200, // Larger chunks for richer context
      overlapSize: 120,
      maxChunks: 6, // More chunks for structured synthesis
      semanticGrouping: true, // Enable for better organization
      deduplication: true
    },
    searchConfig: {
      maxQueries: 3, // Multiple angles for comprehensive research
      parallelSearches: true,
      fallbackEnabled: true, // Enable for reliability
      expertSourcing: true, // Include authoritative sources
      intelligentIntent: true // Use LLM for smart intent detection
    }
  },
  
  ultraSearch: {
    mode: 'ultra',
    maxSources: 25, // Premium source selection for rigorous analysis
    maxImages: 30, // Extensive image collection for thorough visual analysis
    maxVideos: 25, // Comprehensive video collection for multi-modal research
    rerankingConfig: {
      threshold: 0.15, // Very low threshold for exhaustive coverage
      maxDocuments: 50, // Maximum documents for comprehensive analysis
      diversityBoost: true, // Strong diversity for multi-perspective synthesis
      semanticWeight: 0.7, // Balanced for nuanced understanding
      keywordWeight: 0.3
    },
    fusionConfig: {
      maxChunkSize: 1800, // Large chunks for complex reasoning
      overlapSize: 180,
      maxChunks: 10, // More chunks for detailed multi-step synthesis
      semanticGrouping: true, // Enable for sophisticated organization
      deduplication: true
    },
    searchConfig: {
      maxQueries: 6, // Multiple search angles for exhaustive coverage
      parallelSearches: true,
      fallbackEnabled: true, // Maximum reliability for high-stakes queries
      expertSourcing: true, // Prioritize authoritative and expert sources
      intelligentIntent: true // Use advanced LLM intent analysis
    }
  }
};

// Default configuration
export const defaultSearchConfig = searchConfigs.quickSearch;

// Function to get configuration by mode
export function getSearchConfig(mode: string): OrchestratorConfig {
  return searchConfigs[mode] || defaultSearchConfig;
}

// Function to create orchestrator instance
export function createSearchOrchestrator(mode: string) {
  const config = getSearchConfig(mode);
  return new SearchOrchestrator(config);
}

// Performance tuning configurations
export const performanceConfigs = {
  quick: {
    maxConcurrentSearches: 1,
    timeout: 30000, // 30 seconds
    retryAttempts: 1
  },
  pro: {
    maxConcurrentSearches: 3,
    timeout: 60000, // 1 minute
    retryAttempts: 2
  },
  ultra: {
    maxConcurrentSearches: 6,
    timeout: 120000, // 2 minutes
    retryAttempts: 3
  }
};

// Task complexity mapping for search optimization
export const taskComplexityMapping = {
  simple: {
    maxQueries: 1,
    parallelSearches: false,
    maxSources: 15
  },
  moderate: {
    maxQueries: 3,
    parallelSearches: true,
    maxSources: 25
  },
  complex: {
    maxQueries: 8,
    parallelSearches: true,
    maxSources: 50
  }
};

// Search engine configurations
export const searchEngineConfigs = {
  default: {
    engines: ['google', 'bing', 'duckduckgo'],
    categories: ['general'],
    language: 'en',
    safesearch: 1
  },
  academic: {
    engines: ['google', 'bing', 'arxiv', 'scholar'],
    categories: ['science', 'academic'],
    language: 'en',
    safesearch: 1
  },
  technical: {
    engines: ['google', 'bing', 'github', 'stackoverflow'],
    categories: ['general', 'tech'],
    language: 'en',
    safesearch: 1
  },
  news: {
    engines: ['google', 'bing', 'news'],
    categories: ['news'],
    language: 'en',
    safesearch: 1
  }
};

