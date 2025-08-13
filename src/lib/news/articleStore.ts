// In-memory article storage (in production, this would be a database)
import { NewsArticle } from './types';

interface StoredArticle {
  article: NewsArticle;
  slug: string;
  timestamp: Date;
}

export class ArticleStore {
  private static instance: ArticleStore;
  private articles: Map<string, StoredArticle> = new Map();
  private slugToId: Map<string, string> = new Map();
  
  public static getInstance(): ArticleStore {
    if (!ArticleStore.instance) {
      ArticleStore.instance = new ArticleStore();
    }
    return ArticleStore.instance;
  }

  // Store article with slug mapping
  storeArticle(article: NewsArticle, slug: string): void {
    const stored: StoredArticle = {
      article,
      slug,
      timestamp: new Date()
    };
    
    this.articles.set(article.id, stored);
    this.slugToId.set(slug, article.id);
    
    // Clean up old articles to prevent memory leaks (keep last 1000)
    if (this.articles.size > 1000) {
      this.cleanup();
    }
  }

  // Get article by slug
  getArticleBySlug(slug: string): NewsArticle | null {
    const articleId = this.slugToId.get(slug);
    if (!articleId) return null;
    
    const stored = this.articles.get(articleId);
    return stored ? stored.article : null;
  }

  // Get article by ID
  getArticleById(id: string): NewsArticle | null {
    const stored = this.articles.get(id);
    return stored ? stored.article : null;
  }

  // Check if article exists by URL
  hasArticleByUrl(url: string): NewsArticle | null {
    for (const stored of this.articles.values()) {
      if (stored.article.url === url) {
        return stored.article;
      }
    }
    return null;
  }

  // Generate unique slug (handle duplicates)
  generateUniqueSlug(baseSlug: string): string {
    let slug = baseSlug;
    let counter = 1;
    
    while (this.slugToId.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  // Clean up old articles (keep most recent 800)
  private cleanup(): void {
    const sortedEntries = Array.from(this.articles.entries())
      .sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());
    
    // Keep most recent 800 articles
    const toKeep = sortedEntries.slice(0, 800);
    const toRemove = sortedEntries.slice(800);
    
    // Clear old entries
    this.articles.clear();
    this.slugToId.clear();
    
    // Restore kept entries
    toKeep.forEach(([id, stored]) => {
      this.articles.set(id, stored);
      this.slugToId.set(stored.slug, id);
    });
    
    console.log(`Cleaned up ${toRemove.length} old articles`);
  }

  // Get all stored articles (for debugging)
  getAllArticles(): NewsArticle[] {
    return Array.from(this.articles.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(stored => stored.article);
  }

  // Get statistics
  getStats(): { totalArticles: number; totalSlugs: number; oldestArticle: Date | null } {
    const articles = Array.from(this.articles.values());
    const oldestArticle = articles.length > 0 
      ? Math.min(...articles.map(a => a.timestamp.getTime()))
      : null;
    
    return {
      totalArticles: this.articles.size,
      totalSlugs: this.slugToId.size,
      oldestArticle: oldestArticle ? new Date(oldestArticle) : null
    };
  }
}
