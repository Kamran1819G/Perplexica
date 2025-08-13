// AI agent for personalized news recommendations
import { BaseNewsAgent } from './baseAgent';
import { NewsArticle, UserPreferences } from '../types';

export class PersonalizerAgent extends BaseNewsAgent {
  constructor() {
    super('News Personalizer', 'personalizer');
  }

  async process(data: { articles: NewsArticle[], userPreferences: UserPreferences }): Promise<NewsArticle[]> {
    const result = await this.executeWithErrorHandling(async () => {
      const { articles, userPreferences } = data;
      
      // Calculate relevance scores for each article
      const scoredArticles = await Promise.all(
        articles.map(article => this.calculateRelevanceScore(article, userPreferences))
      );

      // Sort by relevance score and return
      return scoredArticles
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        
    }, 'personalization');
    
    return result || data.articles;
  }

  private async calculateRelevanceScore(
    article: NewsArticle, 
    preferences: UserPreferences
  ): Promise<NewsArticle> {
    let score = 50; // Base relevance score

    // Interest-based scoring
    const userInterests = preferences.interests.map(i => i.toLowerCase());
    const articleTopics = article.topics.map(t => t.toLowerCase());
    
    // Topic matching
    const topicMatches = articleTopics.filter(topic => 
      userInterests.some(interest => 
        topic.includes(interest) || interest.includes(topic)
      )
    );
    score += topicMatches.length * 15;

    // Personalized topic weights
    preferences.personalizedTopics.forEach(({ topic, weight }) => {
      if (articleTopics.some(t => t.toLowerCase().includes(topic.toLowerCase()))) {
        score += weight * 20;
      }
    });

    // Source preference scoring
    const sourceDomain = article.source.domain;
    if (preferences.preferredSources.includes(sourceDomain)) {
      score += 20;
    }
    if (preferences.avoidedSources.includes(sourceDomain)) {
      score -= 30;
    }

    // Historical interaction patterns
    const similarArticlesInteracted = preferences.interactionHistory.filter(interaction => {
      // Find similar articles user has interacted with positively
      return ['like', 'share', 'save'].includes(interaction.action);
    });

    if (similarArticlesInteracted.length > 0) {
      score += Math.min(15, similarArticlesInteracted.length * 3);
    }

    // Reading history analysis
    const hasReadSimilar = preferences.readingHistory.length > 0;
    if (hasReadSimilar) {
      // Boost score if user typically reads this type of content
      score += 10;
    }

    // Quality and credibility boost
    score += article.qualityScore * 0.3; // 30% of quality score
    if (article.source.credibility === 'high') {
      score += 10;
    } else if (article.source.credibility === 'low') {
      score -= 15;
    }

    // Sentiment preference (if user tends to prefer certain sentiment)
    const sentimentHistory = preferences.interactionHistory
      .filter(h => ['like', 'share'].includes(h.action))
      .map(h => h.articleId); // In real implementation, we'd lookup article sentiment

    // Recency bonus for fresh content
    const hoursSincePublished = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSincePublished < 24) {
      score += 10 - (hoursSincePublished / 3); // Fresher = higher score
    }

    // Diversity penalty to avoid echo chambers
    const userTopicDistribution = this.calculateTopicDistribution(preferences);
    const articleMainTopic = article.topics[0] || 'General';
    const topicFrequency = userTopicDistribution[articleMainTopic] || 0;
    
    if (topicFrequency > 0.5) { // User reads this topic > 50% of the time
      score -= 5; // Small penalty to encourage diversity
    }

