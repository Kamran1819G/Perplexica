import QuickSearchOrchestratorBase, { SearchOrchestratorType } from './quickSearchOrchestrator';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { searchSearxng } from '../searxng';
import { Document } from 'langchain/document';
import { getDocumentsFromLinks } from '../utils/documents';
import CacheManager, { CacheKeys } from '../cache';
import { withErrorHandling, retryHandlers } from '../errorHandling';
import { trackAsync } from '../performance';

const proSearchPlanningPrompt = `
You are an expert research assistant planning a comprehensive search strategy for a complex query. 
Your goal is to break down the query into multiple specific, targeted search steps that will provide comprehensive coverage.

For the query: {query}
Context: {context}


Create a detailed search plan with 4-6 specific steps that:
1. Start with a broad overview search
2. Dig into specific aspects or sub-topics
3. Find recent developments or updates
4. Compare different perspectives or alternatives
5. Look for expert opinions or authoritative sources
6. Find practical applications or examples

Each step should be a specific, actionable search query that would yield unique, valuable information.

Format your response as a list of steps, one per line:
Overview of [main topic] and its key components
Recent developments in [specific aspect] during 2024-2025
Expert opinions on [specific angle or controversy]
Comparison between [alternative approaches or solutions]
Real-world applications of [topic] in [industry/context]
Future trends and predictions for [topic]
`;

interface ProSearchConfig {
  searchWeb: boolean;
  rerank: boolean;
  summarizer: boolean;
  rerankThreshold: number;
  queryGeneratorPrompt: string;
  responsePrompt: string;
  activeEngines: string[];
  planningPrompt: string;
  maxSearchSteps: number;
  deepAnalysis: boolean;
  maxSources?: number; // Maximum sources to return after ranking
}

export class ProSearchOrchestrator extends QuickSearchOrchestratorBase implements SearchOrchestratorType {
  private proConfig: ProSearchConfig;

  constructor(config: ProSearchConfig) {
    super(config);
    this.proConfig = config;
  }

