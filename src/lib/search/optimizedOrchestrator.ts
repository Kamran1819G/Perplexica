import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import { Document } from 'langchain/document';
import { searchSearxng } from '../searxng';
import { getDocumentsFromLinks } from '../utils/documents';
import CacheManager, { CacheKeys } from '../cache';
import { withErrorHandling, circuitBreakers, retryHandlers } from '../errorHandling';
import { trackAsync } from '../performance';
import { EventEmitter } from 'events';

// Connection pool for managing concurrent requests
class ConnectionPool {
  private pool: Array<{ id: string; inUse: boolean; lastUsed: number }> = [];
  private maxConnections: number;
  private timeout: number;

  constructor(maxConnections: number = 10, timeout: number = 30000) {
    this.maxConnections = maxConnections;
    this.timeout = timeout;
  }

  async acquire(): Promise<string> {
    // Clean up expired connections
    this.cleanup();

    // Find available connection
    const available = this.pool.find(conn => !conn.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.id;
    }

    // Create new connection if pool not full
    if (this.pool.length < this.maxConnections) {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.pool.push({
        id: connectionId,
        inUse: true,
        lastUsed: Date.now(),
      });
      return connectionId;
    }

    // Wait for connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.pool.find(conn => !conn.inUse);
        if (available) {
          clearInterval(checkInterval);
          available.inUse = true;
          available.lastUsed = Date.now();
          resolve(available.id);
        }
      }, 100);
    });
  }

  release(connectionId: string): void {
    const connection = this.pool.find(conn => conn.id === connectionId);
    if (connection) {
      connection.inUse = false;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    this.pool = this.pool.filter(conn => 
      conn.inUse || (now - conn.lastUsed) < this.timeout
    );
  }

  getStats() {
    return {
      total: this.pool.length,
      inUse: this.pool.filter(conn => conn.inUse).length,
      available: this.pool.filter(conn => !conn.inUse).length,
      maxConnections: this.maxConnections,
    };
  }
}

// Intelligent query prioritization
class QueryPrioritizer {
  private static readonly PRIORITY_WEIGHTS = {
    complexity: 0.3,
    userType: 0.2,
    timeOfDay: 0.1,
    resourceUsage: 0.4,
  };

  static calculatePriority(query: string, userContext?: any): number {
    const complexity = this.assessComplexity(query);
    const userType = this.getUserType(userContext);
    const timeOfDay = this.getTimeOfDay();
    const resourceUsage = this.getCurrentResourceUsage();

    return (
      complexity * this.PRIORITY_WEIGHTS.complexity +
      userType * this.PRIORITY_WEIGHTS.userType +
      timeOfDay * this.PRIORITY_WEIGHTS.timeOfDay +
      resourceUsage * this.PRIORITY_WEIGHTS.resourceUsage
    );
  }

  private static assessComplexity(query: string): number {
    const words = query.split(' ').length;
    const hasTechnicalTerms = /(api|algorithm|architecture|protocol|framework)/i.test(query);
    const hasComparison = /(vs|versus|compare|difference|similar)/i.test(query);
    
    let complexity = 0.5; // Base complexity
    
    if (words > 10) complexity += 0.2;
    if (hasTechnicalTerms) complexity += 0.2;
    if (hasComparison) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }

  private static getUserType(userContext?: any): number {
    // Higher priority for premium users or power users
    if (userContext?.userType === 'premium') return 0.9;
    if (userContext?.userType === 'power') return 0.7;
    return 0.5;
  }

  private static getTimeOfDay(): number {
    const hour = new Date().getHours();
    // Peak hours: 9-11 AM and 2-4 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      return 0.8;
    }
    return 0.5;
  }

  private static getCurrentResourceUsage(): number {
    // This would integrate with system monitoring
    // For now, return a base value
    return 0.5;
  }
}

