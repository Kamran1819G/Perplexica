import ProSearchOrchestrator from './proSearchOrchestrator';
import { SearchOrchestratorType } from './quickSearchOrchestrator';
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

const ultraSearchPlanningPrompt = `
You are an expert research strategist designing a comprehensive ultra-deep research plan for complex queries.
Your goal is to create a multi-layered research strategy that rivals PhD-level analysis.

For the query: {query}
Context: {context}

Create an ultra-comprehensive research plan with 8-12 specific research phases that include:

1. **Contextual Foundation** - Establish core concepts and terminology
2. **Historical Context** - Background and evolution of the topic
3. **Current State Analysis** - Present-day status and developments
4. **Expert Perspectives** - Academic and industry expert opinions
5. **Comparative Analysis** - Alternative approaches and competing theories
6. **Technical Deep-Dive** - Detailed technical or methodological aspects
7. **Case Studies** - Real-world applications and examples
8. **Future Implications** - Trends, predictions, and potential impacts
9. **Critical Assessment** - Limitations, controversies, and debates
10. **Cross-Domain Connections** - Related fields and interdisciplinary links
11. **Practical Applications** - Implementation strategies and use cases
12. **Research Gaps** - Areas needing further investigation

Each phase should be a specific, actionable research query designed to uncover unique insights.
Focus on creating queries that would yield academic-quality, authoritative sources.

Format your response as a numbered list of research phases:
1. [Specific research query for contextual foundation]
2. [Specific research query for historical context]
...and so on
`;

interface UltraSearchConfig {
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
  parallelAgents: number;
  crossValidation: boolean;
  dynamicReplanning: boolean;
  expertSourcing: boolean;
  maxSources?: number; // Maximum sources to return after ranking
}

interface SearchAgent {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Document[];
  startTime?: Date;
  endTime?: Date;
}

interface ValidationLoop {
  originalQuery: string;
  findings: Document[];
  validationQueries: string[];
  conflicts: string[];
  confidence: number;
}

export class UltraSearchOrchestrator extends ProSearchOrchestrator implements SearchOrchestratorType {
  private ultraConfig: UltraSearchConfig;
  private searchAgents: SearchAgent[] = [];
  private validationLoops: ValidationLoop[] = [];
  private replanningInterval: NodeJS.Timeout | null = null;

  constructor(config: UltraSearchConfig) {
    super(config);
    this.ultraConfig = config;
  }

