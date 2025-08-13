import { searchSearxng } from '@/lib/searxng';
import { getNewsEnginesForCategory } from '@/lib/newsSearchEngines';
import { FilterAgent } from '@/lib/news/agents/filterAgent';
import { SummarizerAgent } from '@/lib/news/agents/summarizerAgent';
import { PersonalizerAgent } from '@/lib/news/agents/personalizerAgent';
import { NewsArticle, UserPreferences } from '@/lib/news/types';

const articleWebsites = [
  'yahoo.com',
  'www.exchangewire.com',
  'businessinsider.com',
  /* 'wired.com',
  'mashable.com',
  'theverge.com',
  'gizmodo.com',
  'cnet.com',
  'venturebeat.com', */
];

const topics = ['AI', 'tech']; /* TODO: Add UI to customize this */

// Get primary news engines from configuration
const newsEngines = getNewsEnginesForCategory('primary');

// Initialize AI agents
const filterAgent = new FilterAgent();
const summarizerAgent = new SummarizerAgent();
const personalizerAgent = new PersonalizerAgent();

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;
    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';
    const topic = params.get('topic');
    const website = params.get('website');
    const q = params.get('q');
    const page = parseInt(params.get('page') || '1', 10);
    const pageSize = parseInt(params.get('pageSize') || '12', 10);
    const sort = params.get('sort') || 'relevance';
    const includeAI = params.get('includeAI') === 'true';
    const personalize = params.get('personalize') === 'true';
    const minQuality = parseInt(params.get('minQuality') || '30');
    const userId = params.get('userId');

    let data = [];

    if (mode === 'normal') {
      if (q) {
        // Custom query search - use multiple engines for better results
        const searchPromises = newsEngines.map(engine => 
          searchSearxng(q, {
            engines: [engine],
            pageno: 1,
          }).catch(err => {
            console.warn(`Engine ${engine} failed:`, err);
            return { results: [] };
          })
        );
        
        const results = await Promise.allSettled(searchPromises);
        data = results
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value.results)
          .flat();
      } else if (topic || website) {
        // Filtered by topic and/or website
        const topicsToUse = topic ? [topic] : ['AI', 'tech'];
        const websitesToUse = website ? [website] : [
          'yahoo.com',
          'www.exchangewire.com',
          'businessinsider.com',
        ];
        
        const searchPromises = websitesToUse.flatMap((w) =>
          topicsToUse.flatMap((t) =>
            newsEngines.map(async (engine) => {
              try {
                return (
                  await searchSearxng(`site:${w} ${t}`, {
                    engines: [engine],
                    pageno: 1,
                  })
                ).results;
              } catch (err) {
                console.warn(`Engine ${engine} failed for site:${w} ${t}:`, err);
                return [];
              }
            })
          )
        );
        
        const results = await Promise.allSettled(searchPromises);
        data = results
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value)
          .flat()
          .sort(() => Math.random() - 0.5);
      } else {
        // Default: all topics and all websites with multiple engines
        const articleWebsites = [
          'yahoo.com',
          'www.exchangewire.com',
          'businessinsider.com',
        ];
        const topics = ['AI', 'tech'];
        
        const searchPromises = articleWebsites.flatMap((w) =>
          topics.flatMap((t) =>
            newsEngines.map(async (engine) => {
              try {
                return (
                  await searchSearxng(
                    `site:${w} ${t}`,
                    {
                      engines: [engine],
                      pageno: 1,
                    },
                  )
                ).results;
              } catch (err) {
                console.warn(`Engine ${engine} failed for site:${w} ${t}:`, err);
                return [];
              }
            })
          )
        );
        
        const results = await Promise.allSettled(searchPromises);
        data = results
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value)
          .flat()
          .sort(() => Math.random() - 0.5);
      }
    } else {
      // Preview mode: random topic and website with multiple engines
      const articleWebsites = [
        'yahoo.com',
        'www.exchangewire.com',
        'businessinsider.com',
      ];
      const topics = ['AI', 'tech'];
      const randomWebsite = articleWebsites[Math.floor(Math.random() * articleWebsites.length)];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      // Use multiple engines for preview mode too
      const searchPromises = newsEngines.map(engine =>
        searchSearxng(
          `site:${randomWebsite} ${randomTopic}`,
          {
            engines: [engine],
            pageno: 1,
          },
        ).catch(err => {
          console.warn(`Engine ${engine} failed in preview mode:`, err);
          return { results: [] };
        })
      );
      
      const results = await Promise.allSettled(searchPromises);
      data = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value.results)
        .flat();
    }

    // Remove duplicates based on URL
    const uniqueData = data.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );

    // Convert to NewsArticle format and apply AI processing if requested
    let processedArticles: NewsArticle[] = uniqueData.map((item: any, index: number) => {
      const url = new URL(item.url || 'https://example.com');
      return {
        id: `discover_${Date.now()}_${index}`,
        title: item.title || 'Untitled',
        content: item.content || item.description || '',
        url: item.url || '',
        thumbnail: item.img_src || item.thumbnail,
        publishedAt: item.publishedDate || item.date || new Date().toISOString(),
        source: {
          name: item.engine || url.hostname.replace('www.', ''),
          domain: url.hostname.replace('www.', ''),
          credibility: 'medium' as const
        },
        qualityScore: 50,
        topics: []
      };
    });

    // Apply AI enhancements if requested
    if (includeAI && processedArticles.length > 0) {
      try {
        // Filter and enhance with AI
        const filteredArticles = await filterAgent.batchFilter(processedArticles, minQuality);
        processedArticles = await summarizerAgent.batchProcess(filteredArticles);
      } catch (aiError) {
        console.warn('AI processing failed, continuing without enhancements:', aiError);
      }
    }

    // Apply personalization if requested
    if (personalize && userId && processedArticles.length > 0) {
      try {
        // In production, fetch user preferences from database
        const userPreferences: UserPreferences = {
          interests: topic ? [topic] : ['AI', 'tech'],
          preferredSources: [],
          avoidedSources: [],
          readingHistory: [],
          interactionHistory: [],
          personalizedTopics: [
            { topic: 'Technology', weight: 0.8 },
            { topic: 'Business', weight: 0.6 }
          ]
        };

        processedArticles = await personalizerAgent.generatePersonalizedFeed(
          processedArticles,
          userPreferences,
          pageSize * 2 // Get more for better filtering
        );
      } catch (personalizationError) {
        console.warn('Personalization failed:', personalizationError);
      }
    }

    // Convert back to the expected format for backwards compatibility
    const enhancedData = processedArticles.map(article => ({
      title: article.title,
      content: article.content,
      url: article.url,
      thumbnail: article.thumbnail,
      published: article.publishedAt,
      engine: article.source.name,
      publishedDate: article.publishedAt,
      qualityScore: article.qualityScore,
      summary: article.summary,
      topics: article.topics,
      sentiment: article.sentiment,
      relevanceScore: article.relevanceScore
    }));

    // Sorting
    const getDate = (item: any) => {
      if (item.publishedDate) return new Date(item.publishedDate).getTime();
      if (item.date) return new Date(item.date).getTime();
      return 0;
    };
    
    if (sort === 'newest') {
      enhancedData.sort((a, b) => getDate(b) - getDate(a));
    } else if (sort === 'oldest') {
      enhancedData.sort((a, b) => getDate(a) - getDate(b));
    } else if (sort === 'website') {
      enhancedData.sort((a, b) => {
        const hostA = (a.url ? new URL(a.url).hostname : '').replace('www.', '');
        const hostB = (b.url ? new URL(b.url).hostname : '').replace('www.', '');
        return hostA.localeCompare(hostB);
      });
    } else if (sort === 'relevance' && personalize) {
      enhancedData.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else if (sort === 'quality') {
      enhancedData.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }

    const totalResults = enhancedData.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const pagedData = enhancedData.slice((page - 1) * pageSize, page * pageSize);

    return Response.json(
      {
        blogs: pagedData,
        totalResults,
        totalPages,
        page,
        pageSize,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};
