import { searchSearxng } from '@/lib/searxng';

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
        // Custom query search
        data = (
          await searchSearxng(q, {
            engines: ['bing news'],
            pageno: 1,
          })
        ).results;
      } else if (topic || website) {
        // Filtered by topic and/or website
        const topicsToUse = topic ? [topic] : ['AI', 'tech'];
        const websitesToUse = website ? [website] : [
          'yahoo.com',
          'www.exchangewire.com',
          'businessinsider.com',
        ];
        data = (
          await Promise.all(
            websitesToUse.flatMap((w) =>
              topicsToUse.map(async (t) => {
                return (
                  await searchSearxng(`site:${w} ${t}`, {
                    engines: ['bing news'],
                    pageno: 1,
                  })
                ).results;
              })
            )
          )
        )
          .flat()
          .sort(() => Math.random() - 0.5);
      } else {
        // Default: all topics and all websites
        const articleWebsites = [
          'yahoo.com',
          'www.exchangewire.com',
          'businessinsider.com',
        ];
        const topics = ['AI', 'tech'];
        data = (
          await Promise.all([
            ...new Array(articleWebsites.length * topics.length)
              .fill(0)
              .map(async (_, i) => {
                return (
                  await searchSearxng(
                    `site:${articleWebsites[i % articleWebsites.length]} ${topics[i % topics.length]}`,
                    {
                      engines: ['bing news'],
                      pageno: 1,
                    },
                  )
                ).results;
              }),
          ])
        )
          .map((result) => result)
          .flat()
          .sort(() => Math.random() - 0.5);
      }
    } else {
      // Preview mode: random topic and website
      const articleWebsites = [
        'yahoo.com',
        'www.exchangewire.com',
        'businessinsider.com',
      ];
      const topics = ['AI', 'tech'];
      data = (
        await searchSearxng(
          `site:${articleWebsites[Math.floor(Math.random() * articleWebsites.length)]} ${topics[Math.floor(Math.random() * topics.length)]}`,
          {
            categories: ['news'],
            time_range: ['month'],
            pageno: 1,
          },
        )
      ).results;
    }

    // Sorting
    const getDate = (item: any) => {
      if (item.publishedDate) return new Date(item.publishedDate).getTime();
      if (item.date) return new Date(item.date).getTime();
      return 0;
    };
    if (sort === 'newest') {
      data.sort((a, b) => getDate(b) - getDate(a));
    } else if (sort === 'oldest') {
      data.sort((a, b) => getDate(a) - getDate(b));
    } else if (sort === 'website') {
      data.sort((a, b) => {
        const hostA = (a.url ? new URL(a.url).hostname : '').replace('www.', '');
        const hostB = (b.url ? new URL(b.url).hostname : '').replace('www.', '');
        return hostA.localeCompare(hostB);
      });
    }

    const totalResults = data.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const pagedData = data.slice((page - 1) * pageSize, page * pageSize);

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
