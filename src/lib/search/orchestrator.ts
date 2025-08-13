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

export interface OrchestratorConfig {
  mode: 'quick' | 'pro' | 'ultra';
  maxSources: number;
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
  };
}

export class SearchOrchestrator {
  private config: OrchestratorConfig;
  private neuralReranker: NeuralReranker;
  private contextualFusion: ContextualFusion;
  private searxng: SearxngClient;
  private emitter: eventEmitter;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.neuralReranker = new NeuralReranker(config.rerankingConfig);
    this.contextualFusion = new ContextualFusion(config.fusionConfig);
    this.searxng = new SearxngClient();
    this.emitter = new eventEmitter();
  }

  async executeSearch(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    fileIds: string[] = [],
    systemInstructions: string = ''
  ): Promise<eventEmitter> {
    return await trackAsync('search_execution', async () => {
      try {
        // Blazing fast parallel execution - run phases concurrently where possible
        const startTime = Date.now();
        
        // Phase 1: Quick query analysis (non-blocking)
        const analysisPromise = this.analyzeQuery(query, history, llm);
        
        // Phase 2: Generate queries immediately (parallel with analysis)
        const queriesPromise = this.generateSearchQueries(query, llm);
        
        // Wait for queries and start search immediately
        const [searchQueries] = await Promise.all([queriesPromise, analysisPromise]);
        
        // Phase 3: Start document retrieval and reranking pipeline
        const documentsPromise = this.retrieveDocuments(searchQueries);
        
        // Phase 4 & 5: Pipeline reranking and fusion
        const documents = await documentsPromise;
        
        // Run reranking and context creation in optimized pipeline
        const [rerankedDocs, contextChunks] = await Promise.all([
          this.rerankDocuments(query, documents, embeddings),
          // Start context creation with initial documents for speed
          documents.length > 0 ? 
            this.createContextChunks(query, documents.slice(0, 10).map((doc, i) => ({
              ...doc,
              relevanceScore: 1 - (i * 0.1),
              originalRank: i
            })), llm) : 
            Promise.resolve([])
        ]);
        
        // Phase 6: Generate answer with best available data
        await this.generateAnswer(query, contextChunks, rerankedDocs, llm);
        
        const endTime = Date.now();
        this.emitter.emit('data', JSON.stringify({
          type: 'complete',
          data: { 
            message: 'Search completed successfully',
            executionTime: endTime - startTime,
            mode: this.config.mode
          }
        }));

        // Emit end event to close the stream
        this.emitter.emit('end');

        return this.emitter;
      } catch (error) {
        console.error('Search failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.emitter.emit('data', JSON.stringify({
          type: 'error',
          data: { error: errorMessage }
        }));
        
        // Emit end event even on error to close the stream
        this.emitter.emit('end');
        
        throw error;
      }
    });
  }

  private async analyzeQuery(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel
  ): Promise<void> {
    const modeMessages = {
      quick: {
        message: 'Quick analysis for immediate results...',
        details: 'Optimizing for speed and relevance'
      },
      pro: {
        message: 'Analyzing query for comprehensive research...',
        details: 'Planning multi-source investigation'
      },
      ultra: {
        message: 'Deep analysis for premium synthesis...',
        details: 'Preparing rigorous multi-dimensional research'
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
      data: { complexity: queryComplexity, mode: this.config.mode }
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
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'context_fusion',
        message: 'Creating context chunks...',
        details: 'Merging and organizing information for synthesis',
        progress: 80
      }
    }));

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
