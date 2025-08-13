import axios from 'axios';
import { getSearxngApiEndpoint } from './config';
import { Document } from 'langchain/document';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  time_range?: string[];
  format?: 'json' | 'html';
  safesearch?: 0 | 1 | 2;
  autocomplete?: boolean;
  suggestions?: boolean;
  maxResults?: number;
  diversityBoost?: boolean;
}

export interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
  publishedDate?: string;
  category?: string;
  engine?: string;
  score?: number;
}

export interface SearchQuery {
  text: string;
  weight: number;
  category?: string;
  timeRange?: string;
}

export class SearxngClient {
  private baseUrl: string;
  private defaultOptions: SearxngSearchOptions;
  private cache: Map<string, { results: SearxngSearchResult[], timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private requestPool: Map<string, Promise<any>> = new Map(); // Prevent duplicate requests

  constructor(options: Partial<SearxngSearchOptions> = {}) {
    this.baseUrl = getSearxngApiEndpoint();
    this.defaultOptions = {
      format: 'json',
      maxResults: 50,
      diversityBoost: true,
      ...options
    };
  }

  async search(
    query: string,
    options: SearxngSearchOptions = {}
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const cacheKey = `${query}-${JSON.stringify(mergedOptions)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { results: cached.results, suggestions: [] };
    }

    // Check if request is already in progress
    const existingRequest = this.requestPool.get(cacheKey);
    if (existingRequest) {
      return await existingRequest;
    }

    // Create new request
    const requestPromise = this.performSearch(query, mergedOptions, cacheKey);
    this.requestPool.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      this.requestPool.delete(cacheKey);
      return result;
    } catch (error) {
      this.requestPool.delete(cacheKey);
      throw error;
    }
  }

  private async performSearch(
    query: string, 
    options: SearxngSearchOptions, 
    cacheKey: string
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = this.buildSearchUrl(query, options);
        const timeoutMs = attempt === 0 ? 5000 : (attempt === 1 ? 8000 : 12000); // Progressive timeout
        
        const response = await axios.get(url.toString(), {
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Perplexify/1.11.0-rc1',
            'Accept': 'application/json',
            'Connection': 'keep-alive',
          },
          validateStatus: (status) => status < 500, // Accept 4xx errors but retry on 5xx
        });

        // Handle non-200 responses
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let results: SearxngSearchResult[] = response.data?.results || [];
        const suggestions: string[] = response.data?.suggestions || [];

        // Apply result processing
        results = this.processResults(results, options);

        // Cache results
        this.cache.set(cacheKey, { results, timestamp: Date.now() });
        
        // Clean old cache entries
        if (this.cache.size > 100) {
          const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
          oldestKeys.forEach(key => this.cache.delete(key));
        }
        
        return { results, suggestions };
      } catch (error: any) {
        lastError = error;
        const isTimeoutError = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
        const isServerError = error.response?.status >= 500;
        
        // Log attempt details
        console.warn(`SearXNG search attempt ${attempt + 1}/${maxRetries + 1} failed:`, {
          error: error.message,
          code: error.code,
          status: error.response?.status,
          isTimeout: isTimeoutError,
          isNetwork: isNetworkError,
          isServer: isServerError
        });

        // Don't retry for client errors (4xx) unless it's specific cases
        if (error.response?.status >= 400 && error.response?.status < 500 && 
            error.response?.status !== 429) { // Retry on rate limits
          break;
        }

        // If this is the last attempt, break
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    console.error(`SearXNG search failed after ${maxRetries + 1} attempts:`, lastError?.message || 'Unknown error');
    return { results: [], suggestions: [] };
  }

  async multiQuerySearch(
    queries: SearchQuery[],
    options: SearxngSearchOptions = {}
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const allResults: SearxngSearchResult[] = [];
    const allSuggestions: string[] = [];

    // Execute searches in parallel with aggressive concurrency
    const searchPromises = queries.map(async (query) => {
      const queryOptions = { 
        ...mergedOptions,
        maxResults: Math.ceil((mergedOptions.maxResults || 50) / queries.length) // Distribute results
      };
      
      // Apply query-specific options
      if (query.category) {
        queryOptions.categories = [query.category];
      }
      if (query.timeRange) {
        queryOptions.time_range = [query.timeRange];
      }

      try {
        const result = await this.search(query.text, queryOptions);
        return {
          results: result.results.map(r => ({ ...r, score: (r.score || 0) * query.weight })),
          suggestions: result.suggestions
        };
      } catch (error) {
        console.warn(`Search failed for query: ${query.text}`, error);
        return { results: [], suggestions: [] };
      }
    });

    const searchResults = await Promise.allSettled(searchPromises);

    // Fast aggregation and deduplication
    const seenUrls = new Set<string>();
    searchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { results, suggestions } = result.value;
        
        // Fast URL deduplication
        for (const item of results) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allResults.push(item);
          }
        }
        allSuggestions.push(...suggestions);
      }
    });

    // Remove duplicates and sort by score
    const uniqueResults = this.deduplicateResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Remove duplicate suggestions
    const uniqueSuggestions = [...new Set(allSuggestions)];

    return {
      results: sortedResults.slice(0, mergedOptions.maxResults || 50),
      suggestions: uniqueSuggestions
    };
  }

  async searchWithFallback(
    query: string,
    options: SearxngSearchOptions = {}
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[]; fallbackUsed: boolean }> {
    try {
      const result = await this.search(query, options);
      return { ...result, fallbackUsed: false };
    } catch (error) {
      console.warn('Primary search failed, using fallback:', error);
      
      // Fallback: try with simplified options
      const fallbackOptions = {
        ...options,
        engines: ['google', 'bing'], // Use reliable engines
        maxResults: Math.min(options.maxResults || 50, 20)
      };

      try {
        const fallbackResult = await this.search(query, fallbackOptions);
        return { ...fallbackResult, fallbackUsed: true };
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        return { results: [], suggestions: [], fallbackUsed: true };
      }
    }
  }

  async searchByCategory(
    query: string,
    category: string,
    options: SearxngSearchOptions = {}
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
    const categoryOptions = {
      ...options,
      categories: [category]
    };

    return this.search(query, categoryOptions);
  }

  async searchWithTimeRange(
    query: string,
    timeRange: string,
    options: SearxngSearchOptions = {}
  ): Promise<{ results: SearxngSearchResult[]; suggestions: string[] }> {
    const timeOptions = {
      ...options,
      time_range: [timeRange]
    };

    return this.search(query, timeOptions);
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const url = this.buildSearchUrl(query, { 
        ...this.defaultOptions, 
        suggestions: true,
        maxResults: 10
      });
      
      const response = await axios.get(url.toString());
      return response.data.suggestions || [];
    } catch (error) {
      console.warn('Failed to get suggestions:', error);
      return [];
    }
  }

  private buildSearchUrl(query: string, options: SearxngSearchOptions): URL {
    const url = new URL(`${this.baseUrl}/search`);
    
    // Add query
    url.searchParams.append('q', query);
    
    // Add format
    if (options.format) {
      url.searchParams.append('format', options.format);
    }

    // Add other parameters
    if (options.categories && options.categories.length > 0) {
      url.searchParams.append('categories', options.categories.join(','));
    }

    if (options.engines && options.engines.length > 0) {
      url.searchParams.append('engines', options.engines.join(','));
    }

    if (options.language) {
      url.searchParams.append('language', options.language);
    }

    if (options.pageno) {
      url.searchParams.append('pageno', options.pageno.toString());
    }

    if (options.time_range && options.time_range.length > 0) {
      url.searchParams.append('time_range', options.time_range.join(','));
    }

    if (options.safesearch !== undefined) {
      url.searchParams.append('safesearch', options.safesearch.toString());
    }

    if (options.autocomplete) {
      url.searchParams.append('autocomplete', '1');
    }

    if (options.suggestions) {
      url.searchParams.append('suggestions', '1');
    }

    return url;
  }

  private processResults(
    results: SearxngSearchResult[],
    options: SearxngSearchOptions
  ): SearxngSearchResult[] {
    let processed = results;

    // Apply diversity boost if enabled
    if (options.diversityBoost) {
      processed = this.applyDiversityBoost(processed);
    }

    // Limit results
    if (options.maxResults) {
      processed = processed.slice(0, options.maxResults);
    }

    return processed;
  }

  private applyDiversityBoost(results: SearxngSearchResult[]): SearxngSearchResult[] {
    const diversified: SearxngSearchResult[] = [];
    const usedDomains = new Set<string>();

    // First pass: add one result from each domain
    results.forEach(result => {
      const domain = this.extractDomain(result.url);
      if (!usedDomains.has(domain)) {
        diversified.push(result);
        usedDomains.add(domain);
      }
    });

    // Second pass: add remaining results
    results.forEach(result => {
      if (!diversified.find(r => r.url === result.url)) {
        diversified.push(result);
      }
    });

    return diversified;
  }

  private deduplicateResults(results: SearxngSearchResult[]): SearxngSearchResult[] {
    const seen = new Set<string>();
    const unique: SearxngSearchResult[] = [];

    results.forEach(result => {
      if (!seen.has(result.url)) {
        seen.add(result.url);
        unique.push(result);
      }
    });

    return unique;
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  // Convert results to LangChain documents
  toDocuments(results: SearxngSearchResult[]): Document[] {
    return results.map(result => new Document({
      pageContent: result.content || result.title,
      metadata: {
        title: result.title,
        url: result.url,
        source: 'searxng',
        score: result.score || 0,
        category: result.category,
        engine: result.engine,
        publishedDate: result.publishedDate,
        author: result.author
      }
    }));
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/healthz`, { 
        timeout: 3000,
        headers: {
          'User-Agent': 'Perplexify/1.11.0-rc1',
          'Accept': 'application/json',
        },
      });
      return response.status === 200;
    } catch (error: any) {
      console.warn('SearXNG health check failed:', error.message);
      return false;
    }
  }
}

// Export the original function for backward compatibility
export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('Invalid search query provided:', query);
      return { results: [], suggestions: [] };
    }

    const searcher = new SearxngClient();
    const result = await searcher.search(query.trim(), opts);
    return {
      results: result.results || [],
      suggestions: result.suggestions || []
    };
  } catch (error: any) {
    console.error('Error in searchSearxng wrapper:', error.message);
    return { results: [], suggestions: [] };
  }
};
