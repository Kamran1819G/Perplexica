import { searchSearxng } from '@/lib/searxng';
import { getNewsEnginesForCategory } from '@/lib/newsSearchEngines';

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

    // Sorting
    const getDate = (item: any) => {
      if (item.publishedDate) return new Date(item.publishedDate).getTime();
      if (item.date) return new Date(item.date).getTime();
      return 0;
    };
    if (sort === 'newest') {
      uniqueData.sort((a, b) => getDate(b) - getDate(a));
    } else if (sort === 'oldest') {
      uniqueData.sort((a, b) => getDate(a) - getDate(b));
    } else if (sort === 'website') {
      uniqueData.sort((a, b) => {
        const hostA = (a.url ? new URL(a.url).hostname : '').replace('www.', '');
        const hostB = (b.url ? new URL(b.url).hostname : '').replace('www.', '');
        return hostA.localeCompare(hostB);
      });
    }

    const totalResults = uniqueData.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const pagedData = uniqueData.slice((page - 1) * pageSize, page * pageSize);

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
