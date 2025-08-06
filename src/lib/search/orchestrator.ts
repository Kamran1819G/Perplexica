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
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

class SearchOrchestrator implements SearchOrchestratorType {
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
        result = await this.executeWebSearch(query, llm);
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

  private async executeWebSearch(query: string, llm: BaseChatModel): Promise<any> {
    if (!this.config.searchWeb) {
      return { results: [], message: 'Web search disabled for this mode' };
    }

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

          return { query: question, docs: documents };
        }
      }),
    ]);

    return await searchChain.invoke({ query });
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
    console.log('🔧 rerankDocs called with:', docs.length, 'docs and', fileIds.length, 'files');
    
    if (docs.length === 0 && fileIds.length === 0) {
      console.log('⚠️ rerankDocs: No docs or files, returning empty array');
      return docs;
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
      return docs.slice(0, 15);
    }

    const docsWithContent = docs.filter(
      (doc) => doc.pageContent && doc.pageContent.length > 0,
    );
    
    console.log('📊 rerankDocs: Filtered to', docsWithContent.length, 'docs with content');

          if (this.config.rerank === false) {
      console.log('⚠️ rerankDocs: Rerank disabled, using simple filtering');
      if (filesData.length > 0) {
        const [queryEmbedding] = await Promise.all([
          embeddings.embedQuery(query),
        ]);

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

        let sortedDocs = similarity
          .filter(
            (sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3),
          )
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 15)
          .map((sim) => fileDocs[sim.index]);

        sortedDocs =
          docsWithContent.length > 0 ? sortedDocs.slice(0, 8) : sortedDocs;

        return [
          ...sortedDocs,
          ...docsWithContent.slice(0, 15 - sortedDocs.length),
        ];
      } else {
        return docsWithContent.slice(0, 15);
      }
          } else {
      console.log('🧮 rerankDocs: Computing embeddings for', docsWithContent.length, 'documents...');
      let docEmbeddings, queryEmbedding;
      try {
        [docEmbeddings, queryEmbedding] = await Promise.all([
          embeddings.embedDocuments(
            docsWithContent.map((doc) => doc.pageContent),
          ),
          embeddings.embedQuery(query),
        ]);
        console.log('✅ rerankDocs: Embeddings computed successfully');
      } catch (embeddingError) {
        console.error('❌ rerankDocs: Error computing embeddings:', embeddingError);
        throw embeddingError;
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

      const sortedDocs = similarity
        .filter((sim) => sim.similarity > (this.config.rerankThreshold ?? 0.3))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 15)
        .map((sim) => docsWithContent[sim.index]);

      return sortedDocs;
    }

    return [];
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

      // Emit final results
      this.emitter.emit('data', JSON.stringify({
        type: 'sources',
        data: sources,
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

export default SearchOrchestrator;
export { SearchOrchestrator }; 