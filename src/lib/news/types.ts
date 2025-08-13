// News system type definitions
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  thumbnail?: string;
  publishedAt: string;
  source: {
    name: string;
    domain: string;
    credibility: 'high' | 'medium' | 'low';
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  qualityScore: number; // 0-100
  topics: string[];
  relevanceScore?: number; // User-specific relevance
  bias?: 'left' | 'center' | 'right' | 'unknown';
  factCheck?: {
    status: 'verified' | 'disputed' | 'unknown';
    confidence: number;
  };
}

export interface NewsFilter {
  topics?: string[];
  sources?: string[];
  sentiment?: ('positive' | 'negative' | 'neutral')[];
  timeRange?: {
    from: Date;
    to: Date;
  };
  qualityThreshold?: number;
  credibilityFilter?: ('high' | 'medium' | 'low')[];
}

export interface UserPreferences {
  interests: string[];
  preferredSources: string[];
  avoidedSources: string[];
  readingHistory: string[]; // Article IDs
  interactionHistory: {
    articleId: string;
    action: 'view' | 'share' | 'save' | 'like' | 'dislike';
    timestamp: Date;
  }[];
  personalizedTopics: {
    topic: string;
    weight: number; // 0-1
  }[];
}

export interface CrawlResult {
  articles: NewsArticle[];
  totalFound: number;
  sourcesScanned: string[];
  errors: string[];
  timestamp: Date;
}

export interface NewsAgent {
  name: string;
  type: 'crawler' | 'filter' | 'summarizer' | 'personalizer' | 'sentiment';
  status: 'active' | 'idle' | 'error';
  lastRun?: Date;
  performance: {
    accuracy: number;
    speed: number;
    reliability: number;
  };
}

export interface NewsPrompt {
  id: string;
  type: 'summarize' | 'analyze' | 'filter' | 'personalize';
  content: string;
  context?: any;
  parameters?: Record<string, any>;
}
