# Advanced Search Architecture

## Overview

This document describes the enhanced search architecture inspired by Perplexity AI's approach, which combines state-of-the-art machine learning models, real-time data retrieval, and sophisticated information synthesis to provide accurate, trustworthy, and up-to-date answers.

## Architecture Components

### 1. Neural Reranker (`neuralReranker.ts`)

The neural reranker implements a hybrid approach combining semantic similarity and keyword relevance scoring:

- **Semantic Scoring**: Uses embeddings to calculate semantic similarity between queries and documents
- **Keyword Scoring**: Analyzes keyword frequency and relevance
- **Combined Scoring**: Merges semantic and keyword scores with configurable weights
- **Diversity Boost**: Ensures source diversity by prioritizing different domains
- **Threshold Filtering**: Removes low-relevance documents based on configurable thresholds

**Key Features:**
- Configurable semantic vs. keyword weight balance
- Domain diversity enforcement
- Relevance threshold filtering
- Performance optimization for large document sets

### 2. Contextual Fusion (`contextualFusion.ts`)

Inspired by Perplexity AI's T5 neural model approach, this component:

- **Semantic Grouping**: Groups related documents by semantic similarity
- **Overlapping Chunks**: Creates overlapping text chunks for better context preservation
- **Deduplication**: Removes redundant content while preserving unique information
- **Context Enhancement**: Uses LLMs to enhance and clarify context chunks
- **Unified Context**: Merges multiple chunks into coherent, unified context

**Key Features:**
- Configurable chunk sizes and overlap
- LLM-powered context enhancement
- Intelligent deduplication
- Semantic coherence preservation

### 3. Adaptive LLM Integration

The system adapts to work with any configured LLM from user settings:

- **Universal Compatibility**: Works with any LLM provider configured in settings
- **Query Complexity Analysis**: Analyzes query complexity to optimize search strategy
- **Dynamic Configuration**: Adjusts search parameters based on query characteristics
- **Settings Integration**: Uses the LLM API keys and models configured by the user
- **Flexible Architecture**: No dependency on specific model providers

**Supported via Settings:**
- Any OpenAI-compatible API
- Anthropic Claude models
- Local models via Ollama
- Custom model endpoints

### 4. SearXNG Client (`searxng.ts`)

Advanced search engine integration with enhanced features:

- **Multi-Query Search**: Executes multiple search queries in parallel
- **Fallback Handling**: Automatic fallback to reliable engines
- **Result Processing**: Advanced result filtering and deduplication
- **Category-Based Search**: Specialized search for different content types
- **Health Monitoring**: Built-in health checks and error handling

**Search Categories:**
- General search
- Academic/research
- Technical/programming
- News and current events

### 5. Search Orchestrator (`orchestrator.ts`)

The main orchestrator that coordinates all components:

- **Query Analysis**: Analyzes query complexity and determines optimal strategy
- **Multi-Phase Execution**: Implements 6-phase search process
- **Parallel Processing**: Supports parallel search execution for faster results
- **Progress Tracking**: Real-time progress updates and status monitoring
- **Error Handling**: Comprehensive error handling with fallback strategies
- **LLM Agnostic**: Works with any LLM configured in user settings

**Search Phases:**
1. Query Complexity Analysis
2. Multi-Query Generation
3. Parallel Document Retrieval
4. Neural Reranking
5. Contextual Fusion
6. Answer Generation

## Search Modes

### Quick Search
- **Purpose**: Fast, efficient answers for simple queries
- **Configuration**: Single query, basic reranking, minimal processing
- **Use Case**: Factual questions, quick lookups, simple explanations
- **Performance**: ~15-30 seconds

### Pro Search
- **Purpose**: Comprehensive analysis with multiple search angles
- **Configuration**: 3-5 queries, enhanced reranking, semantic grouping
- **Use Case**: Complex questions, analysis requests, comparative research
- **Performance**: ~45-90 seconds

### Ultra Search
- **Purpose**: PhD-level research with maximum comprehensiveness
- **Configuration**: 8-12 queries, aggressive reranking, advanced fusion
- **Use Case**: Academic research, deep analysis, comprehensive reports
- **Performance**: ~2-4 minutes

## Configuration

