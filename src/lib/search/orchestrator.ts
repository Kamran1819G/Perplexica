import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import { Document } from 'langchain/document';
import eventEmitter from 'events';
import { NeuralReranker, RerankedDocument } from './neuralReranker';
import { ContextualFusion, ContextChunk } from './contextualFusion';
import { SearxngClient } from '../searxng';
import { getDocumentsFromLinks } from '../utils/documents';
import { withErrorHandling } from '../errorHandling';
import { trackAsync } from '../performance';
import { IntentDetector, SearchIntent } from './intentDetection';
import handleImageSearch from '../chains/imageSearchAgent';
import handleVideoSearch from '../chains/videoSearchAgent';

export interface ImageResult {
  img_src: string;
  url: string;
  title: string;
}

export interface VideoResult {
  img_src: string;
  url: string;
  title: string;
  iframe_src: string;
}

export interface UnifiedSearchResults {
  documents: RerankedDocument[];
  images: ImageResult[];
  videos: VideoResult[];
  searchIntent: SearchIntent;
  executionTime: number;
}

export interface OrchestratorConfig {
  mode: 'quick' | 'pro' | 'ultra';
  maxSources: number;
  maxImages: number;
  maxVideos: number;
  rerankingConfig: {
    threshold: number;
    maxDocuments: number;
    diversityBoost: boolean;
    semanticWeight: number;
    keywordWeight: number;
  };
  fusionConfig: {
    maxChunkSize: number;
    overlapSize: number;
    maxChunks: number;
    semanticGrouping: boolean;
    deduplication: boolean;
  };
  searchConfig: {
    maxQueries: number;
    parallelSearches: boolean;
    fallbackEnabled: boolean;
    expertSourcing: boolean;
    intelligentIntent: boolean;
  };
}

