import SearchOrchestrator from './orchestrator';
import ProSearchOrchestrator from './proSearchOrchestrator';
import prompts from '../prompts';

export const orchestratorHandlers: Record<string, SearchOrchestrator | ProSearchOrchestrator> = {
  webSearch: new SearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.webSearchPlanningPrompt,
  }),
  proSearch: new ProSearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.2, // More aggressive reranking for Pro mode
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.webSearchPlanningPrompt,
    maxSearchSteps: 6,
    deepAnalysis: true,
  }),
}; 