  private async executeAdvancedQuickSearch(
    queries: string[],
    llm: BaseChatModel,
    emitter?: any
  ): Promise<Document[]> {
    const allDocuments: Document[] = [];
    
    // Initialize agents for Pro search
    const agents = queries.map((query, index) => ({
      id: `pro-agent-${index + 1}`,
      query,
      status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
      results: 0
    }));

    if (emitter) {
      // Emit initial agents data
      emitter.emit('data', JSON.stringify({
        type: 'agents',
        data: agents
      }));
    }
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const progressPercent = 30 + ((i / queries.length) * 35); // 30-65% for searches
      const agent = agents[i];
      
      if (emitter) {
        emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'searching_query',
            message: `Searching: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`,
            details: `Query ${i + 1} of ${queries.length}`,
            progress: Math.round(progressPercent)
          }
        }));

        // Update agent status to running
        agent.status = 'running';
        emitter.emit('data', JSON.stringify({
          type: 'agentUpdate',
          data: {
            id: agent.id,
            status: agent.status,
            query: agent.query,
            results: 0
          }
        }));
      }

      try {
        // Check cache first
        const cacheKey = CacheKeys.search(query, 'pro');
        const cached = CacheManager.get(cacheKey, 'search');
        
        if (cached) {
          if (emitter) {
            emitter.emit('data', JSON.stringify({
              type: 'cache_hit',
              message: `Using cached results for query ${i + 1}`,
            }));
          }
          allDocuments.push(...cached.documents);
          
          // Update agent status to completed
          agent.status = 'completed';
          agent.results = cached.documents.length;
          if (emitter) {
            emitter.emit('data', JSON.stringify({
              type: 'agentUpdate',
              data: {
                id: agent.id,
                status: agent.status,
                query: agent.query,
                results: agent.results
              }
            }));
          }
          continue;
        }

        // Search with multiple engines for comprehensive results
        const searchResults = await searchSearxng(query, {
          language: 'en',
          engines: this.proConfig.activeEngines,
          time_range: ['year'], // Focus on recent content
        });

        const documents = searchResults.results.map(
          (result) =>
            new Document({
              pageContent: result.content || result.title,
              metadata: {
                title: result.title,
                url: result.url,
                query: query, // Track which query found this
                ...(result.img_src && { img_src: result.img_src }),
              },
            }),
        );

        // Cache the results
        CacheManager.set(cacheKey, { documents }, 'search', 5 * 60 * 1000); // 5 minutes

        allDocuments.push(...documents);

        // Update agent status to completed
        agent.status = 'completed';
        agent.results = documents.length;

        if (emitter && documents.length > 0) {
          this.emitter.emit('data', JSON.stringify({
            type: 'progress',
            data: {
              step: 'query_results',
              message: `Found ${documents.length} sources`,
              details: `Total: ${allDocuments.length} sources collected`,
              progress: Math.round(progressPercent + 2)
            }
          }));

          // Emit agent completion update
          emitter.emit('data', JSON.stringify({
            type: 'agentUpdate',
            data: {
              id: agent.id,
              status: agent.status,
              query: agent.query,
              results: agent.results
            }
          }));
        }
        
        // Brief delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Pro search failed for query: ${query}`, error);
        
        // Update agent status to failed
        agent.status = 'failed';
        agent.results = 0;
        
        if (emitter) {
          this.emitter.emit('data', JSON.stringify({
            type: 'progress',
            data: {
              step: 'query_error',
              message: 'Search query failed, continuing...',
              details: `Error with query ${i + 1}, trying next`,
              progress: Math.round(progressPercent)
            }
          }));

          // Emit agent failure update
          emitter.emit('data', JSON.stringify({
            type: 'agentUpdate',
            data: {
              id: agent.id,
              status: agent.status,
              query: agent.query,
              results: agent.results
            }
          }));
        }
      }
    }

    return allDocuments;
  }

  private async generateProSearchQueries(
    originalQuery: string,
    llm: BaseChatModel,

  ): Promise<string[]> {
    console.log('🔧 ProSearch: Creating query generation chain...');
    const queryGenerationChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        You are an expert at generating comprehensive search queries for in-depth research.
        
        Original query: {originalQuery}
  
        
        Generate 4-6 specific, targeted search queries that would provide comprehensive coverage of this topic.
        Each query should explore a different angle or aspect.
        
        Focus on:
        - Current developments and recent news
        - Expert analysis and professional insights  
        - Different perspectives and approaches
        - Practical applications and case studies
        - Comparative analysis
        - Future trends and implications
        
        Format as a simple list, one query per line:
      `),
      llm,
      new StringOutputParser(),
      RunnableLambda.from(async (output: string) => {
        console.log('🔍 ProSearch: LLM raw output:', output);
        const queries = output
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.trim().replace(/^[-*•]\s*/, '').replace(/^["']+|["']+$/g, '')) // Remove quotes
          .slice(0, 6);
        console.log('🔍 ProSearch: Parsed queries:', queries);
        return queries;
      }),
    ]);

    try {
      console.log('⏳ ProSearch: Invoking query generation chain with:', originalQuery);
      const queries = await queryGenerationChain.invoke({
        originalQuery,
      });
      
      console.log('✅ ProSearch: Query generation completed');
      return queries as string[];
    } catch (error) {
      console.error('❌ ProSearch: Error generating queries:', error);
      return [originalQuery]; // Fallback to original query
    }
  }

  async planAndExecute(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,

    fileIds: string[],
    systemInstructions: string,
  ): Promise<eventEmitter> {
    console.log('🚀 ProSearchOrchestrator.planAndExecute started for query:', message);

    // Allow time for event listeners to be attached
    setTimeout(async () => {
      try {
      // Phase 1: Advanced Planning
      console.log('📋 ProSearch: Emitting planning progress...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'pro_planning',
          message: 'Analyzing question complexity...',
          details: 'Pro Search: Breaking down into research angles',
          progress: 5
        }
      }));

      // Generate multiple targeted search queries
      console.log('🔧 ProSearch: Emitting query generation progress...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'query_generation',
          message: 'Generating research queries...',
          details: 'Creating targeted search strategies',
          progress: 15
        }
      }));

      console.log('⏳ ProSearch: Generating search queries...');
      const searchQueries = await this.generateProSearchQueries(
        message,
        llm
      );
      console.log('✅ ProSearch: Generated queries:', searchQueries.length);

      console.log('📤 ProSearch: Emitting queries ready progress...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'queries_ready',
          message: `Generated ${searchQueries.length} research queries`,
          details: 'Ready to execute comprehensive search',
          progress: 25
        }
      }));

      console.log('📤 ProSearch: Emitting proQueries data...');
      this.emitter.emit('data', JSON.stringify({
        type: 'proQueries',
        data: searchQueries,
      }));

      // Phase 2: Comprehensive Web Search
      console.log('🔍 ProSearch: Starting multi-search phase...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'multi_search',
          message: 'Executing multi-angle search...',
          details: 'Searching with multiple specialized queries',
          progress: 30
        }
      }));

      console.log('⏳ ProSearch: Calling executeAdvancedQuickSearch...');
      const allDocuments = await this.executeAdvancedQuickSearch(searchQueries, llm, this.emitter);
      console.log('✅ ProSearch: Web search completed, found documents:', allDocuments.length);

      // Phase 3: Advanced Document Processing and Ranking
      console.log('📊 ProSearch: Starting document processing phase...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'processing',
          message: 'Processing comprehensive results...',
          details: `Analyzing ${allDocuments.length} sources for relevance`,
          progress: 70
        }
      }));

      console.log('⏳ ProSearch: Calling rerankDocs with', allDocuments.length, 'documents...');
      let rankedDocuments;
      try {
        rankedDocuments = await this.rerankDocs(
          message,
          allDocuments,
          fileIds,
          embeddings,
        );
        console.log('✅ ProSearch: Document ranking completed, ranked documents:', rankedDocuments.length);
      } catch (rerankError) {
        console.error('❌ ProSearch: Error during reranking:', rerankError);
        throw rerankError;
      }

      // Phase 4: Enhanced Response Generation
      console.log('✍️ ProSearch: Starting response generation phase...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'generating',
          message: 'Generating comprehensive response...',
          details: 'Synthesizing information from multiple angles',
          progress: 85
        }
      }));

      console.log('🔧 ProSearch: Creating enhanced response prompt...');
      const enhancedResponsePrompt = `
        You are an expert research assistant providing focused, insightful analysis with multiple perspectives.
        
        System Instructions: {systemInstructions}
        
        Query: {query}
        Date: {date}
        
        Based on comprehensive research using multiple targeted searches, provide a well-structured response that:
        
        1. **Starts with a clear answer** - Get to the point quickly
        2. **Presents key insights** - Highlight the most important findings
        3. **Shows multiple angles** - Include different perspectives when relevant
        4. **Provides context** - Explain why this information matters
        5. **Includes practical details** - Give actionable information when possible
        6. **Cites sources naturally** - Use [1], [2], etc. throughout the text
        7. **Stays focused** - Avoid unnecessary detail while being comprehensive
        
        ### Response Structure
        - **Direct answer** (1-2 sentences)
        - **Key points** (bullet points for main insights)
        - **Context and details** (paragraphs for important background)
        - **Practical implications** (when relevant)
        - **Related considerations** (if applicable)
        
        ### Writing Style
        - Conversational but professional
        - Clear and accessible
        - Well-organized with headings
        - Concise paragraphs (2-3 sentences)
        - Use **bold** for emphasis
        
        Sources and Context:
        {context}
        
        Write a focused, insightful response that provides depth without being overwhelming.
        Use numbered citations [1], [2], etc. that correspond to the source order provided.
      `;

      // Create enhanced answering chain
      console.log('🔗 ProSearch: Creating answering chain...');
      const answeringChain = RunnableSequence.from([
        RunnableLambda.from(async () => {
          const contextText = rankedDocuments
            .map((doc, index) => `[${index + 1}] ${doc.metadata.title}: ${doc.pageContent}`)
            .join('\n\n');

          // Limit context length to prevent token limit issues
          const maxContextLength = 10000; // Reasonable limit for LLM
          const truncatedContext = contextText.length > maxContextLength 
            ? contextText.substring(0, maxContextLength) + '\n\n[Content truncated due to length...]'
            : contextText;

          console.log('📄 ProSearch: Context length:', contextText.length, 'characters (truncated to:', truncatedContext.length, ')');
          return {
            systemInstructions: systemInstructions || 'Provide accurate, helpful, and comprehensive information.',
            query: message,
            date: new Date().toISOString(),
            context: truncatedContext,
          };
        }),
        PromptTemplate.fromTemplate(enhancedResponsePrompt),
        llm,
        new StringOutputParser(),
      ]);

      console.log('⏳ ProSearch: Invoking answering chain...');
      let response;
      try {
        response = await answeringChain.invoke({});
        console.log('✅ ProSearch: Response generation completed, length:', response.length);
      } catch (responseError) {
        console.error('❌ ProSearch: Error generating response:', responseError);
        throw responseError;
      }

      // Emit results with transparency about source count
      console.log('📤 ProSearch: Emitting sources...');
      const maxSources = this.proConfig.maxSources || 25;
      this.emitter.emit('data', JSON.stringify({
        type: 'sources',
        data: rankedDocuments,
        metadata: {
          totalFound: rankedDocuments.length,
          maxDisplayed: maxSources,
          mode: 'pro'
        }
      }));

      console.log('📤 ProSearch: Emitting response...');
      this.emitter.emit('data', JSON.stringify({
        type: 'response',
        data: response,
      }));

      // Generate enhanced follow-ups for Pro mode
      console.log('🔄 ProSearch: Generating follow-ups...');
      try {
        const contextText = rankedDocuments.map(doc => doc.pageContent).join(' ').substring(0, 3000);
        console.log('⏳ ProSearch: Calling followUpGenerator.generateFollowUps...');
        const followUps = await this.followUpGenerator.generateFollowUps(
          message,
          response,
          history,
          contextText,
          llm,
        );
        console.log('✅ ProSearch: Follow-ups generated successfully');

        console.log('📤 ProSearch: Emitting follow-ups...');
        this.emitter.emit('data', JSON.stringify({
          type: 'followUps',
          data: followUps,
        }));
      } catch (error) {
        console.error('❌ ProSearch: Error generating pro follow-ups:', error);
      }

      console.log('📤 ProSearch: Emitting completion progress...');
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'complete',
          message: 'Pro Search completed successfully',
          details: 'Comprehensive analysis ready',
          progress: 100
        }
      }));

      console.log('📤 ProSearch: Emitting done signal...');
      this.emitter.emit('data', JSON.stringify({
        type: 'done',
        data: 'Pro Search completed successfully',
      }));

      } catch (error: any) {
        this.emitter.emit('data', JSON.stringify({
          type: 'error',
          data: `Pro Search error: ${error.message}`,
        }));
      }

      this.emitter.emit('end');
    }, 10); // 10ms delay to allow event listeners to attach

    return this.emitter;
  }
}

export default ProSearchOrchestrator;