### Reranking Configuration
```typescript
rerankingConfig: {
  threshold: 0.3,           // Relevance threshold (0.1-1.0)
  maxDocuments: 20,         // Maximum documents to process
  diversityBoost: true,     // Enable domain diversity
  semanticWeight: 0.6,      // Weight for semantic scoring
  keywordWeight: 0.4        // Weight for keyword scoring
}
```

### Fusion Configuration
```typescript
fusionConfig: {
  maxChunkSize: 1500,       // Maximum chunk size in words
  overlapSize: 150,         // Overlap between chunks
  maxChunks: 8,             // Maximum context chunks
  semanticGrouping: false,  // Enable semantic grouping
  deduplication: true       // Enable deduplication
}
```

### Search Configuration
```typescript
searchConfig: {
  maxQueries: 1,            // Maximum search queries
  parallelSearches: false,  // Enable parallel execution
  fallbackEnabled: true,    // Enable fallback search
  expertSourcing: false     // Focus on expert sources
}
```

## Performance Optimization

### Parallel Processing
- **Quick Mode**: Sequential execution for speed
- **Pro Mode**: Limited parallel execution (3 concurrent searches)
- **Ultra Mode**: Full parallel execution (6+ concurrent searches)

### Caching Strategy
- **Query Results**: Cache search results for repeated queries
- **Embeddings**: Cache document embeddings for faster reranking
- **Context Chunks**: Cache processed context chunks

### Resource Management
- **Memory Usage**: Configurable limits for document processing
- **Timeout Handling**: Automatic timeout and fallback for slow operations
- **Error Recovery**: Graceful degradation when components fail

## Integration Points

### API Integration
The enhanced search system integrates with existing APIs:

- **Search API**: `/api/search` - Main search endpoint
- **Chat API**: `/api/chat` - Chat with search capabilities
- **Streaming**: Real-time progress updates and results

### UI Integration
Enhanced UI components provide:

- **Progress Tracking**: Real-time search progress visualization
- **Mode Selection**: Easy switching between search modes
- **Result Display**: Enhanced source display with relevance scores
- **Step Visualization**: Detailed view of search execution steps

## Local Deployment

### Requirements
- Node.js 18+ 
- Docker (for SearXNG)
- Sufficient RAM (4GB+ recommended)
- Local LLM support (Ollama, HuggingFace)

### Setup
1. **Install Dependencies**: `yarn install`
2. **Configure SearXNG**: Update `searxng/settings.yml`
3. **Set Environment Variables**: Configure API keys and endpoints
4. **Start Services**: `docker-compose up -d`
5. **Run Application**: `yarn dev`

### Configuration Files
- `src/lib/search/config.ts` - Search configuration
- `searxng/settings.yml` - SearXNG settings
- `docker-compose.yaml` - Service orchestration
- `.env.local` - Environment variables

## Monitoring and Debugging

### Logging
- **Search Execution**: Detailed logs for each search phase
- **Performance Metrics**: Timing and resource usage tracking
- **Error Tracking**: Comprehensive error logging with context

### Health Checks
- **SearXNG Health**: `/healthz` endpoint monitoring
- **Model Availability**: LLM provider status checking
- **Component Status**: Individual component health monitoring

### Performance Metrics
- **Response Times**: Per-mode performance tracking
- **Success Rates**: Query success and failure rates
- **Resource Usage**: Memory and CPU utilization

## Future Enhancements

### Planned Features
- **Advanced Caching**: Redis-based result caching
- **Load Balancing**: Multiple SearXNG instance support
- **Custom Models**: Integration with custom fine-tuned models
- **Real-time Updates**: Live data integration for current events

### Research Areas
- **Query Understanding**: Advanced natural language understanding
- **Source Validation**: Automated fact-checking and verification
- **Personalization**: User-specific search preferences and history
- **Multimodal Search**: Image and video search capabilities

## Troubleshooting

### Common Issues
1. **SearXNG Connection**: Check Docker container status and network connectivity
2. **Model Loading**: Verify API keys and model availability
3. **Memory Issues**: Adjust chunk sizes and document limits
4. **Timeout Errors**: Increase timeout values for complex queries

### Debug Mode
Enable debug logging by setting:
```typescript
DEBUG_SEARCH=true
DEBUG_ORCHESTRATOR=true
DEBUG_RERANKER=true
```

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Testing
- **Unit Tests**: Component-level testing
- **Integration Tests**: End-to-end search testing
- **Performance Tests**: Load and stress testing

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive documentation

