# News Search Engines Configuration

## Overview

Perplexica's news discovery feature uses multiple news search engines through SearXNG integration to provide comprehensive news coverage and diverse perspectives.

## Available News Search Engines

### Primary News Engines
High-reliability news sources for current events and articles:

- **Bing News** - Microsoft's news aggregation service
  - Privacy: Medium
  - Reliability: High
  - Coverage: Global

- **Google News** - Google's news service
  - Privacy: Low
  - Reliability: High
  - Coverage: Global

- **Yahoo News** - Yahoo's news platform
  - Privacy: Medium
  - Reliability: High
  - Coverage: Global

- **Reuters** - Professional news agency
  - Privacy: High
  - Reliability: High
  - Coverage: Global

- **Startpage News** - Privacy-focused news search
  - Privacy: High
  - Reliability: Medium
  - Coverage: Global

- **Brave News** - Brave browser's news service
  - Privacy: High
  - Reliability: Medium
  - Coverage: Global

- **Qwant News** - European privacy-focused news
  - Privacy: High
  - Reliability: Medium
  - Coverage: European focus

### Alternative News Engines
Additional news sources for broader coverage:

- **DuckDuckGo News** - Privacy-focused news search
- **SearX News** - Meta search engine news
- **Mojeek News** - Alternative news search

## News Discovery Implementation

### Enhanced Discover Feature

The discover feature now uses multiple news engines instead of just Bing News:

1. **Parallel Search**: All engines search simultaneously
2. **Error Resilience**: Failed engines don't break the search
3. **Smart Deduplication**: Removes duplicate articles by URL
4. **Diverse Sources**: Mix of high/medium/low privacy engines
5. **Geographic Coverage**: Some engines work better in different regions

### Benefits

- **Better Coverage**: Results from 7+ news engines instead of 1
- **Diversity**: Different perspectives and sources
- **Reliability**: Redundancy if engines fail
- **Privacy Options**: Mix of privacy-focused and traditional engines
- **Content Quality**: Professional news agencies like Reuters

## Configuration

### API Endpoints

- `GET /api/news-search-engines` - Get all available news search engines
- `GET /api/discover` - News discovery with multiple engines

### Usage in Code

```typescript
import { getNewsEnginesForCategory, NEWS_SEARCH_ENGINES } from '@/lib/newsSearchEngines';

// Get primary news engines
const primaryEngines = getNewsEnginesForCategory('primary');

// Get all news engines
const allNewsEngines = NEWS_SEARCH_ENGINES.all;

// Check if engine is available
const isAvailable = isNewsEngineAvailable('reuters');
```

## Privacy Levels

News engines are categorized by privacy level:

- **High Privacy**: Reuters, Startpage News, Brave News, Qwant News, DuckDuckGo News
- **Medium Privacy**: Bing News, Yahoo News
- **Low Privacy**: Google News

## Reliability Ratings

- **High Reliability**: Bing News, Google News, Yahoo News, Reuters
- **Medium Reliability**: Startpage News, Brave News, Qwant News, DuckDuckGo News

## Recent Improvements

### Multi-Engine News Discovery

1. **Parallel Processing**: All engines search simultaneously for faster results
2. **Error Handling**: Graceful fallback when engines fail
3. **Deduplication**: Removes duplicate articles based on URL
4. **Diverse Sources**: Mix of traditional and privacy-focused engines
5. **Better Coverage**: More comprehensive news discovery

### Technical Enhancements

- **Promise.allSettled()**: Handles engine failures gracefully
- **Error Logging**: Tracks which engines fail for debugging
- **Result Merging**: Combines results from multiple engines
- **Smart Filtering**: Removes duplicates and low-quality results

## Future Enhancements

1. **User Preferences**: Allow users to select preferred news engines
2. **Engine Performance**: Track and optimize engine selection
3. **Regional Engines**: Add region-specific news engines
4. **Topic-Specific Engines**: Use different engines for different topics
5. **Engine Health Monitoring**: Track engine availability and performance

## Troubleshooting

### Common Issues

1. **Engine Failures**: Some engines may be temporarily unavailable
2. **Rate Limiting**: Engines may limit requests
3. **Geographic Restrictions**: Some engines may not work in all regions

### Solutions

- The system automatically handles engine failures
- Failed engines are logged but don't break the search
- Results are deduplicated to avoid showing the same content multiple times
- Multiple engines provide redundancy

## Configuration Files

- `src/lib/newsSearchEngines.ts` - News engine definitions and utilities
- `src/app/api/news-search-engines/route.ts` - News engines API endpoint
- `src/app/api/discover/route.ts` - News discovery API implementation
- `searxng/settings.yml` - SearXNG engine configuration

## Performance Considerations

- **Parallel Execution**: All engines run simultaneously for faster results
- **Timeout Handling**: Individual engine timeouts prevent hanging
- **Result Caching**: Consider implementing result caching for better performance
- **Load Balancing**: Distribute requests across engines to avoid rate limiting 