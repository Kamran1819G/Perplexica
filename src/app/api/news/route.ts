import { NextRequest, NextResponse } from 'next/server';
import { searchSearxng } from '@/lib/searxng';
import { getNewsEnginesForCategory } from '@/lib/newsSearchEngines';
import { FilterAgent } from '@/lib/news/agents/filterAgent';
import { SummarizerAgent } from '@/lib/news/agents/summarizerAgent';
import { PersonalizerAgent } from '@/lib/news/agents/personalizerAgent';
import { NewsArticle, UserPreferences, NewsFilter } from '@/lib/news/types';

// Initialize AI agents
const filterAgent = new FilterAgent();
const summarizerAgent = new SummarizerAgent();
const personalizerAgent = new PersonalizerAgent();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const category = searchParams.get('category') || 'general';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const personalize = searchParams.get('personalize') === 'true';
    const includeAI = searchParams.get('includeAI') === 'true';
    const minQuality = parseInt(searchParams.get('minQuality') || '30');
    const userId = searchParams.get('userId');
    
    // Parse filter parameters
    const topicsParam = searchParams.get('topics');
    const sourcesParam = searchParams.get('sources');
    const sentimentParam = searchParams.get('sentiment');
    
    const filter: NewsFilter = {
      topics: topicsParam ? topicsParam.split(',') : undefined,
      sources: sourcesParam ? sourcesParam.split(',') : undefined,
      sentiment: sentimentParam ? [sentimentParam as any] : undefined,
      qualityThreshold: minQuality
    };

    // Get news engines based on category
    const newsEngines = getNewsEnginesForCategory('primary');
    
    // Build search query based on category and filters
    let searchQuery = '';
    if (category && category !== 'general') {
      searchQuery = category;
    }
    if (filter.topics && filter.topics.length > 0) {
      searchQuery += ` ${filter.topics.join(' OR ')}`;
    }
    
    // If no specific query, use trending topics
    if (!searchQuery.trim()) {
      searchQuery = 'breaking news OR latest news';
    }

    // Fetch news from multiple engines
    const searchPromises = newsEngines.map(engine => 
      searchSearxng(searchQuery, {
        engines: [engine],
        pageno: page,
        time_range: 'day', // Focus on recent news
      }).catch(err => {
        console.warn(`Engine ${engine} failed:`, err);
        return { results: [] };
      })
    );

    const results = await Promise.allSettled(searchPromises);
    const rawArticles = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value.results)
      .flat();

    // Convert to our NewsArticle format
    let articles: NewsArticle[] = rawArticles.map((result: any, index: number) => {
      const url = new URL(result.url);
      return {
        id: `article_${Date.now()}_${index}`,
        title: result.title || 'Untitled',
        content: result.content || result.description || '',
        url: result.url,
        thumbnail: result.img_src || result.thumbnail,
        publishedAt: result.publishedDate || result.date || new Date().toISOString(),
        source: {
          name: result.engine || url.hostname.replace('www.', ''),
          domain: url.hostname.replace('www.', ''),
          credibility: 'medium' as const
        },
        qualityScore: 50, // Will be updated by filter agent
        topics: [] // Will be populated by filter agent
      };
    });

    // Remove duplicates by URL
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );

    // Apply AI processing if requested
    if (includeAI) {
      // Filter and enhance articles with AI
      const filteredArticles = await filterAgent.batchFilter(uniqueArticles, minQuality);
      
      // Add summaries
      articles = await summarizerAgent.batchProcess(filteredArticles);
    } else {
      articles = uniqueArticles;
    }

    // Apply personalization if requested and user provided
    if (personalize && userId) {
      try {
        // In production, fetch user preferences from database
        const userPreferences: UserPreferences = {
          interests: ['technology', 'business'], // Example
          preferredSources: [],
          avoidedSources: [],
          readingHistory: [],
          interactionHistory: [],
          personalizedTopics: [
            { topic: 'Technology', weight: 0.8 },
            { topic: 'Business', weight: 0.6 }
          ]
        };

        articles = await personalizerAgent.generatePersonalizedFeed(
          articles, 
          userPreferences, 
          limit
        );
      } catch (error) {
        console.error('Personalization failed:', error);
        // Continue without personalization
      }
    }

    // Apply additional filters
    if (filter.sentiment) {
      articles = articles.filter(article => 
        !article.sentiment || filter.sentiment!.includes(article.sentiment)
      );
    }

    if (filter.sources) {
      articles = articles.filter(article => 
        filter.sources!.some(source => 
          article.source.domain.includes(source) || 
          article.source.name.toLowerCase().includes(source.toLowerCase())
        )
      );
    }

    // Sort by relevance score (if personalized) or by publication date
    articles.sort((a, b) => {
      if (personalize && a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

    // Prepare response with metadata
    const response = {
      success: true,
      data: paginatedArticles,
      metadata: {
        total: articles.length,
        page,
        limit,
        totalPages: Math.ceil(articles.length / limit),
        category,
        personalized: personalize,
        aiEnhanced: includeAI,
        filters: filter,
        engines: newsEngines,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in enhanced news API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, articleId, topics, source, preferences } = body;

    switch (action) {
      case 'updatePreferences':
        if (!userId || !preferences) {
          return NextResponse.json(
            { success: false, error: 'Missing userId or preferences' },
            { status: 400 }
          );
        }
        
        // In production, save to database
        // await saveUserPreferences(userId, preferences);
        
        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully'
        });

      case 'recordInteraction':
        if (!userId || !articleId || !action) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          );
        }

        // In production, update user interaction history
        // const updatedPreferences = await personalizerAgent.updateUserPreferences(
        //   currentPreferences, 
        //   { articleId, topics, source, action }
        // );
        // await saveUserPreferences(userId, updatedPreferences);

        return NextResponse.json({
          success: true,
          message: 'Interaction recorded'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in news POST endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}