// Optimized search orchestrator
export class OptimizedSearchOrchestrator {
  private connectionPool: ConnectionPool;
  private emitter: EventEmitter;
  private maxConcurrentSearches: number;
  private searchQueue: Array<{
    id: string;
    query: string;
    priority: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private activeSearches: Set<string> = new Set();

  constructor(maxConcurrentSearches: number = 5) {
    this.connectionPool = new ConnectionPool(maxConcurrentSearches * 2);
    this.emitter = new EventEmitter();
    this.maxConcurrentSearches = maxConcurrentSearches;
    this.processQueue();
  }

  async search(
    query: string,
    llm: BaseChatModel,
    embeddings: Embeddings,
    history: BaseMessage[],
    userContext?: any,
    options: {
      maxSources?: number;
      searchMode?: 'quick' | 'pro' | 'ultra';
      timeout?: number;
    } = {}
  ): Promise<{ documents: Document[]; sources: any[] }> {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const priority = QueryPrioritizer.calculatePriority(query, userContext);

    return new Promise((resolve, reject) => {
      this.searchQueue.push({
        id: searchId,
        query,
        priority,
        resolve,
        reject,
      });

      // Sort queue by priority
      this.searchQueue.sort((a, b) => b.priority - a.priority);
    });
  }

  private async processQueue(): Promise<void> {
    while (true) {
      if (this.searchQueue.length > 0 && this.activeSearches.size < this.maxConcurrentSearches) {
        const searchTask = this.searchQueue.shift()!;
        this.activeSearches.add(searchTask.id);

        // Process search in background
        this.executeSearch(searchTask).finally(() => {
          this.activeSearches.delete(searchTask.id);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async executeSearch(searchTask: any): Promise<void> {
    const { id, query, resolve, reject } = searchTask;

    try {
      // Check cache first
      const cacheKey = CacheKeys.search(query, 'optimized');
      const cached = CacheManager.get(cacheKey, 'search');
      
      if (cached) {
        this.emitter.emit('data', JSON.stringify({
          type: 'cache_hit',
          searchId: id,
          message: 'Using cached results',
        }));
        resolve(cached);
        return;
      }

      // Acquire connection from pool
      const connectionId = await this.connectionPool.acquire();

      try {
        const result = await trackAsync(
          'optimized_search',
          async () => {
            return await withErrorHandling(
              async () => {
                // Parallel search execution
                const [webResults, documentResults] = await Promise.allSettled([
                  this.searchWeb(query),
                  this.searchDocuments(query),
                ]);

                const documents: Document[] = [];
                const sources: any[] = [];

                // Process web results
                if (webResults.status === 'fulfilled') {
                  documents.push(...webResults.value.documents);
                  sources.push(...webResults.value.sources);
                }

                // Process document results
                if (documentResults.status === 'fulfilled') {
                  documents.push(...documentResults.value);
                }

                // Intelligent deduplication and ranking
                const deduplicated = this.deduplicateAndRank(documents, query);

                return {
                  documents: deduplicated,
                  sources,
                };
              },
              'optimized_search',
              {
                circuitBreaker: circuitBreakers.searxng,
                retryHandler: retryHandlers.search,
              }
            );
          },
          { searchId: id, query }
        );

        // Cache results
        CacheManager.set(cacheKey, result, 'search', 5 * 60 * 1000); // 5 minutes

        resolve(result);
      } finally {
        this.connectionPool.release(connectionId);
      }
    } catch (error) {
      reject(error);
    }
  }

  private async searchWeb(query: string): Promise<{ documents: Document[]; sources: any[] }> {
    const searchResults = await searchSearxng(query, {
      language: 'en',
      engines: ['google', 'bing', 'duckduckgo'],
      time_range: ['month'],
    });

    const documents = searchResults.results.map(
      (result) =>
        new Document({
          pageContent: result.content || result.title,
          metadata: {
            title: result.title,
            url: result.url,
            source: 'web',
          },
        })
    );

    return { documents, sources: searchResults.results };
  }

  private async searchDocuments(query: string): Promise<Document[]> {
    // This would integrate with document search functionality
    // For now, return empty array
    return [];
  }

  private deduplicateAndRank(documents: Document[], query: string): Document[] {
    // Remove exact duplicates
    const uniqueDocs = documents.filter((doc, index, self) =>
      index === self.findIndex(d => d.pageContent === doc.pageContent)
    );

    // Simple ranking based on content relevance
    const rankedDocs = uniqueDocs.map(doc => ({
      document: doc,
      score: this.calculateRelevanceScore(doc, query),
    }));

    // Sort by score and return top results
    return rankedDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.document);
  }

  private calculateRelevanceScore(doc: Document, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const content = doc.pageContent.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      const wordCount = (content.match(new RegExp(word, 'g')) || []).length;
      score += wordCount;
    });

    // Bonus for title matches
    const title = doc.metadata.title?.toLowerCase() || '';
    queryWords.forEach(word => {
      if (title.includes(word)) {
        score += 2;
      }
    });

    return score;
  }

  getStats() {
    return {
      queueLength: this.searchQueue.length,
      activeSearches: this.activeSearches.size,
      maxConcurrent: this.maxConcurrentSearches,
      connectionPool: this.connectionPool.getStats(),
    };
  }

  getEmitter(): EventEmitter {
    return this.emitter;
  }
}

export default OptimizedSearchOrchestrator;
