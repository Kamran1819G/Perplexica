import { LRUCache } from 'lru-cache';

// Global cache instance with memory management
const globalCache = new LRUCache<string, any>({
  max: 500, // Maximum number of items
  maxSize: 50 * 1024 * 1024, // 50MB max size
  sizeCalculation: (value, key) => {
    // Estimate size based on content type
    if (typeof value === 'string') return value.length;
    if (typeof value === 'object') return JSON.stringify(value).length;
    return 1;
  },
  ttl: 1000 * 60 * 15, // 15 minutes default TTL
  updateAgeOnGet: true, // Update age when accessed
  allowStale: false,
});

// Search result cache with shorter TTL
const searchCache = new LRUCache<string, any>({
  max: 200,
  maxSize: 20 * 1024 * 1024, // 20MB
  ttl: 1000 * 60 * 5, // 5 minutes for search results
  sizeCalculation: (value) => JSON.stringify(value).length,
});

// Embedding cache for similarity calculations
const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  maxSize: 100 * 1024 * 1024, // 100MB for embeddings
  ttl: 1000 * 60 * 60, // 1 hour for embeddings
  sizeCalculation: (embeddings) => embeddings.length * 8, // 8 bytes per float64
});

// Weather and API cache
const apiCache = new LRUCache<string, any>({
  max: 100,
  maxSize: 10 * 1024 * 1024, // 10MB
  ttl: 1000 * 60 * 10, // 10 minutes for API responses
  sizeCalculation: (value) => JSON.stringify(value).length,
});

export class CacheManager {
  static get(key: string, cacheType: 'global' | 'search' | 'embedding' | 'api' = 'global') {
    const cache = this.getCache(cacheType);
    return cache.get(key);
  }

  static set(key: string, value: any, cacheType: 'global' | 'search' | 'embedding' | 'api' = 'global', ttl?: number) {
    const cache = this.getCache(cacheType);
    if (ttl) {
      cache.set(key, value, { ttl });
    } else {
      cache.set(key, value);
    }
  }

  static has(key: string, cacheType: 'global' | 'search' | 'embedding' | 'api' = 'global') {
    const cache = this.getCache(cacheType);
    return cache.has(key);
  }

  static delete(key: string, cacheType: 'global' | 'search' | 'embedding' | 'api' = 'global') {
    const cache = this.getCache(cacheType);
    cache.delete(key);
  }

  static clear(cacheType?: 'global' | 'search' | 'embedding' | 'api') {
    if (cacheType) {
      const cache = this.getCache(cacheType);
      cache.clear();
    } else {
      globalCache.clear();
      searchCache.clear();
      embeddingCache.clear();
      apiCache.clear();
    }
  }

  static getStats() {
    return {
      global: {
        size: globalCache.size,
        maxSize: globalCache.max,
        memoryUsage: globalCache.calculatedSize,
      },
      search: {
        size: searchCache.size,
        maxSize: searchCache.max,
        memoryUsage: searchCache.calculatedSize,
      },
      embedding: {
        size: embeddingCache.size,
        maxSize: embeddingCache.max,
        memoryUsage: embeddingCache.calculatedSize,
      },
      api: {
        size: apiCache.size,
        maxSize: apiCache.max,
        memoryUsage: apiCache.calculatedSize,
      },
    };
  }

  private static getCache(cacheType: string) {
    switch (cacheType) {
      case 'search':
        return searchCache;
      case 'embedding':
        return embeddingCache;
      case 'api':
        return apiCache;
      default:
        return globalCache;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  search: (query: string, mode: string) => `search:${mode}:${query}`,
  embedding: (text: string) => `embedding:${text}`,
  weather: (lat: number, lng: number) => `weather:${lat}:${lng}`,
  news: (category: string) => `news:${category}`,
  chat: (chatId: string) => `chat:${chatId}`,
  message: (messageId: string) => `message:${messageId}`,
};

export default CacheManager;
