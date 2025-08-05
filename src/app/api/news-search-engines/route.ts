import { NEWS_SEARCH_ENGINES, NEWS_ENGINE_METADATA, getNewsEngineCategories } from '@/lib/newsSearchEngines';

export const GET = async () => {
  try {
    const categories = getNewsEngineCategories();
    
    const newsEnginesInfo = categories.map(category => ({
      category,
      engines: NEWS_SEARCH_ENGINES[category as keyof typeof NEWS_SEARCH_ENGINES].map(engine => ({
        id: engine,
        ...NEWS_ENGINE_METADATA[engine as keyof typeof NEWS_ENGINE_METADATA]
      }))
    }));

    return Response.json({
      categories,
      engines: newsEnginesInfo,
      totalNewsEngines: NEWS_SEARCH_ENGINES.all.length,
      availableCategories: categories,
      primaryEngines: NEWS_SEARCH_ENGINES.primary,
      alternativeEngines: NEWS_SEARCH_ENGINES.alternative
    }, {
      status: 200,
    });
  } catch (err) {
    console.error(`An error occurred in news-search-engines route: ${err}`);
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