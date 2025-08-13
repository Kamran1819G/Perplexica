import { NextRequest, NextResponse } from 'next/server';
import { searchSearxng } from '@/lib/searxng';
import { FilterAgent } from '@/lib/news/agents/filterAgent';
import { SummarizerAgent } from '@/lib/news/agents/summarizerAgent';
import { ArticleScraper } from '@/lib/news/scraper';
import { ArticleStore } from '@/lib/news/articleStore';
import { NewsArticle } from '@/lib/news/types';

const filterAgent = new FilterAgent();
const summarizerAgent = new SummarizerAgent();
const scraper = ArticleScraper.getInstance();
const articleStore = ArticleStore.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    
    // Try to get article by slug first (most common case)
    let article = articleStore.getArticleBySlug(slug);
    let relatedArticles: NewsArticle[] = [];

    if (article) {
      // Article found in store, get related articles
      if (article.topics.length > 0) {
        relatedArticles = await findRelatedArticles(article.topics, article.url);
      }
    } else {
      // Check if slug is a URL (fallback for direct URL access)
      if (slug.startsWith('http')) {
        article = await scrapeAndStoreArticle(slug);
        
        // Find related articles based on the topics
        if (article.topics.length > 0) {
          relatedArticles = await findRelatedArticles(article.topics, slug);
        }
      } else {
        // Try to find by URL in existing articles
        const existingArticle = findArticleByTitleSlug(slug);
        if (existingArticle) {
          article = existingArticle;
          if (article.topics.length > 0) {
            relatedArticles = await findRelatedArticles(article.topics, article.url);
          }
        } else {
          throw new Error('Article not found');
        }
      }
    }

    return NextResponse.json({
      success: true,
      article,
      related: relatedArticles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Article not found or could not be processed',
        timestamp: new Date().toISOString()
      },
      { status: 404 }
    );
  }
}

async function scrapeAndStoreArticle(url: string): Promise<NewsArticle> {
  try {
    // Check if we already have this article
    const existingArticle = articleStore.hasArticleByUrl(url);
    if (existingArticle) {
      return existingArticle;
    }

    // Scrape the article content
    const scrapedData = await scraper.scrapeArticle(url);
    
    // Create NewsArticle from scraped data
    const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const article = scraper.toNewsArticle(scrapedData, url, articleId);

    // Enhance with AI analysis
    const enhancedArticle = await filterAgent.process(article);
    const finalArticle = await summarizerAgent.process(enhancedArticle);

    // Generate slug from title and store
    const baseSlug = scraper.generateSlug(finalArticle.title);
    const uniqueSlug = articleStore.generateUniqueSlug(baseSlug);
    articleStore.storeArticle(finalArticle, uniqueSlug);

    return finalArticle;

  } catch (error) {
    console.error('Failed to scrape and store article:', error);
    throw new Error('Could not process article');
  }
}

function findArticleByTitleSlug(slug: string): NewsArticle | null {
  // Search through stored articles for partial matches
  const allArticles = articleStore.getAllArticles();
  
  // Try exact slug match first
  let found = articleStore.getArticleBySlug(slug);
  if (found) return found;
  
  // Try to find by similar slug patterns
  const slugVariations = [
    slug,
    slug.replace(/-/g, ' '),
    slug.replace(/-/g, ''),
  ];
  
  for (const article of allArticles) {
    const articleSlug = scraper.generateSlug(article.title);
    if (slugVariations.some(variation => 
      articleSlug.includes(variation) || variation.includes(articleSlug)
    )) {
      return article;
    }
  }
  
  return null;
}

async function findRelatedArticles(topics: string[], excludeUrl: string): Promise<NewsArticle[]> {
  try {
    const relatedArticles: NewsArticle[] = [];
    
    // Search for articles with similar topics
    for (const topic of topics.slice(0, 2)) { // Limit to 2 topics to avoid too many requests
      try {
        const searchResult = await searchSearxng(topic, {
          engines: ['bing news', 'google news'],
          pageno: 1,
          time_range: ['week']
        });

        if (searchResult.results) {
          const topicArticles = searchResult.results
            .filter((result: any) => result.url !== excludeUrl) // Exclude the current article
            .slice(0, 3) // Limit results per topic
            .map((result: any, index: number) => {
              const url = new URL(result.url);
              return {
                id: `related_${Date.now()}_${index}`,
                title: result.title || 'Related Article',
                content: result.content || result.description || '',
                url: result.url,
                thumbnail: result.img_src || result.thumbnail,
                publishedAt: result.publishedDate || result.date || new Date().toISOString(),
                source: {
                  name: result.engine || url.hostname.replace('www.', ''),
                  domain: url.hostname.replace('www.', ''),
                  credibility: 'medium' as const
                },
                qualityScore: 60, // Default score for related articles
                topics: [topic]
              };
            });

          relatedArticles.push(...topicArticles);
        }
      } catch (topicSearchError) {
        console.warn(`Failed to find articles for topic ${topic}:`, topicSearchError);
      }
    }

    // Remove duplicates and return top 6
    const uniqueArticles = relatedArticles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );

    return uniqueArticles.slice(0, 6);

  } catch (error) {
    console.error('Failed to find related articles:', error);
    return [];
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json();
    const { action, query } = body;
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);

    switch (action) {
      case 'analyze':
        // Re-analyze the article with fresh AI processing
        if (slug.startsWith('http')) {
          const article = await scrapeAndStoreArticle(slug);
          return NextResponse.json({
            success: true,
            article,
            message: 'Article re-analyzed successfully'
          });
        }
        break;

      case 'chat':
        // Handle AI assistant queries
        // This would integrate with your LLM API
        const response = await handleArticleQuery(slug, query);
        return NextResponse.json({
          success: true,
          response,
          timestamp: new Date().toISOString()
        });

      case 'fact-check':
        // Trigger fact-checking process
        const factCheckResult = await performFactCheck(slug);
        return NextResponse.json({
          success: true,
          factCheck: factCheckResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { success: false, error: 'Action not supported for this article type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in article POST endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleArticleQuery(articleUrl: string, query: string): Promise<string> {
  // This would integrate with your LLM for contextual Q&A
  // For now, return a placeholder response
  return `I understand you're asking about "${query}" regarding this article. Based on the content, I can provide analysis and context. This feature will be enhanced with full LLM integration.`;
}

async function performFactCheck(articleUrl: string): Promise<any> {
  // This would integrate with fact-checking APIs and databases
  // For now, return a placeholder result
  return {
    status: 'analyzed',
    claims: [
      {
        claim: 'Sample claim from article',
        verdict: 'verified',
        confidence: 0.85,
        sources: ['Source 1', 'Source 2']
      }
    ],
    overall_credibility: 'high',
    timestamp: new Date().toISOString()
  };
}
