import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import LineListOutputParser from '../outputParsers/listLineOutputParser';
import LineOutputParser from '../outputParsers/lineOutputParser';
import { getDocumentsFromLinks } from '../utils/documents';
import { Document } from 'langchain/document';
import { searchSearxng } from '../searxng';
import path from 'node:path';
import fs from 'node:fs';
import computeSimilarity from '../utils/computeSimilarity';
import formatChatHistoryAsString from '../utils/formatHistory';
import eventEmitter from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import FollowUpGenerator, { FollowUpResult } from '../chains/followUpGenerator';
import CacheManager, { CacheKeys } from '../cache';
import { withErrorHandling, retryHandlers } from '../errorHandling';
import { trackAsync } from '../performance';

export interface SearchStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface SearchPlan {
  query: string;
  steps: SearchStep[];
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SearchOrchestratorType {
  planAndExecute: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,

    fileIds: string[],
    systemInstructions: string,
  ) => Promise<eventEmitter>;
}

interface OrchestratorConfig {
  searchWeb: boolean;
  rerank: boolean;
  summarizer: boolean;
  rerankThreshold: number;
  queryGeneratorPrompt: string;
  responsePrompt: string;
  activeEngines: string[];
  planningPrompt: string;
  maxSources?: number; // Maximum sources to return after ranking
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

class QuickSearchOrchestrator implements SearchOrchestratorType {
  protected config: OrchestratorConfig;
  private strParser = new StringOutputParser();
  protected emitter: eventEmitter;
  protected followUpGenerator: FollowUpGenerator;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.emitter = new eventEmitter();
    this.followUpGenerator = new FollowUpGenerator();
  }

