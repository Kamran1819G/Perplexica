import { NextRequest, NextResponse } from 'next/server';
import { ArticleScraper } from '@/lib/news/scraper';
import { ArticleStore } from '@/lib/news/articleStore';
import { FilterAgent } from '@/lib/news/agents/filterAgent';
import { SummarizerAgent } from '@/lib/news/agents/summarizerAgent';

const scraper = ArticleScraper.getInstance();
const articleStore = ArticleStore.getInstance();
const filterAgent = new FilterAgent();
const summarizerAgent = new SummarizerAgent();

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || !url.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'Valid URL required' },
        { status: 400 }
      );
    }

    // Check if article already exists
    const existingArticle = articleStore.hasArticleByUrl(url);
    if (existingArticle) {
      // Article exists, find its slug
      const allArticles = articleStore.getAllArticles();
      for (const article of allArticles) {
        if (article.url === url) {
          const slug = scraper.generateSlug(article.title);
          return NextResponse.json({
            success: true,
            slug: articleStore.generateUniqueSlug(slug),
            article,
            cached: true
          });
        }
      }
    }

    // Scrape and process the article
    const scrapedData = await scraper.scrapeArticle(url);
    
    // Create NewsArticle from scraped data
    const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const article = scraper.toNewsArticle(scrapedData, url, articleId);

    // Enhance with AI analysis
    const enhancedArticle = await filterAgent.process(article);
    const finalArticle = await summarizerAgent.process(enhancedArticle);

    // Generate unique slug and store
    const baseSlug = scraper.generateSlug(finalArticle.title);
    const uniqueSlug = articleStore.generateUniqueSlug(baseSlug);
    articleStore.storeArticle(finalArticle, uniqueSlug);

    return NextResponse.json({
      success: true,
      slug: uniqueSlug,
      article: finalArticle,
      cached: false
    });

  } catch (error) {
    console.error('Error processing article:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process article',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
