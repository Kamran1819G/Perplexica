import QuickSearchOrchestrator from './quickSearchOrchestrator';
import ProSearchOrchestrator from './proSearchOrchestrator';
import UltraSearchOrchestrator from './ultraSearchOrchestrator';
import prompts from '../prompts';

export const orchestratorHandlers: Record<string, QuickSearchOrchestrator | ProSearchOrchestrator | UltraSearchOrchestrator> = {
  quickSearch: new QuickSearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.quickSearchRetrieverPrompt,
    responsePrompt: prompts.quickSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.quickSearchPlanningPrompt,
    maxSources: 15, // Quick search: 15 sources
  }),
  proSearch: new ProSearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.quickSearchRetrieverPrompt,
    responsePrompt: prompts.quickSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.2, // More aggressive reranking for Pro mode
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.quickSearchPlanningPrompt,
    maxSearchSteps: 6,
    deepAnalysis: true,
    maxSources: 25, // Pro search: 25 sources for deeper analysis
  }),
  ultraSearch: new UltraSearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.quickSearchRetrieverPrompt,
    responsePrompt: prompts.quickSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.1, // Most aggressive reranking for Ultra mode
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.quickSearchPlanningPrompt,
    maxSearchSteps: 12,
    deepAnalysis: true,
    parallelAgents: 12, // 12 parallel research agents
    crossValidation: true, // Enable cross-validation loops
    dynamicReplanning: true, // Enable dynamic replanning every 45s
    expertSourcing: true, // Focus on expert and academic sources
    maxSources: 50, // Ultra search: 50 sources for comprehensive analysis
  }),
}; 