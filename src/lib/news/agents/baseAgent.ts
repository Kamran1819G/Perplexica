// Base class for all news AI agents
import { NewsAgent, NewsArticle, NewsPrompt } from '../types';

export abstract class BaseNewsAgent {
  protected name: string;
  protected type: NewsAgent['type'];
  protected status: NewsAgent['status'] = 'idle';
  protected lastRun?: Date;
  protected performance = {
    accuracy: 0,
    speed: 0,
    reliability: 0
  };

  constructor(name: string, type: NewsAgent['type']) {
    this.name = name;
    this.type = type;
  }

  abstract process(input: any): Promise<any>;

  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> {
    try {
      this.status = 'active';
      const startTime = Date.now();
      
      const result = await operation();
      
      const endTime = Date.now();
      this.updatePerformance(endTime - startTime, true);
      this.status = 'idle';
      this.lastRun = new Date();
      
      return result;
    } catch (error) {
      console.error(`${this.name} - ${operationName} failed:`, error);
      this.status = 'error';
      this.updatePerformance(0, false);
      return null;
    }
  }

  protected updatePerformance(executionTime: number, success: boolean) {
    // Update speed metric (lower is better, normalize to 0-100 scale)
    const speedScore = Math.max(0, 100 - (executionTime / 100));
    this.performance.speed = (this.performance.speed + speedScore) / 2;

    // Update reliability metric
    const reliabilityDelta = success ? 5 : -10;
    this.performance.reliability = Math.max(0, Math.min(100, 
      this.performance.reliability + reliabilityDelta
    ));
  }

  getAgentInfo(): NewsAgent {
    return {
      name: this.name,
      type: this.type,
      status: this.status,
      lastRun: this.lastRun,
      performance: this.performance
    };
  }

  // Common prompt templates for different agent types
  protected getPromptTemplate(promptType: string, context: any): NewsPrompt {
    const basePrompts = {
      summarize: `Summarize this news article in 2-3 sentences, focusing on the key facts and implications. Maintain objectivity and avoid editorial opinions.`,
      
      analyze_sentiment: `Analyze the sentiment and bias of this news article. Categorize as positive/negative/neutral and identify any political or ideological bias (left/center/right). Provide confidence scores.`,
      
      filter_quality: `Evaluate this news article for quality and credibility. Consider: source reputation, factual accuracy, writing quality, completeness, and potential misinformation. Score from 0-100.`,
      
      personalize: `Based on the user's reading history and preferences, calculate relevance score (0-100) for this article. Consider topic alignment, source preferences, and past engagement patterns.`,
      
      extract_topics: `Extract 3-5 main topics/categories from this news article. Use standardized topic labels like: Technology, Politics, Business, Health, Sports, Entertainment, Science, World News, etc.`
    };

    return {
      id: `${this.name}_${Date.now()}`,
      type: promptType as any,
      content: basePrompts[promptType as keyof typeof basePrompts] || '',
      context,
      parameters: {
        timestamp: new Date().toISOString(),
        agent: this.name
      }
    };
  }
}
