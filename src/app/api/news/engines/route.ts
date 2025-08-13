import { NextResponse } from 'next/server';
import { 
  NEWS_SEARCH_ENGINES, 
  NEWS_ENGINE_METADATA, 
  getNewsEngineCategories,
  getAllNewsEngines,
  isNewsEngineAvailable
} from '@/lib/newsSearchEngines';

export async function GET() {
  try {
    const categories = getNewsEngineCategories();
    const allEngines = getAllNewsEngines();
    
    const engineDetails = categories.map(category => ({
      category,
      engines: NEWS_SEARCH_ENGINES[category as keyof typeof NEWS_SEARCH_ENGINES].map(engine => ({
        id: engine,
        available: isNewsEngineAvailable(engine),
        ...NEWS_ENGINE_METADATA[engine as keyof typeof NEWS_ENGINE_METADATA]
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        categories,
        engines: engineDetails,
        totalEngines: allEngines.length,
        availableCategories: categories,
        metadata: {
          primaryEngines: NEWS_SEARCH_ENGINES.primary,
          alternativeEngines: NEWS_SEARCH_ENGINES.alternative,
          allEngines: allEngines
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in news engines API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news engines',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
