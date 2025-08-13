// AI agent for intelligent news article summarization
import { BaseNewsAgent } from './baseAgent';
import { NewsArticle } from '../types';

export class SummarizerAgent extends BaseNewsAgent {
  constructor() {
    super('News Summarizer', 'summarizer');
  }

  async process(article: NewsArticle): Promise<NewsArticle> {
    const result = await this.executeWithErrorHandling(async () => {
      const prompt = this.getPromptTemplate('summarize', {
        title: article.title,
        content: article.content,
        source: article.source.name
      });

      // Create enhanced summary using AI
      const summary = await this.generateSummary(article);
      
      return {
        ...article,
        summary
      };
    }, 'article summarization');
    
    return result || article;
  }

  private async generateSummary(article: NewsArticle): Promise<string> {
    // Enhanced summarization logic
    const content = article.content;
    
    if (!content || content.length < 100) {
      return article.title; // Fallback for short content
    }

    try {
      // For now, create intelligent extractive summary
      // In production, this would call an LLM API
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (sentences.length <= 2) {
        return content.substring(0, 200) + '...';
      }

      // Extract key sentences based on position and keywords
      const keyWords = this.extractKeywords(article.title);
      const scoredSentences = sentences.map((sentence, index) => {
        let score = 0;
        
        // Position bonus (first and last sentences are often important)
        if (index === 0) score += 3;
        if (index === sentences.length - 1) score += 2;
        
        // Keyword matching
        keyWords.forEach(keyword => {
          if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
            score += 2;
          }
        });
        
        // Length bonus (not too short, not too long)
        if (sentence.length > 50 && sentence.length < 200) {
          score += 1;
        }
        
        return { sentence: sentence.trim(), score, index };
      });

      // Select top 2-3 sentences
      const topSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .sort((a, b) => a.index - b.index)
        .map(s => s.sentence);

      return topSentences.join('. ') + '.';
      
    } catch (error) {
      console.error('Summary generation failed:', error);
      return content.substring(0, 200) + '...';
    }
  }

  private extractKeywords(title: string): string[] {
    // Extract important words from title
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }

  async batchProcess(articles: NewsArticle[]): Promise<NewsArticle[]> {
    const results = await Promise.allSettled(
      articles.map(article => this.process(article))
    );

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<NewsArticle>).value);
  }
}
