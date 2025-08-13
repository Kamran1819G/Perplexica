// Web scraping utilities for article content extraction
import { NewsArticle } from './types';

interface ScrapedArticle {
  title: string;
  content: string;
  author?: string;
  publishedAt: string;
  description?: string;
  image?: string;
  tags?: string[];
}

export class ArticleScraper {
  private static instance: ArticleScraper;
  
  public static getInstance(): ArticleScraper {
    if (!ArticleScraper.instance) {
      ArticleScraper.instance = new ArticleScraper();
    }
    return ArticleScraper.instance;
  }

  async scrapeArticle(url: string): Promise<ScrapedArticle> {
    try {
      // Try to fetch the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return this.parseHTML(html, url);

    } catch (error) {
      console.error('Scraping failed:', error);
      // Fallback to basic extraction from URL
      return this.getFallbackArticle(url);
    }
  }

  private parseHTML(html: string, url: string): ScrapedArticle {
    // Remove HTML tags and extract content using regex patterns
    // This is a simplified approach - in production, you'd use a proper HTML parser
    
    // Extract title from <title> tag or h1
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? this.cleanText(titleMatch[1]) : this.getTitleFromUrl(url);

    // Extract meta description
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descriptionMatch ? this.cleanText(descriptionMatch[1]) : '';

    // Extract main content from common article containers
    const contentPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    let content = '';
    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match) {
        content = this.extractTextFromHTML(match[1]);
        if (content.length > 200) break; // Found substantial content
      }
    }

    // If no substantial content found, extract from paragraphs
    if (content.length < 200) {
      const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
      content = paragraphs
        .map(p => this.cleanText(p.replace(/<[^>]*>/g, '')))
        .filter(text => text.length > 50)
        .join('\n\n');
    }

    // Extract image from og:image or first img tag
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<img[^>]*src=["']([^"']+)["']/i);
    const image = imageMatch ? imageMatch[1] : undefined;

    // Extract published date
    const datePatterns = [
      /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
      /<time[^>]*datetime=["']([^"']+)["']/i,
      /<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i,
    ];

    let publishedAt = new Date().toISOString();
    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          publishedAt = new Date(match[1]).toISOString();
          break;
        } catch {
          continue;
        }
      }
    }

    // Extract author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>([^<]+)<\/span>/i);
    const author = authorMatch ? this.cleanText(authorMatch[1]) : undefined;

    return {
      title,
      content: content || description || 'Content could not be extracted from this article.',
      description,
      author,
      publishedAt,
      image,
      tags: this.extractTags(html)
    };
  }

  private extractTextFromHTML(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    
    // Remove HTML tags but preserve paragraph breaks
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<br[^>]*>/gi, '\n');
    text = text.replace(/<[^>]*>/g, '');
    
    // Clean up text
    text = this.cleanText(text);
    
    // Limit content length for performance
    return text.substring(0, 5000);
  }

  private cleanText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract meaningful part from URL
      const parts = pathname.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1];
      
      // Convert URL-friendly format to readable title
      return lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|htm|php|asp|aspx)$/i, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      return 'Article';
    }
  }

  private extractTags(html: string): string[] {
    const tags: string[] = [];
    
    // Extract from meta keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      tags.push(...keywordsMatch[1].split(',').map(tag => tag.trim()));
    }
    
    // Extract from article tags
    const articleTagMatches = html.match(/<a[^>]*class=["'][^"']*tag[^"']*["'][^>]*>([^<]+)<\/a>/gi) || [];
    articleTagMatches.forEach(match => {
      const tagMatch = match.match(/>([^<]+)</);
      if (tagMatch) {
        tags.push(this.cleanText(tagMatch[1]));
      }
    });
    
    return [...new Set(tags)].slice(0, 10); // Remove duplicates and limit
  }

  private getFallbackArticle(url: string): ScrapedArticle {
    const domain = new URL(url).hostname.replace('www.', '');
    
    return {
      title: this.getTitleFromUrl(url),
      content: `This article from ${domain} could not be fully scraped. Please visit the original source for complete content.`,
      publishedAt: new Date().toISOString(),
      description: `Article from ${domain}`,
    };
  }

  // Generate URL-friendly slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length
  }

  // Convert scraped article to NewsArticle format
  toNewsArticle(scraped: ScrapedArticle, url: string, id: string): NewsArticle {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    return {
      id,
      title: scraped.title,
      content: scraped.content,
      summary: scraped.description,
      url,
      thumbnail: scraped.image,
      publishedAt: scraped.publishedAt,
      source: {
        name: domain.charAt(0).toUpperCase() + domain.slice(1),
        domain,
        credibility: 'medium' // Will be updated by filter agent
      },
      qualityScore: 50, // Will be updated by filter agent
      topics: scraped.tags || []
    };
  }
}
