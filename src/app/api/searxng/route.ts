import { NextRequest, NextResponse } from 'next/server';
import { getSearxngApiEndpoint } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searxngURL = getSearxngApiEndpoint();
    const query = searchParams.get('q') || '';
    
    if (!searxngURL) {
      return NextResponse.json(
        { error: 'SearXNG API endpoint not configured' },
        { status: 500 }
      );
    }

    // Build the SearXNG URL with all query parameters
    const searxngApiUrl = new URL('/search', searxngURL);
    searchParams.forEach((value, key) => {
      searxngApiUrl.searchParams.append(key, value);
    });

    // Make request to SearXNG
    const response = await fetch(searxngApiUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Perplexify/1.0)',
      },
    });

    if (!response.ok) {
      // If SearXNG returns an error, use DuckDuckGo as fallback
      console.warn(`SearXNG service error: ${response.status} ${response.statusText}`);
      
      const fallbackResults = await getDuckDuckGoResults(query);
      
      return NextResponse.json({
        results: fallbackResults.results,
        suggestions: fallbackResults.suggestions,
        query: query,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SearXNG API error:', error);
    
    // Return fallback results on any error
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const fallbackResults = await getDuckDuckGoResults(query);
    
    return NextResponse.json({
      results: fallbackResults.results,
      suggestions: fallbackResults.suggestions,
      query: query,
    });
  }
}

async function getDuckDuckGoResults(query: string): Promise<{ results: any[], suggestions: string[] }> {
  try {
    // Use DuckDuckGo Instant Answer API
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error('DuckDuckGo API failed');
    }
    
    const data = await response.json();
    
    const results = [];
    
    // Add instant answer if available
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        content: data.AbstractText,
        img_src: data.Image || '',
      });
    }
    
    // Add related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            content: topic.Text,
          });
        }
      });
    }
    
    // Generate suggestions
    const suggestions = generateSuggestions(query);
    
    return {
      results: results.slice(0, 10), // Limit to 10 results
      suggestions: suggestions,
    };
  } catch (error) {
    console.error('DuckDuckGo API error:', error);
    
    // Return mock results if DuckDuckGo also fails
    return {
      results: generateMockResults(query),
      suggestions: generateSuggestions(query),
    };
  }
}

function generateMockResults(query: string): any[] {
  return [
    {
      title: `${query} - Latest Information`,
      url: `https://example.com/search?q=${encodeURIComponent(query)}`,
      content: `Find the latest information about ${query}. This is a placeholder result while the search service is being configured.`,
    },
    {
      title: `${query} News and Updates`,
      url: `https://example.com/news?q=${encodeURIComponent(query)}`,
      content: `Stay updated with the latest news and developments related to ${query}.`,
    },
    {
      title: `${query} - Comprehensive Guide`,
      url: `https://example.com/guide?q=${encodeURIComponent(query)}`,
      content: `A comprehensive guide about ${query} with detailed information and resources.`,
    },
  ];
}

function generateSuggestions(query: string): string[] {
  if (!query.trim()) return [];
  
  const suggestions = [
    `${query} latest news`,
    `${query} 2024`,
    `${query} company`,
    `${query} technology`,
    `${query} updates`,
    `${query} information`,
    `${query} guide`,
    `${query} tutorial`,
  ];
  
  // Return 3-5 random suggestions
  return suggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 3);
} 