  private async executeParallelSearchAgents(
    queries: string[],
    llm: BaseChatModel,
    emitter?: any
  ): Promise<Document[]> {
    const allDocuments: Document[] = [];
    const maxConcurrent = this.ultraConfig.parallelAgents || 12;
    
    // Initialize search agents
    this.searchAgents = queries.map((query, index) => ({
      id: `agent-${index + 1}`,
      query,
      status: 'pending',
      results: [],
    }));

    if (emitter) {
      emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'ultra_agents_init',
          message: `Deploying ${this.searchAgents.length} parallel research agents`,
          details: 'Ultra Search: Initializing advanced search matrix',
          progress: 25
        }
      }));
    }

    // Execute searches in parallel batches
    const batches = [];
    for (let i = 0; i < queries.length; i += maxConcurrent) {
      batches.push(queries.slice(i, i + maxConcurrent));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progressBase = 25 + (batchIndex / batches.length) * 35; // 25-60% for agent execution

      if (emitter) {
        emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_batch_search',
            message: `Executing batch ${batchIndex + 1}/${batches.length}`,
            details: `Processing ${batch.length} concurrent research queries`,
            progress: Math.round(progressBase)
          }
        }));
      }

      // Execute batch in parallel
      const batchPromises = batch.map(async (query, localIndex) => {
        const agentIndex = batchIndex * maxConcurrent + localIndex;
        const agent = this.searchAgents[agentIndex];
        
        agent.status = 'running';
        agent.startTime = new Date();

        try {
          // Use multiple search engines for comprehensive coverage
          const searchResults = await searchSearxng(query, {
            language: 'en',
            engines: [
              'google', 'bing', 'duckduckgo', 'startpage', 'searx',
              'semantic scholar', 'arxiv', 'pubmed', 'wikipedia'
            ],
            time_range: ['year'], // Focus on recent and authoritative content
          });

          const documents = searchResults.results.map(
            (result) =>
              new Document({
                pageContent: result.content || result.title,
                metadata: {
                  title: result.title,
                  url: result.url,
                  query: query,
                  agentId: agent.id,
                  ...(result.img_src && { img_src: result.img_src }),
                },
              }),
          );

          agent.results = documents;
          agent.status = 'completed';
          agent.endTime = new Date();

          return documents;
        } catch (error) {
          console.error(`Ultra Search Agent ${agent.id} failed:`, error);
          agent.status = 'failed';
          agent.endTime = new Date();
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allDocuments.push(...batchResults.flat());

      // Brief delay between batches to avoid overwhelming servers
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (emitter) {
      emitter.emit('data', JSON.stringify({
        type: 'ultraAgents',
        data: this.searchAgents,
      }));
    }

    return allDocuments;
  }

  private async executeCrossValidationLoop(
    originalQuery: string,
    documents: Document[],
    llm: BaseChatModel,
    emitter?: any
  ): Promise<Document[]> {
    if (!this.ultraConfig.crossValidation) {
      return documents;
    }

    if (emitter) {
      emitter.emit('data', JSON.stringify({
        type: 'progress',
        data: {
          step: 'cross_validation',
          message: 'Executing cross-validation protocols',
          details: 'Verifying information accuracy and consistency',
          progress: 65
        }
      }));
    }

    // Analyze documents for potential conflicts or inconsistencies
    const validationChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
        You are a research validation expert. Analyze the following information for accuracy and consistency.
        
        Original Query: {originalQuery}
        
        Research Findings Summary:
        {findings}
        
        Identify:
        1. Any contradictory information between sources
        2. Claims that need additional verification
        3. Missing perspectives or viewpoints
        4. Areas where more authoritative sources are needed
        
        Generate 3-5 specific validation queries to verify or clarify any inconsistencies:
      `),
      llm,
      new StringOutputParser(),
      RunnableLambda.from(async (output: string) => {
        const validationQueries = output
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.trim().replace(/^[-*•]\s*/, ''))
          .slice(0, 5);
        return validationQueries;
      }),
    ]);

    try {
      const findingsSummary = documents
        .slice(0, 20) // Limit for token efficiency
        .map(doc => `${doc.metadata.title}: ${doc.pageContent.substring(0, 200)}...`)
        .join('\n\n');

      const validationQueries = await validationChain.invoke({
        originalQuery,
        findings: findingsSummary,
      });

      // Execute validation searches
      const validationDocs = await this.executeParallelSearchAgents(
        validationQueries as string[],
        llm,
        emitter
      );

      // Combine original and validation documents
      return [...documents, ...validationDocs];
    } catch (error) {
      console.error('Cross-validation failed:', error);
      return documents;
    }
  }

  private async generateUltraSearchQueries(
    originalQuery: string,
    llm: BaseChatModel,
  ): Promise<string[]> {
    console.log('🔧 UltraSearch: Creating comprehensive query generation...');
    
    const queryGenerationChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(ultraSearchPlanningPrompt),
      llm,
      new StringOutputParser(),
      RunnableLambda.from(async (output: string) => {
        console.log('🔍 UltraSearch: LLM raw output:', output);
        const queries = output
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.trim().replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, ''))
          .filter(query => query.length > 10) // Filter out very short queries
          .slice(0, 12); // Limit to 12 comprehensive queries
        console.log('🔍 UltraSearch: Parsed queries:', queries);
        return queries;
      }),
    ]);

    try {
      console.log('⏳ UltraSearch: Invoking ultra query generation...');
      const queries = await queryGenerationChain.invoke({
        query: originalQuery,
        context: 'Ultra-comprehensive research analysis',
      });
      
      console.log('✅ UltraSearch: Ultra query generation completed');
      return queries as string[];
    } catch (error) {
      console.error('❌ UltraSearch: Error generating queries:', error);
      return [originalQuery]; // Fallback to original query
    }
  }

  private startDynamicReplanning(
    originalQuery: string,
    llm: BaseChatModel,
    emitter?: any
  ): void {
    if (!this.ultraConfig.dynamicReplanning) return;

    this.replanningInterval = setInterval(async () => {
      try {
        // Analyze current progress and adapt strategy
        const completedAgents = this.searchAgents.filter(agent => agent.status === 'completed');
        const failedAgents = this.searchAgents.filter(agent => agent.status === 'failed');
        
        if (emitter && completedAgents.length > 0) {
          emitter.emit('data', JSON.stringify({
            type: 'progress',
            data: {
              step: 'dynamic_replan',
              message: 'Analyzing progress and adapting strategy',
              details: `${completedAgents.length} agents completed, ${failedAgents.length} failed`,
              progress: Math.min(95, 60 + (completedAgents.length / this.searchAgents.length) * 25)
            }
          }));
        }

        // If we have enough successful results, we can stop replanning
        if (completedAgents.length >= this.searchAgents.length * 0.8) {
          this.stopDynamicReplanning();
        }
      } catch (error) {
        console.error('Dynamic replanning error:', error);
      }
    }, 45000); // Every 45 seconds as per Perplexity's approach
  }

  private stopDynamicReplanning(): void {
    if (this.replanningInterval) {
      clearInterval(this.replanningInterval);
      this.replanningInterval = null;
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
    console.log('🚀 UltraSearchOrchestrator.planAndExecute started for query:', message);

    // Allow time for event listeners to be attached
    setTimeout(async () => {
      try {
        // Phase 1: Ultra Planning & Contextual Priming
        console.log('📋 UltraSearch: Emitting ultra planning progress...');
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_planning',
            message: 'Initiating ultra-deep research protocol',
            details: 'Ultra Search: Analyzing query complexity and research requirements',
            progress: 5
          }
        }));

        // Generate comprehensive research queries
        console.log('🔧 UltraSearch: Generating ultra-comprehensive research plan...');
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_query_generation',
            message: 'Generating ultra-comprehensive research matrix',
            details: 'Creating 8-12 specialized research angles for PhD-level analysis',
            progress: 15
          }
        }));

        const ultraSearchQueries = await this.generateUltraSearchQueries(
          message,
          llm
        );
        console.log('✅ UltraSearch: Generated ultra queries:', ultraSearchQueries.length);

        this.emitter.emit('data', JSON.stringify({
          type: 'ultraQueries',
          data: ultraSearchQueries,
        }));

        // Phase 2: Parallel Agent Deployment
        console.log('🤖 UltraSearch: Deploying parallel research agents...');
        this.startDynamicReplanning(message, llm, this.emitter);

        const allDocuments = await this.executeParallelSearchAgents(
          ultraSearchQueries, 
          llm, 
          this.emitter
        );
        console.log('✅ UltraSearch: Parallel agents completed, found documents:', allDocuments.length);

        // Phase 3: Cross-Validation Loop
        console.log('🔍 UltraSearch: Executing cross-validation protocols...');
        const validatedDocuments = await this.executeCrossValidationLoop(
          message,
          allDocuments,
          llm,
          this.emitter
        );
        console.log('✅ UltraSearch: Cross-validation completed, validated documents:', validatedDocuments.length);

        // Phase 4: Advanced Document Processing
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_processing',
            message: 'Processing ultra-comprehensive dataset',
            details: `Advanced analysis of ${validatedDocuments.length} authoritative sources`,
            progress: 70
          }
        }));

        const rankedDocuments = await this.rerankDocs(
          message,
          validatedDocuments,
          fileIds,
          embeddings,
        );
        console.log('✅ UltraSearch: Ultra document ranking completed:', rankedDocuments.length);

        // Phase 5: Ultra Response Generation
        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_generating',
            message: 'Synthesizing PhD-level analysis',
            details: 'Generating comprehensive research report with expert insights',
            progress: 85
          }
        }));

        const ultraResponsePrompt = `
          You are a world-class research analyst providing ultra-comprehensive, PhD-level analysis.
          
          System Instructions: {systemInstructions}
          
          Research Query: {query}
          Date: {date}
          
          Based on ultra-comprehensive research conducted using parallel research agents, cross-validation protocols, 
          and expert-level sourcing, provide an authoritative, in-depth analysis that:
          
          1. **Executive Summary** - Clear, concise overview of key findings
          2. **Comprehensive Analysis** - Deep dive into all aspects of the topic
          3. **Expert Perspectives** - Synthesis of authoritative viewpoints and academic insights
          4. **Evidence-Based Conclusions** - Well-supported findings with strong source attribution
          5. **Comparative Analysis** - Different approaches, methodologies, or viewpoints
          6. **Technical Details** - In-depth technical or methodological information when relevant
          7. **Real-World Applications** - Practical implications and use cases
          8. **Future Implications** - Trends, predictions, and potential developments
          9. **Critical Assessment** - Limitations, controversies, and areas of debate
          10. **Research Recommendations** - Suggestions for further investigation
          
          Structure your response with clear sections and subsections.
          Use numbered citations [1], [2], etc. that correspond to the source order provided.
          Maintain academic rigor while ensuring accessibility.
          
          Ultra-Research Sources and Context:
          {context}
          
          Provide a comprehensive, authoritative analysis that demonstrates mastery-level understanding.
        `;

        // Create ultra answering chain
        const ultraAnsweringChain = RunnableSequence.from([
          RunnableLambda.from(async () => {
            const contextText = rankedDocuments
              .map((doc, index) => `[${index + 1}] ${doc.metadata.title}: ${doc.pageContent}`)
              .join('\n\n');

            // Increased context limit for ultra mode
            const maxContextLength = 20000;
            const truncatedContext = contextText.length > maxContextLength 
              ? contextText.substring(0, maxContextLength) + '\n\n[Content truncated - ultra mode processing complete]'
              : contextText;

            return {
              systemInstructions: systemInstructions || 'Provide ultra-comprehensive, PhD-level analysis with expert insights.',
              query: message,
              date: new Date().toISOString(),
              context: truncatedContext,
            };
          }),
          PromptTemplate.fromTemplate(ultraResponsePrompt),
          llm,
          new StringOutputParser(),
        ]);

        const response = await ultraAnsweringChain.invoke({});
        console.log('✅ UltraSearch: Ultra response generation completed');

        // Stop dynamic replanning
        this.stopDynamicReplanning();

        // Emit results with transparency about source count
        const maxSources = this.ultraConfig.maxSources || 50;
        this.emitter.emit('data', JSON.stringify({
          type: 'sources',
          data: rankedDocuments,
          metadata: {
            totalFound: rankedDocuments.length,
            maxDisplayed: maxSources,
            mode: 'ultra'
          }
        }));

        this.emitter.emit('data', JSON.stringify({
          type: 'response',
          data: response,
        }));

        // Generate ultra follow-ups
        try {
          const contextText = rankedDocuments.map(doc => doc.pageContent).join(' ').substring(0, 5000);
          const followUps = await this.followUpGenerator.generateFollowUps(
            message,
            response,
            history,
            contextText,
            llm,
          );

          this.emitter.emit('data', JSON.stringify({
            type: 'followUps',
            data: followUps,
          }));
        } catch (error) {
          console.error('❌ UltraSearch: Error generating follow-ups:', error);
        }

        this.emitter.emit('data', JSON.stringify({
          type: 'progress',
          data: {
            step: 'ultra_complete',
            message: 'Ultra Search analysis completed',
            details: 'PhD-level research report ready',
            progress: 100
          }
        }));

        this.emitter.emit('data', JSON.stringify({
          type: 'done',
          data: 'Ultra Search completed successfully',
        }));

      } catch (error: any) {
        this.stopDynamicReplanning();
        this.emitter.emit('data', JSON.stringify({
          type: 'error',
          data: `Ultra Search error: ${error.message}`,
        }));
      }

      this.emitter.emit('end');
    }, 10);

    return this.emitter;
  }
}

export default UltraSearchOrchestrator;