export class SearchOrchestrator {
  private config: OrchestratorConfig;
  private neuralReranker: NeuralReranker;
  private contextualFusion: ContextualFusion;
  private searxng: SearxngClient;
  private emitter: eventEmitter;
  private intentDetector: IntentDetector;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.neuralReranker = new NeuralReranker(config.rerankingConfig);
    this.contextualFusion = new ContextualFusion(config.fusionConfig);
    this.searxng = new SearxngClient();
    this.emitter = new eventEmitter();
    this.intentDetector = new IntentDetector({} as BaseChatModel); // Will be initialized with actual LLM
  }

  async executeSearch(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    fileIds: string[] = [],
    systemInstructions: string = ''
  ): Promise<eventEmitter> {
    // Return the emitter immediately so listeners can be attached
    // Then start the actual search work asynchronously
    setImmediate(() => {
      this.executeSearchInternal(query, history, llm, embeddings, fileIds, systemInstructions);
    });
    
    return this.emitter;
  }

  private async executeSearchInternal(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    fileIds: string[] = [],
    systemInstructions: string = ''
  ): Promise<void> {
    return await trackAsync('search_execution', async () => {
      try {
        const startTime = Date.now();
        
        // Initialize intent detector with actual LLM
        this.intentDetector = new IntentDetector(llm);
        
        // Phase 1: Start document search immediately (always needed)
        console.log('🚀 Orchestrator: Starting document search immediately...');
        
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'planning',
            message: 'Analyzing query and planning search...',
            details: 'Generating optimized search queries',
            progress: 10
          }
        }));
        
        const queriesPromise = this.generateSearchQueries(query, llm);
        const searchQueries = await queriesPromise;
        
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'searching',
            message: 'Searching for relevant sources...',
            details: `Executing ${searchQueries.length} search queries`,
            progress: 30
          }
        }));
        
        console.log('📄 Orchestrator: Starting document retrieval...');
        const documentsPromise = this.retrieveDocuments(searchQueries);
        
        // Phase 2: Detect intent for images/videos in parallel with document search
        let searchIntent: SearchIntent;
        const intentPromise = (async () => {
          if (this.config.searchConfig.intelligentIntent) {
            return await this.detectSearchIntent(query, history);
          } else {
            // Quick fallback for performance-critical scenarios
            return IntentDetector.getQuickIntent(query);
          }
        })();
        
        // Wait for both documents and intent detection
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'sources_found',
            message: 'Processing search results...',
            details: 'Analyzing and ranking sources for relevance',
            progress: 60
          }
        }));
        
        const [documents, intent] = await Promise.all([documentsPromise, intentPromise]);
        searchIntent = intent;
        
        console.log('🎯 Orchestrator: Detected search intent:', {
          primaryIntent: searchIntent.primaryIntent,
          needsImages: searchIntent.needsImages,
          needsVideos: searchIntent.needsVideos,
          confidence: searchIntent.confidence,
          reasoning: searchIntent.reasoning
        });
        
        // Emit search intent data for UI
        this.emitter.emit('data', JSON.stringify({
          type: 'searchIntent',
          data: searchIntent
        }));
        
        // Note: Sources will be emitted later after full processing
        console.log(`📄 Orchestrator: Found ${documents.length} documents, will emit sources after processing`);
        
        // Phase 3: Start media searches asynchronously after document search completes
        const mediaPromises: Promise<any>[] = [];
        let images: ImageResult[] = [];
        let videos: VideoResult[] = [];
        
        if (searchIntent.needsImages) {
          console.log('🖼️ Orchestrator: Starting image search asynchronously...');
          mediaPromises.push(
            this.retrieveImages(query, history, llm).then(result => ({ type: 'images', data: result }))
          );
        }
        
        if (searchIntent.needsVideos) {
          console.log('🎥 Orchestrator: Starting video search asynchronously...');
          mediaPromises.push(
            this.retrieveVideos(query, history, llm).then(result => ({ type: 'videos', data: result }))
          );
        }
        
        // Process media results as they come in
        if (mediaPromises.length > 0) {
          const mediaResults = await Promise.allSettled(mediaPromises);
          
          mediaResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (result.value.type === 'images') {
                images = result.value.data.images || [];
                console.log(`🖼️ Orchestrator: Got ${images.length} images from async search`);
                
                // Emit images data
                this.emitter.emit('data', JSON.stringify({
                  type: 'images',
                  data: images
                }));
              } else if (result.value.type === 'videos') {
                videos = result.value.data.videos || [];
                console.log(`🎥 Orchestrator: Got ${videos.length} videos from async search`);
                
                // Emit videos data
                this.emitter.emit('data', JSON.stringify({
                  type: 'videos',
                  data: videos
                }));
              }
            } else {
              console.error(`❌ Orchestrator: Media search failed:`, result.reason);
            }
          });
        }
        
        console.log('🔄 Orchestrator: Final results summary:', {
          documents: documents.length,
          images: images.length,
          videos: videos.length
        });
        
        // Phase 4: Document processing and answer generation (if documents exist)
        if (documents.length > 0) {
          this.emitter.emit('data', JSON.stringify({
            type: 'progress',
            data: {
              step: 'generating',
              message: 'Generating comprehensive answer...',
              details: `Synthesizing information from ${documents.length} sources`,
              progress: 80
            }
          }));
          
          const [rerankedDocs, contextChunks] = await Promise.all([
            this.rerankDocuments(query, documents, embeddings),
            this.createContextChunks(query, documents.slice(0, 10).map((doc, i) => ({
              ...doc,
              relevanceScore: 1 - (i * 0.1),
              originalRank: i
            })), llm)
          ]);
          
          await this.generateUnifiedAnswer(query, contextChunks, rerankedDocs, images, videos, searchIntent, llm);
        } else {
          // Handle image/video only responses
          this.emitter.emit('data', JSON.stringify({
            type: 'progress',
            data: {
              step: 'generating',
              message: 'Generating media-focused response...',
              details: 'Processing visual and video content',
              progress: 80
            }
          }));
          
          await this.generateMediaOnlyResponse(query, images, videos, searchIntent, llm);
        }
        
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'complete',
            message: 'Search completed successfully',
            details: 'All operations completed',
            progress: 100
          }
        }));
        
        const endTime = Date.now();
        this.emitter.emit('data', JSON.stringify({
          type: 'complete',
          data: { 
            message: 'Unified search completed successfully',
            executionTime: endTime - startTime,
            mode: this.config.mode,
            searchIntent: searchIntent
          }
        }));

        this.emitter.emit('end');
      } catch (error) {
        console.error('Unified search failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.emitter.emit('data', JSON.stringify({
          type: 'error',
          data: { error: errorMessage }
        }));
        
        this.emitter.emit('end');
        throw error;
      }
    });
  }

  private async detectSearchIntent(query: string, history: BaseMessage[]): Promise<SearchIntent> {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'intent_detection',
        message: 'Analyzing search intent...',
        details: 'Determining optimal search strategy',
        progress: 5
      }
    }));

    const intent = await this.intentDetector.detectIntent(query);
    
    this.emitter.emit('data', JSON.stringify({
      type: 'intent_detected',
      data: {
        intent: intent,
        searchTypes: {
          documents: true, // Always search documents
          images: intent.needsImages,
          videos: intent.needsVideos
        }
      }
    }));

    return intent;
  }

  private async retrieveImages(query: string, history: BaseMessage[], llm: BaseChatModel): Promise<{ images: ImageResult[] }> {
    console.log('🖼️ Orchestrator: Starting image retrieval for query:', query);
    
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'image_search',
        message: 'Searching for images...',
        details: 'Finding relevant visual content',
        progress: 30
      }
    }));

    try {
      console.log('🖼️ Orchestrator: Calling handleImageSearch...');
      const result = await handleImageSearch({
        query,
        chat_history: history,
        page: 1
      }, llm);

      console.log('🖼️ Orchestrator: Raw image search result:', result);
      const images = (result.images || []).slice(0, this.config.maxImages || 20);
      console.log('🖼️ Orchestrator: Processed images count:', images.length, 'max allowed:', this.config.maxImages || 20);
      
      if (images.length > 0) {
        console.log('🖼️ Orchestrator: Sample images:', images.slice(0, 2).map(img => ({ title: img.title, url: img.url })));
      }
      
      this.emitter.emit('data', JSON.stringify({
        type: 'images_found',
        data: {
          count: images.length,
          images: images.slice(0, 6) // Preview first 6
        }
      }));

      console.log('🖼️ Orchestrator: Returning images:', images.length);
      return { images };
    } catch (error) {
      console.error('🖼️ Orchestrator: Image search failed:', error);
      return { images: [] };
    }
  }

  private async retrieveVideos(query: string, history: BaseMessage[], llm: BaseChatModel): Promise<{ videos: VideoResult[] }> {
    console.log('🎥 Orchestrator: Starting video retrieval for query:', query);
    
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'video_search',
        message: 'Searching for videos...',
        details: 'Finding relevant video content',
        progress: 35
      }
    }));

    try {
      console.log('🎥 Orchestrator: Calling handleVideoSearch...');
      const result = await handleVideoSearch({
        query,
        chat_history: history,
        page: 1
      }, llm);

      console.log('🎥 Orchestrator: Raw video search result:', result);
      const videos = (result.videos || []).slice(0, this.config.maxVideos || 15);
      console.log('🎥 Orchestrator: Processed videos count:', videos.length, 'max allowed:', this.config.maxVideos || 15);
      
      if (videos.length > 0) {
        console.log('🎥 Orchestrator: Sample videos:', videos.slice(0, 2).map(vid => ({ title: vid.title, url: vid.url })));
      }
      
      this.emitter.emit('data', JSON.stringify({
        type: 'videos_found',
        data: {
          count: videos.length,
          videos: videos.slice(0, 4) // Preview first 4
        }
      }));

      console.log('🎥 Orchestrator: Returning videos:', videos.length);
      return { videos };
    } catch (error) {
      console.error('🎥 Orchestrator: Video search failed:', error);
      return { videos: [] };
    }
  }

  private async analyzeQuery(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    searchIntent?: SearchIntent
  ): Promise<void> {
    const intentMessage = searchIntent ? 
      `Analyzing ${searchIntent.primaryIntent} search with documents${searchIntent.confidence.images > 0.7 ? ' images' : ''}${searchIntent.confidence.videos > 0.7 ? ' videos' : ''}` :
      'Analyzing query for comprehensive research...';
    
    const modeMessages = {
      quick: {
        message: intentMessage || 'Quick analysis for immediate results...',
        details: searchIntent ? `Intent: ${searchIntent.reasoning}` : 'Optimizing for speed and relevance'
      },
      pro: {
        message: intentMessage || 'Analyzing query for comprehensive research...',
        details: searchIntent ? `Multi-modal search: ${searchIntent.reasoning}` : 'Planning multi-source investigation'
      },
      ultra: {
        message: intentMessage || 'Deep analysis for premium synthesis...',
        details: searchIntent ? `Advanced intent analysis: ${searchIntent.reasoning}` : 'Preparing rigorous multi-dimensional research'
      }
    };

    const modeMessage = modeMessages[this.config.mode] || modeMessages.quick;

    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'query_analysis',
        message: modeMessage.message,
        details: modeMessage.details,
        progress: 10
      }
    }));

    // Analyze query complexity for search strategy optimization
    const queryComplexity = this.analyzeQueryComplexity(query);
    
    this.emitter.emit('data', JSON.stringify({
      type: 'query_analysis',
      data: { 
        complexity: queryComplexity, 
        mode: this.config.mode,
        searchIntent: searchIntent
      }
    }));
  }

  private analyzeQueryComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const queryLower = query.toLowerCase();
    const wordCount = query.split(' ').length;
    
    // Determine complexity based on query characteristics
    if (wordCount > 20 || 
        queryLower.includes('complex') || 
        queryLower.includes('advanced') ||
        queryLower.includes('analyze') ||
        queryLower.includes('compare') ||
        queryLower.includes('research')) {
      return 'complex';
    } else if (wordCount > 10 || 
               queryLower.includes('how') || 
               queryLower.includes('why') ||
               queryLower.includes('explain')) {
      return 'moderate';
    }
    
    return 'simple';
  }

  private async generateSearchQueries(
    query: string,
    llm: BaseChatModel
  ): Promise<string[]> {
    const modeMessages = {
      quick: {
        message: 'Focusing search for immediate results...',
        details: 'Single targeted query for speed'
      },
      pro: {
        message: 'Generating research queries...',
        details: 'Multiple angles for comprehensive coverage'
      },
      ultra: {
        message: 'Planning exhaustive search strategy...',
        details: 'Multi-dimensional query generation'
      }
    };

    const modeMessage = modeMessages[this.config.mode] || modeMessages.quick;

    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'query_generation',
        message: modeMessage.message,
        details: modeMessage.details,
        progress: 20
      }
    }));

    const maxQueries = this.config.searchConfig.maxQueries;
    let queries: string[] = [];

    switch (this.config.mode) {
      case 'quick':
        queries = [query];
        break;
      case 'pro':
        queries = await this.generateProQueries(query, llm, maxQueries);
        break;
      case 'ultra':
        queries = await this.generateUltraQueries(query, llm, maxQueries);
        break;
    }

    this.emitter.emit('data', JSON.stringify({
      type: 'queries_generated',
      data: { queries, count: queries.length, mode: this.config.mode }
    }));

    return queries;
  }

  private async generateProQueries(
    query: string,
    llm: BaseChatModel,
    maxQueries: number
  ): Promise<string[]> {
    // Pro Mode: Broader research coverage with diverse angles
    const baseQueries = [
      query, // Original query
      `${query} latest research 2024`, // Recent developments
      `${query} expert analysis`, // Expert perspectives
      `${query} comprehensive overview`, // Broad coverage
      `${query} industry trends`, // Market/industry context
      `${query} comparative study` // Comparative analysis
    ];

    return baseQueries.slice(0, maxQueries);
  }

  private async generateUltraQueries(
    query: string,
    llm: BaseChatModel,
    maxQueries: number
  ): Promise<string[]> {
    // Ultra Mode: Exhaustive multi-dimensional research
    const baseQueries = [
      query, // Core query
      `${query} comprehensive analysis`, // Deep analysis
      `${query} historical development`, // Historical context
      `${query} current state 2024`, // Current status
      `${query} expert consensus`, // Expert opinions
      `${query} comparative evaluation`, // Comparisons
      `${query} technical specifications`, // Technical depth
      `${query} case studies examples`, // Real-world applications
      `${query} future outlook`, // Future implications
      `${query} limitations challenges`, // Constraints and issues
      `${query} best practices`, // Methodological approaches
      `${query} research methodology` // Academic perspective
    ];

    return baseQueries.slice(0, maxQueries);
  }

  private async retrieveDocuments(queries: string[]): Promise<Document[]> {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'document_retrieval',
        message: 'Retrieving documents...',
        details: `Searching across ${queries.length} query angles`,
        progress: 40
      }
    }));

    const allDocuments: Document[] = [];

    if (this.config.searchConfig.parallelSearches) {
      // Parallel search execution
      const searchPromises = queries.map(async (query, index) => {
        try {
          const result = await this.searxng.searchWithFallback(query, {
            maxResults: Math.ceil(this.config.rerankingConfig.maxDocuments / queries.length),
            diversityBoost: true
          });
          
          const docs = this.searxng.toDocuments(result.results);
          
          this.emitter.emit('data', JSON.stringify({
            type: 'search_progress',
            data: {
              queryIndex: index,
              query: query,
              documentsFound: docs.length,
              fallbackUsed: result.fallbackUsed
            }
          }));

          return docs;
        } catch (error) {
          console.warn(`Search failed for query ${index}:`, error);
          return [];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      searchResults.forEach(docs => allDocuments.push(...docs));
    } else {
      // Sequential search execution
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        try {
          const result = await this.searxng.searchWithFallback(query, {
            maxResults: Math.ceil(this.config.rerankingConfig.maxDocuments / queries.length),
            diversityBoost: true
          });
          
          const docs = this.searxng.toDocuments(result.results);
          allDocuments.push(...docs);
          
          this.emitter.emit('data', JSON.stringify({
            type: 'search_progress',
            data: {
              queryIndex: i,
              query: query,
              documentsFound: docs.length,
              fallbackUsed: result.fallbackUsed
            }
          }));
        } catch (error) {
          console.warn(`Search failed for query ${i}:`, error);
        }
      }
    }

    return allDocuments;
  }

  private async rerankDocuments(
    query: string,
    documents: Document[],
    embeddings: Embeddings
  ): Promise<RerankedDocument[]> {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'document_reranking',
        message: 'Reranking documents...',
        details: 'Applying neural reranking for relevance scoring',
        progress: 60
      }
    }));

    const rerankedDocs = await this.neuralReranker.rerankDocuments(
      query,
      documents,
      embeddings
    );

    this.emitter.emit('data', JSON.stringify({
      type: 'reranking_complete',
      data: {
        originalCount: documents.length,
        rerankedCount: rerankedDocs.length,
        topSources: rerankedDocs.slice(0, 5).map(doc => ({
          title: doc.metadata?.title || 'Untitled',
          url: doc.metadata?.url || '',
          score: doc.relevanceScore
        }))
      }
    }));

    return rerankedDocs;
  }

  private async createContextChunks(
    query: string,
    documents: RerankedDocument[],
    llm: BaseChatModel
  ): Promise<ContextChunk[]> {
    // Add safety checks
    if (!documents || documents.length === 0) {
      console.warn('No documents provided to createContextChunks');
      return [];
    }
    
    if (!llm) {
      console.warn('No LLM provided to createContextChunks');
      return [];
    }

    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'context_fusion',
        message: 'Creating context chunks...',
        details: 'Merging and organizing information for synthesis',
        progress: 80
      }
    }));

    try {
      const chunks = await this.contextualFusion.createContextChunks(
        query,
        documents,
        llm
      );

      this.emitter.emit('data', JSON.stringify({
        type: 'context_chunks_created',
        data: {
          chunkCount: chunks.length,
          totalSources: documents.length
        }
      }));

      return chunks;
    } catch (error) {
      console.error('Error creating context chunks:', error);
      // Return empty array on error
      return [];
    }
  }

  private async generateUnifiedAnswer(
    query: string,
    contextChunks: ContextChunk[],
    sources: RerankedDocument[],
    images: ImageResult[],
    videos: VideoResult[],
    searchIntent: SearchIntent,
    llm: BaseChatModel
  ): Promise<void> {
    // Add safety checks
    if (!llm) {
      console.error('No LLM provided to generateUnifiedAnswer');
      return;
    }

    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'answer_generation',
        message: 'Generating unified answer...',
        details: 'Synthesizing information from all sources',
        progress: 90
      }
    }));

    // Handle case where no context chunks are available
    if (!contextChunks || contextChunks.length === 0) {
      console.warn('No context chunks available, generating response from sources directly');
      await this.generateFallbackResponse(query, sources, images, videos, searchIntent, llm);
      return;
    }

    try {
      // Merge context chunks into unified context
    const unifiedContext = await this.contextualFusion.mergeChunksIntoUnifiedContext(
      query,
      contextChunks,
      llm
    );

    // Emit all content types found
    const maxSources = this.config.maxSources;
    
    // Emit sources
    if (sources.length > 0) {
      this.emitter.emit('data', JSON.stringify({
        type: 'sources',
        data: sources.slice(0, maxSources),
        metadata: {
          totalFound: sources.length,
          maxDisplayed: maxSources,
          mode: this.config.mode
        }
      }));
    }

    // Emit images
    if (images.length > 0) {
      console.log('📤 Orchestrator: Emitting images data:', {
        count: images.length,
        sampleTitles: images.slice(0, 3).map(img => img.title)
      });
      this.emitter.emit('data', JSON.stringify({
        type: 'images',
        data: images,
        metadata: {
          totalFound: images.length,
          searchIntent: searchIntent.needsImages,
          confidence: searchIntent.confidence.images
        }
      }));
    } else {
      console.log('📤 Orchestrator: No images to emit, images array length:', images.length);
    }

    // Emit videos
    if (videos.length > 0) {
      console.log('📤 Orchestrator: Emitting videos data:', {
        count: videos.length,
        sampleTitles: videos.slice(0, 3).map(vid => vid.title)
      });
      this.emitter.emit('data', JSON.stringify({
        type: 'videos',
        data: videos,
        metadata: {
          totalFound: videos.length,
          searchIntent: searchIntent.needsVideos,
          confidence: searchIntent.confidence.videos
        }
      }));
    } else {
      console.log('📤 Orchestrator: No videos to emit, videos array length:', videos.length);
    }

    // Generate final answer
    const answer = await this.generateUnifiedFinalAnswer(query, unifiedContext, sources, images, videos, searchIntent, llm);

    // Emit the response in the format expected by the chat API
    this.emitter.emit('data', JSON.stringify({
      type: 'response',
      data: answer
    }));
    
    // Also emit the structured answer data for other consumers
    this.emitter.emit('data', JSON.stringify({
      type: 'answer_generated',
      data: {
        answer,
        sources: sources.slice(0, this.config.maxSources).map(doc => ({
          title: doc.metadata?.title || 'Untitled',
          url: doc.metadata?.url || '',
          score: doc.relevanceScore
        })),
        images: images.slice(0, 6),
        videos: videos.slice(0, 4),
        searchIntent: searchIntent
      }
    }));

    this.emitCompletion();
    } catch (error) {
      console.error('Error in generateUnifiedAnswer:', error);
      // Fallback to simple response
      await this.generateFallbackResponse(query, sources, images, videos, searchIntent, llm);
      this.emitCompletion();
    }
  }

  private async generateMediaOnlyResponse(
    query: string,
    images: ImageResult[],
    videos: VideoResult[],
    searchIntent: SearchIntent,
    llm: BaseChatModel
  ): Promise<void> {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'media_response',
        message: 'Generating media-focused response...',
        details: 'Creating response for visual/video content',
        progress: 90
      }
    }));

    // Emit media content
    if (images.length > 0) {
      this.emitter.emit('data', JSON.stringify({
        type: 'images',
        data: images,
        metadata: {
          totalFound: images.length,
          searchIntent: searchIntent.needsImages,
          confidence: searchIntent.confidence.images
        }
      }));
    }

    if (videos.length > 0) {
      this.emitter.emit('data', JSON.stringify({
        type: 'videos',
        data: videos,
        metadata: {
          totalFound: videos.length,
          searchIntent: searchIntent.needsVideos,
          confidence: searchIntent.confidence.videos
        }
      }));
    }

    // Generate media-focused response
    const answer = await this.generateMediaFocusedAnswer(query, images, videos, searchIntent, llm);

    this.emitter.emit('data', JSON.stringify({
      type: 'response',
      data: answer
    }));

    this.emitter.emit('data', JSON.stringify({
      type: 'answer_generated',
      data: {
        answer,
        images: images.slice(0, 6),
        videos: videos.slice(0, 4),
        searchIntent: searchIntent
      }
    }));

    this.emitCompletion();
  }

  private emitCompletion(): void {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'complete',
        message: 'Unified search completed successfully',
        details: 'All content types processed',
        progress: 100
      }
    }));

    this.emitter.emit('data', JSON.stringify({
      type: 'done',
      data: 'Unified search completed successfully'
    }));
  }

  private async generateAnswer(
    query: string,
    contextChunks: ContextChunk[],
    sources: RerankedDocument[],
    llm: BaseChatModel
  ): Promise<void> {
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'answer_generation',
        message: 'Generating comprehensive answer...',
        details: 'Synthesizing information from verified sources',
        progress: 90
      }
    }));

    // Merge context chunks into unified context
    const unifiedContext = await this.contextualFusion.mergeChunksIntoUnifiedContext(
      query,
      contextChunks,
      llm
    );

    // Emit sources first (as expected by the frontend)
    const maxSources = this.config.maxSources;
    this.emitter.emit('data', JSON.stringify({
      type: 'sources',
      data: sources.slice(0, maxSources),
      metadata: {
        totalFound: sources.length,
        maxDisplayed: maxSources,
        mode: this.config.mode
      }
    }));

    // Generate final answer
    const answer = await this.generateFinalAnswer(query, unifiedContext, sources, llm);

    // Emit the response in the format expected by the chat API
    this.emitter.emit('data', JSON.stringify({
      type: 'response',
      data: answer
    }));
    
    // Also emit the structured answer data for other consumers
    this.emitter.emit('data', JSON.stringify({
      type: 'answer_generated',
      data: {
        answer,
        sources: sources.slice(0, this.config.maxSources).map(doc => ({
          title: doc.metadata?.title || 'Untitled',
          url: doc.metadata?.url || '',
          score: doc.relevanceScore
        }))
      }
    }));

    // Emit completion progress
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'complete',
        message: 'Search completed successfully',
        details: 'Answer generation finished',
        progress: 100
      }
    }));

    // Emit done signal to indicate completion
    this.emitter.emit('data', JSON.stringify({
      type: 'done',
      data: 'Search completed successfully'
    }));
  }

  private async generateFinalAnswer(
    query: string,
    context: string,
    sources: RerankedDocument[],
    llm: BaseChatModel
  ): Promise<string> {
    const modePrompts = {
      quick: `You are Perplexify in Quick Mode - delivering immediate, utility-first answers. Your response should feel like a smart, citation-backed answer box that gets straight to the point.

Query: ${query}

Sources: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}

Context: ${context}

Quick Mode Guidelines:
- **Immediate and concise**: Lead with the direct answer in the first sentence
- **High-signal, low-noise**: Pack maximum relevant facts into minimal words
- **Clean citations**: Use [1], [2] inline for key facts only
- **Tight paragraphs**: 1-2 short paragraphs maximum
- **Utility-first**: Focus on what the user needs to know most
- **Just-the-answers**: Minimize scrolling, maximize usefulness

Deliver a snappy, focused answer that gets out of the way:`,

      pro: `You are Perplexify in Pro Mode - functioning as a researcher's assistant providing comprehensive, well-structured analysis with transparent citations.

Query: ${query}

Verified Sources: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}

Context: ${context}

Pro Mode Guidelines:
- **Researcher's depth**: Provide broader source discovery and denser synthesis
- **Structured analysis**: Use clear sections with descriptive headings
- **Rich citations**: Cite sources transparently with [1][2] for important claims
- **Multi-paragraph reasoning**: Develop ideas across 3-5 well-organized paragraphs
- **Weigh sources**: Address conflicting information when present
- **Academic-style overview**: Feel like a credible literature review
- **Completeness over brevity**: Trade some speed for thoroughness and traceability

Provide a comprehensive, well-structured research summary:`,

      ultra: `You are Perplexify in Ultra Mode - delivering premium reasoning and synthesis for complex queries where accuracy, nuance, and multi-step analysis are critical.

Query: ${query}

Comprehensive Sources: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}

Context: ${context}

Ultra Mode Guidelines:
- **Premium synthesis**: Conduct rigorous multi-hop reasoning and analysis
- **Explicit reconciliation**: Address contradictions and edge cases thoughtfully
- **Methodical structure**: Use clear sections like a decision memo or policy analysis
- **Nuanced reasoning**: Articulate assumptions, limitations, and trade-offs
- **Long-form coherence**: Maintain logical flow across extended analysis
- **High-stakes accuracy**: Double-check claims and provide confidence indicators
- **Advanced reasoning**: Show step-by-step thinking for complex conclusions
- **Professional depth**: Feel like a strategic analysis or technical evaluation

Deliver a thorough, methodical analysis with rigorous reasoning:`
    };

    const prompt = modePrompts[this.config.mode] || modePrompts.quick;

    try {
      const response = await llm.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Failed to generate final answer:', error);
      return 'I apologize, but I encountered an error while generating the final answer. Please try again.';
    }
  }

  // Public method to get the emitter for external use
  getEmitter(): eventEmitter {
    return this.emitter;
  }

  private async generateUnifiedFinalAnswer(
    query: string,
    context: string,
    sources: RerankedDocument[],
    images: ImageResult[],
    videos: VideoResult[],
    searchIntent: SearchIntent,
    llm: BaseChatModel
  ): Promise<string> {
    const hasImages = images.length > 0;
    const hasVideos = videos.length > 0;
    const hasDocuments = sources.length > 0;
    
    const mediaContext = `
${hasImages ? `\nRelevant Images Found: ${images.length} images related to "${query}"` : ''}
${hasVideos ? `\nRelevant Videos Found: ${videos.length} videos related to "${query}"` : ''}
${hasImages || hasVideos ? '\nNote: Visual content is available in separate tabs for detailed viewing.' : ''}`;

    const modePrompts = {
      quick: `You are Perplexify delivering a unified response with text${hasImages ? ', images' : ''}${hasVideos ? ', and videos' : ''}.

Query: ${query}
Search Intent: ${searchIntent.primaryIntent} (confidence: documents 100%, images ${Math.round(searchIntent.confidence.images * 100)}%, videos ${Math.round(searchIntent.confidence.videos * 100)}%)

${hasDocuments ? `Sources: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}` : ''}

Context: ${context}${mediaContext}

Guidelines:
- **Direct and comprehensive**: Address the query with all available content types
- **Cross-reference**: Mention when images/videos complement the text information
- **Clean citations**: Use [1], [2] for document sources
- **Media integration**: Reference visual content naturally when relevant
${hasImages ? '- **Image reference**: Mention that relevant images are available in the Images tab' : ''}
${hasVideos ? '- **Video reference**: Note that related videos can be found in the Videos tab' : ''}

Provide a focused answer that leverages all available content:`,

      pro: `You are Perplexify providing comprehensive analysis with multi-modal content including text${hasImages ? ', images' : ''}${hasVideos ? ', and videos' : ''}.

Query: ${query}
Search Intent Analysis: ${searchIntent.reasoning}
Content Distribution: Documents (100%), Images (${Math.round(searchIntent.confidence.images * 100)}%), Videos (${Math.round(searchIntent.confidence.videos * 100)}%)

${hasDocuments ? `Verified Sources: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}` : ''}

Research Context: ${context}${mediaContext}

Pro Mode Guidelines:
- **Multi-modal synthesis**: Integrate insights from all content types
- **Structured analysis**: Organize information clearly with appropriate headings
- **Rich citations**: Reference sources transparently [1][2]
- **Content cross-referencing**: Explain how different media types support your analysis
- **Comprehensive coverage**: Address multiple aspects revealed by different content types
${hasImages ? '- **Visual analysis**: Reference key visual insights available in Images tab' : ''}
${hasVideos ? '- **Video insights**: Mention relevant video content in Videos tab' : ''}

Deliver a thorough, well-structured analysis:`,

      ultra: `You are Perplexify conducting premium multi-modal research synthesis combining textual analysis${hasImages ? ', visual content' : ''}${hasVideos ? ', and video resources' : ''}.

Query: ${query}
Advanced Intent Analysis: ${searchIntent.reasoning}
Confidence Metrics: Documents (100%), Images (${Math.round(searchIntent.confidence.images * 100)}%), Videos (${Math.round(searchIntent.confidence.videos * 100)}%)
Primary Intent: ${searchIntent.primaryIntent}

${hasDocuments ? `Comprehensive Source Base: ${sources.map((s, i) => `[${i + 1}] ${s.metadata?.title || 'Untitled'} - ${s.metadata?.url || 'No URL'}`).join('\n')}` : ''}

Unified Research Context: ${context}${mediaContext}

Ultra Mode Guidelines:
- **Rigorous multi-modal synthesis**: Systematically integrate all content types
- **Advanced reasoning**: Show how different media types validate or contradict findings
- **Methodical structure**: Use clear sections and logical progression
- **Evidence triangulation**: Cross-validate information across text, visual, and video sources
- **Nuanced analysis**: Address complexities and edge cases revealed by comprehensive content
- **Professional depth**: Deliver analysis worthy of strategic decision-making
${hasImages ? '- **Visual evidence integration**: Explain how images support or extend textual findings' : ''}
${hasVideos ? '- **Video content synthesis**: Integrate insights from video demonstrations/explanations' : ''}

Deliver a methodical, comprehensive analysis with rigorous multi-modal reasoning:`
    };

    const prompt = modePrompts[this.config.mode] || modePrompts.quick;

    try {
      const response = await llm.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Failed to generate unified answer:', error);
      return 'I apologize, but I encountered an error while generating the comprehensive answer. Please try again.';
    }
  }

  private async generateMediaFocusedAnswer(
    query: string,
    images: ImageResult[],
    videos: VideoResult[],
    searchIntent: SearchIntent,
    llm: BaseChatModel
  ): Promise<string> {
    const hasImages = images.length > 0;
    const hasVideos = videos.length > 0;
    
    const prompt = `You are Perplexify responding to a media-focused query with ${hasImages ? `${images.length} images` : ''}${hasImages && hasVideos ? ' and ' : ''}${hasVideos ? `${videos.length} videos` : ''}.

Query: ${query}
Search Intent: ${searchIntent.reasoning}
Content Found: ${hasImages ? `Images (${images.length})` : ''}${hasImages && hasVideos ? ', ' : ''}${hasVideos ? `Videos (${videos.length})` : ''}

${hasImages ? `Image Results: ${images.slice(0, 3).map((img, i) => `${i + 1}. ${img.title}`).join(', ')}` : ''}
${hasVideos ? `Video Results: ${videos.slice(0, 3).map((vid, i) => `${i + 1}. ${vid.title}`).join(', ')}` : ''}

Guidelines:
- **Direct response**: Address the visual/video content request directly
- **Content overview**: Describe what type of visual content was found
- **Navigation guidance**: Explain how to access and view the content
- **Quality note**: Mention the relevance and variety of results
${hasImages ? '- **Image guidance**: Direct users to the Images tab for visual browsing' : ''}
${hasVideos ? '- **Video guidance**: Direct users to the Videos tab for video content' : ''}

Provide a helpful response about the visual content found:`;

    try {
      const response = await llm.invoke(prompt);
      return response.content as string;
    } catch (error) {
      console.error('Failed to generate media-focused answer:', error);
      return `I found ${hasImages ? `${images.length} relevant images` : ''}${hasImages && hasVideos ? ' and ' : ''}${hasVideos ? `${videos.length} relevant videos` : ''} for your query. Please check the ${hasImages ? 'Images' : ''}${hasImages && hasVideos ? ' and ' : ''}${hasVideos ? 'Videos' : ''} tab${(hasImages && hasVideos) ? 's' : ''} to explore the content.`;
    }
  }

  private async generateFallbackResponse(
    query: string,
    sources: RerankedDocument[],
    images: ImageResult[],
    videos: VideoResult[],
    searchIntent: SearchIntent,
    llm: BaseChatModel
  ): Promise<void> {
    console.log('🔄 Orchestrator: Generating fallback response...');
    
    // Create a simple response with available data
    const hasDocuments = sources && sources.length > 0;
    const hasImages = images && images.length > 0;
    const hasVideos = videos && videos.length > 0;
    
    let fallbackContent = `I found information related to your query "${query}".`;
    
    if (hasDocuments) {
      const topDocs = sources.slice(0, 3);
      const docSummary = topDocs.map(doc => 
        `- ${doc.metadata?.title || 'Source'}: ${doc.pageContent?.substring(0, 100) || 'Content available'}...`
      ).join('\n');
      fallbackContent += `\n\nBased on the sources I found:\n${docSummary}`;
    }
    
    if (hasImages) {
      fallbackContent += `\n\nI also found ${images.length} relevant images for your query.`;
    }
    
    if (hasVideos) {
      fallbackContent += `\n\nAdditionally, I found ${videos.length} relevant videos.`;
    }
    
    // Emit the fallback response
    this.emitter.emit('data', JSON.stringify({
      type: 'message',
      data: fallbackContent
    }));
    
    // Emit sources if available
    if (hasDocuments) {
      this.emitter.emit('data', JSON.stringify({
        type: 'sources',
        data: sources.slice(0, 5).map(doc => ({
          title: doc.metadata?.title || 'Untitled',
          url: doc.metadata?.url || '',
          content: doc.pageContent ? doc.pageContent.substring(0, 200) + '...' : 'No content available'
        }))
      }));
    }
  }

  // Method to update configuration
  updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.rerankingConfig) {
      this.neuralReranker.updateConfig(newConfig.rerankingConfig);
    }
    if (newConfig.fusionConfig) {
      this.contextualFusion.updateConfig(newConfig.fusionConfig);
    }
  }
}