  private createPlanningChain(llm: BaseChatModel) {
    return RunnableSequence.from([
      PromptTemplate.fromTemplate(this.config.planningPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        // Parse the planning output to extract steps
        const planOutputParser = new LineListOutputParser({
          key: 'steps',
        });

        const steps = await planOutputParser.parse(input);
        
        const searchPlan: SearchPlan = {
          query: '',
          steps: steps.map((step: string, index: number) => ({
            id: `step-${index + 1}`,
            name: step.trim(),
            status: 'pending' as const,
            description: `Executing: ${step.trim()}`,
          })),
          estimatedDuration: steps.length * 2, // Rough estimate
          priority: 'medium' as const,
        };

        return searchPlan;
      }),
    ]);
  }

  private async executeStep(
    step: SearchStep,
    llm: BaseChatModel,
    embeddings: Embeddings,
    query: string,
    history: BaseMessage[],
    fileIds: string[],

    systemInstructions: string,
  ): Promise<any> {
    // Update step status to running
    step.status = 'running';
    step.startTime = new Date();
    
    this.emitter.emit('stepUpdate', JSON.stringify({
      type: 'stepUpdate',
      step: step,
    }));

    try {
      let result: any = null;

      // Execute different types of steps based on the step name
      if (step.name.toLowerCase().includes('query analysis')) {
        result = await this.executeQueryAnalysis(query, llm);
      } else if (step.name.toLowerCase().includes('web search')) {
        result = await this.executeQuickSearch(query, llm);
      } else if (step.name.toLowerCase().includes('document retrieval')) {
        result = await this.executeDocumentRetrieval(query, llm);
      } else if (step.name.toLowerCase().includes('reranking')) {
        result = await this.executeReranking(query, [], fileIds, embeddings);
      } else if (step.name.toLowerCase().includes('content generation')) {
        result = await this.executeContentGeneration(query, history, llm, systemInstructions);
      } else {
        // Default step execution
        result = await this.executeGenericStep(step, query, llm);
      }

      // Update step status to completed
      step.status = 'completed';
      step.endTime = new Date();
      step.result = result;

      this.emitter.emit('stepUpdate', JSON.stringify({
        type: 'stepUpdate',
        step: step,
      }));

      return result;
    } catch (error: any) {
      // Update step status to failed
      step.status = 'failed';
      step.endTime = new Date();
      step.error = error.message;

      this.emitter.emit('stepUpdate', JSON.stringify({
        type: 'stepUpdate',
        step: step,
      }));

      throw error;
    }
  }

  private async executeQueryAnalysis(query: string, llm: BaseChatModel): Promise<any> {
    const analysisChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        Analyze the following query and provide insights:
        Query: {query}
        
        Provide:
        1. Query intent
        2. Key topics
        3. Search strategy
        4. Expected information type
      `),
      llm,
      this.strParser,
    ]);

    return await analysisChain.invoke({ query });
  }

  private async executeQuickSearch(query: string, llm: BaseChatModel): Promise<any> {
    if (!this.config.searchWeb) {
      return { results: [], message: 'Web search disabled for this mode' };
    }

    return await trackAsync(
      'quick_search_execution',
      async () => {
        return await withErrorHandling(
          async () => {
            // Check cache first
            const cacheKey = CacheKeys.search(query, 'quick');
            const cached = CacheManager.get(cacheKey, 'search');
            
            if (cached) {
              this.emitter.emit('data', JSON.stringify({
                type: 'cache_hit',
                message: 'Using cached search results',
              }));
              return cached;
            }

            // Initialize single agent for Quick search
            const agent = {
              id: 'quick-agent-1',
              query,
              status: 'running' as 'pending' | 'running' | 'completed' | 'failed',
              results: 0
            };

            // Emit agent data
            this.emitter.emit('data', JSON.stringify({
              type: 'agents',
              data: [agent]
            }));

            const searchChain = RunnableSequence.from([
              PromptTemplate.fromTemplate(this.config.queryGeneratorPrompt),
              llm,
              this.strParser,
              RunnableLambda.from(async (input: string) => {
                const linksOutputParser = new LineListOutputParser({
                  key: 'links',
                });

                const questionOutputParser = new LineOutputParser({
                  key: 'question',
                });

                const links = await linksOutputParser.parse(input);
                let question = this.config.summarizer
                  ? await questionOutputParser.parse(input)
                  : input;

                if (question === 'not_needed') {
                  return { query: '', docs: [] };
                }

                if (links.length > 0) {
                  // Handle direct links
                  const linkDocs = await getDocumentsFromLinks({ links });
                  return { query: question, docs: linkDocs };
                } else {
                  // Perform web search
                  question = question.replace(/<think>.*?<\/think>/g, '');
                  
                  const res = await searchSearxng(question, {
                    language: 'en',
                    engines: this.config.activeEngines,
                  });

                  const documents = res.results.map(
                    (result) =>
                      new Document({
                        pageContent:
                          result.content ||
                          (this.config.activeEngines.includes('youtube')
                            ? result.title
                            : ''),
                        metadata: {
                          title: result.title,
                          url: result.url,
                          ...(result.img_src && { img_src: result.img_src }),
                        },
                      }),
                  );

                  const result = { query: question, docs: documents };
                  
                  // Cache the results
                  CacheManager.set(cacheKey, result, 'search', 5 * 60 * 1000); // 5 minutes
                  
                  return result;
                }
              }),
            ]);

            const searchResult = await searchChain.invoke({ query });

            // Update agent status to completed
            agent.status = 'completed';
            agent.results = searchResult.docs?.length || 0;

            // Emit agent completion update
            this.emitter.emit('data', JSON.stringify({
              type: 'agentUpdate',
              data: {
                id: agent.id,
                status: agent.status,
                query: agent.query,
                results: agent.results
              }
            }));

            return searchResult;
          },
          'quick_search',
          {
            retryHandler: retryHandlers.search,
            fallback: () => ({
              query: '',
              docs: [],
              _fallback: true,
            }),
          }
        );
      },
      { query }
    );
  }

  private async executeDocumentRetrieval(query: string, llm: BaseChatModel): Promise<any> {
    // This would handle document retrieval from uploaded files
    return { message: 'Document retrieval completed', docs: [] };
  }

  private async executeReranking(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,

  ): Promise<any> {
    if (!this.config.rerank) {
      return { docs: docs };
    }

    const sortedDocs = await this.rerankDocs(
      query,
      docs,
      fileIds,
      embeddings,
  
    );

    return { docs: sortedDocs };
  }

  private async executeContentGeneration(
    query: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    systemInstructions: string,
  ): Promise<any> {
    const generationChain = RunnableSequence.from([
      ChatPromptTemplate.fromMessages([
        ['system', this.config.responsePrompt],
        new MessagesPlaceholder('chat_history'),
        ['user', '{query}'],
      ]),
      llm,
      this.strParser,
    ]);

    return await generationChain.invoke({
      chat_history: history,
      query: query,
    });
  }

  private async executeGenericStep(step: SearchStep, query: string, llm: BaseChatModel): Promise<any> {
    // Generic step execution
    const genericChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        Execute the following step: {step}
        Query: {query}
        
        Provide a detailed result of this step execution.
      `),
      llm,
      this.strParser,
    ]);

    return await genericChain.invoke({
      step: step.name,
      query: query,
    });
  }

  protected async rerankDocs(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,

  ) {
    return await trackAsync(
      'rerank_documents',
      async () => {
        return await withErrorHandling(
          async () => {
            const maxSources = this.config.maxSources || 15;
            console.log('🔧 rerankDocs called with:', docs.length, 'docs and', fileIds.length, 'files');
            console.log('📊 rerankDocs: Max sources configured:', maxSources);
            
            if (docs.length === 0 && fileIds.length === 0) {
              console.log('⚠️ rerankDocs: No docs or files, returning empty array');
              return docs;
            }

            // Check cache for query embedding
            const queryEmbeddingKey = CacheKeys.embedding(query);
            let queryEmbedding = CacheManager.get(queryEmbeddingKey, 'embedding');
            
            if (!queryEmbedding) {
              queryEmbedding = await embeddings.embedQuery(query);
              CacheManager.set(queryEmbeddingKey, queryEmbedding, 'embedding', 60 * 60 * 1000); // 1 hour
            }

            const filesData = fileIds
              .map((file) => {
                const filePath = path.join(process.cwd(), 'uploads', file);

                const contentPath = filePath + '-extracted.json';
                const embeddingsPath = filePath + '-embeddings.json';

                const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
                const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

                const fileSimilaritySearchObject = content.contents.map(
                  (c: string, i: number) => {
                    return {
                      fileName: content.title,
                      content: c,
                      embeddings: embeddings.embeddings[i],
                    };
                  },
                );

                return fileSimilaritySearchObject;
              })
              .flat();

            if (query.toLocaleLowerCase() === 'summarize') {
              console.log('📝 rerankDocs: Summarize mode, returning first', maxSources, 'docs');
              return docs.slice(0, maxSources);
            }

            const docsWithContent = docs.filter(
              (doc) => doc.pageContent && doc.pageContent.length > 0,
            );
            
            console.log('📊 rerankDocs: Filtered to', docsWithContent.length, 'docs with content');

            if (this.config.rerank === false) {
              console.log('⚠️ rerankDocs: Rerank disabled, using simple filtering');
              if (filesData.length > 0) {
                // Use cached query embedding (already computed above)

            const fileDocs = filesData.map((fileData) => {
              return new Document({
                pageContent: fileData.content,
                metadata: {
                  title: fileData.fileName,
                  url: `File`,
                },
              });
            });

            const similarity = filesData.map((fileData, i) => {
              const sim = computeSimilarity(queryEmbedding, fileData.embeddings);

              return {
                index: i,
                similarity: sim,
              };
            });

            const fileSourcesLimit = Math.floor(maxSources * 0.4); // 40% for file sources
            const webSourcesLimit = maxSources - fileSourcesLimit; // 60% for web sources
            
            let sortedDocs = similarity
              .filter(
                (sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3),
              )
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, fileSourcesLimit)
              .map((sim) => fileDocs[sim.index]);

            console.log('📁 rerankDocs: Selected', sortedDocs.length, 'file sources out of', filesData.length, 'available');

            const finalSources = [
              ...sortedDocs,
              ...docsWithContent.slice(0, webSourcesLimit),
            ];

            console.log('📊 rerankDocs: Final mix -', sortedDocs.length, 'file sources +', Math.min(webSourcesLimit, docsWithContent.length), 'web sources =', finalSources.length, 'total');
            return finalSources;
          } else {
            console.log('🌐 rerankDocs: No files, returning top', maxSources, 'web sources out of', docsWithContent.length, 'available');
            return docsWithContent.slice(0, maxSources);
          }
        } else {
          console.log('🧮 rerankDocs: Computing embeddings for', docsWithContent.length, 'documents...');
          
          // Check cache for document embeddings
          const docContents = docsWithContent.map((doc) => doc.pageContent);
          const docEmbeddingKeys = docContents.map(content => CacheKeys.embedding(content));
          
          let docEmbeddings = [];
          const uncachedContents = [];
          const uncachedIndices = [];
          
          for (let i = 0; i < docContents.length; i++) {
            const cached = CacheManager.get(docEmbeddingKeys[i], 'embedding');
            if (cached) {
              docEmbeddings[i] = cached;
            } else {
              uncachedContents.push(docContents[i]);
              uncachedIndices.push(i);
            }
          }
          
          // Compute embeddings for uncached documents
          if (uncachedContents.length > 0) {
            const newEmbeddings = await embeddings.embedDocuments(uncachedContents);
            for (let i = 0; i < newEmbeddings.length; i++) {
              const index = uncachedIndices[i];
              docEmbeddings[index] = newEmbeddings[i];
              CacheManager.set(docEmbeddingKeys[index], newEmbeddings[i], 'embedding', 60 * 60 * 1000); // 1 hour
            }
          }

          docsWithContent.push(
            ...filesData.map((fileData) => {
              return new Document({
                pageContent: fileData.content,
                metadata: {
                  title: fileData.fileName,
                  url: `File`,
                },
              });
            }),
          );

          docEmbeddings.push(...filesData.map((fileData) => fileData.embeddings));

          const similarity = docEmbeddings.map((docEmbedding, i) => {
            const sim = computeSimilarity(queryEmbedding, docEmbedding);

            return {
              index: i,
              similarity: sim,
            };
          });

          const filteredByThreshold = similarity.filter((sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3));
          console.log('🎯 rerankDocs: Filtered', filteredByThreshold.length, 'sources above threshold', this.config.rerankThreshold, 'out of', similarity.length, 'total');
          
          const sortedDocs = filteredByThreshold
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxSources)
            .map((sim) => docsWithContent[sim.index]);

          console.log('✅ rerankDocs: Returning top', sortedDocs.length, 'sources after reranking');
          return sortedDocs;
        }
          },
          'rerank_documents',
          {
            retryHandler: retryHandlers.search,
            fallback: () => docs.slice(0, this.config.maxSources || docs.length),
          }
        );
      },
      { query, docCount: docs.length }
    );
  }

  private async handleStream(
    stream: AsyncGenerator<StreamEvent, any, any>,
    emitter: eventEmitter,
  ) {
    for await (const event of stream) {
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalSourceRetriever'
      ) {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'sources', data: event.data.output }),
        );
      }
      if (
        event.event === 'on_chain_stream' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.data.chunk }),
        );
      }
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit('end');
      }
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
    console.log('🚀 SearchOrchestrator.planAndExecute started for query:', message);
    
    // Phase 1: Planning
    console.log('📋 Emitting planning progress...');
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'planning',
        message: 'Analyzing your question...',
        details: 'Understanding the search requirements',
        progress: 10
      }
    }));

    console.log('🔧 Creating planning chain...');

    const planningChain = this.createPlanningChain(llm);
    console.log('⏳ Invoking planning chain...');
    
    let searchPlan;
    try {
      searchPlan = await planningChain.invoke({
        query: message,
        systemInstructions: systemInstructions,
      });
      console.log('✅ Planning completed, steps:', searchPlan.steps?.length || 0);
    } catch (planError) {
      console.error('❌ Planning failed:', planError);
      throw planError;
    }

    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'planning_complete',
        message: 'Search plan created',
        details: `Planning ${searchPlan.steps.length} search steps`,
        progress: 20
      }
    }));

    this.emitter.emit('data', JSON.stringify({
      type: 'plan',
      data: searchPlan,
    }));

    // Phase 2: Execution
    this.emitter.emit('data', JSON.stringify({
      type: 'progress',
      data: {
        step: 'searching',
        message: 'Searching the web...',
        details: 'Finding relevant information sources',
        progress: 30
      }
    }));

    let finalResult = '';
    let sources: any[] = [];

    try {
      // Execute each step in the plan
      const totalSteps = searchPlan.steps.length;
      console.log(`🔄 Starting execution of ${totalSteps} steps...`);
      
      for (let i = 0; i < searchPlan.steps.length; i++) {
        const step = searchPlan.steps[i];
        const progressPercent = 30 + ((i / totalSteps) * 40); // 30-70% for execution
        
        console.log(`⚡ Executing step ${i + 1}/${totalSteps}: ${step.name}`);
        
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'executing',
            message: `Executing: ${step.name}`,
            details: `Step ${i + 1} of ${totalSteps}`,
            progress: Math.round(progressPercent)
          }
        }));

        let stepResult;
        try {
          stepResult = await this.executeStep(
            step,
            llm,
            embeddings,
            message,
            history,
            fileIds,
            systemInstructions,
          );
          console.log(`✅ Step ${i + 1} completed:`, step.name);
        } catch (stepError) {
          console.error(`❌ Step ${i + 1} failed:`, step.name, stepError);
          throw stepError;
        }

        // Handle different types of step results
        if (step.name.toLowerCase().includes('content generation')) {
          finalResult = stepResult;
        } else if (step.name.toLowerCase().includes('web search') || 
                   step.name.toLowerCase().includes('document retrieval')) {
          if (stepResult.docs) {
            sources = stepResult.docs;
            this.emitter.emit('data', JSON.stringify({
              type: 'progress',
              data: {
                step: 'sources_found',
                message: 'Found relevant sources',
                details: `Collected ${stepResult.docs.length} sources`,
                progress: Math.round(progressPercent + 5)
              }
            }));
          }
        }
      }

      // Processing phase
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'processing',
          message: 'Processing information...',
          details: 'Analyzing and ranking sources',
          progress: 75
        }
      }));

      // Generating response
      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'generating',
          message: 'Generating response...',
          details: 'Creating comprehensive answer',
          progress: 85
        }
      }));

      // Emit final results with transparency about source count
      const maxSources = this.config.maxSources || 15;
      this.emitter.emit('data', JSON.stringify({
        type: 'sources',
        data: sources,
        metadata: {
          totalFound: sources.length,
          maxDisplayed: maxSources,
          mode: 'quick'
        }
      }));

      this.emitter.emit('data', JSON.stringify({
        type: 'response',
        data: finalResult,
      }));

      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'completing',
          message: 'Finalizing response...',
          details: 'Adding follow-up suggestions',
          progress: 95
        }
      }));

      // Generate follow-up questions and related queries
      try {
        const contextText = sources.map(doc => doc.pageContent).join(' ').substring(0, 2000);
        const followUps = await this.followUpGenerator.generateFollowUps(
          message,
          finalResult,
          history,
          contextText,
          llm,
        );

        this.emitter.emit('data', JSON.stringify({
          type: 'followUps',
          data: followUps,
        }));
      } catch (error) {
        console.error('Error generating follow-ups:', error);
      }

      this.emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'complete',
          message: 'Search completed successfully',
          details: 'Ready for your next question',
          progress: 100
        }
      }));

      this.emitter.emit('data', JSON.stringify({
        type: 'done',
        data: 'Search execution completed',
      }));

    } catch (error: any) {
      this.emitter.emit('data', JSON.stringify({
        type: 'error',
        data: error.message,
      }));
    }

    this.emitter.emit('end');
    return this.emitter;
  }
}

export default QuickSearchOrchestrator;
export { QuickSearchOrchestrator }; 