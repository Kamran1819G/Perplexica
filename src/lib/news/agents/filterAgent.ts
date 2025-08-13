// AI agent for news quality filtering and scoring
import { BaseNewsAgent } from './baseAgent';
import { NewsArticle } from '../types';

export class FilterAgent extends BaseNewsAgent {
  private trustedDomains = new Set([
    'reuters.com', 'bbc.com', 'apnews.com', 'npr.org', 'pbs.org',
    'wsj.com', 'ft.com', 'bloomberg.com', 'economist.com',
    'nytimes.com', 'washingtonpost.com', 'theguardian.com',
    'cnn.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com'
  ]);

  private suspiciousDomains = new Set([
    // Add domains known for misinformation
    'example-fake-news.com'
  ]);

  constructor() {
    super('Content Filter', 'filter');
  }

  async process(article: NewsArticle): Promise<NewsArticle> {
    const result = await this.executeWithErrorHandling(async () => {
      const qualityScore = await this.calculateQualityScore(article);
      const credibility = this.assessSourceCredibility(article.source.domain);
      const sentiment = await this.analyzeSentiment(article);
      const bias = await this.detectBias(article);
      const topics = await this.extractTopics(article);

      return {
        ...article,
        qualityScore,
        source: {
          ...article.source,
          credibility
        },
        sentiment,
        bias,
        topics
      };
    }, 'article filtering');
    
    return result || article;
  }

  private async calculateQualityScore(article: NewsArticle): Promise<number> {
    let score = 50; // Base score

    // Content length and structure
    if (article.content.length < 100) {
      score -= 20; // Too short
    } else if (article.content.length > 500) {
      score += 10; // Good length
    }

    // Title quality
    if (article.title.length < 20) {
      score -= 10; // Too short title
    }
    if (article.title.includes('BREAKING') || article.title.includes('URGENT')) {
      score += 5; // Breaking news indicator
    }
    if (article.title.split('').filter(c => c === '!').length > 2) {
      score -= 15; // Too many exclamation marks (clickbait indicator)
    }

    // Source credibility
    const domain = article.source.domain;
    if (this.trustedDomains.has(domain)) {
      score += 20;
    } else if (this.suspiciousDomains.has(domain)) {
      score -= 30;
    }

    // Content quality indicators
    const sentences = article.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 5) {
      score += 5; // Good structure
    }

    // Check for potential misinformation indicators
    const misinformationPatterns = [
      /\b(fake|hoax|conspiracy|coverup)\b/i,
      /\b(they don't want you to know|shocking truth|hidden agenda)\b/i,
      /\b(doctors hate this|one weird trick|shocking secret)\b/i
    ];

    misinformationPatterns.forEach(pattern => {
      if (pattern.test(article.content) || pattern.test(article.title)) {
        score -= 20;
      }
    });

    // Fact-checking indicators
    if (article.content.includes('according to') || article.content.includes('sources say')) {
      score += 5; // Attribution
    }

    return Math.max(0, Math.min(100, score));
  }

  private assessSourceCredibility(domain: string): 'high' | 'medium' | 'low' {
    if (this.trustedDomains.has(domain)) {
      return 'high';
    } else if (this.suspiciousDomains.has(domain)) {
      return 'low';
    }
    return 'medium';
  }

  private async analyzeSentiment(article: NewsArticle): Promise<'positive' | 'negative' | 'neutral'> {
    const text = `${article.title} ${article.content}`.toLowerCase();
    
    // Simple sentiment analysis using keyword matching
    const positiveWords = ['good', 'great', 'excellent', 'success', 'win', 'positive', 'growth', 'increase', 'improve', 'benefit'];
    const negativeWords = ['bad', 'terrible', 'fail', 'loss', 'negative', 'decline', 'decrease', 'problem', 'crisis', 'threat'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      positiveCount += (text.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });
    
    negativeWords.forEach(word => {
      negativeCount += (text.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    });
    
    if (positiveCount > negativeCount + 2) {
      return 'positive';
    } else if (negativeCount > positiveCount + 2) {
      return 'negative';
    }
    return 'neutral';
  }

  private async detectBias(article: NewsArticle): Promise<'left' | 'center' | 'right' | 'unknown'> {
    // Simple bias detection based on language patterns
    const text = `${article.title} ${article.content}`.toLowerCase();
    
    const leftIndicators = ['progressive', 'liberal', 'social justice', 'climate change', 'inequality'];
    const rightIndicators = ['conservative', 'traditional', 'free market', 'law and order', 'border security'];
    
    let leftScore = 0;
    let rightScore = 0;
    
    leftIndicators.forEach(indicator => {
      leftScore += (text.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    });
    
    rightIndicators.forEach(indicator => {
      rightScore += (text.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    });
    
    if (leftScore > rightScore + 1) return 'left';
    if (rightScore > leftScore + 1) return 'right';
    if (leftScore + rightScore > 0) return 'center';
    return 'unknown';
  }

  private async extractTopics(article: NewsArticle): Promise<string[]> {
    const text = `${article.title} ${article.content}`.toLowerCase();
    const topics: string[] = [];
    
    const topicKeywords = {
      'Technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer', 'digital', 'internet', 'data', 'cyber'],
      'Politics': ['election', 'government', 'political', 'senate', 'congress', 'president', 'policy', 'law', 'vote'],
      'Business': ['business', 'economy', 'market', 'financial', 'company', 'corporate', 'trade', 'economic', 'finance'],
      'Health': ['health', 'medical', 'hospital', 'doctor', 'disease', 'medicine', 'treatment', 'healthcare', 'patient'],
      'Sports': ['sports', 'game', 'team', 'player', 'championship', 'league', 'match', 'tournament', 'athlete'],
      'Entertainment': ['movie', 'music', 'celebrity', 'film', 'entertainment', 'actor', 'show', 'concert', 'theater'],
      'Science': ['science', 'research', 'study', 'scientist', 'discovery', 'experiment', 'scientific', 'laboratory'],
      'World News': ['international', 'global', 'world', 'foreign', 'country', 'nation', 'embassy', 'diplomatic'],
      'Environment': ['climate', 'environment', 'green', 'sustainable', 'pollution', 'renewable', 'carbon', 'ecology']
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.some(keyword => text.includes(keyword));
      if (matches) {
        topics.push(topic);
      }
    });
    
    return topics.length > 0 ? topics : ['General'];
  }

  async batchFilter(articles: NewsArticle[], minQualityScore = 30): Promise<NewsArticle[]> {
    const filteredArticles = await Promise.allSettled(
      articles.map(article => this.process(article))
    );

    return filteredArticles
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<NewsArticle>).value)
      .filter(article => article.qualityScore >= minQualityScore);
  }
}