    return {
      ...article,
      relevanceScore: Math.max(0, Math.min(100, score))
    };
  }

  private calculateTopicDistribution(preferences: UserPreferences): Record<string, number> {
    const topicCounts: Record<string, number> = {};
    let totalInteractions = 0;

    preferences.interactionHistory.forEach(interaction => {
      if (['view', 'like', 'share'].includes(interaction.action)) {
        // In real implementation, we'd lookup the article's topics
        // For now, we'll simulate based on personalized topics
        totalInteractions++;
      }
    });

    preferences.personalizedTopics.forEach(({ topic, weight }) => {
      topicCounts[topic] = weight;
    });

    // Normalize to percentages
    Object.keys(topicCounts).forEach(topic => {
      topicCounts[topic] = topicCounts[topic] / Math.max(1, totalInteractions);
    });

    return topicCounts;
  }

  async updateUserPreferences(
    currentPreferences: UserPreferences,
    newInteraction: {
      articleId: string;
      topics: string[];
      source: string;
      action: 'view' | 'share' | 'save' | 'like' | 'dislike';
    }
  ): Promise<UserPreferences> {
    const updatedPreferences = { ...currentPreferences };

    // Add to interaction history
    updatedPreferences.interactionHistory.push({
      articleId: newInteraction.articleId,
      action: newInteraction.action,
      timestamp: new Date()
    });

    // Keep only last 1000 interactions
    if (updatedPreferences.interactionHistory.length > 1000) {
      updatedPreferences.interactionHistory = updatedPreferences.interactionHistory.slice(-1000);
    }

    // Update topic weights based on positive interactions
    if (['like', 'share', 'save'].includes(newInteraction.action)) {
      newInteraction.topics.forEach(topic => {
        const existingTopic = updatedPreferences.personalizedTopics.find(pt => pt.topic === topic);
        if (existingTopic) {
          existingTopic.weight = Math.min(1, existingTopic.weight + 0.05);
        } else {
          updatedPreferences.personalizedTopics.push({ topic, weight: 0.1 });
        }
      });

      // Add to preferred sources if positive interaction
      if (!updatedPreferences.preferredSources.includes(newInteraction.source)) {
        updatedPreferences.preferredSources.push(newInteraction.source);
      }
    }

    // Reduce weights for negative interactions
    if (newInteraction.action === 'dislike') {
      newInteraction.topics.forEach(topic => {
        const existingTopic = updatedPreferences.personalizedTopics.find(pt => pt.topic === topic);
        if (existingTopic) {
          existingTopic.weight = Math.max(0, existingTopic.weight - 0.1);
        }
      });

      // Add to avoided sources
      if (!updatedPreferences.avoidedSources.includes(newInteraction.source)) {
        updatedPreferences.avoidedSources.push(newInteraction.source);
      }
    }

    return updatedPreferences;
  }

  // Generate personalized news feed
  async generatePersonalizedFeed(
    allArticles: NewsArticle[],
    userPreferences: UserPreferences,
    limit = 20
  ): Promise<NewsArticle[]> {
    const personalizedArticles = await this.process({ articles: allArticles, userPreferences });
    
    // Apply diversity filter to avoid echo chambers
    const diverseFeed = this.applyDiversityFilter(personalizedArticles, limit);
    
    return diverseFeed.slice(0, limit);
  }

  private applyDiversityFilter(articles: NewsArticle[], limit: number): NewsArticle[] {
    const result: NewsArticle[] = [];
    const usedTopics = new Set<string>();
    const usedSources = new Set<string>();
    
    // First pass: High relevance articles with diverse topics
    for (const article of articles) {
      if (result.length >= limit) break;
      
      const mainTopic = article.topics[0];
      if (!usedTopics.has(mainTopic) && (article.relevanceScore || 0) > 70) {
        result.push(article);
        usedTopics.add(mainTopic);
        usedSources.add(article.source.domain);
      }
    }
    
    // Second pass: Fill remaining slots with diverse sources
    for (const article of articles) {
      if (result.length >= limit) break;
      
      if (!result.includes(article) && !usedSources.has(article.source.domain)) {
        result.push(article);
        usedSources.add(article.source.domain);
      }
    }
    
    // Third pass: Fill any remaining slots
    for (const article of articles) {
      if (result.length >= limit) break;
      
      if (!result.includes(article)) {
        result.push(article);
      }
    }
    
    return result;
  }
}
